<?php

namespace App\Services\Mlm;

use App\Models\Setting;
use App\Models\User;
use FancyMlm\Laravel\Models\Member;
use FancyMlm\Plan\CompensationPlan;
use FancyMlm\Referral\ReferralEngine;
use FancyMlm\Referral\RewardComputation;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use LaravelFunLab\Events\XpAwarded;
use LaravelFunLab\Facades\LFL;
use LaravelFunLab\Models\EventLog;

/**
 * The sandbox's live wiring of the fancy-mlm engine. It owns the ONE piece the
 * package leaves to the host: an admin-editable {@see CompensationPlan}. The
 * plan is stored as JSON in a {@see Setting} row so the admin config surface can
 * switch the downline shape (unilevel / binary / matrix), tiers, and level
 * factors at runtime — the container binds {@see CompensationPlan} to
 * {@see plan()} (see AppServiceProvider), so the package's engine, facade, and
 * fun-lab listener all pick up the live plan on the next request.
 *
 * Everything else — the reward walk, the fun-lab payout, the recursion guard —
 * is the package's; this service just reads the network for the UI, resolves a
 * user to their member, and exposes the demo "simulate activity" loop.
 */
class MlmProgram
{
    public const SETTING_KEY = 'mlm.plan';

    /** The default plan the showcase ships with (unilevel, four tiers). */
    public const DEFAULT_PLAN = [
        'tree' => 'unilevel',
        'width' => 3,
        'metric' => 'referral-bonus',
        'levelFactors' => [1.0, 0.5, 0.25],
        'tiers' => [
            'bronze' => 1.0,
            'silver' => 1.25,
            'gold' => 1.5,
            'diamond' => 2.0,
        ],
        'compression' => true,
        'defaultTier' => 'bronze',
    ];

    /** Active-downline size that promotes a member into each tier. */
    public const TIER_THRESHOLDS = [
        'bronze' => 0,
        'silver' => 3,
        'gold' => 6,
        'diamond' => 12,
    ];

    /**
     * The engine is resolved lazily (not constructor-injected): the container
     * binds {@see CompensationPlan} back to this service's {@see plan()}, so
     * injecting the engine — which needs the plan — here would recurse.
     */
    private function engine(): ReferralEngine
    {
        return app(ReferralEngine::class);
    }

    /**
     * The current, admin-editable plan as a plain array.
     *
     * @return array<string, mixed>
     */
    public function planData(): array
    {
        $raw = Setting::get(self::SETTING_KEY);
        if ($raw === null) {
            return self::DEFAULT_PLAN;
        }

        $decoded = json_decode($raw, true);

        return is_array($decoded) ? array_merge(self::DEFAULT_PLAN, $decoded) : self::DEFAULT_PLAN;
    }

    public function plan(): CompensationPlan
    {
        return CompensationPlan::fromArray($this->planData());
    }

    /**
     * Persist an admin-chosen plan. Only the fields the config surface controls
     * are written; the rest fall back to {@see DEFAULT_PLAN}.
     *
     * @param  array<string, mixed>  $plan
     */
    public function savePlan(array $plan): void
    {
        Setting::put(self::SETTING_KEY, json_encode(array_merge(self::DEFAULT_PLAN, $plan)));
    }

    /** The edge the DownlineTree should draw for the current tree type. */
    public function edge(): string
    {
        return $this->plan()->tree === CompensationPlan::TREE_UNILEVEL ? 'sponsor' : 'placement';
    }

    /**
     * The whole network as JSON-friendly DownlineMember rows the fancy-mlm-ui
     * DownlineTree consumes.
     *
     * @return list<array<string, mixed>>
     */
    public function network(): array
    {
        return $this->members()
            ->map(fn (Member $m) => $this->toDownlineMember($m))
            ->values()
            ->all();
    }

    /** The 30-day referral-attribution cookie /join/{username} sets (referrer user id). */
    public const REFERRAL_COOKIE = 'fancy_ref';

    /**
     * The member belonging to a user, creating one on first visit. A brand-new
     * member honors a pending /join/{username} referral attribution: the
     * referrer's member becomes the sponsor (placement left null — the engine
     * falls back to the sponsor edge), and the attribution is cleared. Without
     * one the member is a network root, as before.
     */
    public function memberForUser(User $user): Member
    {
        $existing = Member::query()->where('user_id', $user->getKey())->first();
        if ($existing !== null) {
            return $existing;
        }

        $sponsorId = $this->pendingReferralSponsorId($user);
        $member = Member::query()->create([
            'user_id' => $user->getKey(),
            'sponsor_id' => $sponsorId,
            'tier' => 'bronze',
            'active' => true,
            'meta' => ['label' => $user->name],
        ]);

        if ($sponsorId !== null) {
            Cookie::queue(Cookie::forget(self::REFERRAL_COOKIE));
        }

        return $member;
    }

    /**
     * Resolve the referral-attribution cookie to a sponsor member id, or null:
     * the referrer must exist and not be the user themselves. The referrer's
     * own member row is created on demand (a shared link IS network
     * participation), so the organic loop works even if the referrer never
     * opened /referrals after setting their username.
     */
    private function pendingReferralSponsorId(User $user): ?int
    {
        $referrerId = (int) request()->cookie(self::REFERRAL_COOKIE, 0);
        if ($referrerId <= 0 || $referrerId === (int) $user->getKey()) {
            return null;
        }

        $referrer = User::query()->find($referrerId);
        if ($referrer === null) {
            return null;
        }

        $sponsorMember = Member::query()->firstOrCreate(
            ['user_id' => $referrer->getKey()],
            ['tier' => 'bronze', 'active' => true, 'meta' => ['label' => $referrer->name]],
        );

        return (int) $sponsorMember->getKey();
    }

    /**
     * Every member with their linked user, shaped for the admin Members table.
     *
     * @return list<array<string, mixed>>
     */
    public function membersForAdmin(): array
    {
        return $this->members()
            ->map(fn (Member $m) => [
                'id' => (string) $m->getKey(),
                'label' => $this->labelFor($m),
                'userId' => $m->user_id !== null ? (int) $m->user_id : null,
                'userName' => $m->user?->name,
                'userEmail' => $m->user?->email,
                'tier' => $m->tier ?: 'bronze',
                'active' => (bool) $m->active,
                'sponsorId' => $m->sponsor_id !== null ? (string) $m->sponsor_id : null,
                'placementId' => $m->placement_id !== null ? (string) $m->placement_id : null,
                'demo' => (bool) ($m->meta['demo'] ?? false),
            ])
            ->values()
            ->all();
    }

    /**
     * Users with no member row yet — the candidates for the admin's
     * "create member" picker.
     *
     * @return list<array{id: int, name: string, email: string}>
     */
    public function usersWithoutMember(): array
    {
        return User::query()
            ->whereNotIn('id', Member::query()->whereNotNull('user_id')->select('user_id'))
            ->orderBy('name')
            ->get(['id', 'name', 'email'])
            ->map(fn (User $u) => ['id' => (int) $u->getKey(), 'name' => $u->name, 'email' => $u->email])
            ->all();
    }

    /**
     * Re-organize an existing member: sponsor, placement, tier, active. Rejects
     * a sponsor/placement that is the member themselves or sits in their own
     * downline — re-pointing INTO your own subtree would loop the reward walk.
     *
     * @param  array<string, mixed>  $attrs
     *
     * @throws ValidationException when the assignment would create a cycle
     */
    public function updateMember(Member $member, array $attrs): Member
    {
        $sponsorId = isset($attrs['sponsor_id']) ? (int) $attrs['sponsor_id'] : null;
        $placementId = isset($attrs['placement_id']) ? (int) $attrs['placement_id'] : null;

        if ($this->wouldCycle($member, $sponsorId, 'sponsor')) {
            throw ValidationException::withMessages([
                'sponsor_id' => 'That sponsor is this member or one of their own descendants — the sponsor tree would loop.',
            ]);
        }
        if ($this->wouldCycle($member, $placementId, 'placement')) {
            throw ValidationException::withMessages([
                'placement_id' => 'That placement is this member or one of their own descendants — the placement tree would loop.',
            ]);
        }

        $member->update([
            'sponsor_id' => $sponsorId,
            'placement_id' => $placementId,
            'tier' => (string) $attrs['tier'],
            'active' => (bool) $attrs['active'],
        ]);

        return $member->refresh();
    }

    /** A brand-new member for a user who has none, optionally pre-attached to the tree. */
    public function createForUser(User $user, ?int $sponsorId = null, ?int $placementId = null, ?string $tier = null): Member
    {
        return Member::query()->create([
            'user_id' => $user->getKey(),
            'sponsor_id' => $sponsorId,
            'placement_id' => $placementId,
            'tier' => $tier ?? (string) ($this->planData()['defaultTier'] ?? 'bronze'),
            'active' => true,
            'meta' => ['label' => $user->name],
        ]);
    }

    /**
     * Delete a member and SPLICE the chain: children's sponsor_id re-points to
     * the deleted member's own sponsor, placement children to their placement
     * (null when the deleted member was a root) — the subtree survives intact.
     */
    public function deleteMember(Member $member): void
    {
        DB::transaction(function () use ($member) {
            Member::query()->where('sponsor_id', $member->getKey())->update(['sponsor_id' => $member->sponsor_id]);
            Member::query()->where('placement_id', $member->getKey())->update(['placement_id' => $member->placement_id]);
            $member->delete();
        });
    }

    /**
     * Delete every demo-seeded member (meta.demo) with the same splice
     * semantics — a REAL member sponsored by a demo row re-points to the
     * nearest surviving ancestor. This is the production cleanup for an
     * accidentally-run MlmNetworkSeeder.
     */
    public function purgeDemo(): int
    {
        $demoIds = Member::query()->get()
            ->filter(fn (Member $m) => (bool) ($m->meta['demo'] ?? false))
            ->map(fn (Member $m) => (int) $m->getKey())
            ->values();

        DB::transaction(function () use ($demoIds) {
            foreach ($demoIds as $id) {
                $member = Member::query()->find($id);
                if ($member !== null) {
                    $this->deleteMember($member);
                }
            }
        });

        return $demoIds->count();
    }

    /**
     * Would attaching $member under $candidateId on the given edge loop the
     * tree? Walks UP the candidate's ancestor chain along the exact pointer the
     * engine's UpwardTree climbs (sponsor: `sponsor_id`; placement:
     * `placement_id ?? sponsor_id`); a cycle exists iff the walk reaches
     * $member — i.e. the candidate IS the member or sits in their downline.
     */
    private function wouldCycle(Member $member, ?int $candidateId, string $edge): bool
    {
        if ($candidateId === null) {
            return false;
        }

        $byId = Member::query()->get(['id', 'sponsor_id', 'placement_id'])->keyBy('id');

        $current = $candidateId;
        $seen = [];
        while ($current !== null) {
            if ($current === (int) $member->getKey()) {
                return true;
            }
            if (isset($seen[$current])) {
                return false; // pre-existing loop elsewhere — not one we'd create
            }
            $seen[$current] = true;

            $parent = $byId->get($current);
            if ($parent === null) {
                return false;
            }

            $next = $edge === 'sponsor'
                ? $parent->sponsor_id
                : ($parent->placement_id ?? $parent->sponsor_id);
            $current = $next !== null ? (int) $next : null;
        }

        return false;
    }

    /**
     * The direct + indirect downline size under a member, following the active
     * tree's edge. Drives rank/tier progress.
     */
    public function downlineCount(Member $root): int
    {
        $edge = $this->edge();

        $byParent = $this->members()->groupBy(fn (Member $m) => (string) (
            $edge === 'sponsor'
                ? $m->sponsor_id
                : ($m->placement_id ?? $m->sponsor_id)
        ));

        $count = 0;
        $stack = [(string) $root->getKey()];
        $seen = [];
        while ($stack !== []) {
            $id = array_pop($stack);
            if (isset($seen[$id])) {
                continue;
            }
            $seen[$id] = true;
            foreach ($byParent->get($id, collect()) as $child) {
                $count++;
                $stack[] = (string) $child->getKey();
            }
        }

        return $count;
    }

    /**
     * Rank progress for a member: current tier, the next tier, and downline
     * size vs the promotion threshold — shaped for fancy-mlm-ui's RankProgress.
     *
     * @return array<string, mixed>
     */
    public function rankProgress(Member $member): array
    {
        $size = $this->downlineCount($member);
        $tiers = array_keys(self::TIER_THRESHOLDS);
        $current = $member->tier ?: 'bronze';
        $index = array_search($current, $tiers, true);
        $index = $index === false ? 0 : $index;
        $next = $tiers[$index + 1] ?? null;

        return [
            'tier' => $current,
            'nextTier' => $next,
            'value' => $size,
            'target' => $next ? self::TIER_THRESHOLDS[$next] : $size,
        ];
    }

    /**
     * A user's commission statement — the fun-lab awards the engine paid them,
     * newest first, shaped for fancy-mlm-ui's CommissionStatement.
     *
     * @return list<array<string, mixed>>
     */
    public function commissionsForUser(User $user, int $limit = 25): array
    {
        $source = (string) config('mlm.reward_source', 'mlm');

        return EventLog::query()
            ->where('source', $source)
            ->where('awardable_type', $user->getMorphClass())
            ->where('awardable_id', $user->getKey())
            ->orderByDesc('occurred_at')
            ->limit($limit)
            ->get()
            ->map(fn (EventLog $log) => $this->commissionRow($log))
            ->all();
    }

    /** The fun-lab metric a downline member "earns" in the demo activity loop. */
    public const ACTIVITY_METRIC = 'network-activity';

    /**
     * Run the LIVE loop end-to-end: award the origin member's user fun-lab XP
     * for an action. That fires {@see XpAwarded}, which the
     * package's AwardReferralOnXp listener catches and distributes up the tree —
     * crediting each upline via FunLabRewardSink (the recursion guard stops the
     * bonus from re-triggering itself). We snapshot the ledger before/after so we
     * can return exactly the commission rows this action generated.
     *
     * @return list<array<string, mixed>>
     */
    public function simulateActivity(Member $origin, float $base): array
    {
        $user = $origin->user;
        if ($user === null) {
            // No linked user to earn XP — distribute directly so the demo still
            // pays the upline (bypasses the listener but exercises the same engine).
            return array_map(
                fn (RewardComputation $r) => $this->rewardRow($r),
                $this->engine()->distribute((string) $origin->getKey(), $base, ['trigger' => 'demo.simulate']),
            );
        }

        $source = (string) config('mlm.reward_source', 'mlm');
        $lastId = (int) EventLog::query()->where('source', $source)->max('id');

        LFL::award(self::ACTIVITY_METRIC)
            ->to($user)
            ->amount((int) round($base))
            ->because('Demo network activity')
            ->save();

        return EventLog::query()
            ->where('source', $source)
            ->where('id', '>', $lastId)
            ->orderBy('id')
            ->get()
            ->map(fn (EventLog $log) => $this->commissionRow($log))
            ->all();
    }

    /**
     * Map a fun-lab EventLog (an mlm-sourced award) to a CommissionRow. The
     * engine's per-reward detail (level, tier) rides in `context.meta`, stamped
     * by FunLabRewardSink::withMeta().
     *
     * @return array<string, mixed>
     */
    private function commissionRow(EventLog $log): array
    {
        $context = (array) ($log->context ?? []);
        $meta = (array) ($context['meta'] ?? []);

        return [
            'id' => (string) $log->getKey(),
            'level' => (int) ($meta['level'] ?? 0),
            'tier' => $meta['tier'] ?? null,
            'amount' => (float) $log->amount,
            'status' => 'paid',
            'recipientLabel' => $log->reason,
        ];
    }

    /** @return array<string, mixed> */
    private function rewardRow(RewardComputation $r): array
    {
        return [
            'id' => $r->recipientMemberId.'-'.$r->level,
            'recipientMemberId' => $r->recipientMemberId,
            'recipientLabel' => $this->labelFor($r->recipientMemberId),
            'level' => $r->level,
            'tier' => $r->tier,
            'amount' => $r->amount,
            'status' => 'paid',
        ];
    }

    /** @return Collection<int, Member> */
    private function members(): Collection
    {
        return Member::query()->with('user')->orderBy('id')->get();
    }

    /** @return array<string, mixed> */
    private function toDownlineMember(Member $m): array
    {
        return [
            'id' => (string) $m->getKey(),
            'sponsorId' => $m->sponsor_id !== null ? (string) $m->sponsor_id : null,
            'placementId' => $m->placement_id !== null ? (string) $m->placement_id : null,
            'label' => $this->labelFor($m),
            'tier' => $m->tier ?: 'bronze',
            'active' => (bool) $m->active,
        ];
    }

    private function labelFor(Member|string $member): string
    {
        if (is_string($member)) {
            $member = Member::query()->with('user')->find($member);
            if ($member === null) {
                return 'Member';
            }
        }

        return $member->user?->name
            ?? ($member->meta['label'] ?? null)
            ?? 'Member #'.$member->getKey();
    }
}
