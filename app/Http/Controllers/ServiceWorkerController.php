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
        $script = <<<'JS'
        self.addEventListener('install', () => self.skipWaiting());
        self.addEventListener('activate', (e) => {
          e.waitUntil((async () => {
            for (const k of await caches.keys()) { if (k.startsWith('fancy-pwa-')) await caches.delete(k); }
            await self.registration.unregister();
            for (const c of await self.clients.matchAll()) { try { c.navigate(c.url); } catch (_) {} }
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
