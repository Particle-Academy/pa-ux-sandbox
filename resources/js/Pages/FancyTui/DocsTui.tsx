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

// Mouse reporting: xterm emits mouse events only once the running app turns it
// on. DECSET 1000 = report button press + release (NOT motion, so drag-select
// still works with Shift); 1006 = SGR extended coordinates, which the service
// decodes. The app itself never writes these — the browser owns enabling them.
const MOUSE_ON = "\x1b[?1000;1006h";
const MOUSE_OFF = "\x1b[?1000;1006l";

// An SGR mouse report, ESC [ < button ; col ; row (M press | m release).
const MOUSE_REPORT = /^\x1b\[<(\d+);\d+;\d+([Mm])$/;

/**
 * Whether to forward a chunk of terminal input to the service.
 *
 * Keystrokes and everything non-mouse pass through untouched. A mouse report is
 * forwarded ONLY when it is a left-button PRESS — release, wheel, motion, and
 * the middle/right buttons are dropped, so a click is a single request rather
 * than a flood the service has to decode and discard.
 */
function forwardable(data: string): boolean {
    const match = MOUSE_REPORT.exec(data);
    if (!match) return true;
    const button = Number(match[1]);
    const press = match[2] === "M";
    return press && (button & 0b1100011) === 0;
}

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
            // Drop the mouse reports the app does not act on (release / wheel /
            // drag / middle / right); keystrokes always pass.
            if (!forwardable(data)) return;
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

    // Keep mouse reporting on. fancy-term's controlled-output diffing resets
    // xterm whenever a frame is a wholesale replace (every repaint here is), and
    // a reset clears DEC private modes — so re-assert mouse reporting after each
    // frame. This parent effect runs AFTER <Terminal>'s output effect (child
    // effects fire first), so it lands after the reset; the sequence is a
    // mode-set with no visible output, so re-sending it is idempotent.
    useEffect(() => {
        terminal.current?.write(MOUSE_ON);
    }, [frame]);

    // Full-viewport takeover: stop the page behind it from scrolling, own the
    // keyboard, and never leak a live session when the view closes.
    useEffect(() => {
        document.body.classList.add("ftui-takeover-active");
        terminal.current?.focus();
        return () => {
            document.body.classList.remove("ftui-takeover-active");
            terminal.current?.write(MOUSE_OFF);
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
                        // The FULL 16-colour ANSI palette. fancy-tui's tones are
                        // ANSI colour NAMES (info→blue, danger→red, text→white),
                        // so a partial palette left those falling back to xterm's
                        // muddy defaults on this near-black background — which is
                        // why Fancy mode looked flat. Every slot is set to a
                        // cohesive, vivid dark-theme colour so every tone renders.
                        theme={{
                            background: "#090b10",
                            foreground: "#e4e4e7",
                            cursor: "#a78bfa",
                            cursorAccent: "#090b10",
                            selectionBackground: "#312e81",
                            black: "#18181b",
                            red: "#fb7185",
                            green: "#4ade80",
                            yellow: "#facc15",
                            blue: "#818cf8",
                            magenta: "#c084fc",
                            cyan: "#22d3ee",
                            white: "#e4e4e7",
                            brightBlack: "#71717a",
                            brightRed: "#fda4af",
                            brightGreen: "#86efac",
                            brightYellow: "#fde047",
                            brightBlue: "#a5b4fc",
                            brightMagenta: "#d8b4fe",
                            brightCyan: "#67e8f9",
                            brightWhite: "#fafafa",
                        }}
                    />
                )}
            </div>
        </div>
    );
}
