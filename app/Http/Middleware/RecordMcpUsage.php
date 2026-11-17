<?php

namespace App\Http\Middleware;

use App\Jobs\RecordMcpRequest;
use App\Support\McpStats\McpUsageRecorder;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Records usage of the hosted MCP server (/mcp) for the admin dashboard.
 *
 * `handle()` only notes the start time and stamps the latency on the way
 * out. Everything else happens in `terminate()`, which Laravel runs after
 * the response has been sent (FastCGI's finish_request has already closed the
 * connection), so the caller never waits on analytics. With
 * `mcp-stats.queue` set, even the database writes move to a worker.
 *
 * Nothing here may fail a request: every error is reported and swallowed.
 */
class RecordMcpUsage
{
    private const STARTED = '_mcp_stats_started';

    private const LATENCY = '_mcp_stats_latency_ms';

    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set(self::STARTED, hrtime(true));

        $response = $next($request);

        $request->attributes->set(self::LATENCY, (int) round((hrtime(true) - $request->attributes->get(self::STARTED)) / 1_000_000));

        return $response;
    }

    public function terminate(Request $request, Response $response): void
    {
        if (! config('mcp-stats.enabled', true) || ! $request->isMethod('POST')) {
            return;
        }

        try {
            $payload = app(McpUsageRecorder::class)->capture($request, $response, (int) $request->attributes->get(self::LATENCY, 0));
            if ($payload === null) {
                return;
            }

            $job = new RecordMcpRequest($payload);
            $queue = config('mcp-stats.queue');

            if (is_string($queue) && $queue !== '') {
                dispatch($job->onConnection($queue));
            } else {
                dispatch_sync($job);
            }
        } catch (Throwable $e) {
            report($e);
        }
    }
}
