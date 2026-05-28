<?php

namespace App\Providers;

use App\Models\User;
use App\Services\Entitlements;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use ParticleAcademy\Fms\Services\FeatureManager;

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
        // (the laravel-catalog admin's configured ability) resolve to the
        // User::is_admin flag.
        Gate::define('admin', fn (User $user): bool => (bool) $user->is_admin);
        Gate::define('manageCatalog', fn (User $user): bool => (bool) $user->is_admin);

        // Login throttle — keyed by email + IP so a single attacker IP
        // can't drain the budget for legitimate users on the same email.
        RateLimiter::for('login', function (Request $request): Limit {
            $key = strtolower((string) $request->input('email')).'|'.$request->ip();

            return Limit::perMinute(5)->by($key);
        });

        // Coin minting listeners are auto-discovered via their handle()
        // typehints in app/Listeners/MintCoinsFrom{Xp,Achievement,Prize}.
        // See config/coins.php for the per-metric and per-slug rates.

        // Pro entitlement (laravel-fms pre-strategy, v0.6.0+). Runs before
        // the Gate/registry/config chain: a Pro feature is granted to anyone
        // who holds an active subscription OR earned the `sandbox-pro` prize.
        // Non-entitled users fall through (null) so the feature stays off by
        // default. This is the pay-OR-earn unlock that ties catalog + fms +
        // fun-lab together. FeatureManager is a singleton, so registering
        // here attaches to the same instance the FMS facade resolves.
        app(FeatureManager::class)->registerPreStrategy(
            'pro-entitlement',
            function (string $feature, $user) {
                $entitlements = app(Entitlements::class);
                if (! $entitlements->isProFeature($feature)) {
                    return null; // not Pro-gated — let the normal chain decide
                }

                return $entitlements->isPro($user instanceof User ? $user : null) ? true : null;
            },
        );
    }
}
