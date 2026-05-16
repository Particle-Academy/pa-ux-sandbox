<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;

class GitHubLoginController extends Controller
{
    public function redirect(): SymfonyRedirectResponse
    {
        return Socialite::driver('github')
            ->scopes(['read:user', 'user:email'])
            ->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        if ($request->has('error')) {
            return redirect('/')->with('auth_error', $request->input('error_description', 'GitHub sign-in was cancelled.'));
        }

        $github = Socialite::driver('github')->user();

        $user = User::updateOrCreate(
            ['github_id' => (string) $github->getId()],
            [
                'name' => $github->getName() ?: $github->getNickname(),
                'email' => $github->getEmail() ?: $github->getNickname().'@users.noreply.github.com',
                'github_username' => $github->getNickname(),
                'avatar_url' => $github->getAvatar(),
            ],
        );

        Auth::login($user, true);

        return redirect()->intended('/');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }
}
