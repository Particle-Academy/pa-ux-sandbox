<?php

namespace App\Services;

use App\Models\User;
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
            'name' => $user->name,
            'githubUsername' => $user->github_username,
            'avatarUrl' => $user->avatar_url,
            'metrics' => $metrics,
            'achievements' => $achievements,
            'prizes' => $prizes,
            'lifetimeEarned' => $user->getWallet()->lifetime_earned,
            'lifetimeSpent' => $user->getWallet()->lifetime_spent,
            'memberSince' => $user->created_at?->year,
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
