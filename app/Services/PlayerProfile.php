<?php

namespace App\Services;

use App\Models\User;
use App\Support\PlayerIdentity;
use LaravelFunLab\Facades\LFL;
use LaravelFunLab\Http\Resources\LeaderboardEntryResource;
use LaravelFunLab\Models\GamedMetric;
use LaravelFunLab\Models\MetricLevelGroup;
use LaravelFunLab\Models\MetricLevelGroupLevel;
use LaravelFunLab\Services\MetricLevelGroupService;

/**
 * Builds the player-facing gamification view of a user.
 *
 * `summary()` is the lightweight slice shared on every Inertia response
 * (chrome chip): coins, overall level + tier name, weighted XP, progress,
 * and cosmetic slots. `full()` adds the per-metric breakdown, achievements,
 * and prizes for the profile page.
 *
 * The "overall-engagement" composite group is the single source of the
 * headline level/XP (see FunLabSeeder).
 */
class PlayerProfile
{
    public const GROUP = 'overall-engagement';

    public function __construct(
        private readonly MetricLevelGroupService $groups,
        private readonly Entitlements $entitlements,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function summary(User $user): array
    {
        $info = $this->groups->getLevelInfo($user, self::GROUP);
        $proSource = $this->entitlements->proSource($user);

        return [
            'coins' => $user->coinBalance(),
            'level' => (int) $info['current_level'],
            'levelName' => $this->levelName((int) $info['current_level']),
            'totalXp' => (int) $info['total_xp'],
            'nextThreshold' => $info['next_level_threshold'],
            'progress' => round((float) $info['progress_percentage'], 1),
            'cosmetics' => $user->cosmetic_slots ?? [],
            'optedOut' => $user->isOptedOut(),
            'pro' => $proSource !== null,
            'proSource' => $proSource, // 'subscription' | 'prize' | null
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function full(User $user): array
    {
        $profile = $user->getProfile()->load('metrics.gamedMetric');

        $metrics = $profile->metrics
            ->filter(fn ($m) => $m->gamedMetric !== null)
            ->map(fn ($m) => [
                'slug' => $m->gamedMetric->slug,
                'name' => $m->gamedMetric->name,
                'icon' => $m->gamedMetric->icon,
                'xp' => (int) $m->total_xp,
                'level' => (int) $m->current_level,
            ])
            ->sortByDesc('xp')
            ->values()
            ->all();

        $achievements = $user->getAchievements()
            ->map(fn ($a) => [
                'id' => $a->id,
                'slug' => $a->slug,
                'name' => $a->name ?? $a->slug,
                'description' => $a->description,
                'icon' => $a->icon,
            ])->all();

        $prizes = $user->getRecentPrizes(50)
            ->map(fn ($grant) => [
                'slug' => $grant->prize?->slug,
                'name' => $grant->prize?->name ?? $grant->prize?->slug,
                'type' => $grant->prize?->type,
            ])
            ->filter(fn ($p) => $p['slug'] !== null)
            ->values()
            ->all();

        return [
            ...$this->summary($user),
            // Display name + avatar + cosmetics in the one shape every
            // identity surface renders (App\Support\PlayerIdentity).
            'identity' => PlayerIdentity::for($user),
            'name' => $user->name,
            'metrics' => $metrics,
            'achievements' => $achievements,
            'prizes' => $prizes,
            'lifetimeEarned' => $user->getWallet()->lifetime_earned,
            'lifetimeSpent' => $user->getWallet()->lifetime_spent,
            'memberSince' => $user->created_at?->year,
        ];
    }

    /**
     * The top ten players, overall or on ONE gamed metric (laravel-fun-lab
     * 0.7.0's per-metric leaderboard), in exactly the shape `GET
     * /api/lfl/leaderboards/{type}` returns, plus display names keyed by
     * profile id (the API carries ids only). Opted-out players are excluded,
     * as on every board. An unknown metric falls back to the overall board.
     *
     * @return array{metric: ?string, entries: list<array<string, mixed>>, names: array<string, string>, viewerProfileId: int, metrics: list<array{slug: string, name: string}>}
     */
    public function metricBoard(User $user, ?string $metric): array
    {
        if ($metric !== null && GamedMetric::query()->where('slug', $metric)->doesntExist()) {
            $metric = null;
        }

        $builder = LFL::leaderboard()->for(User::class)->by('xp')->excludeOptedOut();
        if ($metric !== null) {
            $builder->metric($metric);
        }
        $profiles = $builder->take(10);

        $users = User::query()
            ->whereIn('id', $profiles->pluck('awardable_id'))
            ->get(['id', 'name', 'username'])
            ->keyBy('id');

        return [
            'metric' => $metric,
            'entries' => LeaderboardEntryResource::collection($profiles)->resolve(request()),
            'names' => $profiles
                ->mapWithKeys(fn ($p) => [(string) $p->id => (string) ($users->get($p->awardable_id)?->name ?? 'Player')])
                ->all(),
            'viewerProfileId' => (int) $user->getProfile()->id,
            'metrics' => GamedMetric::query()->orderBy('name')->get(['slug', 'name'])
                ->map(fn (GamedMetric $m): array => ['slug' => $m->slug, 'name' => $m->name])
                ->all(),
        ];
    }

    private function levelName(int $level): ?string
    {
        $group = MetricLevelGroup::findBySlug(self::GROUP);
        if ($group === null) {
            return null;
        }

        // Tiers are sparse (1,3,5,7,10) — pick the highest defined tier at
        // or below the user's current level.
        return MetricLevelGroupLevel::query()
            ->where('metric_level_group_id', $group->id)
            ->where('level', '<=', $level)
            ->orderByDesc('level')
            ->value('name');
    }
}
