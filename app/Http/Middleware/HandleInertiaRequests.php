<?php

namespace App\Http\Middleware;

use App\Services\PlayerProfile;
use App\Support\SelfSite;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     */
    protected $rootView = 'showcase-app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Default shared props for every Inertia response.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'csrfToken' => csrf_token(),
            'auth' => [
                'user' => $user ? [
                    'name' => $user->name,
                    'github_username' => $user->github_username,
                    'avatar_url' => $user->avatar_url,
                    // Gamification summary for the chrome chip. Lazy so it
                    // only resolves on full page loads / when requested.
                    'player' => fn () => app(PlayerProfile::class)->summary($user),
                ] : null,
                // Admin chrome link, computed server-side from the `admin` Gate
                // — NOT the raw users.is_admin column, which is never sent to the
                // browser. Non-admins and guests get null, so their payload
                // carries no admin reference at all. This is a UI convenience
                // only: every /admin route is independently protected by the
                // `can:admin` middleware, so faking this client-side reveals and
                // grants nothing.
                'admin' => $user && Gate::forUser($user)->allows('admin')
                    ? ['url' => route('admin.dashboard', absolute: false)] // relative, like the other nav links (Inertia client visit)
                    : null,
            ],
            'flash' => [
                'auth_error' => fn () => $request->session()->get('auth_error'),
                'submitted' => fn () => $request->session()->get('submitted'),
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            // The showcase's own heuristics identity (read from the pasted Fancy
            // Pixel tracker), so the in-browser agent sink can attribute
            // agent-driven activity to the same site humans are tracked under.
            // Lazy: only resolves on full loads / explicit partial requests.
            'heuristicsSelf' => fn () => ($key = SelfSite::key()) === null ? null : [
                'siteKey' => $key,
                'endpoint' => SelfSite::endpoint(),
            ],
        ];
    }
}
