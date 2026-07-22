<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The /fancy-tui showcase page plus the render proxy its live terminal browses.
 *
 * The TUI is the whole fancy-tui showcase as ONE live Ink app per viewer,
 * rendered by a localhost Node service (Ink needs Node). The browser starts a
 * session, streams frames, and forwards keystrokes; `session()` /
 * `sessionStream()` are that service's public edge — see those methods.
 */
class FancyTuiController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('FancyTui/Index');
    }

    /**
     * Start / feed / end the live session (POST) — the whole TUI.
     *
     * Edge posture: the render service binds loopback only, so THIS is its
     * public edge — throttling and the never-trust-the-body stance live here.
     * The raw body is forwarded verbatim (the global TrimStrings middleware
     * would otherwise eat a lone `\r`, silently swallowing the Enter key) and
     * the service is the validation boundary: it clamps the size and refuses any
     * app kind but the fixed allow-list, so a session is never arbitrary.
     */
    public function session(Request $request): JsonResponse
    {
        $base = rtrim((string) config('services.tui.url'), '/');
        if ($base === '') {
            return response()->json(['error' => 'The docs terminal is not available here.'], 503);
        }

        $raw = $request->getContent();
        if (strlen($raw) > 64 * 1024) {
            return response()->json(['error' => 'Payload too large.'], 413);
        }

        try {
            $response = Http::timeout((float) config('services.tui.timeout', 5))
                ->withBody($raw !== '' ? $raw : '{}', 'application/json')
                ->acceptJson()
                ->post("{$base}/session");
        } catch (\Throwable) {
            return response()->json(['error' => 'The docs terminal is not responding.'], 503);
        }

        // Pass the service's status through: a full-sessions 409 or an
        // unknown-slug 409 is meaningful to the browser, not a generic error.
        return response()->json($response->json(), $response->status());
    }

    /**
     * Long-poll for the next frame of a live preview.
     *
     * The service holds this open until the component redraws — a keystroke or a
     * timer tick — or ~2s elapses, so animation arrives without the browser
     * hammering. The HTTP timeout sits just above the service's hold so a normal
     * quiet return is never mistaken for a dead service.
     */
    public function sessionStream(Request $request): JsonResponse
    {
        $base = rtrim((string) config('services.tui.url'), '/');
        if ($base === '') {
            return response()->json(['error' => 'The docs terminal is not available here.'], 503);
        }

        $id = (string) $request->query('id', '');
        $since = (int) $request->query('since', 0);
        if ($id === '') {
            return response()->json(['error' => 'missing session id'], 400);
        }

        try {
            $response = Http::timeout((float) config('services.tui.stream_timeout', 8))
                ->acceptJson()
                ->get("{$base}/session/stream", ['id' => $id, 'since' => $since]);
        } catch (\Throwable) {
            return response()->json(['error' => 'The docs terminal is not responding.'], 503);
        }

        return response()->json($response->json(), $response->status());
    }
}
