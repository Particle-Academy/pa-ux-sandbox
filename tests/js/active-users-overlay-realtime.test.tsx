// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://showcase.example.test/"}
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FancyDataRoot } from "@particle-academy/fancy-query";
import { FakeWebSocket } from "./support/fake-websocket";

/**
 * A broadcast `ActiveUserActivity` reaches the overlay — end to end through
 * the showcase's real realtime wiring: `getEcho()` -> the socket client ->
 * fancy-query's `useFancyStream` -> `<ActiveUsersOverlay>`.
 *
 * The server half is `app/Events/ActiveUserActivity.php`, which uses
 * `broadcastAs('active-user.updated')`. A custom broadcast name goes over the
 * wire VERBATIM, so the client must listen for it with a leading dot; without
 * it, the name is namespaced to `App\Events\active-user\updated` and never
 * matches. That is what the overlay did: the push channel was wired to nothing
 * and the 3-second REST poll was quietly doing all of the work.
 */

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
    vi.resetModules();
    FakeWebSocket.reset();
    vi.stubGlobal("WebSocket", FakeWebSocket);
    // The overlay's REST poll: return nothing, so only the socket can post a pill.
    vi.stubGlobal("fetch", vi.fn(async () => new Response("[]", { status: 200 })));
    sessionStorage.clear();
    for (const [name, content] of [["broadcasting-driver", "reverb"], ["csrf-token", "csrf"]]) {
        const meta = document.createElement("meta");
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
    }
    vi.stubEnv("VITE_REVERB_APP_KEY", "app-key");
    vi.stubEnv("VITE_REVERB_HOST", "ws.example.test");
    vi.stubEnv("VITE_REVERB_PORT", "443");
    vi.stubEnv("VITE_REVERB_SCHEME", "https");
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
});

afterEach(() => {
    act(() => root.unmount());
    host.remove();
    document.head.querySelectorAll("meta").forEach((meta) => meta.remove());
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

async function settle(ms = 0): Promise<void> {
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, ms));
    });
}

describe("ActiveUsersOverlay over the socket", () => {
    it("posts a pill when the server broadcasts active-user.updated", async () => {
        const { getEcho } = await import("../../resources/js/lib/echo");
        const { ActiveUsersOverlay } = await import("../../resources/js/components/ActiveUsersOverlay");

        act(() => {
            root.render(
                <FancyDataRoot echo={getEcho()}>
                    <ActiveUsersOverlay />
                </FancyDataRoot>,
            );
        });
        await settle();

        const socket = FakeWebSocket.latest();
        expect(socket, "the overlay should open a socket").toBeDefined();
        socket!.establish();
        await settle();
        expect(socket!.sent).toContainEqual({ event: "pusher:subscribe", data: { channel: "active-users" } });
        socket!.receive({ event: "pusher_internal:subscription_succeeded", channel: "active-users", data: "{}" });

        // Exactly what Laravel puts on the wire for ActiveUserActivity.
        socket!.receive({
            event: "active-user.updated",
            channel: "active-users",
            data: JSON.stringify({
                id: 42,
                user_id: 7,
                name: "Ada Socket",
                avatar_url: null,
                identity: { name: "Ada Socket", avatarUrl: null, cosmetics: null },
                activity_type: "visit",
                activity_label: "opened the socket demo",
                activity_at: new Date().toISOString(),
                is_xp: false,
                is_achievement: false,
                last_active_at: new Date().toISOString(),
                is_fake: false,
            }),
        });
        await settle(20);

        expect(host.textContent).toContain("Ada Socket");
        expect(host.textContent).toContain("opened the socket demo");
    });
});
