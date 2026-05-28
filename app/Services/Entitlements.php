<?php

namespace App\Services;

use App\Models\User;
use LaravelFunLab\Models\PrizeGrant;

/**
 * Resolves "Pro" entitlement — the payoff that ties the three packages
 * together. A user is Pro if EITHER:
 *
 *   - they hold an active Cashier subscription (laravel-catalog products), OR
 *   - they earned the `sandbox-pro` fun-lab prize (granted at the
 *     Ambassador tier of overall-engagement — see FunLabSeeder).
 *
 * The pre-strategy registered in AppServiceProvider feeds this into
 * laravel-fms so `FMS::canAccess()` on any PRO_FEATURE reflects it. The
 * net effect: pay OR earn-your-way-in unlocks the same features, through
 * one authoritative check.
 */
class Entitlements
{
    public const PRO_PRIZE = 'sandbox-pro';

    /**
     * Features unlocked by Pro. A pre-strategy grants these to entitled
     * users; for everyone else they fall through to the normal chain
     * (off by default).
     *
     * @var list<string>
     */
    public const PRO_FEATURES = [
        'pro-themes',          // extra showcase themes
        'pro-source-export',   // download a component's full source bundle
        'pro-bridge-tools',    // advanced agent bridge tools
    ];

    public function isProFeature(string $feature): bool
    {
        return in_array($feature, self::PRO_FEATURES, true);
    }

    public function isPro(?User $user): bool
    {
        return $this->proSource($user) !== null;
    }

    /**
     * How the user is Pro: 'subscription', 'prize', or null if not Pro.
     */
    public function proSource(?User $user): ?string
    {
        if ($user === null) {
            return null;
        }
        if ($user->subscribed()) {
            return 'subscription';
        }
        if ($this->hasPrize($user, self::PRO_PRIZE)) {
            return 'prize';
        }

        return null;
    }

    public function hasPrize(User $user, string $slug): bool
    {
        $profile = $user->getProfile();

        return PrizeGrant::query()
            ->where('profile_id', $profile->id)
            ->whereHas('prize', fn ($q) => $q->where('slug', $slug))
            ->exists();
    }
}
