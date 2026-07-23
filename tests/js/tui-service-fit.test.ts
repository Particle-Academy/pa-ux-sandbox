import { describe, expect, it } from "vitest";
import { SHOWCASE_EXAMPLES } from "@particle-academy/fancy-tui/showcase";
import { renderAppFrame } from "../../tui-service/src/render.js";

const CR = "\r";
const LF = "\n";
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

/**
 * Terminal sizes the app is checked against — a phone-width browser terminal up
 * to a maximised one. The whole docs UI is one live app that repaints a
 * fixed-size screen with NO scrollback, so a frame one row too tall pushes
 * content off the top irrecoverably. These are the guard.
 */
const SIZES: Array<[number, number]> = [
    [60, 18],
    [70, 20],
    [80, 24],
    [100, 30],
    [110, 40],
    [120, 50],
    [140, 60],
    [200, 45],
];

/** Visible size of a frame, ANSI stripped and the trailing newline discounted. */
function measure(frame: string) {
    const lines = frame.split(CR + LF);
    if (lines[lines.length - 1] === "") lines.pop();
    return {
        height: lines.length,
        width: Math.max(0, ...lines.map((l) => l.replace(ANSI, "").length)),
    };
}

// "Make it Fancy" is a live toggle, so BOTH looks must obey the fixed-frame
// contract at every size — the Plain theme swaps borders (single vs round/double)
// and the source panel drops its syntax colour, either of which could shift a row.
const MODES = [true, false] as const;

describe("docs app — the frame fits the terminal it was given", () => {
    for (const fancy of MODES) {
        for (const [cols, rows] of SIZES) {
            it(`fits ${cols}x${rows} on first paint (fancy=${fancy})`, () => {
                const { height, width } = measure(renderAppFrame(cols, rows, { fancy }));
                expect(height).toBeLessThanOrEqual(rows);
                expect(width).toBeLessThanOrEqual(cols);
            });
        }

        // Every example is rendered LIVE in the preview pane — arbitrary content,
        // composed for its own layout, dropped into a fixed pane. Hero is twelve
        // rows and Modal draws inside a 68-column box, so selecting each in turn
        // is the surest way to find one that overflows a short terminal.
        for (const [cols, rows] of SIZES) {
            it(`fits every live preview at ${cols}x${rows} (fancy=${fancy})`, () => {
                const tooTall: string[] = [];
                const tooWide: string[] = [];

                for (const example of SHOWCASE_EXAMPLES) {
                    const { height, width } = measure(renderAppFrame(cols, rows, { initialSlug: example.slug, fancy }));
                    if (height > rows) tooTall.push(`${example.slug} (${height} rows)`);
                    if (width > cols) tooWide.push(`${example.slug} (${width} cols)`);
                }

                expect(tooTall).toEqual([]);
                expect(tooWide).toEqual([]);
            });
        }

        // The three things a windowed, fixed-height layout is most at risk of
        // clipping: a group heading, the live view, and the source. Badge is the
        // first row of the Display group, so selecting it puts its heading on
        // screen; assert all three survive, in BOTH looks.
        it(`keeps group headings, the live view and the source on screen (fancy=${fancy})`, () => {
            const clean = renderAppFrame(110, 36, { initialSlug: "badge", fancy }).replace(ANSI, "");
            expect(clean, "group heading").toContain("DISPLAY");
            expect(clean, "live label").toContain("LIVE");
            expect(clean, "live render").toContain("passing"); // the live Badge
            expect(clean, "source label").toContain("SOURCE");
            expect(clean, "source text").toContain('tone="success"');
        });
    }

    it("keeps the selected component on screen when it is far down the list", () => {
        const last = SHOWCASE_EXAMPLES[SHOWCASE_EXAMPLES.length - 1]!;
        const frame = renderAppFrame(110, 40, { initialSlug: last.slug });
        const clean = frame.replace(ANSI, "");

        expect(measure(frame).height).toBeLessThanOrEqual(40);
        // The list window must move with the selection, not clip it off.
        expect(clean).toContain(last.name);
    });
});

describe("docs app — the preview is the component, running", () => {
    const detailFor = (slug: string, cols = 140, rows = 50) =>
        renderAppFrame(cols, rows, { initialSlug: slug }).replace(ANSI, "");

    it("draws the real component in the preview pane, not a stored frame", () => {
        const badge = detailFor("badge");
        expect(badge).toContain("LIVE");
        expect(badge).toContain("passing"); // rendered by the live Badge
        expect(badge).toContain("flaky");

        const table = detailFor("table");
        expect(table).toContain("JOB");
        expect(table).toContain("integration");
    });

    it("shows the source beside the live component", () => {
        const badge = detailFor("badge");
        expect(badge).toContain("SOURCE");
        // `tone="success"` appears only in the SOURCE — the live Badge renders
        // the coloured pill, not the prop text.
        expect(badge).toContain('tone="success"');
    });

    it("renders components that ask for keyboard input, not Ink's error screen", () => {
        // Every overlay calls `useInput` unconditionally, and Ink refuses raw
        // mode unless stdin is a TTY — which it is not under a test runner. Ink
        // then replaces the ENTIRE frame with its error screen. The render
        // stdin stub is what keeps a Modal preview from blanking the page.
        const modal = detailFor("modal");
        expect(modal).toContain("Deploy to production?");
        expect(modal).not.toContain("Raw mode is not supported");
    });

    it("lays the component out at the pane's width, not a fixed 68 columns", () => {
        // A Hero centres its title across the pane it is given, so a wide
        // terminal starts it much further right than a narrow one. The docs app
        // overrides the Hero preview copy to its own "Fancy TUI" title, which
        // also appears in the brand bar (small indent) and the SOURCE panel
        // (`title="Fancy TUI"`, at the gutter). The centred LIVE title has the
        // largest indent, so take the max — ignoring the source occurrence.
        const titleCol = (cols: number) => {
            const lines = detailFor("hero", cols, 40).split(CR + LF);
            return Math.max(
                -1,
                ...lines.map((l) => (l.includes('title="') ? -1 : l.indexOf("Fancy TUI"))),
            );
        };

        const wide = titleCol(200);
        const narrow = titleCol(90);
        expect(wide).toBeGreaterThan(0);
        expect(narrow).toBeGreaterThan(0);
        expect(wide).toBeGreaterThan(narrow + 20);
    });

    it("clips a preview taller than the pane instead of pushing the footer off", () => {
        // Hero is twelve rows; an 18-row terminal cannot hold it plus chrome.
        const short = renderAppFrame(80, 18, { initialSlug: "hero" });
        const lines = short.split(CR + LF).filter((l) => l !== "");

        expect(lines.length).toBeLessThanOrEqual(18);
        // The footer is the thing an overflow would have shoved off the screen.
        expect(short.replace(ANSI, "")).toContain("quit");
    });

    it("shows a scrollback example as source rather than breaking the frame", () => {
        // MessageList / StaticList write through Ink's <Static>, above the frame
        // and outside the box model. Rendering them live would make the frame
        // taller than the terminal, so the pane withholds the live view.
        const frame = renderAppFrame(120, 40, { initialSlug: "message-list" });
        expect(measure(frame).height).toBeLessThanOrEqual(40);
        expect(frame.replace(ANSI, "")).toContain("scrollback");
    });
});
