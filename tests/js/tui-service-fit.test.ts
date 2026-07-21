import { describe, expect, it } from "vitest";
import { SHOWCASE_EXAMPLES } from "@particle-academy/fancy-tui/showcase";
import { renderFrame } from "../../tui-service/src/render.js";
import { initialState } from "../../tui-service/src/model.js";
import type { Catalogue, CatalogueComponent, Family } from "../../tui-service/src/catalogue.js";

const CR = "\r";
const LF = "\n";
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

function component(name: string, previewable: boolean): CatalogueComponent {
    return {
        name,
        title: name,
        package: previewable ? "fancy-tui" : "react-fancy",
        description: `${name} description`,
        previewable,
        previewSlug: null,
        previewFrame: null,
        previewSource: null,
    } as unknown as CatalogueComponent;
}

function family(slug: string, group: string, count: number, previewable = false): Family {
    return {
        slug,
        name: slug,
        group,
        components: Array.from({ length: count }, (_, i) => component(`${slug}-${i}`, previewable)),
    };
}

/**
 * A catalogue shaped like the real one: many families spread over several
 * themes. The theme count is what matters — each theme draws a heading and a
 * blank line that the row budget has to pay for.
 */
const GROUPS = ["terminal", "core", "surfaces", "documents", "commerce", "platform", "tooling"];
const families: Family[] = GROUPS.flatMap((group, g) =>
    Array.from({ length: g === 6 ? 20 : 4 }, (_, i) => family(`${group}-${i}`, group, 12, group === "terminal")),
);

const catalogue: Catalogue = {
    themes: GROUPS.map((group) => ({ group, families: families.filter((f) => f.group === group) })),
    families,
    total: families.reduce((n, f) => n + f.components.length, 0),
    previewableCount: families.filter((f) => f.group === "terminal").length * 12,
};

/**
 * Terminal sizes every pane is checked against — a phone-width browser terminal
 * up to a maximised one.
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

/**
 * A fancy-tui family whose components carry REAL showcase slugs, so the detail
 * pane resolves a live example and renders the component itself.
 */
const liveComponents: CatalogueComponent[] = SHOWCASE_EXAMPLES.map((example) => ({
    name: `tui-${example.slug}`,
    title: example.name,
    package: "fancy-tui",
    description: `${example.name} — a fancy-tui component with a live terminal preview.`,
    family: "fancy-tui",
    familyName: "Fancy TUI",
    group: "terminal",
    url: `/packages/fancy-tui/tui-${example.slug}`,
    previewable: true,
    previewSlug: example.slug,
    previewFrame: null,
    previewSource: null,
}));

const liveFamily: Family = {
    slug: "fancy-tui",
    name: "Fancy TUI",
    group: "terminal",
    components: liveComponents,
};

const liveCatalogue: Catalogue = {
    themes: [{ group: "terminal", families: [liveFamily] }],
    families: [liveFamily],
    total: liveComponents.length,
    previewableCount: liveComponents.length,
};

/** Detail-pane state for the nth component of the live family. */
const detailAt = (index: number) => ({
    ...initialState,
    pane: "detail" as const,
    familyIndex: 0,
    componentIndex: index,
});

/** Visible size of a frame, ANSI stripped and the trailing newline discounted. */
function measure(frame: string) {
    const lines = frame.split(CR + LF);
    if (lines[lines.length - 1] === "") lines.pop();
    return {
        height: lines.length,
        width: Math.max(...lines.map((l) => l.replace(ANSI, "").length)),
    };
}

describe("docs TUI — the frame fits the terminal it was given", () => {
    // The original bug: the row budget counted one row per family, but the first
    // family of a theme also draws a heading and a blank line. With seven themes
    // the home pane overflowed by more than a dozen rows, pushing the hero and
    // the selected item off the top — unrecoverable, because the docs TUI
    // repaints a full screen and keeps no scrollback.
    for (const [cols, rows] of SIZES) {
        it(`fits ${cols}x${rows}`, () => {
            const { height, width } = measure(renderFrame(catalogue, initialState, cols, rows));

            expect(height).toBeLessThanOrEqual(rows);
            expect(width).toBeLessThanOrEqual(cols);
        });
    }

    // The detail pane renders fancy-tui's showcase example LIVE — arbitrary
    // content, composed for its own layout, dropped into a fixed pane. Hero is
    // twelve rows and Modal draws inside a 68-column box, so this is the obvious
    // next thing to overflow a short terminal.
    for (const [cols, rows] of SIZES) {
        it(`fits the detail pane with a live preview at ${cols}x${rows}`, () => {
            const tooTall: string[] = [];
            const tooWide: string[] = [];

            for (const [index, example] of SHOWCASE_EXAMPLES.entries()) {
                const { height, width } = measure(
                    renderFrame(liveCatalogue, detailAt(index), cols, rows),
                );
                if (height > rows) tooTall.push(`${example.slug} (${height} rows)`);
                if (width > cols) tooWide.push(`${example.slug} (${width} cols)`);
            }

            expect(tooTall).toEqual([]);
            expect(tooWide).toEqual([]);
        });
    }

    it("keeps the selected family on screen when it is far down the list", () => {
        // Scrolling to a family near the end must not drop it off the frame —
        // the window has to move with the selection, not clip it.
        const deep = { ...initialState, familyIndex: families.length - 1 };
        const frame = renderFrame(catalogue, deep, 110, 40);
        const clean = frame.replace(ANSI, "");

        expect(measure(frame).height).toBeLessThanOrEqual(40);
        expect(clean).toContain(families[families.length - 1]!.name);
    });
});

describe("docs TUI — the preview is the component, running", () => {
    const index = (slug: string) => SHOWCASE_EXAMPLES.findIndex((e) => e.slug === slug);
    const detailFor = (slug: string, cols = 110, rows = 40) =>
        renderFrame(liveCatalogue, detailAt(index(slug)), cols, rows).replace(ANSI, "");

    it("draws the real component, not a stored frame", () => {
        // Nothing in the catalogue carries a captured frame here, so anything
        // that appears was rendered by Ink during THIS call.
        expect(liveComponents.every((c) => c.previewFrame === null)).toBe(true);

        const badge = detailFor("badge");
        expect(badge).toContain("LIVE PREVIEW");
        expect(badge).toContain("passing");
        expect(badge).toContain("flaky");

        const table = detailFor("table");
        expect(table).toContain("JOB");
        expect(table).toContain("integration");
    });

    it("renders components that ask for keyboard input", () => {
        // Every overlay calls `useInput` unconditionally (Escape closes it), and
        // Ink refuses raw mode unless stdin is a TTY — which it is not under a
        // test runner or a daemon. Ink then replaces the ENTIRE frame with its
        // error screen, so one overlay in a preview blanked the whole page.
        // renderFrame hands Ink a stdin stub; this is what proves it still does.
        const modal = detailFor("modal");

        expect(modal).toContain("Deploy to production?");
        expect(modal).not.toContain("Raw mode is not supported");
    });

    it("lays the component out at the pane's width, not the capture's 68 columns", () => {
        // The point of rendering live: a Hero centres its title across the pane
        // it is given. On a 200-column terminal that title starts past column
        // 80 — a position a 68-column capture cannot produce however it is
        // embedded. Measuring the panel border instead would prove nothing: the
        // host draws that at any width.
        const wide = detailFor("hero", 200, 40);
        const title = wide.split(CR + LF).find((line) => line.includes("Fancy Docs"));

        expect(title).toBeDefined();
        expect(title!.indexOf("Fancy Docs")).toBeGreaterThan(80);

        // …and the same component, narrower, centres it much further left.
        const narrow = detailFor("hero", 90, 40)
            .split(CR + LF)
            .find((line) => line.includes("Fancy Docs"));

        expect(narrow!.indexOf("Fancy Docs")).toBeLessThan(60);
    });

    it("clips a preview that is taller than the pane instead of pushing the footer off", () => {
        // Hero is twelve rows; an 18-row terminal cannot hold it plus chrome.
        const short = detailFor("hero", 80, 18);
        const lines = short.split(CR + LF).filter((l) => l !== "");

        expect(lines.length).toBeLessThanOrEqual(18);
        // The footer is the thing an overflow would have shoved off the screen.
        expect(short).toContain("web docs");
    });

    it("falls back to the captured frame when there is no live example", () => {
        const stale: CatalogueComponent = {
            ...liveComponents[0]!,
            name: "tui-retired",
            title: "Retired",
            previewSlug: "retired",
            previewFrame: "captured-frame-line-one\ncaptured-frame-line-two",
            previewSource: "<Retired />",
        };
        const family: Family = { ...liveFamily, components: [stale] };
        const catalogue: Catalogue = {
            themes: [{ group: "terminal", families: [family] }],
            families: [family],
            total: 1,
            previewableCount: 1,
        };

        const frame = renderFrame(catalogue, detailAt(0), 110, 40).replace(ANSI, "");

        expect(frame).toContain("CAPTURED PREVIEW");
        expect(frame).toContain("captured-frame-line-one");
        expect(measure(renderFrame(catalogue, detailAt(0), 110, 40)).height).toBeLessThanOrEqual(40);
    });
});
