import { usePage } from "@inertiajs/react";

type SharedAuth = { auth?: { user?: unknown }; csrfToken?: string };

/**
 * Fire-and-forget client for the XP analytics endpoints
 * (routes/web.php → /api/xp/*). No-ops for guests (the endpoints require
 * auth anyway). The server throttles per (user, key) so callers don't
 * have to debounce — call freely on interaction.
 */
export function useXp() {
    const page = usePage<SharedAuth>();
    const csrf = page.props.csrfToken ?? "";
    const authed = Boolean(page.props.auth?.user);

    function send(url: string, body: Record<string, unknown>): void {
        if (!authed) return;
        void fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-TOKEN": csrf,
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
            body: JSON.stringify(body),
            credentials: "same-origin",
            keepalive: true,
        }).catch(() => {
            /* analytics is best-effort; never surface failures */
        });
    }

    return {
        /** Credit tinkerer-xp for interacting with a demo. */
        demo(demo: string, kind: "interaction" | "first-use" | "completion" = "interaction") {
            send("/api/xp/demo", { demo, kind });
        },
        /** Credit bridge-xp for invoking an MCP bridge tool. */
        bridge(tool: string, bridge?: string) {
            send("/api/xp/bridge", { tool, bridge });
        },
    };
}
