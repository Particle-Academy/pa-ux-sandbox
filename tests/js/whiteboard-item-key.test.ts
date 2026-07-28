import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Whiteboard board items are keyed `kind`, never `type`.
 *
 * The docs pages taught `type: "sticky"`. Nothing complained, because no
 * fancy-whiteboard component reads the discriminant at all — `kind` appears
 * only in its type definitions, so `<StickyNote>` renders a wrongly-keyed item
 * perfectly well.
 *
 * Where it bites is the Human+ side. `agent-integrations`' whiteboard bridge
 * lists the board as `` `${item.kind} ${item.id}` ``, so an item built the way
 * these pages showed reads back to an agent as **`undefined n1: …`** — it can
 * see the note and cannot tell a sticky from a shape. `BoardItem` is a union
 * discriminated on `kind`, so any host switching on it falls through too.
 *
 * Asserted against the SOURCE rather than a render, because the failure is in
 * what the page tells you to write: these files carry copyable `code:` strings,
 * and a render test would happily pass while the snippet beside it stayed wrong.
 *
 * Note the deliberate narrowness — `fancy-slides` elements ARE keyed `type`,
 * and a blanket rename across the docs would have broken them. Only files that
 * import fancy-whiteboard are checked.
 */
const DOCS = resolve(process.cwd(), "resources/js/Pages/Packages");

/** Every source file under Packages/ that imports fancy-whiteboard. */
function whiteboardFiles(): string[] {
    return globSync("**/*.tsx", { cwd: DOCS })
        .map((rel) => resolve(DOCS, rel))
        .filter((file) => readFileSync(file, "utf8").includes("@particle-academy/fancy-whiteboard"));
}

describe("whiteboard docs", () => {
    it("finds the files it is meant to be guarding", () => {
        // A glob that silently matches nothing would make every assertion below
        // vacuously true — the exact way a source-level test rots.
        expect(whiteboardFiles().length).toBeGreaterThan(0);
    });

    // `sticky` and `connector` exist ONLY in fancy-whiteboard, so `type:` on
    // either is unambiguously wrong wherever it appears.
    it.each(whiteboardFiles())("never keys a sticky or connector on `type` in %s", (file) => {
        const src = readFileSync(file, "utf8");

        expect(src).not.toMatch(/\btype:\s*"(sticky|connector)"/);
    });

    // `shape` is ambiguous — BOTH packages have one, and `ComponentDemo.tsx`
    // imports both. So this fires only where slides is not in play. A file
    // using both models cannot be judged by a source scan, and pretending
    // otherwise would mean either a false failure or a silent exemption.
    const whiteboardOnly = whiteboardFiles().filter(
        (f) => !readFileSync(f, "utf8").includes("@particle-academy/fancy-slides"),
    );

    it.each(whiteboardOnly)("never keys a shape on `type` in %s", (file) => {
        expect(readFileSync(file, "utf8")).not.toMatch(/\btype:\s*"shape"/);
    });

    it("still keys fancy-slides elements on `type`", () => {
        // The counter-check. Slides elements are a different model, and a
        // careless sweep of "type -> kind" across the docs would break them
        // while making the assertion above pass.
        const slides = resolve(DOCS, "showcase-fixtures.tsx");
        const src = readFileSync(slides, "utf8");

        expect(src).toMatch(/\btype:\s*"shape"/);
        expect(src).not.toMatch(/@particle-academy\/fancy-whiteboard/);
    });
});
