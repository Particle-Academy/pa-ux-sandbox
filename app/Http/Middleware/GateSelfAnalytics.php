<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Support\SelfSite;
use Closure;
use FancyCompliance\Contracts\ConsentGate;
use Illuminate\Contracts\Container\Container;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Http\Request;
use Illuminate\Pipeline\Pipeline;
use Illuminate\Session\Middleware\StartSession;
use Symfony\Component\HttpFoundation\Response;

/**
 * The server half of gating the showcase's OWN analytics on `analytics` consent.
 *
 * Sits on fancy-heuristics' `/heuristics/collect` and `/heuristics/pixel`
 * (via `heuristics.routes.middleware`, set in AppServiceProvider::register).
 * A batch or beacon carrying this site's own key, from someone who has not
 * consented, is answered `204` and never stored, exactly as
 * `consent:analytics,drop` would. The browser half (ShowcaseAnalytics.tsx)
 * already sends nothing without consent; this is what holds when a stale tab,
 * a cached bundle or a hand-made request does.
 *
 * ## Why not plain `consent:analytics,drop`
 *
 * These routes ALSO receive every other site's pixel: the sites listed in the
 * showcase post here cross-origin, with no cookie of ours and no consent of
 * ours to give. Gating the whole route would drop all of them. So only this
 * site's key is gated; everyone else's consent is their own site's business.
 *
 * ## Why it starts a session
 *
 * The routes run in the stateless `api` group: no EncryptCookies, no session.
 * There the guest cookie is still encrypted and a signed-in person has no user,
 * so every visitor reads as undecided and is refused: it fails closed and
 * collects nothing, the trap fancy-compliance's README warns about. For a
 * request with our key, this decrypts the cookies and, when a session cookie
 * came with it, starts that session, then asks the gate. Never for a request
 * without one, so a cookieless beacon cannot mint a session row per call.
 */
final class GateSelfAnalytics
{
    public function __construct(
        private readonly ConsentGate $gate,
        private readonly Container $container,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $self = SelfSite::key();
        if ($self === null || $request->isMethod('OPTIONS')) {
            return $next($request);
        }

        $key = $request->input('siteKey') ?? $request->input('site_key');
        if (! is_string($key) || ! hash_equals($self, $key)) {
            return $next($request);
        }

        if ($this->allows($request)) {
            return $next($request);
        }

        return new Response('', 204, ['X-Fancy-Compliance' => 'consent-required']);
    }

    private function allows(Request $request): bool
    {
        $stack = [EncryptCookies::class];
        if ($request->cookies->has((string) config('session.cookie'))) {
            $stack[] = StartSession::class;
        }

        $allowed = false;
        (new Pipeline($this->container))
            ->send($request)
            ->through($stack)
            ->then(function (Request $request) use (&$allowed): Response {
                $allowed = $this->gate->allows('analytics', $request);

                return new Response('', 204);
            });

        return $allowed;
    }
}
