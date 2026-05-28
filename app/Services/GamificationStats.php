<?php

namespace App\Services;

use App\Models\ShowcaseSubmission;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use LaravelFunLab\Models\AchievementGrant;
use LaravelFunLab\Models\Profile;

/**
 * Read-only aggregates for the admin dashboard. Kept as a service so the
 * shape is unit-testable independent of the Blade view.
 */
class GamificationStats
{
    /** @return array<string, mixed> */
    public function dashboard(): array
    {
        return [
            'coins' => $this->coins(),
            'engagement' => $this->engagement(),
            'topEarners' => $this->topEarners(),
            'featured' => $this->featured(),
            'pendingSubmissions' => ShowcaseSubmission::where('status', 'pending')->count(),
        ];
    }

    /** @return array<string, int> */
    protected function coins(): array
    {
        $startOfDay = Carbon::today();

        return [
            'in_circulation' => (int) Wallet::sum('balance'),
            'lifetime_minted' => (int) Wallet::sum('lifetime_earned'),
            'earned_today' => (int) WalletTransaction::where('kind', 'credit')
                ->where('created_at', '>=', $startOfDay)->sum('amount'),
            'spent_today' => (int) WalletTransaction::where('kind', 'debit')
                ->where('created_at', '>=', $startOfDay)->sum('amount'),
        ];
    }

    /** @return array<string, int> */
    protected function engagement(): array
    {
        return [
            'total_xp' => (int) Profile::sum('total_xp'),
            'achievements_unlocked' => AchievementGrant::count(),
            'active_profiles' => Profile::where('total_xp', '>', 0)->count(),
            'new_users_7d' => User::where('created_at', '>=', Carbon::now()->subDays(7))->count(),
        ];
    }

    /**
     * Top earners all-time (by lifetime coins minted) and this week (by
     * coins credited in the last 7 days). Names resolved in one pass.
     *
     * @return array{all_time: array<int, array<string, mixed>>, this_week: array<int, array<string, mixed>>}
     */
    protected function topEarners(int $limit = 5): array
    {
        $allTime = Wallet::query()
            ->where('lifetime_earned', '>', 0)
            ->with('user:id,name')
            ->orderByDesc('lifetime_earned')
            ->limit($limit)
            ->get()
            ->map(fn (Wallet $w) => [
                'name' => $w->user?->name ?? '—',
                'value' => $w->lifetime_earned,
            ])->all();

        $weekRows = WalletTransaction::query()
            ->select('wallets.user_id', DB::raw('SUM(wallet_transactions.amount) as earned'))
            ->join('wallets', 'wallets.id', '=', 'wallet_transactions.wallet_id')
            ->where('wallet_transactions.kind', 'credit')
            ->where('wallet_transactions.created_at', '>=', Carbon::now()->subDays(7))
            ->groupBy('wallets.user_id')
            ->orderByDesc('earned')
            ->limit($limit)
            ->get();

        $names = User::whereIn('id', $weekRows->pluck('user_id'))->pluck('name', 'id');
        $thisWeek = $weekRows->map(fn ($r) => [
            'name' => $names[$r->user_id] ?? '—',
            'value' => (int) $r->earned,
        ])->all();

        return ['all_time' => $allTime, 'this_week' => $thisWeek];
    }

    /**
     * @return array{count: int, items: array<int, array<string, mixed>>}
     */
    protected function featured(): array
    {
        $items = ShowcaseSubmission::query()
            ->whereNotNull('featured_until')
            ->where('featured_until', '>', now())
            ->orderBy('featured_until')
            ->limit(10)
            ->get(['id', 'title', 'url', 'featured_until'])
            ->map(fn (ShowcaseSubmission $s) => [
                'id' => $s->id,
                'title' => $s->title ?? '(untitled)',
                'url' => $s->url,
                'until' => $s->featured_until->format('M j, Y'),
            ])->all();

        return ['count' => count($items), 'items' => $items];
    }
}
