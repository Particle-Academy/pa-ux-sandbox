<?php

namespace App\Http\Controllers;

use Symfony\Component\HttpFoundation\Response;

/**
 * TOMBSTONE service worker.
 *
 * The showcase used to ship a real precaching service worker (built to
 * public/build/sw.js by the fancyPwa() Vite plugin) and serve it here at root
 * scope. That broke production: the SW served its cached offline page to ONLINE
 * users and risked intercepting dynamic / SSR content. The site-wide PWA has
 * been removed.
 *
 * But a service worker, once registered, keeps running on every visitor's
 * machine until it is explicitly unregistered — removing the wiring is not
 * enough. So /sw.js now ALWAYS serves this self-unregistering tombstone: when a
 * registered SW does its periodic update check it fetches this script, sees a
 * byte-for-byte-different worker, installs it, and the new worker tears itself
 * (and its caches) down and reloads every controlled client. Prod recovers on
 * its own.
 *
 * Always 200 (never 404 on a missing build artifact) — the tombstone must
 * always serve so already-registered workers can fetch it and self-destruct.
 *
 * Invokable controller (NOT a closure) so route:cache keeps working.
 */
class ServiceWorkerController extends Controller
{
    public function __invoke(): Response
    {
        // NOTE: no `fetch` listener, deliberately. The moment this worker
        // activates it stops intercepting anything, so the client is already
        // recovered — which is why it does NOT force a reload.
        //
        // It used to end with `clients.matchAll()` → `c.navigate(c.url)`, to
        // hurry stale clients along. That re-navigated every controlled tab to
        // the URL it was ALREADY on, and if it fired while someone was clicking
        // a link, it cancelled their navigation and dumped them back where they
        // started. Reported as "none of the buttons work" on the 404 page, which
        // is exactly what it looks like from the outside. The tear-down does not
        // need it: caches are deleted, the registration is gone, and this worker
        // proxies nothing, so the visitor's next request is clean either way.
        $script = <<<'JS'
        self.addEventListener('install', () => self.skipWaiting());
        self.addEventListener('activate', (e) => {
          e.waitUntil((async () => {
            for (const k of await caches.keys()) { if (k.startsWith('fancy-pwa-')) await caches.delete(k); }
            await self.registration.unregister();
          })());
        });
        JS;

        return response($script, 200, [
            'Content-Type' => 'application/javascript',
            'Service-Worker-Allowed' => '/',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ]);
    }
}
