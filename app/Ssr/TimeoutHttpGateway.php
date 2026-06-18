<?php

namespace App\Ssr;

use Exception;
use Illuminate\Http\Client\StrayRequestException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Vite;
use Inertia\Ssr\HttpGateway;
use Inertia\Ssr\Response;
use Inertia\Ssr\SsrException;

/**
 * Inertia SSR gateway with a SHORT, bounded HTTP timeout.
 *
 * The stock {@see HttpGateway} calls `Http::post()` with no timeout, so it
 * inherits Laravel's 30s default. Under SSR, PHP makes a blocking HTTP call to
 * the node daemon for EVERY page render and holds one PHP-FPM worker for the
 * whole call. A hung or slow daemon therefore cascades to total PHP-FPM worker
 * exhaustion — every PHP route hangs (this took prod down once; see the
 * ssr-blocked memory). A render normally completes in well under a second, so a
 * few-second ceiling lets a slow/hung daemon FAST-FAIL: `dispatch()` returns
 * null and Inertia renders the page client-side instead of blocking a worker
 * for 30s.
 *
 * This method mirrors the vendor `HttpGateway::dispatch()` exactly except for
 * the `connectTimeout()`/`timeout()` on the HTTP call — keep it in sync if the
 * Inertia SSR protocol changes. Tunable via `config('inertia.ssr.timeout')` and
 * `config('inertia.ssr.connect_timeout')`.
 */
class TimeoutHttpGateway extends HttpGateway
{
    /**
     * Dispatch the Inertia page to the SSR engine via HTTP, bounded by a timeout.
     *
     * @param  array<string, mixed>  $page
     */
    public function dispatch(array $page, ?Request $request = null): ?Response
    {
        if (! $this->ssrIsEnabled($request ?? request())) {
            return null;
        }

        $isHot = Vite::isRunningHot();

        if (! $isHot && $this->shouldEnsureBundleExists() && ! $this->bundleExists()) {
            return null;
        }

        $url = $isHot
            ? $this->getHotUrl('/__inertia_ssr')
            : $this->getProductionUrl('/render');

        try {
            $response = Http::connectTimeout((float) config('inertia.ssr.connect_timeout', 2))
                ->timeout((float) config('inertia.ssr.timeout', 5))
                ->post($url, $page);

            if ($response->failed()) {
                $this->handleSsrFailure($page, $response->json());

                return null;
            }

            if (! $data = $response->json()) {
                return null;
            }

            return new Response(
                implode("\n", $data['head'] ?? []),
                $data['body'] ?? ''
            );
        } catch (Exception $e) {
            if ($e instanceof StrayRequestException || $e instanceof SsrException) {
                throw $e;
            }

            // A timeout / connection error is treated as an SSR miss: fall back
            // to client rendering (return null) rather than bubbling a 500 — the
            // whole point of the bounded timeout.
            $this->handleSsrFailure($page, [
                'error' => $e->getMessage(),
                'type' => 'connection',
            ]);

            return null;
        }
    }
}
