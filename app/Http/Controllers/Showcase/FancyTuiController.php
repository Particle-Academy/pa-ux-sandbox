<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The /fancy-tui showcase page plus the render proxy its "Fancy Docs TUI"
 * browses.
 *
 * The TUI is a human-browseable version of the registry MCP: the same
 * `list-components` / `get-component` an agent calls, driven by a keyboard.
 * The terminal is rendered by a localhost Node service (Ink needs Node), and
 * `frame()` is its public edge — see that method.
 */
class FancyTuiController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('FancyTui/Index');
    }

    /**
     * Proxy one keystroke to the docs TUI render service and return its frame.
     *
     * The terminal itself is a Node service that runs the real fancy-tui Ink
     * components and browses the real MCP — it has to be Node, because Ink is
     * Node. That service binds localhost only; THIS is its public edge, so the
     * throttling and the never-trust-the-body posture live here, not there.
     *
     * The browser owns the navigation state and sends it back each keystroke,
     * so there is no session to store. The body is forwarded as-is: the service
     * sanitises it (an unknown pane, a NaN index, an oversized search all
     * degrade to the home screen), because the state is untrusted on the way in.
     */
    public function frame(Request $request): JsonResponse
    {
        $base = rtrim((string) config('services.tui.url'), '/');

        // No service configured (e.g. a plain `php artisan serve` with no TUI
        // process) is a clean "unavailable", not a 500 — the HTML docs still work.
        if ($base === '') {
            return response()->json(['error' => 'The docs terminal is not available here.'], 503);
        }

        // Forward the RAW body, not `$request->only(...)`. The global
        // TrimStrings middleware strips whitespace from parsed input — which
        // silently eats the Enter key (a lone `\r`/`\n`), so arrows would work
        // and Enter would not. The render service is the validation boundary
        // and sanitises everything, so a verbatim pass-through is both correct
        // and safe.
        $raw = $request->getContent();
        if (strlen($raw) > 64 * 1024) {
            return response()->json(['error' => 'Payload too large.'], 413);
        }

        try {
            $response = Http::timeout((float) config('services.tui.timeout', 5))
                ->withBody($raw !== '' ? $raw : '{}', 'application/json')
                ->acceptJson()
                ->post("{$base}/render");
        } catch (\Throwable) {
            return response()->json(['error' => 'The docs terminal is not responding.'], 503);
        }

        if (! $response->successful()) {
            return response()->json(['error' => 'The docs terminal returned an error.'], 502);
        }

        return response()->json($response->json(), 200);
    }

    /**
     * Start / feed / end a live preview session (POST) — the interactive,
     * animated half of the TUI. Same edge posture as frame(): loopback service,
     * raw body forwarded, service is the validation boundary. A preview is one
     * of a FIXED set of showcase components chosen by slug; the service refuses
     * anything else.
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
