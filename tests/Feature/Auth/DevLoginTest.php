<?php

use App\Models\User;
use Database\Seeders\DevUsersSeeder;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Tests\TestCase;

uses(TestCase::class);

/**
 * Force the framework's resolved environment for the duration of one test.
 * Note: this also flips the app off `testing`, which disables Laravel's
 * automatic CSRF bypass — POST tests below drop PreventRequestForgery to
 * compensate (we're exercising the dev-login gate here, not CSRF).
 */
function asEnv(string $env): void
{
    app()->detectEnvironment(fn () => $env);
}

it('renders the dev login buttons on the login page in local', function () {
    asEnv('local');

    $this->get('/login')
        ->assertOk()
        ->assertSee('Dev login')
        ->assertSee('admin@fancy.test')
        ->assertSee('user@fancy.test')
        ->assertSee(route('dev-login'));
});

it('does not render or serve the dev login buttons outside local', function () {
    asEnv('production');

    $this->get('/login')
        ->assertOk()
        ->assertDontSee('Dev login')
        ->assertDontSee('admin@fancy.test')
        ->assertDontSee('/dev-login');
});

it('logs in as the admin dev account in local', function () {
    $this->seed(DevUsersSeeder::class); // seed while still in `testing` (not production)
    asEnv('local');

    $this->withoutMiddleware(PreventRequestForgery::class)
        ->post('/dev-login', ['email' => 'admin@fancy.test'])
        ->assertRedirect(route('home'));

    expect(auth()->check())->toBeTrue()
        ->and(auth()->user()->email)->toBe('admin@fancy.test')
        ->and(auth()->user()->is_admin)->toBeTrue();
});

it('logs in as the regular dev account in local', function () {
    $this->seed(DevUsersSeeder::class);
    asEnv('local');

    $this->withoutMiddleware(PreventRequestForgery::class)
        ->post('/dev-login', ['email' => 'user@fancy.test'])
        ->assertRedirect(route('home'));

    expect(auth()->user()->is_admin)->toBeFalse();
});

it('404s for dev login outside local even with a valid dev email', function () {
    $this->seed(DevUsersSeeder::class); // accounts exist; the gate must still hold
    asEnv('production');

    $this->withoutMiddleware(PreventRequestForgery::class)
        ->post('/dev-login', ['email' => 'admin@fancy.test'])
        ->assertNotFound();

    expect(auth()->check())->toBeFalse();
});

it('404s for an email outside the dev allow-list', function () {
    $this->seed(DevUsersSeeder::class);
    asEnv('local');

    $this->withoutMiddleware(PreventRequestForgery::class)
        ->post('/dev-login', ['email' => 'attacker@example.com'])
        ->assertNotFound();

    expect(auth()->check())->toBeFalse();
});

it('refuses to seed dev users in production', function () {
    asEnv('production');

    // Call the seeder directly — exercising the guard, not the artisan layer.
    expect(fn () => (new DevUsersSeeder)->run())
        ->toThrow(RuntimeException::class);
});

it('seeds two idempotent dev accounts', function () {
    $this->seed(DevUsersSeeder::class);
    $this->seed(DevUsersSeeder::class); // re-run must not duplicate

    expect(User::whereIn('email', ['admin@fancy.test', 'user@fancy.test'])->count())->toBe(2);
});
