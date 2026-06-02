<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShowcaseSubmission;
use App\Models\User;
use App\Services\PlayerProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use LaravelFunLab\Facades\LFL;
use LaravelFunLab\Models\Achievement;
use LaravelFunLab\Models\GamedMetric;
use LaravelFunLab\Models\Prize;

class AdminUsersController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('q', ''));
        $sort = $request->query('sort', 'recent');

        $query = User::query()->with('wallet');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('github_username', 'like', "%{$search}%");
            });
        }

        match ($sort) {
            'coins' => $query->leftJoin('wallets', 'wallets.user_id', '=', 'users.id')
                ->orderByDesc('wallets.balance')
                ->select('users.*'),
            'name' => $query->orderBy('name'),
            default => $query->latest('users.created_at'),
        };

        $users = $query->paginate(25)->withQueryString();

        return Inertia::render('Admin/Users', [
            'users' => collect($users->items())->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'github_username' => $user->github_username,
                'avatar_url' => $user->avatar_url,
                'is_admin' => (bool) $user->is_admin,
                'coins' => (int) ($user->wallet?->balance ?? 0),
                'joined' => $user->created_at?->format('M j, Y'),
            ])->all(),
            'search' => $search,
            'sort' => $sort,
            'total' => $users->total(),
            'pending' => ShowcaseSubmission::where('status', 'pending')->count(),
        ]);
    }

    public function show(User $user, PlayerProfile $playerProfile): Response
    {
        $profile = $user->getProfile()->load('metrics.gamedMetric');
        $summary = $playerProfile->summary($user);
        $wallet = $user->getWallet();

        $metrics = $profile->metrics
            ->filter(fn ($m) => $m->gamedMetric !== null)
            ->map(fn ($m) => [
                'metric' => $m->gamedMetric->name,
                'slug' => $m->gamedMetric->slug,
                'level' => (int) $m->current_level,
                'xp' => (int) $m->total_xp,
            ])
            ->sortByDesc('xp')
            ->values()
            ->all();

        $transactions = $wallet->transactions()->limit(30)->get()->map(fn ($tx) => [
            'kind' => $tx->kind,
            'amount' => (int) $tx->amount,
            'reason' => $tx->reason,
            'at' => $tx->created_at?->diffForHumans(),
        ])->all();

        $achievements = $user->getRecentAchievements(50)->map(fn ($grant) => [
            'name' => $grant->achievement?->name ?? $grant->achievement?->slug ?? '—',
            'granted_at' => $grant->granted_at?->format('M j, Y'),
        ])->all();

        return Inertia::render('Admin/UserShow', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'github_username' => $user->github_username,
                'avatar_url' => $user->avatar_url,
                'is_admin' => (bool) $user->is_admin,
                'opted_out' => $user->isOptedOut(),
                'pro' => $summary['pro'],
                'proSource' => $summary['proSource'],
                'coins' => (int) $wallet->balance,
                'lifetime_earned' => (int) $wallet->lifetime_earned,
                'lifetime_spent' => (int) $wallet->lifetime_spent,
                'level' => $summary['level'],
                'levelName' => $summary['levelName'],
                'totalXp' => $summary['totalXp'],
            ],
            'metrics' => $metrics,
            'transactions' => $transactions,
            'achievements' => $achievements,
            'allMetrics' => GamedMetric::orderBy('name')->get(['slug', 'name'])
                ->map(fn ($m) => ['slug' => $m->slug, 'name' => $m->name])->all(),
            'allAchievements' => Achievement::orderBy('name')->get(['slug', 'name'])
                ->map(fn ($a) => ['slug' => $a->slug, 'name' => $a->name])->all(),
            'allPrizes' => Prize::orderBy('name')->get(['slug', 'name'])
                ->map(fn ($p) => ['slug' => $p->slug, 'name' => $p->name])->all(),
            'pending' => ShowcaseSubmission::where('status', 'pending')->count(),
        ]);
    }

    public function grantXp(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'metric' => 'required|string|exists:lfl_gamed_metrics,slug',
            'amount' => 'required|integer|min:1|max:1000000',
            'reason' => 'nullable|string|max:255',
        ]);

        LFL::award($data['metric'])
            ->to($user)
            ->amount($data['amount'])
            ->because($data['reason'] ?? 'admin grant')
            ->save();

        return back()->with('success', "Granted {$data['amount']} {$data['metric']} to {$user->name}.");
    }

    public function grantCoins(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'amount' => 'required|integer|min:1|max:10000000',
            'reason' => 'nullable|string|max:255',
        ]);

        $user->getWallet()->credit(
            amount: $data['amount'],
            reason: $data['reason'] ?? 'admin grant',
            metadata: ['source' => 'admin-grant', 'admin_id' => $request->user()->id],
        );

        return back()->with('success', "Credited {$data['amount']} coins to {$user->name}.");
    }

    public function grantAchievement(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'achievement' => 'required|string|exists:lfl_achievements,slug',
        ]);

        LFL::grant($data['achievement'])->to($user)->because('admin grant')->save();

        return back()->with('success', "Granted achievement '{$data['achievement']}' to {$user->name}.");
    }

    public function grantPrize(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'prize' => 'required|string|exists:lfl_prizes,slug',
        ]);

        LFL::grant($data['prize'])->to($user)->because('admin grant')->save();

        return back()->with('success', "Granted prize '{$data['prize']}' to {$user->name}.");
    }

    public function toggleOptOut(User $user): RedirectResponse
    {
        if ($user->isOptedOut()) {
            $user->optIn();
            $msg = "{$user->name} opted back in to gamification.";
        } else {
            $user->optOut();
            $msg = "{$user->name} opted out of gamification.";
        }

        return back()->with('success', $msg);
    }

    public function toggleAdmin(Request $request, User $user): RedirectResponse
    {
        // Guard against an admin removing their own access and locking out.
        if ($user->id === $request->user()->id) {
            return back()->with('error', "You can't change your own admin flag.");
        }

        $user->update(['is_admin' => ! $user->is_admin]);

        return back()->with('success', "{$user->name} is ".($user->is_admin ? 'now an admin.' : 'no longer an admin.'));
    }
}
