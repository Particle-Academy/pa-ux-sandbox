<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Refuse to boot a production app in debug mode — full stack traces,
        // env values, and SQL bindings would leak in error responses.
        if ($this->app->environment('production') && config('app.debug')) {
            throw new \RuntimeException(
                'APP_DEBUG must be false in production. Aborting boot.',
            );
        }

        // Gate definitions — both 'admin' (sandbox routes) and 'manageCatalog'
        // (the laravel-catalog Livewire admin's configured ability) resolve
        // to the User::is_admin flag.
        Gate::define('admin', fn (User $user): bool => (bool) $user->is_admin);
        Gate::define('manageCatalog', fn (User $user): bool => (bool) $user->is_admin);

        // Login throttle — keyed by email + IP so a single attacker IP
        // can't drain the budget for legitimate users on the same email.
        RateLimiter::for('login', function (Request $request): Limit {
            $key = strtolower((string) $request->input('email')).'|'.$request->ip();

            return Limit::perMinute(5)->by($key);
        });
    }
}
