<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Models\LeaderboardSnapshot;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    public function __invoke(Request $request): View
    {
        $scope = $request->query('scope', 'all_time');
        if (!in_array($scope, ['all_time', 'last_30_days'], true)) {
            $scope = 'all_time';
        }

        $snapshot = LeaderboardSnapshot::query()
            ->where('scope', $scope)
            ->orderByDesc('generated_at')
            ->first();

        return view('showcase.leaderboard', [
            'scope' => $scope,
            'snapshot' => $snapshot,
            'rows' => $snapshot?->rows ?? [],
        ]);
    }
}
