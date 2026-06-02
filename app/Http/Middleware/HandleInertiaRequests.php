<?php

namespace App\Http\Middleware;

use App\Services\PlayerProfile;
use Illuminate\Http\Request;
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
                    'is_admin' => (bool) $user->is_admin,
                    // Gamification summary for the chrome chip. Lazy so it
                    // only resolves on full page loads / when requested.
                    'player' => fn () => app(PlayerProfile::class)->summary($user),
                ] : null,
            ],
            'flash' => [
                'auth_error' => fn () => $request->session()->get('auth_error'),
                'submitted' => fn () => $request->session()->get('submitted'),
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
