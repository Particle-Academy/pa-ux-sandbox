<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Mlm\MlmProgram;
use App\Support\Usernames;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The end-user "refer a friend" surface — the gamified downline dashboard built
 * on fancy-mlm-ui (DownlineTree / CommissionStatement / RankProgress) over the
 * live fancy-mlm engine, plus a share kit (one-tap social + copy-ready
 * conversation starters). The user's shareable link is /join/{username}.
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
}
