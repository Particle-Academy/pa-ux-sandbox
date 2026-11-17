<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;
use Laravel\Socialite\Two\User as SocialiteUser;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * GitHub is the ONLY way into the showcase: sign-in and registration both.
 *
 * There is no password login and no sign-up form. A first GitHub sign-in
 * creates the account (with no password), a later one signs into it.
 *
 * Every failure lands on /login with a readable reason rather than a 500, and
 * is logged with its category so a production failure can be diagnosed from
 * the log without reproducing it.
 */
class GitHubLoginController extends Controller
{
    /**
     * Send the visitor to GitHub's consent screen.
     *
     * An Inertia `<Link>` makes this request over XHR, and an XHR cannot follow
     * a redirect to github.com (CORS), so the click silently did nothing. For
     * an Inertia visit, answer with `Inertia::location()`, which makes the
     * client do a full-page navigation instead.
     */
    public function redirect(Request $request): Response
    {
        if ($request->header('X-Inertia')) {
            return Inertia::location(route('auth.github'));
        }

        return Socialite::driver('github')
            ->scopes(['read:user', 'user:email'])
            ->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        if ($request->has('error')) {
            return $this->failed(
                'GitHub sign-in was cancelled: '.$request->input('error_description', $request->input('error')),
                'github_returned_error',
                ['error' => (string) $request->input('error')],
            );
        }

        try {
            /** @var SocialiteUser $github */
            $github = Socialite::driver('github')->user();
        } catch (InvalidStateException) {
            return $this->failed(
                'That GitHub sign-in link expired. Please try again.',
                'invalid_state',
            );
        } catch (Throwable $e) {
            return $this->failed(
                'GitHub sign-in failed. Please try again in a moment.',
                'token_or_profile_exchange_failed',
                // Class and status only: an HTTP client message can quote a
                // request, and nothing secret belongs in the log.
                ['exception' => $e::class, 'code' => (string) $e->getCode()],
            );
        }

        $githubId = (string) $github->getId();
        $email = $github->getEmail() ?: $github->getNickname().'@users.noreply.github.com';

        $user = User::query()->where('github_id', $githubId)->first();

        if ($user === null && User::query()->where('email', $email)->exists()) {
            // An account that was not created through GitHub already holds
            // this address. Do not merge into it silently, and do not 500 on
            // the unique index either.
            return $this->failed(
                'An existing account already uses the email on this GitHub profile. Contact support to link it.',
                'email_already_registered',
                ['github_id' => $githubId],
            );
        }

        $attributes = [
            'name' => $github->getName() ?: $github->getNickname(),
            'github_username' => $github->getNickname(),
            'avatar_url' => $github->getAvatar(),
        ];

        if ($user === null) {
            $user = User::query()->create($attributes + ['github_id' => $githubId, 'email' => $email]);
        } else {
            $user->fill($attributes);

            // Keep the email current, but never steal one another account holds.
            if (! User::query()->where('email', $email)->whereKeyNot($user->getKey())->exists()) {
                $user->email = $email;
            }

            $user->save();
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        return redirect()->intended('/');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    /**
     * @param  array<string, string>  $context
     */
    private function failed(string $message, string $reason, array $context = []): RedirectResponse
    {
        Log::warning('GitHub sign-in failed', ['reason' => $reason] + $context);

        return redirect()->route('login')->withErrors(['github' => $message]);
    }
}
