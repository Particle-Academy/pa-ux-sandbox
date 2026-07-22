import { describe, expect, it } from "vitest";
import { SHOWCASE_EXAMPLES } from "@particle-academy/fancy-tui/showcase";
import { docExamples, windowByGroup, GROUP_ORDER } from "../../tui-service/src/app.js";
import { renderAppFrame } from "../../tui-service/src/render.js";

const CR = "\r";
const LF = "\n";
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

const strip = (frame: string) => frame.replace(ANSI, "");

describe("docs app — the component list is exactly the showcase", () => {
    it("lists every fancy-tui showcase example, in order, and nothing else", () => {
        expect(docExamples("").map((e) => e.slug)).toEqual(SHOWCASE_EXAMPLES.map((e) => e.slug));
    });

    it("groups those examples under the real showcase groups", () => {
        // Layout / Content / Display / Inputs / Navigation / Data / Human+.
        expect(GROUP_ORDER).toEqual([...new Set(SHOWCASE_EXAMPLES.map((e) => e.group))]);
        expect(GROUP_ORDER).toContain("Human+");
    });

    it("filters the list by name or slug when searching", () => {
        const hits = docExamples("badge");
        expect(hits.map((e) => e.slug)).toEqual(["badge"]);

        // A query nothing matches empties the list rather than throwing.
        expect(docExamples("zzzznope")).toEqual([]);
    });
});

describe("docs app — selecting a component shows its source", () => {
    it("renders the selected example's name, a LIVE view, and its SOURCE", () => {
        for (const example of SHOWCASE_EXAMPLES) {
            const frame = strip(renderAppFrame(140, 50, { initialSlug: example.slug }));
            expect(frame, `${example.slug} name`).toContain(example.name);
            expect(frame, `${example.slug} LIVE label`).toContain("LIVE");
            expect(frame, `${example.slug} SOURCE label`).toContain("SOURCE");
        }
    });

    it("puts a distinctive line of the source on screen", () => {
        // `id="branch"` is unique to the Input example's source snippet.
        expect(strip(renderAppFrame(140, 50, { initialSlug: "input" }))).toContain('id="branch"');
        // `page={2}` is unique to Pagination's.
        expect(strip(renderAppFrame(140, 50, { initialSlug: "pagination" }))).toContain("page={2}");
    });
});

describe("docs app — the grouped list window", () => {
    it("keeps the selected row inside the window", () => {
        const items = SHOWCASE_EXAMPLES;
        for (const selected of [0, 5, 20, 40, items.length - 1]) {
            const { start, end } = windowByGroup(items, selected, 12);
            expect(selected).toBeGreaterThanOrEqual(start);
            expect(selected).toBeLessThan(end);
        }
    });

    it("never budgets more rows than it was given (headings cost a row)", () => {
        const items = SHOWCASE_EXAMPLES;
        const height = 10;
        for (let selected = 0; selected < items.length; selected++) {
            const { start, end } = windowByGroup(items, selected, height);
            let rows = 0;
            for (let i = start; i < end; i++) {
                const opensGroup = i === 0 || items[i]?.group !== items[i - 1]?.group;
                rows += opensGroup ? 2 : 1;
            }
            // A single group-opening row can be 2 tall on its own; otherwise the
            // window must respect the budget.
            expect(rows).toBeLessThanOrEqual(Math.max(height, 2));
        }
    });
});
