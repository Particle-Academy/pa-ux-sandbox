<?php

namespace App\Services\Mlm;

use App\Models\Setting;
use App\Models\User;
use FancyMlm\Laravel\Models\Member;
use FancyMlm\Plan\CompensationPlan;
use FancyMlm\Referral\ReferralEngine;
use FancyMlm\Referral\RewardComputation;
use Illuminate\Support\Collection;
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

    /** The member belonging to a user, creating a root member on first visit. */
    public function memberForUser(User $user): Member
    {
        return Member::query()->firstOrCreate(
            ['user_id' => $user->getKey()],
            ['tier' => 'bronze', 'active' => true, 'meta' => ['label' => $user->name]],
        );
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
