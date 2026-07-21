import { describe, expect, it } from "vitest";
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
    const sizes: Array<[number, number]> = [
        [60, 18],
        [70, 20],
        [80, 24],
        [100, 30],
        [110, 40],
        [120, 50],
        [140, 60],
        [200, 45],
    ];

    for (const [cols, rows] of sizes) {
        it(`fits ${cols}x${rows}`, () => {
            const { height, width } = measure(renderFrame(catalogue, initialState, cols, rows));

            expect(height).toBeLessThanOrEqual(rows);
            expect(width).toBeLessThanOrEqual(cols);
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
