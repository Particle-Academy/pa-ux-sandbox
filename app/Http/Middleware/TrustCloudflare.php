<?php

namespace App\Http\Middleware;

use App\Support\CloudflareNetwork;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Make `$request->ip()` the visitor's address behind Cloudflare, and nobody
 * else's claim of one.
 *
 * Runs first in the global stack, before anything reads the IP.
 *
 * From a Cloudflare edge: CF-Connecting-IP is the address Cloudflare itself saw,
 * so it replaces X-Forwarded-For. Cloudflare APPENDS to a client-sent
 * X-Forwarded-For, so the leftmost entry there is the client's own claim; the
 * replacement removes it. TrustProxies (which trusts the same Cloudflare
 * ranges) then hands that address to `ip()`, and through it to every rate
 * limiter, the MCP IP hash, heuristics and analytics. If CF-Connecting-IP is
 * missing or is not an address, X-Forwarded-For is left as Cloudflare sent it,
 * whose rightmost untrusted entry is still the visitor.
 *
 * From anyone else: every `CF-*` header and `True-Client-IP` is removed, so no
 * later code can be handed a forged visitor address or location by a client
 * that reached the origin directly. X-Forwarded-For from such a peer is already
 * ignored by TrustProxies, which no longer trusts `*`.
 */
class TrustCloudflare
{
    public function handle(Request $request, Closure $next): Response
    {
        if (CloudflareNetwork::isFromCloudflare($request)) {
            $visitor = trim((string) $request->headers->get('CF-Connecting-IP'));

            if (filter_var($visitor, FILTER_VALIDATE_IP) !== false) {
                $request->headers->set('X-Forwarded-For', $visitor);
            }

            return $next($request);
        }

        foreach (array_keys($request->headers->all()) as $name) {
            if (str_starts_with($name, 'cf-') || $name === 'true-client-ip') {
                $request->headers->remove($name);
                $request->server->remove('HTTP_'.strtoupper(str_replace('-', '_', $name)));
            }
        }

        return $next($request);
    }
}
