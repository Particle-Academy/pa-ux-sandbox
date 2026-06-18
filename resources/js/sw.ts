/**
 * Showcase service worker. The fancyPwa() Vite plugin bundles this to
 * public/build/sw.js, injecting globalThis.__FANCY_PRECACHE (the hashed asset
 * list, base-aware for /build/) and __FANCY_VERSION (the cache-busting key).
 */
import {
    precache,
    registerRoute,
    cacheFirst,
    networkFirst,
    staleWhileRevalidate,
    offlineFallback,
} from "@particle-academy/fancy-pwa/sw";

declare global {
    // Injected by the fancyPwa() Vite plugin at build time.
    // eslint-disable-next-line no-var
    var __FANCY_PRECACHE: string[] | undefined;
}

// App shell + the plugin-injected hashed /build/ assets (merged in automatically).
precache(globalThis.__FANCY_PRECACHE || []);

// Hashed, content-addressed build assets never change → cache-first.
registerRoute((req) => new URL(req.url).pathname.startsWith("/build/"), cacheFirst());

// Live presence / heuristics JSON — network-first so we never show stale data.
registerRoute(
    (req) => /\/(active-users|api\/leaderboard|heuristics)/.test(new URL(req.url).pathname),
    networkFirst(),
);

// Page navigations: serve cached shell while revalidating; the network failure
// falls through to the offline page below.
registerRoute((req) => req.mode === "navigate", staleWhileRevalidate());
offlineFallback("/offline");
