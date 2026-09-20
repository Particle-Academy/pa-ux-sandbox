import { describe, expect, it } from "vitest";
import { DOCS } from "../../resources/js/Pages/Packages/ComponentDocs";

/**
 * Every documented component must actually have examples to show.
 *
 * `componentDoc()` picks its examples by FILTERING a shared list on display
 * NAME. A name that matches nothing yields an empty array — no error, no
 * warning, just a component page whose Examples tab renders the intro line and
 * nothing else.
 *
 * That is exactly how it broke: renaming one example from
 * "Field (custom input shell)" to "Field (wrapping another control)" emptied
 * the Field page, and every check stayed green — tsc is happy (both are
 * strings), the build is happy, the PHP suite cannot see React, and the page
 * still renders. It was caught by a human looking at it.
 *
 * So the string-keyed lookup gets the assertion the type system cannot give it.
 */
const ENTRIES = Object.entries(DOCS);

describe("component docs resolve the examples they name", () => {
    it("finds documented components to check", () => {
        // Without this, an import failure would make every case below vacuous.
        expect(ENTRIES.length).toBeGreaterThan(20);
    });

    it.each(ENTRIES)("%s has at least one example", (_key, doc) => {
        expect(Array.isArray(doc.examples)).toBe(true);
        expect(doc.examples.length).toBeGreaterThan(0);
    });
});
