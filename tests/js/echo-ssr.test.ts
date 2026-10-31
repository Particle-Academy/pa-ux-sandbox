import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `getEcho()` under SSR.
 *
 * Runs in vitest's default `node` environment ON PURPOSE: that is the SSR
 * render process exactly — no `window`, no `document`, no browser WebSocket.
 * `showcase-app.tsx` and `ssr.tsx` both call `getEcho()` unconditionally while
 * building the shared provider tree, so it must return `null` here (and must not
 * throw at import time) even when every broadcasting key is configured.
 */

afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
});

describe("getEcho under SSR", () => {
    it("returns null with no window, even when Reverb is fully configured", async () => {
        vi.stubEnv("VITE_REVERB_APP_KEY", "ssr-key");
        vi.stubEnv("VITE_REVERB_HOST", "ws.example.test");
        vi.stubEnv("VITE_REVERB_PORT", "443");
        vi.stubEnv("VITE_REVERB_SCHEME", "https");

        expect(typeof window).toBe("undefined");
        const { getEcho } = await import("../../resources/js/lib/echo");

        expect(getEcho()).toBeNull();
    });
});
