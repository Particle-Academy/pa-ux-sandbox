<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A GitHub repo's star count — populated by the leaderboard sync (absolute)
 * and nudged live by the `star` webhook. Keyed by `owner/name`.
 */
class GithubRepoStat extends Model
{
    protected $fillable = [
        'repo',
        'stars',
        'synced_at',
    ];

    protected function casts(): array
    {
        return [
            'stars' => 'integer',
            'synced_at' => 'datetime',
        ];
    }

    /**
     * repo (owner/name) => stars, for a quick lookup map keyed by the lowercased
     * repo so callers can match `PackageRegistry` repo strings case-insensitively.
     *
     * @return array<string, int>
     */
    public static function starMap(): array
    {
        return self::query()
            ->pluck('stars', 'repo')
            ->mapWithKeys(fn ($stars, $repo) => [strtolower((string) $repo) => (int) $stars])
            ->all();
    }
}
