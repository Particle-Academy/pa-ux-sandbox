<?php

namespace App\Services;

use App\Models\ShowcaseSubmission;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use ParticleAcademy\Fms\Services\FeatureManager;
use ParticleAcademy\Fms\Services\FmsFeatureRegistry;

/**
 * Who may open a support ticket in the showcase: the fancy-support dogfood
 * binding (.ai/plans/fancy-support.md section 5.2).
 *
 * A user is eligible when they are not suspended and own at least one
 * submission that is verified, not suspended, and ownership-verified.
 * "Verified" alone is not enough: it only means Fancy was found on the
 * project, not that this user controls it (section 1.1).
 *
 * Wired into laravel-fms as the `support-eligibility` pre-strategy, which must
 * run BEFORE `pro-entitlement`: `support-premium` is a Pro feature, but a Pro
 * user with no eligible project must still be refused (owner decision D5), and
 * the first non-null pre-strategy verdict wins.
 */
class SupportEligibility
{
    public const STRATEGY = 'support-eligibility';

    /** Opening a ticket at all. Decided entirely by eligibility. */
    public const ACCESS = 'support-access';

    /** The premium service level. Pro grants it; eligibility can veto it. */
    public const PREMIUM = 'support-premium';

    /** FMS resource: tickets open at once. */
    public const OPEN_TICKETS = 'support-open-tickets';

    /** FMS resource: the support agent's token budget. */
    public const AGENT_TOKENS = 'support-agent-tokens';

    public function __construct(private readonly Entitlements $entitlements) {}

    public function isEligible(?User $user): bool
    {
        if ($user === null || $user->isSuspended()) {
            return false;
        }

        return $this->eligibleSubjects($user)->exists();
    }

    /**
     * The submissions a ticket may be opened against (`eligibleSubjects` in the
     * plan's SupportEntitlements contract).
     *
     * @return Builder<ShowcaseSubmission>
     */
    public function eligibleSubjects(User $user): Builder
    {
        return ShowcaseSubmission::query()
            ->where('user_id', $user->id)
            ->where('status', 'verified')
            ->whereNull('suspended_at')
            ->whereNotNull('ownership_verified_at')
            ->whereNotNull('ownership_method');
    }

    /** Eligible AND Pro. Never Pro alone (D5). */
    public function isPremium(?User $user): bool
    {
        return $this->isEligible($user) && $this->entitlements->isPro($user);
    }

    /** The `support-open-tickets` limit for this user. */
    public function openTicketLimit(?User $user): int
    {
        return $this->isPremium($user)
            ? (int) config('support.open_tickets.premium')
            : (int) config('support.open_tickets.standard');
    }

    /**
     * The pre-strategy verdict. `support-access` is decided here outright;
     * premium and open tickets are refused when ineligible and otherwise left
     * to the rest of the chain (null).
     */
    public function verdict(string $feature, mixed $user): ?bool
    {
        $gated = [self::ACCESS, self::PREMIUM, self::OPEN_TICKETS];
        if (! in_array($feature, $gated, true)) {
            return null;
        }

        $eligible = $this->isEligible($user instanceof User ? $user : null);

        if ($feature === self::ACCESS) {
            return $eligible;
        }

        return $eligible ? null : false;
    }

    /**
     * Register the pre-strategy and the two resource features. Called from
     * AppServiceProvider::boot() before `pro-entitlement` is registered.
     * Closures are safe here: the registry is runtime state, never cached
     * config.
     */
    public static function register(FeatureManager $manager, FmsFeatureRegistry $registry): void
    {
        $manager->registerPreStrategy(
            self::STRATEGY,
            fn (string $feature, $user): ?bool => app(self::class)->verdict($feature, $user),
        );

        $registry->register(self::ACCESS, [
            'name' => 'Support access',
            'description' => 'Open support tickets. Needs a verified, ownership-proven showcase project.',
            'type' => 'boolean',
            // Fail closed: a definition with no `enabled` resolves to TRUE in
            // FeatureManager::checkDefinition(), so without the pre-strategy
            // this feature would open support to everyone.
            'enabled' => false,
        ]);

        $registry->register(self::OPEN_TICKETS, [
            'name' => 'Open support tickets',
            'description' => 'Support tickets a user may have open at once.',
            'type' => 'resource',
            'limit' => fn ($user): int => app(self::class)->openTicketLimit($user instanceof User ? $user : null),
        ]);

        $registry->register(self::AGENT_TOKENS, [
            'name' => 'Support agent tokens',
            'description' => "The support agent's token budget (tokens, not money).",
            'type' => 'resource',
            'limit' => fn (): int => (int) config('support.agent_tokens.budget'),
        ]);
    }
}
