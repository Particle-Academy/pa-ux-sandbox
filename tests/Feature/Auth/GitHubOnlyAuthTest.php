<?php

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\MessageBag;
use Illuminate\Support\ViewErrorBag;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;
use Laravel\Socialite\Two\User as SocialiteUser;
use Tests\TestCase;

uses(TestCase::class);

/**
 * The showcase signs people in with GitHub and nothing else (owner ruling).
 *
 * /login used to carry a second, email + password form under the GitHub
 * button, inherited from the original demo app and kept as "secondary". It was
 * reachable from /learn, /shop, the `auth` middleware's redirect and the
 * suspension bounce. These tests fail if any password path comes back.
 */
function fakeGitHubUser(array $overrides = []): SocialiteUser
{
    $attributes = array_merge([
        'id' => 4242,
        'nickname' => 'octo-tester',
        'name' => 'Octo Tester',
        'email' => 'octo@example.com',
        'avatar' => 'https://avatars.example.com/u/4242',
    ], $overrides);

    return (new SocialiteUser)->map($attributes)->setRaw($attributes);
}

function socialiteReturns(SocialiteUser|Throwable $result): void
{
    $driver = Mockery::mock();
    $result instanceof Throwable
        ? $driver->shouldReceive('user')->andThrow($result)
        : $driver->shouldReceive('user')->andReturn($result);

    Socialite::shouldReceive('driver')->with('github')->andReturn($driver);
}

/**
 * Headers of a real Inertia visit, INCLUDING the current asset version. Without
 * the version the middleware answers 409 for a version mismatch, which would
 * make the location assertions pass for the wrong reason (they did, once).
 *
 * @return array<string, string>
 */
function inertiaHeaders(): array
{
    $version = (string) app(HandleInertiaRequests::class)->version(request());

    return ['X-Inertia' => 'true', 'X-Inertia-Version' => $version];
}

// ─── /login offers GitHub, and only GitHub ──────────────────────────────

it('offers GitHub as the only way to sign in on /login', function () {
    $this->get('/login')
        ->assertOk()
        ->assertSee('Continue with GitHub')
        ->assertSee(route('auth.github'), false)
        ->assertDontSee('type="password"', false)
        ->assertDontSee('name="password"', false)
        ->assertDontSee('name="email"', false)
        ->assertDontSee('sign in with email')
        ->assertDontSee('action="'.url('/login').'"', false);
});

it('still shows a suspension notice on /login after the password form is gone', function () {
    $user = User::factory()->create(['suspended_at' => now()]);

    $this->actingAs($user)->get('/profile')->assertRedirect('/login');

    $this->get('/login')->assertSee('Your account has been suspended');
});

// ─── no password route is reachable ─────────────────────────────────────

it('returns 404 for a password login POST', function () {
    $user = User::factory()->create(['password' => 'secret-password']);

    $this->post('/login', ['email' => $user->email, 'password' => 'secret-password'])
        ->assertNotFound();

    expect(Auth::check())->toBeFalse();
});

it('returns 404 for every password and registration endpoint', function (string $method, string $uri) {
    $this->call($method, $uri, [
        'name' => 'Someone',
        'email' => 'someone@example.com',
        'password' => 'secret-password',
        'password_confirmation' => 'secret-password',
    ])->assertNotFound();

    expect(User::query()->where('email', 'someone@example.com')->exists())->toBeFalse();
})->with([
    ['GET', '/register'],
    ['POST', '/register'],
    ['POST', '/signup'],
    ['POST', '/auth/register'],
    ['GET', '/forgot-password'],
    ['POST', '/forgot-password'],
    ['GET', '/reset-password/some-token'],
    ['POST', '/reset-password'],
    ['POST', '/password/email'],
    ['POST', '/password/reset'],
    ['GET', '/confirm-password'],
    ['POST', '/confirm-password'],
    ['PUT', '/user/password'],
]);

it('registers no route that accepts a password or creates an account outside GitHub', function () {
    $offending = collect(Route::getRoutes()->getRoutes())
        ->filter(function ($route) {
            $uri = $route->uri();
            $action = $route->getActionName();

            return preg_match('#(^|/)(register|signup|sign-up|forgot-password|reset-password|confirm-password|password)(/|$)#', $uri)
                || str_contains($action, 'AuthController@login')
                || (in_array('POST', $route->methods(), true) && $uri === 'login' && ! str_contains($action, 'Closure'));
        })
        // The agent-relay "register" endpoints register MCP relay sessions,
        // not accounts.
        ->reject(fn ($route) => preg_match('#^(agent-relay|whiteboard-share)/#', $route->uri()))
        ->map(fn ($route) => implode('|', $route->methods()).' '.$route->uri().' -> '.$route->getActionName())
        ->values()
        ->all();

    expect($offending)->toBe([]);
});

// ─── GitHub is the registration path ────────────────────────────────────

it('creates an account on first GitHub sign-in, with no password', function () {
    socialiteReturns(fakeGitHubUser());

    $this->get('/auth/github/callback?code=abc&state=xyz')->assertRedirect('/');

    $user = User::query()->where('github_id', '4242')->sole();
    expect($user->github_username)->toBe('octo-tester')
        ->and($user->password)->toBeNull()
        ->and(Auth::id())->toBe($user->id);
});

it('signs a returning GitHub user back into the same account', function () {
    $existing = User::factory()->create(['github_id' => '4242', 'password' => null]);
    socialiteReturns(fakeGitHubUser(['email' => 'changed@example.com']));

    $this->get('/auth/github/callback?code=abc&state=xyz')->assertRedirect('/');

    expect(User::query()->where('github_id', '4242')->count())->toBe(1)
        ->and(Auth::id())->toBe($existing->id);
});

it('does not 500 when a GitHub email is already held by another account', function () {
    User::factory()->create(['email' => 'octo@example.com', 'github_id' => null]);
    socialiteReturns(fakeGitHubUser());

    $this->get('/auth/github/callback?code=abc&state=xyz')
        ->assertRedirect('/login')
        ->assertSessionHasErrors('github');

    expect(Auth::check())->toBeFalse()
        ->and(User::query()->where('github_id', '4242')->exists())->toBeFalse();
});

it('sends an expired or replayed GitHub callback back to /login instead of a 500', function () {
    socialiteReturns(new InvalidStateException);

    $this->get('/auth/github/callback?code=abc&state=stale')
        ->assertRedirect('/login')
        ->assertSessionHasErrors('github');

    expect(Auth::check())->toBeFalse();
});

it('sends a cancelled GitHub sign-in back to /login with the reason', function () {
    $this->get('/auth/github/callback?error=access_denied&error_description=The+user+has+denied+your+application+access.')
        ->assertRedirect('/login')
        ->assertSessionHasErrors('github');
});

it('answers an Inertia visit to /auth/github with a full-page location, not an XHR redirect', function () {
    // The phone bottom bar's Sign in was an Inertia <Link>: its XHR followed
    // the 302 to github.com, CORS blocked it, and the tap did nothing.
    $this->get('/auth/github', inertiaHeaders())
        ->assertStatus(409)
        ->assertHeader('X-Inertia-Location', route('auth.github'));
});

it('answers an Inertia visit to /login with a full-page location', function () {
    $this->get('/login', inertiaHeaders())
        ->assertStatus(409)
        ->assertHeader('X-Inertia-Location', route('login'));
});

it('still redirects a plain browser request to GitHub', function () {
    $response = $this->get('/auth/github');

    $response->assertRedirect();
    expect($response->headers->get('Location'))->toStartWith('https://github.com/login/oauth/authorize');
});

it('shows a GitHub sign-in error on /login', function () {
    $this->withSession(['errors' => (new ViewErrorBag)->put('default', new MessageBag(['github' => 'GitHub sign-in failed: test reason']))])
        ->get('/login')
        ->assertSee('GitHub sign-in failed: test reason');
});
