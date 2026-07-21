import { Terminal } from "@particle-academy/fancy-term";
// Required by fancy-term: without it xterm's character-measurement helper (a
// long run of "w") renders as visible text over the output.
import "@xterm/xterm/css/xterm.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentRef } from "react";

/**
 * The Fancy Docs TUI — the /fancy-tui page as a terminal application.
 *
 * This component owns almost nothing. The terminal itself is rendered by a
 * server-side Node service that runs the REAL fancy-tui Ink components and
 * browses the REAL MCP server; the browser is a dumb terminal. Every keystroke
 * is POSTed to `/fancy-tui/frame`, and the reply is the next ANSI frame plus
 * the opaque navigation state to send back with the following key.
 *
 * Holding the state here (rather than in a server session) is what keeps the
 * service stateless and safe: there is nothing per-user to store, and the
 * service treats the returned state as untrusted on the way back in.
 */

type Effect = { type: "open"; url: string } | { type: "quit" };
type FrameResponse = { state: unknown; frame: string; effects: Effect[] };
type Size = { cols: number; rows: number };

const BOOT_FRAME = "\r\n  Starting the Fancy Docs TUI…\r\n";

/** Laravel's XSRF cookie, so this same-origin POST clears CSRF like Inertia's do. */
function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
}

export default function DocsTui({ onExit }: { onExit: () => void }) {
    const [frame, setFrame] = useState<string>(BOOT_FRAME);
    const [unavailable, setUnavailable] = useState<string | null>(null);

    // The opaque navigation state the server round-trips. Held in a ref because
    // keystrokes arrive from xterm outside React's render cycle.
    const stateRef = useRef<unknown>(null);
    const sizeRef = useRef<Size>({ cols: 100, rows: 32 });
    const terminal = useRef<ComponentRef<typeof Terminal>>(null);
    // Serialise requests: a burst of keys must apply in order, since each reply
    // carries the state the next key builds on.
    const chain = useRef<Promise<void>>(Promise.resolve());

    const post = useCallback(
        async (key: string | null) => {
            const { cols, rows } = sizeRef.current;
            const res = await fetch("/fancy-tui/frame", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-XSRF-TOKEN": xsrfToken(),
                },
                body: JSON.stringify({ state: stateRef.current, key, cols, rows }),
            });

            if (!res.ok) {
                // 503/502 from the proxy means the render service isn't there —
                // say so in-terminal rather than leaving a dead screen.
                setUnavailable(
                    res.status === 503
                        ? "The docs terminal isn't running in this environment."
                        : "The docs terminal hit an error.",
                );
                return;
            }

            const payload = (await res.json()) as FrameResponse;
            stateRef.current = payload.state;
            setFrame(payload.frame);

            for (const effect of payload.effects ?? []) {
                if (effect.type === "open") window.open(effect.url, "_blank", "noopener,noreferrer");
                if (effect.type === "quit") onExit();
            }
        },
        [onExit],
    );

    /** Queue a keystroke so replies apply in the order the keys were pressed. */
    const enqueue = useCallback(
        (key: string | null) => {
            chain.current = chain.current
                .then(() => post(key))
                .catch(() => setUnavailable("The docs terminal isn't reachable."));
        },
        [post],
    );

    const onData = useCallback((data: string) => enqueue(data), [enqueue]);

    const onResize = useCallback(
        (next: Size) => {
            const current = sizeRef.current;
            if (current.cols === next.cols && current.rows === next.rows) return;
            sizeRef.current = next;
            // A resize is a repaint at the new size — no key.
            enqueue(null);
        },
        [enqueue],
    );

    // First paint.
    useEffect(() => {
        enqueue(null);
    }, [enqueue]);

    // Full-viewport takeover: stop the page behind it from scrolling, and own
    // the keyboard from the moment it opens.
    useEffect(() => {
        document.body.classList.add("ftui-takeover-active");
        terminal.current?.focus();
        return () => document.body.classList.remove("ftui-takeover-active");
    }, []);

    return (
        <div className="ftui-takeover" role="application" aria-label="Fancy Docs TUI">
            <div className="ftui-takeover__bar">
                <span className="ftui-takeover__dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                </span>
                <b>fancy-docs — real components over MCP</b>
                <button type="button" className="ftui-takeover__exit" onClick={onExit}>
                    Exit <kbd>q</kbd>
                </button>
            </div>
            <div className="ftui-takeover__screen">
                {unavailable ? (
                    <div className="ftui-takeover__notice">
                        <p>{unavailable}</p>
                        <p>
                            Run the docs terminal service and set <code>TUI_SERVICE_URL</code>, or browse
                            the HTML docs.
                        </p>
                        <button type="button" onClick={onExit}>Back to HTML docs</button>
                    </div>
                ) : (
                    <Terminal
                        ref={terminal}
                        output={frame}
                        onData={onData}
                        onResize={onResize}
                        fit
                        fontSize={14}
                        cursorBlink={false}
                        scrollback={0}
                        theme={{
                            background: "#090b10",
                            foreground: "#e4e4e7",
                            cursor: "#a78bfa",
                            black: "#18181b",
                            brightBlack: "#71717a",
                            cyan: "#22d3ee",
                            green: "#4ade80",
                            magenta: "#c084fc",
                            yellow: "#facc15",
                        }}
                    />
                )}
            </div>
        </div>
    );
}
