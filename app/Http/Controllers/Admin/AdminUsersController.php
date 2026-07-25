<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShowcaseSubmission;
use App\Models\User;
use App\Services\Entitlements;
use App\Services\Mlm\MlmProgram;
use App\Services\PlayerProfile;
use App\Support\PlayerIdentity;
use FancyMlm\Laravel\Models\Member;
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
    public function __construct(private readonly Entitlements $entitlements) {}

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

        // Pre-aggregate each listed user's submission count in one query (no N+1).
        $userIds = collect($users->items())->pluck('id');
        $siteCounts = ShowcaseSubmission::query()
            ->selectRaw('user_id, COUNT(*) as c')
            ->whereIn('user_id', $userIds)
            ->groupBy('user_id')
            ->pluck('c', 'user_id');

        // Each listed user's referral sponsor in one query (no N+1): their
        // member row eager-loading sponsor + the sponsor's user, keyed by user_id.
        $membersByUserId = Member::query()
            ->with('sponsor.user')
            ->whereIn('user_id', $userIds)
            ->get()
            ->keyBy('user_id');

        return Inertia::render('Admin/Users', [
            'users' => collect($users->items())->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'github_username' => $user->github_username,
                // Admin lists label people by their account name, not their
                // public handle — but still render the equipped cosmetics, so
                // moderators see exactly what other players see.
                'identity' => PlayerIdentity::for($user, $user->name),
                'is_admin' => (bool) $user->is_admin,
                'suspended' => $user->isSuspended(),
                'coins' => (int) ($user->wallet?->balance ?? 0),
                'joined' => $user->created_at?->format('M j, Y'),
                'proSource' => $this->entitlements->proSource($user),
                'sites' => (int) ($siteCounts[$user->id] ?? 0),
                'sponsor' => $this->sponsorFor($membersByUserId->get($user->id)),
            ])->all(),
            'search' => $search,
            'sort' => $sort,
            'total' => $users->total(),
            'pending' => ShowcaseSubmission::where('status', 'pending')->count(),
        ]);
    }

    /**
     * The users-list "Sponsor" cell: who referred this user's member, or null
     * when they're not in the network / are a network root.
     *
     * @return array{label: string, userId: int|null}|null
     */
    private function sponsorFor(?Member $member): ?array
    {
        $sponsor = $member?->sponsor;
        if ($sponsor === null) {
            return null;
        }

        return [
            'label' => $sponsor->user?->name
                ?? ($sponsor->meta['label'] ?? null)
                ?? 'Member #'.$sponsor->getKey(),
            'userId' => $sponsor->user_id !== null ? (int) $sponsor->user_id : null,
        ];
    }

    public function show(User $user, PlayerProfile $playerProfile, MlmProgram $program): Response
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

        $ownedSites = ShowcaseSubmission::query()
            ->where('user_id', $user->id)
            ->latest('id')
            ->get()
            ->map(fn (ShowcaseSubmission $s) => [
                'id' => $s->id,
                'label' => $s->title ?: (parse_url($s->url, PHP_URL_HOST) ?: $s->url),
                'host' => parse_url($s->url, PHP_URL_HOST) ?: $s->url,
                'status' => $s->status,
                'listable' => $s->isPubliclyListable(),
                'suspended' => $s->isSuspended(),
                'nsfw_status' => $s->nsfw_status,
                'created' => $s->created_at?->format('M j, Y'),
            ])->all();

        // The referral-network card: this user's member row (null until they're
        // enrolled) plus the full member list for the sponsor/placement pickers.
        $mlmMembers = $program->membersForAdmin();
        $mlmMember = collect($mlmMembers)->first(fn (array $m): bool => $m['userId'] === $user->id);

        return Inertia::render('Admin/UserShow', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'github_username' => $user->github_username,
                'identity' => PlayerIdentity::for($user, $user->name),
                'is_admin' => (bool) $user->is_admin,
                'opted_out' => $user->isOptedOut(),
                'suspended' => $user->isSuspended(),
                'suspension_reason' => $user->suspension_reason,
                'can_suspend' => $user->id !== auth()->id() && ! $user->is_admin,
                'pro' => $summary['pro'],
                'proSource' => $summary['proSource'],
                'pro_override' => (bool) $user->pro_override,
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
            'ownedSites' => $ownedSites,
            'allMetrics' => GamedMetric::orderBy('name')->get(['slug', 'name'])
                ->map(fn ($m) => ['slug' => $m->slug, 'name' => $m->name])->all(),
            'allAchievements' => Achievement::orderBy('name')->get(['slug', 'name'])
                ->map(fn ($a) => ['slug' => $a->slug, 'name' => $a->name])->all(),
            'allPrizes' => Prize::orderBy('name')->get(['slug', 'name'])
                ->map(fn ($p) => ['slug' => $p->slug, 'name' => $p->name])->all(),
            'mlmMember' => $mlmMember,
            'mlmMembers' => $mlmMembers,
            'mlmTierKeys' => array_keys($program->planData()['tiers'] ?? []),
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

        $user->forceFill(['is_admin' => ! $user->is_admin])->save();

        return back()->with('success', "{$user->name} is ".($user->is_admin ? 'now an admin.' : 'no longer an admin.'));
    }

    /**
     * Manually grant / revoke Pro — the admin override (third Pro source). A
     * user with an active subscription or the earned prize stays Pro regardless;
     * this just toggles the manual flag.
     */
    public function togglePro(User $user): RedirectResponse
    {
        $user->forceFill(['pro_override' => ! $user->pro_override])->save();

        return back()->with(
            'success',
            "{$user->name} ".($user->pro_override ? 'manually granted Pro.' : 'manual Pro revoked.'),
        );
    }

    /**
     * Suspend / reinstate a user — a full account freeze: login is blocked
     * (EnsureUserNotSuspended), every showcase site is delisted, and Pro is
     * frozen (Entitlements). Never self, never another admin.
     */
    public function toggleSuspend(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            return back()->with('error', "You can't suspend yourself.");
        }
        if ($user->is_admin) {
            return back()->with('error', "Admins can't be suspended — revoke admin first.");
        }

        if ($user->isSuspended()) {
            $user->forceFill(['suspended_at' => null, 'suspension_reason' => null])->save();
            // Re-evaluate each site's public listing now the freeze is lifted.
            $user->submissions()->get()->each->syncHeuristicsVisibility();

            return back()->with('success', "{$user->name}'s suspension was lifted — login + sites restored.");
        }

        $reason = (string) ($request->validate(['reason' => 'nullable|string|max:255'])['reason'] ?? '');
        $user->forceFill([
            'suspended_at' => now(),
            'suspension_reason' => $reason !== '' ? $reason : 'admin suspension',
        ])->save();
        // Delist every site they own from the public showcase.
        $user->submissions()->get()->each->syncHeuristicsVisibility();

        return back()->with('success', "{$user->name} suspended — login blocked, sites delisted, Pro frozen.");
    }
}
