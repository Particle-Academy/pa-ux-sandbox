// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://showcase.example.test/"}
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeWebSocket } from "./support/fake-websocket";

/**
 * `resources/js/lib/echo.ts` — the showcase's realtime client, in a browser.
 *
 * The page is HTTPS (see the environment options above), because that is where
 * every rule in `getEcho()` has teeth: a remote socket must be upgraded to wss
 * or the browser blocks it as mixed content, while a loopback Reverb stays as
 * configured. The SSR half lives in `echo-ssr.test.ts`, which needs a
 * different environment (no window at all).
 *
 * Observed from the outside only: the URL a WebSocket is opened with, and the
 * HTTP request a private channel makes to authorize. Nothing here depends on
 * which client library sits behind `getEcho()`.
 */

const CSRF = "csrf-token-from-the-meta";

function setMeta(name: string, content: string | null): void {
    document.head.querySelector(`meta[name="${name}"]`)?.remove();
    if (content === null) return;
    const meta = document.createElement("meta");
    meta.name = name;
    meta.content = content;
    document.head.appendChild(meta);
}

function configure(env: Record<string, string | undefined>): void {
    for (const [name, value] of Object.entries(env)) {
        vi.stubEnv(name, value);
    }
}

async function loadEcho() {
    const { getEcho } = await import("../../resources/js/lib/echo");
    return getEcho();
}

/** Give microtasks + zero-delay timers a chance to run. */
async function settle(): Promise<void> {
    for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
    vi.resetModules();
    FakeWebSocket.reset();
    vi.stubGlobal("WebSocket", FakeWebSocket);
    fetchMock = vi.fn(async () => new Response(JSON.stringify({ auth: "app-key:signature" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    setMeta("broadcasting-driver", "reverb");
    setMeta("csrf-token", CSRF);
    configure({
        VITE_REVERB_APP_KEY: "app-key",
        VITE_REVERB_HOST: "ws.example.test",
        VITE_REVERB_PORT: "443",
        VITE_REVERB_SCHEME: "https",
    });
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    setMeta("broadcasting-driver", null);
    setMeta("csrf-token", null);
});

describe("getEcho gates", () => {
    it("is null when the server does not broadcast over Reverb", async () => {
        setMeta("broadcasting-driver", "null");

        expect(await loadEcho()).toBeNull();
    });

    it("is null when the broadcasting-driver meta is missing", async () => {
        setMeta("broadcasting-driver", null);

        expect(await loadEcho()).toBeNull();
    });

    it("is null when the build carries no Reverb app key", async () => {
        configure({ VITE_REVERB_APP_KEY: "" });

        expect(await loadEcho()).toBeNull();
    });

    it("returns one shared client", async () => {
        const { getEcho } = await import("../../resources/js/lib/echo");

        expect(getEcho()).not.toBeNull();
        expect(getEcho()).toBe(getEcho());
    });
});

describe("getEcho endpoint", () => {
    it("forces wss on :443 for a remote host on an https page, even with a stale http scheme and :80", async () => {
        configure({ VITE_REVERB_SCHEME: "http", VITE_REVERB_PORT: "80" });

        const echo = await loadEcho();
        echo!.channel("active-users");
        await settle();

        const url = new URL(FakeWebSocket.latest()!.url);
        expect(url.protocol).toBe("wss:");
        expect(url.hostname).toBe("ws.example.test");
        expect(url.port === "" || url.port === "443").toBe(true);
        expect(url.pathname).toBe("/app/app-key");
        expect(url.searchParams.get("protocol")).toBe("7");
    });

    it("keeps a loopback Reverb exactly as configured, plaintext on its own port", async () => {
        configure({ VITE_REVERB_HOST: "localhost", VITE_REVERB_PORT: "8080", VITE_REVERB_SCHEME: "http" });

        const echo = await loadEcho();
        echo!.channel("active-users");
        await settle();

        const url = new URL(FakeWebSocket.latest()!.url);
        expect(url.protocol).toBe("ws:");
        expect(url.hostname).toBe("localhost");
        expect(url.port).toBe("8080");
        expect(url.pathname).toBe("/app/app-key");
    });

    it("keeps 127.0.0.1 as loopback too", async () => {
        configure({ VITE_REVERB_HOST: "127.0.0.1", VITE_REVERB_PORT: "8080", VITE_REVERB_SCHEME: "http" });

        const echo = await loadEcho();
        echo!.channel("active-users");
        await settle();

        expect(FakeWebSocket.latest()!.url.startsWith("ws://127.0.0.1:8080/app/app-key")).toBe(true);
    });
});

describe("getEcho channel authorization", () => {
    it("authorizes a private channel at /broadcasting/auth with socket_id, channel_name and the CSRF token", async () => {
        const echo = await loadEcho();
        echo!.private("App.Models.User.1");
        await settle();
        FakeWebSocket.latest()!.establish("1234.5678");
        await settle();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [endpoint, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(endpoint).toBe("/broadcasting/auth");
        expect(init.method).toBe("POST");
        expect(init.credentials).toBe("same-origin");
        const headers = new Headers(init.headers);
        expect(headers.get("X-CSRF-TOKEN")).toBe(CSRF);
        expect(JSON.parse(String(init.body))).toEqual({
            socket_id: "1234.5678",
            channel_name: "private-App.Models.User.1",
        });

        // The signature the server returned is what goes up the socket.
        const subscribe = FakeWebSocket.latest()!.sent.find((frame) => frame.event === "pusher:subscribe");
        expect(subscribe?.data).toEqual({ channel: "private-App.Models.User.1", auth: "app-key:signature" });
    });

    it("does not subscribe when the server refuses authorization", async () => {
        fetchMock.mockResolvedValueOnce(new Response("Forbidden", { status: 403 }));

        const echo = await loadEcho();
        echo!.private("App.Models.User.2");
        await settle();
        FakeWebSocket.latest()!.establish();
        await settle();

        expect(FakeWebSocket.latest()!.sent.some((frame) => frame.event === "pusher:subscribe")).toBe(false);
    });
});
