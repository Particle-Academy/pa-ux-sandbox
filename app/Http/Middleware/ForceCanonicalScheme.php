<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

/**
 * Generate https URLs when — and only when — this request belongs to the https
 * site.
 *
 * ## Why this is middleware and not a service provider
 *
 * It used to live in `AppServiceProvider::boot()`, keyed off `config('app.url')`
 * alone. Two things were wrong with that, and the second is the worse one.
 *
 * It forced https on EVERY request, including a plain-http one to
 * `php artisan serve`, which emitted `https://localhost:8000/build/...` against
 * a server with no TLS. Every stylesheet and script failed to load and the page
 * rendered BLANK — with a 200, correct HTML and a populated Inertia payload, so
 * nothing pointed here. It read as "the gallery doesn't work in dev" for weeks
 * and quietly blocked verifying any UI change locally.
 *
 * And a provider boots ONCE. It cannot see the request it is deciding for:
 * during boot `request()` is the framework's default, built from `app.url`.
 * Under a long-lived server the first request would decide the scheme for every
 * request after it. Middleware runs per request, which is what a per-request
 * decision needs.
 *
 * ## The rule
 *
 * Force https if the request genuinely arrived over TLS, or if it is addressed
 * to the canonical https host. The second clause is what the original was
 * reaching for: on the real site a missing `X-Forwarded-Proto` must not
 * downgrade asset URLs into mixed content. It just has to be scoped to that
 * host, rather than applied to every request the app ever serves.
 */
class ForceCanonicalScheme
{
    public function handle(Request $request, Closure $next): Response
    {
        $appUrl = (string) config('app.url');
        $canonicalHost = parse_url($appUrl, PHP_URL_HOST);

        $onCanonicalHost = is_string($canonicalHost) && $request->getHost() === $canonicalHost;
        $canonicalIsHttps = str_starts_with($appUrl, 'https://');

        if ($request->isSecure() || ($canonicalIsHttps && $onCanonicalHost)) {
            URL::forceScheme('https');
        }

        return $next($request);
    }
}
