<?php

namespace App\Providers;

use App\Models\Setting;
use App\Models\User;
use App\Services\Entitlements;
use App\Services\Mlm\MlmProgram;
use App\Ssr\TimeoutHttpGateway;
use FancyMlm\Plan\CompensationPlan;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;
use Inertia\Ssr\Gateway;
use ParticleAcademy\Fms\Services\FeatureManager;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Live, admin-editable MLM compensation plan. The fancy-mlm package binds
        // CompensationPlan from the static config('mlm.plan'); we rebind it to the
        // Setting-backed plan MlmProgram owns, so the admin config surface can
        // switch the downline shape (unilevel / binary / matrix) + tiers at
        // runtime and the package's engine + facade + fun-lab referral listener
        // all resolve the live plan on the next request. Rebound in boot() so it
        // wins over the package provider's register() binding.
        $this->app->bind(
            CompensationPlan::class,
            fn ($app) => $app->make(MlmProgram::class)->plan(),
        );

        // Scope the auto-referral loop to the demo activity metric so the package's
        // XpAwarded listener only cascades for network activity — not for every XP
        // award across the whole sandbox economy (explorer-xp, docs reads, …).
        config(['mlm.fun_lab.trigger_metrics' => [MlmProgram::ACTIVITY_METRIC]]);

        // Bounded-timeout Inertia SSR gateway — overrides the package default
        // (which calls the node daemon with NO HTTP timeout → Laravel's 30s) so a
        // hung/slow SSR daemon fast-fails to client rendering instead of pinning a
        // PHP-FPM worker for 30s (which once cascaded to pool exhaustion + a prod
        // outage). Rebound in boot() so it wins over Inertia's register() binding.
        $this->app->bind(Gateway::class, TimeoutHttpGateway::class);

        // Refuse to boot a production app in debug mode — full stack traces,
        // env values, and SQL bindings would leak in error responses.
        if ($this->app->environment('production') && config('app.debug')) {
            throw new \RuntimeException(
                'APP_DEBUG must be false in production. Aborting boot.',
            );
        }

        // Behind Forge's TLS-terminating proxy the request reaches PHP as http,
        // so route()/redirect() would emit http:// URLs the browser blocks as
        // mixed content (e.g. the showcase-submission redirect to ".../installed").
        // Force https URL generation whenever the canonical app URL is https OR
        // the request actually arrived over https (via the trusted proxy headers)
        // — so a stale/misconfigured http APP_URL can't reintroduce mixed content.
        // A genuine no-op for http-only local dev. (TrustProxies in
        // bootstrap/app.php additionally fixes scheme detection + secure cookies.)
        if (str_starts_with((string) config('app.url'), 'https://') || request()->isSecure()) {
            URL::forceScheme('https');
        }

        // Gate definitions — both 'admin' (sandbox routes) and 'manageCatalog'
        // (the laravel-catalog admin's configured ability) resolve to the
        // User::is_admin flag.
        Gate::define('admin', fn (User $user): bool => (bool) $user->is_admin);
        Gate::define('manageCatalog', fn (User $user): bool => (bool) $user->is_admin);

        // Server-rendered SEO meta for the Inertia root view is now owned by
        // particle-academy/fancy-seo: the <x-fancy-seo::head> component in
        // showcase-app.blade.php resolves the per-route head on full HTML loads
        // (Inertia XHR visits return JSON). See App\Providers\SeoServiceProvider.
        //
        // This composer only injects the admin-pasted tracker/pixel snippet
        // (Admin → Settings), raw, exactly like an external consumer's embed. On
        // a secure request, upgrade any http:// in it to https:// — a snippet
        // generated/pasted when APP_URL was http would otherwise have its pixel
        // beacon + verification ping blocked as mixed content (collecting zero
        // events on the live site).
        View::composer('showcase-app', function ($view): void {
            $tracker = (string) Setting::get('tracker_code', '');
            if ($tracker !== '' && request()->isSecure()) {
                $tracker = str_replace('http://', 'https://', $tracker);
            }
            $view->with('tracker', $tracker);
        });

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
