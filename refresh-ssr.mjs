/**
 * Post-build SSR daemon refresh — runs as the last step of `npm run build`.
 *
 * WHY: the Inertia SSR daemon (`php artisan inertia:start-ssr` →
 * `node bootstrap/ssr/ssr.js`) keeps the bundle it booted with in memory, but
 * lazily imports per-page chunks from bootstrap/ssr/assets/ ON EVERY REQUEST.
 * `vite build --ssr` replaces those chunks with new content-hashed filenames,
 * so a daemon that outlives a build 500s on EVERY page
 * (ERR_MODULE_NOT_FOUND for the old chunk) and Inertia silently falls back to
 * client-side rendering — an empty first byte, i.e. the "page renders blank,
 * then reforms" flash on every full page load, site-wide, until someone
 * restarts the daemon by hand.
 *
 * FIX: if a daemon is listening, ask it to exit (its /shutdown endpoint — the
 * same one `php artisan inertia:stop-ssr` uses) so the supervisor that owns it
 * (Genie Processes locally, the Forge daemon in prod) restarts it on the fresh
 * bundle. We then poll /health and WARN LOUDLY if it never comes back, so a
 * broken supervisor is caught at build time instead of as a silent site-wide
 * SSR outage. Never fails the build; a no-daemon environment (CI, Forge build
 * phase) is silently skipped.
 *
 * PORT: hardcoded 13733 to match config/inertia.php + resources/js/ssr.tsx —
 * see the comment in config/inertia.php for why env can't be trusted here.
 */
const SSR_ORIGIN = "http://127.0.0.1:13733";

const probe = async (path, timeoutMs) => {
    try {
        const res = await fetch(`${SSR_ORIGIN}${path}`, { signal: AbortSignal.timeout(timeoutMs) });
        return res.ok;
    } catch {
        return false;
    }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

if (!(await probe("/health", 1500))) {
    // No daemon running (CI, Forge build phase, SSR-off dev) — nothing to refresh.
    process.exit(0);
}

console.log("[refresh-ssr] SSR daemon is running — asking it to restart on the new bundle…");
await probe("/shutdown", 1500); // the daemon exits mid-response; a "failed" fetch is expected

for (let waited = 0; waited < 30_000; waited += 1000) {
    await sleep(1000);
    if (await probe("/health", 1500)) {
        console.log(`[refresh-ssr] SSR daemon back up on the fresh bundle (${(waited + 1000) / 1000}s).`);
        process.exit(0);
    }
}

console.warn(
    [
        "",
        "[refresh-ssr] WARNING: the SSR daemon was shut down for this build but its",
        "[refresh-ssr] supervisor did not restart it within 30s. Until it is restarted,",
        "[refresh-ssr] every page falls back to client-side rendering (blank first paint).",
        "[refresh-ssr] Restart it: `php artisan inertia:start-ssr` (or via Genie Processes / Forge).",
        "",
    ].join("\n"),
);
process.exit(0);
