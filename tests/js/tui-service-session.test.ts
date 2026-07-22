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

describe("preview sessions — the allow-list", () => {
    it("starts a known showcase slug and returns a frame", () => {
        mgr = new SessionManager();
        const started = mgr.start("badge", 60, 8);
        expect("error" in started).toBe(false);
        if ("error" in started) return;
        expect(started.id).toMatch(/^s/);
        expect(started.frame.length).toBeGreaterThan(0);
    });

    it("refuses an unknown slug — a session is never arbitrary", () => {
        mgr = new SessionManager();
        const result = mgr.start("../../etc/passwd", 60, 8);
        expect("error" in result).toBe(true);
        expect(mgr.size).toBe(0);
    });
});

describe("preview sessions — the animation channel", () => {
    it("advances seq with NO input, because a timer redrew the component", async () => {
        // The Spinner animates on its own. If a persistent render's interval did
        // not fire, or its frames were not captured, seq would never move and a
        // long-poll would only ever time out — no animation.
        mgr = new SessionManager();
        const started = mgr.start("spinner", 60, 6);
        if ("error" in started) throw new Error(started.error);

        const first = await mgr.wait(started.id, started.seq)!;
        expect(first.seq).toBeGreaterThan(started.seq);
    });

    it("feeds a keystroke without throwing and reports the current frame", () => {
        mgr = new SessionManager();
        const started = mgr.start("menu", 60, 8);
        if ("error" in started) throw new Error(started.error);
        const after = mgr.key(started.id, `${String.fromCharCode(27)}[B`);
        expect(after).not.toBeNull();
        expect(after!.frame.length).toBeGreaterThan(0);
    });

    it("a keystroke actually reaches the component and redraws it", async () => {
        // The regression guard for the stdin contract: Ink 7 reads input via the
        // readable + read() pattern, not the 'data' event alone. A stdin that
        // emits only 'data' drops every key silently — the session animates (its
        // own timers) but never RESPONDS. Pressing Enter on an accordion toggles
        // a section, which must bump the seq.
        mgr = new SessionManager();
        const started = mgr.start("accordion", 50, 10);
        if ("error" in started) throw new Error(started.error);
        await sleep(80); // let focus settle
        const before = mgr.key(started.id, "")!.seq;
        mgr.key(started.id, "\r"); // Enter — toggle the focused section
        await sleep(80);
        const after = mgr.key(started.id, "")!.seq;
        expect(after).toBeGreaterThan(before);
    });

    it("a stream for an unknown session is null, not a hang", () => {
        mgr = new SessionManager();
        expect(mgr.wait("nope", 0)).toBeNull();
        expect(mgr.key("nope", "x")).toBeNull();
    });
});

describe("preview sessions — the frame fits the pane", () => {
    for (const [cols, rows] of [
        [40, 6],
        [60, 10],
        [100, 20],
    ] as const) {
        it(`fits ${cols}x${rows}`, () => {
            mgr = new SessionManager();
            const started = mgr.start("badge", cols, rows);
            if ("error" in started) throw new Error(started.error);
            const { width, height } = measure(started.frame);
            expect(height).toBeLessThanOrEqual(rows);
            expect(width).toBeLessThanOrEqual(cols);
        });
    }
});

describe("preview sessions — the resource fence", () => {
    it("caps concurrent sessions and refuses past the ceiling", () => {
        mgr = new SessionManager();
        // badge is static (no timers), so this stays cheap.
        for (let i = 0; i < MAX_SESSIONS; i++) {
            expect("error" in mgr.start("badge", 40, 6)).toBe(false);
        }
        expect(mgr.size).toBe(MAX_SESSIONS);
        // All are fresh (< the idle grace), so none can be evicted → refused.
        const overflow = mgr.start("badge", 40, 6);
        expect("error" in overflow).toBe(true);
        expect(mgr.size).toBe(MAX_SESSIONS);
    });

    it("evicts an idle session to admit a new one", async () => {
        mgr = new SessionManager();
        for (let i = 0; i < MAX_SESSIONS; i++) mgr.start("badge", 40, 6);
        // Let them age past the 1s eviction grace.
        await sleep(1_100);
        const admitted = mgr.start("badge", 40, 6);
        expect("error" in admitted).toBe(false);
        expect(mgr.size).toBe(MAX_SESSIONS); // one evicted, one admitted
    });

    it("ends a session and frees it", () => {
        mgr = new SessionManager();
        const started = mgr.start("badge", 40, 6);
        if ("error" in started) throw new Error(started.error);
        expect(mgr.end(started.id)).toBe(true);
        expect(mgr.size).toBe(0);
        expect(mgr.end(started.id)).toBe(false);
    });
});
