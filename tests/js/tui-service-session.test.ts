import { afterEach, describe, expect, it } from "vitest";
import { SessionManager, MAX_SESSIONS } from "../../tui-service/src/session.js";

const CR = "\r";
const LF = "\n";
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

function measure(frame: string) {
    const lines = frame.split(CR + LF);
    if (lines[lines.length - 1] === "") lines.pop();
    return {
        height: lines.length,
        width: Math.max(0, ...lines.map((l) => l.replace(ANSI, "").length)),
    };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let mgr: SessionManager;
afterEach(() => mgr?.destroy());

describe("live sessions — the allow-list", () => {
    it("starts a known app kind and returns a frame", () => {
        mgr = new SessionManager();
        const started = mgr.start("docs", 80, 20);
        expect("error" in started).toBe(false);
        if ("error" in started) return;
        expect(started.id).toMatch(/^s/);
        expect(started.frame.length).toBeGreaterThan(0);
    });

    it("refuses an unknown app kind — a session is never arbitrary", () => {
        mgr = new SessionManager();
        const result = mgr.start("../../etc/passwd", 60, 12);
        expect("error" in result).toBe(true);
        expect(mgr.size).toBe(0);
    });
});

describe("live sessions — the animation channel", () => {
    it("advances seq with NO input, because a timer redrew the component", async () => {
        // The preview starts on the Spinner, which animates on its own. If the
        // persistent render's interval did not fire, or its frames were not
        // captured, seq would never move and a long-poll would only ever time
        // out — no animation.
        mgr = new SessionManager();
        const started = mgr.start("docs", 80, 16, "spinner");
        if ("error" in started) throw new Error(started.error);

        const first = await mgr.wait(started.id, started.seq)!;
        expect(first.seq).toBeGreaterThan(started.seq);
    });

    it("feeds a keystroke without throwing and reports the current frame", () => {
        mgr = new SessionManager();
        const started = mgr.start("docs", 80, 20);
        if ("error" in started) throw new Error(started.error);
        const after = mgr.key(started.id, `${String.fromCharCode(27)}[B`); // down arrow
        expect(after).not.toBeNull();
        expect(after!.frame.length).toBeGreaterThan(0);
    });

    it("a keystroke actually reaches the focused component and redraws it", async () => {
        // The regression guard for the stdin contract AND the focus routing: Ink
        // 7 reads input via readable + read(), not the 'data' event alone, and
        // the list owns focus until Enter hands it to the preview. Starting on
        // the Accordion, the FIRST Enter dives into it, the SECOND toggles the
        // focused section — which must change the frame.
        mgr = new SessionManager();
        const started = mgr.start("docs", 60, 14, "accordion");
        if ("error" in started) throw new Error(started.error);

        await sleep(120); // mount + auto-focus settle
        mgr.key(started.id, "\r"); // Enter — dive into the accordion (focus moves)
        await sleep(120);
        const before = mgr.key(started.id, "")!;
        mgr.key(started.id, "\r"); // Enter — toggle the focused section
        await sleep(120);
        const after = mgr.key(started.id, "")!;

        expect(after.seq).toBeGreaterThan(before.seq);
        expect(after.frame).not.toBe(before.frame);
    });

    it("returns to the list on Escape from the preview", async () => {
        // Escape while a control is focused hands focus back to the list — it
        // must NOT quit (that is Escape at the list root). A frame still comes
        // back, and no quit effect is raised.
        mgr = new SessionManager();
        const started = mgr.start("docs", 60, 14, "input");
        if ("error" in started) throw new Error(started.error);

        await sleep(120);
        mgr.key(started.id, "\r"); // dive into the Input
        await sleep(120);
        const escaped = mgr.key(started.id, String.fromCharCode(27)); // Escape
        expect(escaped).not.toBeNull();
        expect(escaped!.effects).toEqual([]);
    });

    it("raises a quit effect on q at the list root", async () => {
        mgr = new SessionManager();
        const started = mgr.start("docs", 80, 20);
        if ("error" in started) throw new Error(started.error);

        await sleep(80);
        // The effect rides the key response when Ink processes input
        // synchronously, or a following poll when it does not — collect both.
        const first = mgr.key(started.id, "q")!;
        await sleep(60);
        const second = mgr.key(started.id, "")!;
        expect([...first.effects, ...second.effects]).toContainEqual({ type: "quit" });
    });

    it("a stream for an unknown session is null, not a hang", () => {
        mgr = new SessionManager();
        expect(mgr.wait("nope", 0)).toBeNull();
        expect(mgr.key("nope", "x")).toBeNull();
    });
});

describe("live sessions — the frame fits the pane", () => {
    for (const [cols, rows] of [
        [40, 8],
        [60, 12],
        [100, 24],
    ] as const) {
        it(`fits ${cols}x${rows}`, () => {
            mgr = new SessionManager();
            const started = mgr.start("docs", cols, rows);
            if ("error" in started) throw new Error(started.error);
            const { width, height } = measure(started.frame);
            expect(height).toBeLessThanOrEqual(rows);
            expect(width).toBeLessThanOrEqual(cols);
        });
    }
});

describe("live sessions — the resource fence", () => {
    it("caps concurrent sessions and refuses past the ceiling", () => {
        mgr = new SessionManager();
        // Default selection is the static Hero (no timers), so this stays cheap.
        for (let i = 0; i < MAX_SESSIONS; i++) {
            expect("error" in mgr.start("docs", 40, 8)).toBe(false);
        }
        expect(mgr.size).toBe(MAX_SESSIONS);
        // All are fresh (< the idle grace), so none can be evicted → refused.
        const overflow = mgr.start("docs", 40, 8);
        expect("error" in overflow).toBe(true);
        expect(mgr.size).toBe(MAX_SESSIONS);
    });

    it("evicts an idle session to admit a new one", async () => {
        mgr = new SessionManager();
        for (let i = 0; i < MAX_SESSIONS; i++) mgr.start("docs", 40, 8);
        // Let them age past the 1s eviction grace.
        await sleep(1_100);
        const admitted = mgr.start("docs", 40, 8);
        expect("error" in admitted).toBe(false);
        expect(mgr.size).toBe(MAX_SESSIONS); // one evicted, one admitted
    });

    it("ends a session and frees it", () => {
        mgr = new SessionManager();
        const started = mgr.start("docs", 40, 8);
        if ("error" in started) throw new Error(started.error);
        expect(mgr.end(started.id)).toBe(true);
        expect(mgr.size).toBe(0);
        expect(mgr.end(started.id)).toBe(false);
    });
});
