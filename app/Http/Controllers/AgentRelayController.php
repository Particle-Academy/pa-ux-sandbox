<?php

namespace App\Http\Controllers;

use App\Support\SelfSite;
use FancyHeuristics\Facades\Heuristics;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * In-memory relay broker for agent ⟷ browser MCP sessions.
 *
 * Generic — it carries any JSON-RPC/MCP frames (co-browse, whiteboard, flow, …),
 * not just whiteboard. Served at /agent-relay/* (and /whiteboard-share/* as a
 * back-compat alias; state is keyed by session id, not path, so the two are
 * interchangeable). Two endpoints, both gated on a shared secret token (the
 * session token generated client-side and embedded in the share URL):
 *
 *   POST /agent-relay/{id}/inbox?token=…
 *     - body: a single JSON-RPC frame (or batch as array)
 *     - effect: enqueue the frame for delivery to all SSE subscribers
 *
 *   GET  /agent-relay/{id}/events?token=…
 *     - response: SSE stream
 *     - delivers each enqueued frame as `event: mcp\ndata: {...}\n\n`
 *
 * The browser-side SseRelayTransport opens the SSE stream; external MCP
 * clients (curl, custom agents) hit `/inbox` to send tool calls. Both
 * directions are JSON-RPC 2.0 framing — no transformation here.
 *
 * Storage is the cache (file driver in dev, redis in prod). Each session
 * has a queue of pending frames keyed by subscriber id; the SSE handler
 * polls its own queue every 200ms and emits whatever's there. Sessions
 * auto-expire after 1 hour of inactivity (cache TTL is bumped on every
 * read/write).
 */
class AgentRelayController extends Controller
{
    private const TTL_SECONDS = 3600;

    private const POLL_INTERVAL_MS = 200;

    /** Inbound frames from external MCP clients → forwarded to all browser subscribers. */
    public function inbox(Request $request, string $session): JsonResponse
    {
        if (! $this->validateToken($session, (string) $request->query('token'))) {
            return response()->json(['error' => 'invalid_token'], 401);
        }

        $payload = $request->getContent();
        if ($payload === '' || ! str_contains($payload, '"jsonrpc"')) {
            return response()->json(['error' => 'invalid_frame'], 400);
        }

        $this->fanOut($session, 'inbound', $payload);

        // Record agent tool calls as heuristics activity (server-side path —
        // catches headless relay clients that never open a collecting browser
        // tab). Best-effort: never let analytics break frame delivery.
        $this->recordAgentActivity($session, $payload);

        return response()->json(['ok' => true]);
    }

    /**
     * Translate inbound `tools/call` JSON-RPC frames into `actor:"agent"`
     * heuristics events, attributed to the showcase's own site. No-ops when the
     * site isn't dogfooding a pixel yet (no tracker snippet) or the frame isn't
     * a tool call. Wrapped so a malformed frame or a down collector can never
     * 500 the relay.
     */
    private function recordAgentActivity(string $session, string $payload): void
    {
        try {
            $siteKey = SelfSite::key();
            if ($siteKey === null) {
                return;
            }

            $decoded = json_decode($payload, true);
            if (! is_array($decoded)) {
                return;
            }
            // A frame may arrive singly or as a JSON-RPC batch (list of frames).
            $frames = array_is_list($decoded) ? $decoded : [$decoded];

            $events = [];
            foreach ($frames as $frame) {
                if (! is_array($frame) || ($frame['method'] ?? null) !== 'tools/call') {
                    continue;
                }
                $params = is_array($frame['params'] ?? null) ? $frame['params'] : [];
                $tool = (string) ($params['name'] ?? 'tool');
                $args = is_array($params['arguments'] ?? null) ? $params['arguments'] : [];

                $events[] = [
                    'kind' => 'click',
                    'actor' => 'agent',
                    'path' => isset($args['path']) && is_string($args['path']) ? $args['path'] : '/',
                    'ts' => (int) round(microtime(true) * 1000),
                    'targetId' => $tool,
                    'label' => str_replace('_', ' ', $tool),
                    'meta' => ['action' => $tool, 'source' => 'agent', 'via' => 'relay'],
                ];
            }

            if ($events === []) {
                return;
            }

            Heuristics::collect([
                'siteKey' => $siteKey,
                'sessionId' => 'relay-'.$session,
                'events' => $events,
            ]);
        } catch (\Throwable) {
            // best-effort — analytics must never break the relay
        }
    }

    /** Outbound frames from the browser-side server → forwarded to all external clients. */
    public function outbox(Request $request, string $session): JsonResponse
    {
        if (! $this->validateToken($session, (string) $request->query('token'))) {
            return response()->json(['error' => 'invalid_token'], 401);
        }

        $payload = $request->getContent();
        if ($payload === '' || ! str_contains($payload, '"jsonrpc"')) {
            return response()->json(['error' => 'invalid_frame'], 400);
        }

        $this->fanOut($session, 'outbound', $payload);

        return response()->json(['ok' => true]);
    }

    /**
     * SSE stream. The `direction` query param decides which side this
     * subscriber is on: `inbound` for browsers (they want to RECEIVE frames
     * from external clients) or `outbound` for external clients (they want
     * to RECEIVE frames the browser-side server sent).
     */
    public function events(Request $request, string $session): StreamedResponse
    {
        $token = (string) $request->query('token');
        if (! $this->validateToken($session, $token)) {
            return response()->stream(
                fn () => print "event: error\ndata: invalid_token\n\n",
                401,
                ['content-type' => 'text/event-stream'],
            );
        }

        // Default direction: a browser subscribes to inbound (frames from
        // external clients). Pass ?direction=outbound for the opposite.
        $direction = $request->query('direction', 'inbound') === 'outbound' ? 'outbound' : 'inbound';
        $subscriberId = bin2hex(random_bytes(8));

        return response()->stream(function () use ($session, $direction, $subscriberId) {
            @set_time_limit(0);
            @ini_set('output_buffering', 'off');
            @ini_set('zlib.output_compression', '0');

            $key = $this->queueKey($session, $direction, $subscriberId);
            // Register the subscriber so fanOut writes to its queue.
            $subsKey = $this->subscribersKey($session, $direction);
            $subs = $this->cache()->get($subsKey, []);
            $subs[$subscriberId] = time();
            $this->cache()->put($subsKey, $subs, self::TTL_SECONDS);

            // Outbound subscribers are external agents reading frames from
            // the browser. Notify the browser (inbound side) when one joins.
            if ($direction === 'outbound') {
                $this->fanOut($session, 'inbound', json_encode([
                    'jsonrpc' => '2.0',
                    'method' => 'notifications/peer_joined',
                    'params' => ['subscriberId' => $subscriberId, 'ts' => time() * 1000],
                ]));
            }

            echo "retry: 2000\n\n";
            $this->flush();

            $lastBeat = time();
            while (! connection_aborted()) {
                $frames = $this->cache()->pull($key, []);
                foreach ($frames as $frame) {
                    echo "event: mcp\n";
                    echo 'data: '.$frame."\n\n";
                }
                if (! empty($frames)) {
                    $this->flush();
                }
                if ((time() - $lastBeat) >= 15) {
                    echo ": keepalive\n\n";
                    $this->flush();
                    $lastBeat = time();
                    // Stay fresh so fanOut()'s 60s GC prune keeps this stream.
                    $subsNow = $this->cache()->get($subsKey, []);
                    if (isset($subsNow[$subscriberId])) {
                        $subsNow[$subscriberId] = time();
                        $this->cache()->put($subsKey, $subsNow, self::TTL_SECONDS);
                    }
                }
                usleep(self::POLL_INTERVAL_MS * 1000);
            }

            // Clean up subscriber record on disconnect.
            $subs = $this->cache()->get($subsKey, []);
            unset($subs[$subscriberId]);
            $this->cache()->put($subsKey, $subs, self::TTL_SECONDS);
            $this->cache()->forget($key);

            if ($direction === 'outbound') {
                $this->fanOut($session, 'inbound', json_encode([
                    'jsonrpc' => '2.0',
                    'method' => 'notifications/peer_left',
                    'params' => ['subscriberId' => $subscriberId, 'ts' => time() * 1000],
                ]));
            }
        }, 200, [
            'content-type' => 'text/event-stream',
            // no-transform stops a proxy/CDN (Cloudflare) from buffering or
            // re-encoding the stream. NOTE: this does NOT fix Cloudflare's
            // HTTP/3 (QUIC) resetting long-lived SSE → net::ERR_QUIC_PROTOCOL_ERROR
            // — that needs HTTP/3 disabled at the edge (Cloudflare → Network →
            // HTTP/3 (with QUIC) → off) so the browser falls back to HTTP/2.
            'cache-control' => 'no-cache, no-transform',
            'x-accel-buffering' => 'no',
            'connection' => 'keep-alive',
        ]);
    }

    /**
     * Long-poll receive leg — the Cloudflare/CDN-safe alternative to {@see events()}.
     * A bounded version of the SSE drain loop: register the subscriber, park up to
     * ~`wait` ms draining its queue, then return JSON. Short requests sail through a
     * Cloudflare HTTP/3 (QUIC) edge that resets long-lived SSE streams. The client
     * (`@particle-academy/fancy-cf-relay`) re-polls immediately, echoing back the
     * `subscriber` id we hand out so it reads the same queue each time.
     *
     * The park is capped for FPM safety: each parked request holds one PHP-FPM
     * worker for the window — bounded here, unlike SSE which held one indefinitely.
     */
    public function poll(Request $request, string $session): JsonResponse
    {
        if (! $this->validateToken($session, (string) $request->query('token'))) {
            return response()->json(['error' => 'invalid_token'], 401);
        }

        $direction = $request->query('direction', 'inbound') === 'outbound' ? 'outbound' : 'inbound';
        $subscriberId = (string) $request->query('subscriber', '');
        if (! preg_match('/^[a-f0-9]{16}$/', $subscriberId)) {
            $subscriberId = bin2hex(random_bytes(8));
        }
        // Cap the park so a parked request never ties up an FPM worker too long
        // (the actual cap is the $deadline below). The execution budget is only
        // ever RAISED to cover the park + headroom — never lowered: shrinking an
        // unlimited budget (CLI/tests, where set_time_limit persists across the
        // whole process) fataled the test suite five seconds after the first poll.
        $waitMs = max(0, min((int) $request->query('wait', 20000), 25000));
        $needed = (int) ceil($waitMs / 1000) + 5;
        $current = (int) ini_get('max_execution_time');
        if ($current !== 0 && $current < $needed) {
            @set_time_limit($needed);
        }

        $subsKey = $this->subscribersKey($session, $direction);
        $subs = $this->cache()->get($subsKey, []);
        $isNew = ! isset($subs[$subscriberId]);
        $subs[$subscriberId] = time();
        $this->cache()->put($subsKey, $subs, self::TTL_SECONDS);

        // A newly-arrived external (outbound) subscriber notifies the browser side,
        // mirroring the SSE handler.
        if ($isNew && $direction === 'outbound') {
            $this->fanOut($session, 'inbound', json_encode([
                'jsonrpc' => '2.0',
                'method' => 'notifications/peer_joined',
                'params' => ['subscriberId' => $subscriberId, 'ts' => time() * 1000],
            ]));
        }

        $key = $this->queueKey($session, $direction, $subscriberId);
        $deadline = microtime(true) + ($waitMs / 1000);
        $frames = [];
        do {
            $frames = $this->cache()->pull($key, []);
            if (! empty($frames) || microtime(true) >= $deadline || connection_aborted()) {
                break;
            }
            usleep(self::POLL_INTERVAL_MS * 1000);
        } while (true);

        // Keep this subscriber fresh (fanOut() prunes ones it hasn't heard from).
        $subs = $this->cache()->get($subsKey, []);
        $subs[$subscriberId] = time();
        $this->cache()->put($subsKey, $subs, self::TTL_SECONDS);

        return response()->json(['subscriber' => $subscriberId, 'frames' => $frames]);
    }

    /** Register a session token. Browsers POST here on share start. */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'session' => ['required', 'string', 'regex:/^[A-Za-z0-9_-]{4,64}$/'],
            'token' => ['required', 'string', 'min:16', 'max:128'],
        ]);
        $this->cache()->put($this->tokenKey($data['session']), hash('sha256', $data['token']), self::TTL_SECONDS);

        return response()->json(['ok' => true]);
    }

    /** Unregister a session (host stops sharing). */
    public function unregister(Request $request, string $session): JsonResponse
    {
        if (! $this->validateToken($session, (string) $request->query('token'))) {
            return response()->json(['error' => 'invalid_token'], 401);
        }
        $this->cache()->forget($this->tokenKey($session));

        return response()->json(['ok' => true]);
    }

    private function fanOut(string $session, string $direction, string $payload): void
    {
        $subsKey = $this->subscribersKey($session, $direction);
        $subs = $this->cache()->get($subsKey, []);
        // Drop subscribers we haven't heard from in 60s — a crashed SSE stream or
        // a browser that stopped long-polling — so their queues don't pile up.
        // Active subscribers stay fresh: SSE refreshes on each 15s keepalive,
        // long-poll on each ≤25s round-trip.
        $now = time();
        $subs = array_filter($subs, fn ($ts) => ($now - (int) $ts) < 60);
        foreach (array_keys($subs) as $subscriberId) {
            $key = $this->queueKey($session, $direction, $subscriberId);
            $existing = $this->cache()->get($key, []);
            $existing[] = $payload;
            $this->cache()->put($key, $existing, self::TTL_SECONDS);
        }
        // Refresh subscribers TTL.
        $this->cache()->put($subsKey, $subs, self::TTL_SECONDS);
    }

    private function validateToken(string $session, string $token): bool
    {
        if ($session === '' || $token === '') {
            return false;
        }
        $stored = $this->cache()->get($this->tokenKey($session));
        if ($stored === null) {
            return false;
        }

        return hash_equals((string) $stored, hash('sha256', $token));
    }

    private function tokenKey(string $session): string
    {
        return "wb-share:token:{$session}";
    }

    private function cache(): Repository
    {
        return Cache::store(config('agent-relay.cache_store'));
    }

    private function subscribersKey(string $session, string $direction): string
    {
        return "wb-share:subs:{$session}:{$direction}";
    }

    private function queueKey(string $session, string $direction, string $subscriberId): string
    {
        return "wb-share:queue:{$session}:{$direction}:{$subscriberId}";
    }

    private function flush(): void
    {
        if (function_exists('ob_get_level') && ob_get_level() > 0) {
            @ob_flush();
        }
        @flush();
    }
}
