<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Models\LeaderboardSnapshot;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use LaravelFunLab\Facades\LFL;
use LaravelFunLab\Models\Profile;

class LeaderboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $scope = $this->scope($request);
        $contributors = $this->contributorsFor($scope);

        return Inertia::render('Leaderboard', [
            'scope' => $scope,
            'snapshot' => $contributors['snapshot'],
            'rows' => $contributors['rows'],
            'players' => $this->players(),
        ]);
    }

    /**
     * JSON contributors feed for a scope — the showcase dogfoods fancy-query
     * here so the Leaderboard's scope toggle caches + refetches in place
     * instead of a full Inertia page reload.
     */
    public function contributors(Request $request): JsonResponse
    {
        return response()->json($this->contributorsFor($this->scope($request)));
    }

    private function scope(Request $request): string
    {
        $scope = $request->query('scope', 'all_time');

        return in_array($scope, ['all_time', 'last_30_days'], true) ? $scope : 'all_time';
    }

    /**
     * @return array{scope: string, snapshot: array{generated_at: string}|null, rows: array<int, mixed>}
     */
    private function contributorsFor(string $scope): array
    {
        $snapshot = LeaderboardSnapshot::query()
            ->where('scope', $scope)
            ->orderByDesc('generated_at')
            ->first();

        return [
            'scope' => $scope,
            'snapshot' => $snapshot ? [
                'generated_at' => $snapshot->generated_at->toIso8601String(),
            ] : null,
            'rows' => $snapshot?->rows ?? [],
        ];
    }

    /**
     * Top players by total XP (opted-out users excluded by default), with
     * their coin balance + cosmetics so the row can render frames/colors.
     *
     * @return array<int, array<string, mixed>>
     */
    private function players(int $limit = 20): array
    {
        return LFL::leaderboard()
            ->for(User::class)
            ->by('xp')
            ->take($limit)
            ->map(function (Profile $profile) {
                /** @var User|null $user */
                $user = $profile->awardable;

                return [
                    'rank' => (int) $profile->getAttribute('rank'),
                    'name' => $user?->github_username ?? $user?->name ?? 'Anonymous',
                    'avatar_url' => $user?->avatar_url,
                    'total_xp' => (int) $profile->total_xp,
                    'coins' => $user ? $user->coinBalance() : 0,
                    'cosmetics' => $user?->cosmetic_slots ?? [],
                ];
            })
            ->all();
    }
}
