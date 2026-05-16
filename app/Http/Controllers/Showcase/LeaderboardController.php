<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Models\LeaderboardSnapshot;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaderboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $scope = $request->query('scope', 'all_time');
        if (!in_array($scope, ['all_time', 'last_30_days'], true)) {
            $scope = 'all_time';
        }

        $snapshot = LeaderboardSnapshot::query()
            ->where('scope', $scope)
            ->orderByDesc('generated_at')
            ->first();

        return Inertia::render('Leaderboard', [
            'scope' => $scope,
            'snapshot' => $snapshot ? [
                'generated_at' => $snapshot->generated_at->toIso8601String(),
            ] : null,
            'rows' => $snapshot?->rows ?? [],
        ]);
    }
}
