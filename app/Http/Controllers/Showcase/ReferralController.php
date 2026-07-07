<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Mlm\MlmProgram;
use App\Support\Usernames;
use FancyMlm\Laravel\Models\Member;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The end-user "refer a friend" surface — the gamified downline view built on
 * fancy-mlm-ui (DownlineTree / CommissionStatement / RankProgress) over the live
 * fancy-mlm engine. The user's shareable link is /join/{username}; the
 * "simulate activity" loop is ADMIN-ONLY demo tooling (it mints real fun-lab
 * points to uplines).
 */
class ReferralController extends Controller
{
    public function show(Request $request, MlmProgram $program): Response
    {
        $user = $request->user();
        $me = $program->memberForUser($user);

        return Inertia::render('Referrals/Show', [
            'program' => [
                'tree' => $program->plan()->tree,
                'edge' => $program->edge(),
                'metric' => $program->plan()->metric,
                'tiers' => array_keys($program->planData()['tiers'] ?? []),
            ],
            'myMemberId' => (string) $me->getKey(),
            // The username-based link, ABSOLUTE and server-built: the page must
            // never derive it from window.location — the server renders the
            // path-only fallback while the client renders the full origin, a
            // guaranteed hydration mismatch (React #418). Null until the user
            // claims a username (the page then points them to /profile).
            'referralUrl' => $user->username === null ? null : url('/join/'.$user->username),
            'network' => $program->network(),
            'commissions' => $program->commissionsForUser($user),
            'rank' => $program->rankProgress($me),
            // The simulate card is admin demo tooling — the flag mirrors the
            // route's can:admin middleware so non-admins never see it.
            'canSimulate' => Gate::forUser($user)->allows('admin'),
        ]);
    }

    /**
     * Public referral entry: /join/{username}. A real, shareable landing page
     * (personalized OG meta + card come from SeoServiceProvider + the og.join
     * image route) — NOT an instant 302, which made every shared invite link
     * inherit the generic home-page preview. Still remembers who referred this
     * visitor (30-day cookie); the sponsor attaches when their member row is
     * first created. Unknown usernames redirect home silently.
     */
    public function join(Request $request, string $username): RedirectResponse|Response
    {
        $referrer = User::query()
            ->where('username', Usernames::normalize($username))
            ->first();

        if ($referrer === null) {
            return redirect('/');
        }

        Cookie::queue(MlmProgram::REFERRAL_COOKIE, (string) $referrer->getKey(), 60 * 24 * 30);

        return Inertia::render('Referrals/Join', [
            'inviter' => [
                'name' => $referrer->name,
                'username' => $referrer->username,
                'avatarUrl' => $referrer->avatar_url,
            ],
        ]);
    }

    public function simulate(Request $request, MlmProgram $program): RedirectResponse
    {
        $data = $request->validate([
            'member_id' => ['required', 'string'],
            'amount' => ['nullable', 'numeric', 'min:1', 'max:100000'],
        ]);

        $member = Member::query()->find($data['member_id']);
        if ($member === null) {
            return back()->with('error', 'That member is not in the network.');
        }

        $rewards = $program->simulateActivity($member, (float) ($data['amount'] ?? 100));

        $label = $member->user?->name ?? ($member->meta['label'] ?? 'Member #'.$member->getKey());

        return back()
            ->with('mlm_rewards', $rewards)
            ->with('success', $rewards === []
                ? "{$label} acted, but no upline was eligible under this plan."
                : "{$label} acted — ".count($rewards).' upline member(s) earned a referral bonus.');
    }
}
