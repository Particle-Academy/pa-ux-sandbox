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
 * FIX: ask the daemon to exit (its /shutdown endpoint) so its supervisor
 * restarts it on the fresh bundle, then poll /health.
 *
 * ...and when the supervisor does NOT bring it back, restart it ourselves
 * through Genie's own API rather than warning and giving up. See below.
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

/** Poll /health until it answers, or the budget runs out. */
const waitForHealth = async (budgetMs) => {
    for (let waited = 0; waited < budgetMs; waited += 1000) {
        await sleep(1000);
        if (await probe("/health", 1500)) return true;
    }
    return false;
};

/**
 * Restart the daemon through GENIE — the PRIMARY path when running locally.
 *
 * The original design asked the daemon to `/shutdown` and trusted its supervisor
 * to bring it back. Genie advertises CRASH auto-restart, and a `/shutdown` is a
 * clean exit; what is actually observed is worse than "no restart" — the process
 * goes to `restarting` and stays there, never rebinding. `manageProcess restart`
 * does not clear that state either. Only stop-THEN-start does, measured
 * repeatedly, so that is what this performs and why the build no longer relies
 * on the supervisor noticing anything.
 *
 * Genie exposes its MCP endpoint to local processes as `GENIE_MCP_URL` (the same
 * mechanism the documented `imDone` finish-hook uses), so the build can drive
 * the supervisor rather than spawning a daemon itself. That distinction matters:
 * a self-spawned daemon would be an ORPHAN — unsupervised, invisible to Genie
 * Processes, and the source of the port collisions this workspace has already
 * been bitten by.
 *
 * LOCAL ONLY by construction: outside Genie the env vars are absent and this is
 * skipped, so CI and Forge keep the original warn-and-continue behaviour.
 */
const restartViaGenie = async () => {
    const url = process.env.GENIE_MCP_URL;
    const terminalId = process.env.GENIE_TERMINAL_ID;
    if (!url || !terminalId) return false;

    const call = async (args) => {
        const res = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: Date.now(),
                method: "tools/call",
                params: { name: "manageProcess", arguments: { ...args, terminalId } },
            }),
            signal: AbortSignal.timeout(10_000),
        });
        const body = await res.text();
        // The MCP envelope carries the tool's output as a JSON *string*, so the
        // payload arrives with escaped quotes (\"id\"). Matching the raw body
        // silently finds nothing — parse out the text first.
        try {
            const parsed = JSON.parse(body);
            const text = parsed?.result?.content?.[0]?.text;
            if (typeof text === "string") return text;
        } catch {
            /* fall through to the raw body */
        }
        return body;
    };

    try {
        const listed = await call({ action: "list" });
        // The id is stable but not ours to hardcode — find it by the command it
        // supervises, so renaming the process label cannot silently break this.
        const match = listed.match(/"id":\s*"([^"]+)"[^}]*?"command":\s*"[^"]*inertia:start-ssr[^"]*"/s);
        if (!match) return false;

        const id = match[1];
        console.log("[refresh-ssr] stopping and starting it via Genie Processes…");
        await call({ action: "stop", id });
        await sleep(1000);
        await call({ action: "start", id });
        return true;
    } catch {
        return false;
    }
};

if (!(await probe("/health", 1500))) {
    // No daemon running (CI, Forge build phase, SSR-off dev) — nothing to refresh.
    process.exit(0);
}

console.log("[refresh-ssr] SSR daemon is running — restarting it on the new bundle…");

// Under Genie, drive the supervisor directly. Asking the daemon to /shutdown and
// waiting is what wedges it: the supervisor sees a clean exit, enters
// `restarting`, and never rebinds.
if (await restartViaGenie()) {
    if (await waitForHealth(30_000)) {
        console.log("[refresh-ssr] SSR daemon back up on the fresh bundle.");
        process.exit(0);
    }
} else {
    // No Genie (Forge, CI, a bare shell): ask the daemon to exit and let whatever
    // supervises it there bring it back. Unchanged from the original behaviour.
    await probe("/shutdown", 1500); // exits mid-response; a "failed" fetch is expected
    if (await waitForHealth(30_000)) {
        console.log("[refresh-ssr] SSR daemon back up on the fresh bundle.");
        process.exit(0);
    }
}

console.warn(
    [
        "",
        "[refresh-ssr] WARNING: the SSR daemon was shut down for this build and could",
        "[refresh-ssr] not be brought back. Until it is restarted, every page falls back",
        "[refresh-ssr] to client-side rendering (blank first paint).",
        "[refresh-ssr] Restart it: `php artisan inertia:start-ssr` (or via Genie Processes / Forge).",
        "",
    ].join("\n"),
);
process.exit(0);
