import { Terminal } from "@particle-academy/fancy-term";
// Required by fancy-term: without it xterm's character-measurement helper (a
// long run of "w") renders as visible text over the output.
import "@xterm/xterm/css/xterm.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentRef } from "react";

/**
 * The Fancy TUI docs — the /fancy-tui page as one terminal application.
 *
 * The browser is a dumb terminal in front of a Node service that runs the REAL
 * fancy-tui Ink components. The WHOLE docs UI is a single live session: on open
 * it starts one persistent Ink app on the service, streams its frames over a
 * long-poll (so self-animating components animate), and forwards every keystroke
 * to it. There is no navigation reducer and no per-preview session — the app
 * holds its own state server-side in a live React tree.
 *
 * Keys arrive from xterm outside React's render cycle, so a ref carries the live
 * session id; a generation counter invalidates a stale long-poll the moment the
 * session is replaced (a resize restarts it at the new grid).
 */

type AppEffect = { type: "quit" } | { type: "open"; url: string };
type SessionResponse = { id: string; seq: number; frame: string; effects?: AppEffect[] };
type StreamResponse = { seq: number; frame: string; effects?: AppEffect[] };
type Size = { cols: number; rows: number };

const BOOT_FRAME = "\r\n  Starting the Fancy TUI docs…\r\n";

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

    const sizeRef = useRef<Size>({ cols: 100, rows: 32 });
    const terminal = useRef<ComponentRef<typeof Terminal>>(null);

    // The live session, plus a generation that invalidates a stale poll loop the
    // instant the session is replaced (so an old poll never overwrites a newer
    // frame after a resize restart).
    const session = useRef<{ id: string; seen: number } | null>(null);
    const gen = useRef(0);
    // Guard against overlapping starts (first paint + an immediate resize).
    const starting = useRef(false);

    // Apply a frame only if it is newer than what is on screen, so the key POST
    // and the long-poll (which race) never show an older frame over a newer one.
    const applyFrame = useCallback((seq: number, next: string) => {
        const s = session.current;
        if (!s || seq < s.seen) return;
        s.seen = seq;
        setFrame(next);
    }, []);

    const runEffects = useCallback(
        (effects: AppEffect[] | undefined) => {
            for (const effect of effects ?? []) {
                if (effect.type === "open") window.open(effect.url, "_blank", "noopener,noreferrer");
                if (effect.type === "quit") onExit();
            }
        },
        [onExit],
    );

    const endSession = useCallback(async () => {
        const s = session.current;
        session.current = null;
        gen.current++; // stop the long-poll loop
        if (s) {
            await fetch("/fancy-tui/session", {
                method: "POST",
                headers: jsonHeaders(),
                body: JSON.stringify({ action: "end", id: s.id }),
                keepalive: true,
            }).catch(() => {});
        }
    }, []);

    // The animation channel: hold a request open until the app redraws or raises
    // an effect, paint it, immediately re-poll. One loop per session, tied to gen.
    const pollLoop = useCallback(
        async (id: string, myGen: number) => {
            while (gen.current === myGen && session.current) {
                let res: Response;
                try {
                    const since = session.current?.seen ?? 0;
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
                applyFrame(payload.seq, payload.frame);
                runEffects(payload.effects);
            }
        },
        [applyFrame, runEffects],
    );

    const startSession = useCallback(async () => {
        if (starting.current) return;
        starting.current = true;
        const { cols, rows } = sizeRef.current;
        let res: Response;
        try {
            res = await fetch("/fancy-tui/session", {
                method: "POST",
                headers: jsonHeaders(),
                body: JSON.stringify({ action: "start", kind: "docs", cols, rows }),
            });
        } catch {
            starting.current = false;
            setUnavailable("The docs terminal isn't reachable.");
            return;
        }
        starting.current = false;

        if (!res.ok) {
            setUnavailable(
                res.status === 503
                    ? "The docs terminal isn't running in this environment."
                    : "The docs terminal hit an error.",
            );
            return;
        }

        const payload = (await res.json()) as SessionResponse;
        gen.current++;
        const myGen = gen.current;
        session.current = { id: payload.id, seen: payload.seq };
        setFrame(payload.frame);
        runEffects(payload.effects);
        void pollLoop(payload.id, myGen);
    }, [pollLoop, runEffects]);

    // Every keystroke goes to the live session. Frames come back on the key
    // response AND the poll loop; apply whichever is newer.
    const onData = useCallback(
        (data: string) => {
            const s = session.current;
            if (!s) return;
            void fetch("/fancy-tui/session", {
                method: "POST",
                headers: jsonHeaders(),
                body: JSON.stringify({ action: "key", id: s.id, key: data }),
            })
                .then((res) => (res.ok ? res.json() : null))
                .then((payload: SessionResponse | null) => {
                    if (!payload) return;
                    applyFrame(payload.seq, payload.frame);
                    runEffects(payload.effects);
                })
                .catch(() => {});
        },
        [applyFrame, runEffects],
    );

    const onResize = useCallback(
        (next: Size) => {
            const current = sizeRef.current;
            if (current.cols === next.cols && current.rows === next.rows) return;
            sizeRef.current = next;
            // The app is sized at start, so a resize restarts it at the new grid.
            void endSession().then(() => startSession());
        },
        [endSession, startSession],
    );

    // First paint: start the one session.
    useEffect(() => {
        void startSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Full-viewport takeover: stop the page behind it from scrolling, own the
    // keyboard, and never leak a live session when the view closes.
    useEffect(() => {
        document.body.classList.add("ftui-takeover-active");
        terminal.current?.focus();
        return () => {
            document.body.classList.remove("ftui-takeover-active");
            void endSession();
        };
    }, [endSession]);

    return (
        <div className="ftui-takeover" role="application" aria-label="Fancy TUI docs">
            <div className="ftui-takeover__bar">
                <span className="ftui-takeover__dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                </span>
                <b>fancy-tui — live components in your terminal</b>
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
