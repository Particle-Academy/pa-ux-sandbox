<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * In-memory relay broker for shared whiteboard sessions.
 *
 * Two endpoints, both gated on a shared secret token (the session token
 * generated client-side and embedded in the share URL):
 *
 *   POST /whiteboard-share/{id}/inbox?token=…
 *     - body: a single JSON-RPC frame (or batch as array)
 *     - effect: enqueue the frame for delivery to all SSE subscribers
 *
 *   GET  /whiteboard-share/{id}/events?token=…
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
class WhiteboardShareController extends Controller
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

        return response()->json(['ok' => true]);
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
            $subs = Cache::get($subsKey, []);
            $subs[$subscriberId] = time();
            Cache::put($subsKey, $subs, self::TTL_SECONDS);

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
                $frames = Cache::pull($key, []);
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
                }
                usleep(self::POLL_INTERVAL_MS * 1000);
            }

            // Clean up subscriber record on disconnect.
            $subs = Cache::get($subsKey, []);
            unset($subs[$subscriberId]);
            Cache::put($subsKey, $subs, self::TTL_SECONDS);
            Cache::forget($key);

            if ($direction === 'outbound') {
                $this->fanOut($session, 'inbound', json_encode([
                    'jsonrpc' => '2.0',
                    'method' => 'notifications/peer_left',
                    'params' => ['subscriberId' => $subscriberId, 'ts' => time() * 1000],
                ]));
            }
        }, 200, [
            'content-type' => 'text/event-stream',
            'cache-control' => 'no-cache',
            'x-accel-buffering' => 'no',
        ]);
    }

    /** Register a session token. Browsers POST here on share start. */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'session' => ['required', 'string', 'regex:/^[A-Za-z0-9_-]{4,64}$/'],
            'token' => ['required', 'string', 'min:16', 'max:128'],
        ]);
        Cache::put($this->tokenKey($data['session']), hash('sha256', $data['token']), self::TTL_SECONDS);
        return response()->json(['ok' => true]);
    }

    /** Unregister a session (host stops sharing). */
    public function unregister(Request $request, string $session): JsonResponse
    {
        if (! $this->validateToken($session, (string) $request->query('token'))) {
            return response()->json(['error' => 'invalid_token'], 401);
        }
        Cache::forget($this->tokenKey($session));
        return response()->json(['ok' => true]);
    }

    private function fanOut(string $session, string $direction, string $payload): void
    {
        $subsKey = $this->subscribersKey($session, $direction);
        $subs = Cache::get($subsKey, []);
        foreach (array_keys($subs) as $subscriberId) {
            $key = $this->queueKey($session, $direction, $subscriberId);
            $existing = Cache::get($key, []);
            $existing[] = $payload;
            Cache::put($key, $existing, self::TTL_SECONDS);
        }
        // Refresh subscribers TTL.
        Cache::put($subsKey, $subs, self::TTL_SECONDS);
    }

    private function validateToken(string $session, string $token): bool
    {
        if ($session === '' || $token === '') return false;
        $stored = Cache::get($this->tokenKey($session));
        if ($stored === null) return false;
        return hash_equals((string) $stored, hash('sha256', $token));
    }

    private function tokenKey(string $session): string
    {
        return "wb-share:token:{$session}";
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
