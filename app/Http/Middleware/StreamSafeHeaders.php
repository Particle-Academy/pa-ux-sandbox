<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Keep streamed and long-polled responses untouched between PHP and the client.
 *
 * `Cache-Control: no-transform` stops Cloudflare compressing or rewriting the
 * body, which for an event stream means buffering it until a chunk is big
 * enough; `no-cache` keeps every hop from serving a stored copy. And
 * `X-Accel-Buffering: no` stops nginx at the origin holding the response back.
 *
 * Applied per route (the MCP endpoint, the agent relay's SSE and long-poll
 * legs, the TUI frame long-poll) rather than globally: an ordinary page wants
 * Cloudflare's compression.
 */
class StreamSafeHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('Cache-Control', 'no-cache, no-transform');
        $response->headers->set('X-Accel-Buffering', 'no');

        return $response;
    }
}
