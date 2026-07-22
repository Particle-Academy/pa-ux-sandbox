import { Terminal } from "@particle-academy/fancy-term";
// Required by fancy-term: without it xterm's character-measurement helper (a
// long run of "w") renders as visible text over the output.
import "@xterm/xterm/css/xterm.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentRef } from "react";

/**
 * The Fancy Docs TUI — the /fancy-tui page as a terminal application.
 *
 * The browser is a dumb terminal in front of a Node service that runs the REAL
 * fancy-tui Ink components over the REAL MCP. It has two modes, and one xterm:
 *
 *  - NAVIGATION is stateless: each key POSTs to `/fancy-tui/frame` with the
 *    opaque nav state, and the reply is the next frame plus the state to send
 *    back. Nothing per-user is held server-side.
 *  - PREVIEW is a live session: pressing Enter on an interactive component opens
 *    a persistent Ink render of it on the service (`/fancy-tui/session`). Keys
 *    route INTO the component, and a long-poll loop pulls frames as it
 *    redraws — from a keystroke OR its own timers, so a Spinner spins. Escape
 *    ends the session and returns to navigation.
 *
 * A ref decides where a keystroke goes, because keys arrive from xterm outside
 * React's render cycle.
 */

type Effect =
  | { type: "open"; url: string }
  | { type: "quit" }
  | { type: "enter-preview"; slug: string };
type FrameResponse = { state: unknown; frame: string; effects: Effect[] };
type SessionResponse = { id: string; seq: number; frame: string };
type StreamResponse = { seq: number; frame: string };
type Size = { cols: number; rows: number };

const BOOT_FRAME = "\r\n  Starting the Fancy Docs TUI…\r\n";
/** A lone ESC byte — the Escape key. An arrow sends ESC then "[C", so it differs. */
const ESC = "\u001b";

/** Laravel's XSRF cookie, so this same-origin POST clears CSRF like Inertia's do. */
function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
}

const jsonHeaders = () => ({
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "X-XSRF-TOKEN": xsrfToken(),
});

export default function DocsTui({ onExit }: { onExit: () => void }) {
    const [frame, setFrame] = useState<string>(BOOT_FRAME);
    const [unavailable, setUnavailable] = useState<string | null>(null);

    const stateRef = useRef<unknown>(null);
    const sizeRef = useRef<Size>({ cols: 100, rows: 32 });
    const terminal = useRef<ComponentRef<typeof Terminal>>(null);
    // Serialise NAV requests: a burst of keys must apply in order, since each
    // reply carries the state the next key builds on.
    const chain = useRef<Promise<void>>(Promise.resolve());

    // Preview-mode state. `mode` gates key routing; `preview` holds the live
    // session; `gen` invalidates a stale long-poll loop the moment the session
    // changes, so an old poll cannot overwrite a newer frame.
    const mode = useRef<"nav" | "preview">("nav");
    const preview = useRef<{ id: string; slug: string; seen: number } | null>(null);
    const gen = useRef(0);

    // Apply a frame only if it is newer than what is on screen, so the key POST
    // and the long-poll (which race) never show an older frame over a newer one.
    const applyPreviewFrame = useCallback((seq: number, next: string) => {
        const p = preview.current;
        if (!p || seq < p.seen) return;
        p.seen = seq;
        setFrame(next);
    }, []);

    const endPreview = useCallback(async () => {
        const p = preview.current;
        preview.current = null;
        mode.current = "nav";
        gen.current++; // stop the long-poll loop
        if (p) {
            await fetch("/fancy-tui/session", {
                method: "POST",
                headers: jsonHeaders(),
                body: JSON.stringify({ action: "end", id: p.id }),
                keepalive: true,
            }).catch(() => {});
        }
    }, []);

    // The animation channel: hold a request open until the component redraws,
    // paint it, immediately re-poll. One loop per session, tied to `gen`.
    const pollLoop = useCallback(
        async (id: string, myGen: number) => {
            while (mode.current === "preview" && gen.current === myGen) {
                let res: Response;
                try {
                    const since = preview.current?.seen ?? 0;
                    res = await fetch(
                        `/fancy-tui/session/stream?id=${encodeURIComponent(id)}&since=${since}`,
                        { headers: jsonHeaders() },
                    );
                } catch {
                    break; // network blip — stop; a keystroke will resume paint
                }
                if (gen.current !== myGen) return;
                if (!res.ok) break;
                const payload = (await res.json()) as StreamResponse;
                applyPreviewFrame(payload.seq, payload.frame);
            }
        },
        [applyPreviewFrame],
    );

    const startPreview = useCallback(
        async (slug: string) => {
            const { cols, rows } = sizeRef.current;
            let res: Response;
            try {
                res = await fetch("/fancy-tui/session", {
                    method: "POST",
                    headers: jsonHeaders(),
                    body: JSON.stringify({ action: "start", slug, cols, rows }),
                });
            } catch {
                return; // stay in nav; the detail pane is still on screen
            }
            if (!res.ok) return;
            const payload = (await res.json()) as SessionResponse;

            gen.current++;
            const myGen = gen.current;
            preview.current = { id: payload.id, slug, seen: payload.seq };
            mode.current = "preview";
            setFrame(payload.frame);
            void pollLoop(payload.id, myGen);
        },
        [pollLoop],
    );

    const post = useCallback(
        async (key: string | null) => {
            const { cols, rows } = sizeRef.current;
            const res = await fetch("/fancy-tui/frame", {
                method: "POST",
                headers: jsonHeaders(),
                body: JSON.stringify({ state: stateRef.current, key, cols, rows }),
            });

            if (!res.ok) {
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
                if (effect.type === "enter-preview") void startPreview(effect.slug);
            }
        },
        [onExit, startPreview],
    );

    /** Queue a NAV keystroke so replies apply in the order the keys were pressed. */
    const enqueue = useCallback(
        (key: string | null) => {
            chain.current = chain.current
                .then(() => post(key))
                .catch(() => setUnavailable("The docs terminal isn't reachable."));
        },
        [post],
    );

    // Route a keystroke to the right mode. In preview, Escape (a lone ESC, not
    // an arrow's escape SEQUENCE) leaves; everything else feeds the component.
    const onData = useCallback(
        (data: string) => {
            if (mode.current === "preview") {
                const p = preview.current;
                if (!p) return;
                if (data === ESC) {
                    void endPreview().then(() => enqueue(null)); // repaint detail pane
                    return;
                }
                void fetch("/fancy-tui/session", {
                    method: "POST",
                    headers: jsonHeaders(),
                    body: JSON.stringify({ action: "key", id: p.id, key: data }),
                })
                    .then((res) => (res.ok ? res.json() : null))
                    .then((payload: SessionResponse | null) => {
                        if (payload) applyPreviewFrame(payload.seq, payload.frame);
                    })
                    .catch(() => {});
                return;
            }
            enqueue(data);
        },
        [enqueue, endPreview, applyPreviewFrame],
    );

    const onResize = useCallback(
        (next: Size) => {
            const current = sizeRef.current;
            if (current.cols === next.cols && current.rows === next.rows) return;
            sizeRef.current = next;
            // A preview is sized at start, so a resize restarts it at the new
            // grid; navigation is just a repaint at the new size.
            if (mode.current === "preview") {
                const slug = preview.current?.slug;
                void endPreview().then(() => {
                    if (slug) void startPreview(slug);
                });
                return;
            }
            enqueue(null);
        },
        [enqueue, endPreview, startPreview],
    );

    // First paint.
    useEffect(() => {
        enqueue(null);
    }, [enqueue]);

    // Full-viewport takeover: stop the page behind it from scrolling, own the
    // keyboard, and never leak a live session when the view closes.
    useEffect(() => {
        document.body.classList.add("ftui-takeover-active");
        terminal.current?.focus();
        return () => {
            document.body.classList.remove("ftui-takeover-active");
            void endPreview();
        };
    }, [endPreview]);

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
