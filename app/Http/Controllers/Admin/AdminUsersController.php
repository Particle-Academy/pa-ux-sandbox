<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use LaravelFunLab\Facades\LFL;
use LaravelFunLab\Models\Achievement;
use LaravelFunLab\Models\GamedMetric;
use LaravelFunLab\Models\Prize;

class AdminUsersController extends Controller
{
    public function index(Request $request): \Illuminate\Contracts\View\View
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

        return view('admin.users.index', [
            'users' => $users,
            'search' => $search,
            'sort' => $sort,
        ]);
    }

    public function show(User $user): \Illuminate\Contracts\View\View
    {
        $profile = $user->getProfile()->load('metrics.gamedMetric');

        $metrics = $profile->metrics->map(fn ($m) => [
            'slug' => $m->gamedMetric?->slug ?? '—',
            'name' => $m->gamedMetric?->name ?? '—',
            'total_xp' => $m->total_xp,
            'level' => $m->current_level,
        ])->sortByDesc('total_xp')->values();

        return view('admin.users.show', [
            'user' => $user,
            'profile' => $profile,
            'wallet' => $user->getWallet(),
            'transactions' => $user->getWallet()->transactions()->limit(30)->get(),
            'metrics' => $metrics,
            'achievements' => $user->getAchievements(),
            'allMetrics' => GamedMetric::orderBy('name')->get(['slug', 'name']),
            'allAchievements' => Achievement::orderBy('name')->get(['slug', 'name']),
            'allPrizes' => Prize::orderBy('name')->get(['slug', 'name']),
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
