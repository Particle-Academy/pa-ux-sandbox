import { describe, expect, it } from "vitest";
import {
    reduce,
    initialState,
    visibleFamilies,
    selectedComponent,
    componentHref,
    type DocsState,
} from "../../tui-service/src/model";
import { decodeKey } from "../../tui-service/src/keys";
import { sanitizeState, sanitizeSize } from "../../tui-service/src/state";
import type { Catalogue, CatalogueComponent } from "../../tui-service/src/catalogue";

/**
 * The docs TUI render service's pure logic — the reducer, the key decoder, and
 * the untrusted-input sanitiser. Everything the server relies on that does not
 * need Ink or a network.
 */

function component(over: Partial<CatalogueComponent> & { name: string }): CatalogueComponent {
    return {
        title: over.name,
        package: "fancy-tui",
        description: "",
        family: "fancy-tui",
        familyName: "fancy-tui",
        group: "terminal",
        url: `/r/${over.name}.json`,
        previewable: false,
        previewFrame: null,
        previewSource: null,
        ...over,
    };
}

function catalogue(): Catalogue {
    const tui = {
        slug: "fancy-tui",
        name: "fancy-tui",
        group: "terminal",
        components: [
            component({ name: "badge", title: "Badge", previewable: true, previewFrame: "▮", previewSource: "<Badge/>" }),
            component({ name: "panel", title: "Panel", previewable: true, previewFrame: "▭", previewSource: "<Panel/>" }),
        ],
    };
    const core = {
        slug: "fancy-core",
        name: "Fancy Core",
        group: "core",
        components: [component({ name: "button", title: "Button", package: "react-fancy", family: "fancy-core", familyName: "Fancy Core", group: "core" })],
    };
    return {
        themes: [
            { group: "terminal", families: [tui] },
            { group: "core", families: [core] },
        ],
        families: [tui, core],
        total: 3,
        previewableCount: 2,
    };
}

describe("key decoding", () => {
    it.each([
        ["\x1b[A", "up"],
        ["\x1b[B", "down"],
        ["\r", "enter"],
        ["\n", "enter"],
        ["\x1b", "escape"],
        ["\x7f", "backspace"],
    ])("decodes %j to %s", (data, type) => {
        expect(decodeKey(data)?.type).toBe(type);
    });

    it("treats a printable byte as a char and ignores unknown escapes", () => {
        expect(decodeKey("/")).toEqual({ type: "char", value: "/" });
        expect(decodeKey("\x1b[Z")).toBeNull();
    });
});

describe("navigation", () => {
    it("walks home → family → detail and back", () => {
        const cat = catalogue();
        let s: DocsState = initialState;

        s = reduce(cat, s, { type: "enter" }).state;
        expect(s.pane).toBe("family");
        s = reduce(cat, s, { type: "enter" }).state;
        expect(s.pane).toBe("detail");
        s = reduce(cat, s, { type: "escape" }).state;
        expect(s.pane).toBe("family");
        s = reduce(cat, s, { type: "escape" }).state;
        expect(s.pane).toBe("home");
    });

    it("quits on escape at the root and on q anywhere outside search", () => {
        const cat = catalogue();
        expect(reduce(cat, initialState, { type: "escape" }).effects).toEqual([{ type: "quit" }]);
        expect(reduce(cat, initialState, { type: "char", value: "q" }).effects).toEqual([{ type: "quit" }]);
    });

    it("clamps selection at the list edges", () => {
        const cat = catalogue();
        // Up at the top of home stays put; down past the end stops at the last.
        expect(reduce(cat, initialState, { type: "up" }).state.familyIndex).toBe(0);
        let s = { ...initialState, familyIndex: 1 };
        s = reduce(cat, s, { type: "down" }).state;
        expect(s.familyIndex).toBe(1);
    });
});

describe("search", () => {
    it("swallows q while typing so it does not quit mid-query", () => {
        const cat = catalogue();
        let s = reduce(cat, initialState, { type: "char", value: "/" }).state;
        expect(s.searching).toBe(true);
        const r = reduce(cat, s, { type: "char", value: "q" });
        expect(r.effects).toEqual([]);
        expect(r.state.search).toBe("q");
    });

    it("narrows families to those with a matching component", () => {
        const cat = catalogue();
        const s: DocsState = { ...initialState, search: "badge" };
        const families = visibleFamilies(cat, s);
        expect(families).toHaveLength(1);
        expect(families[0].components.map((c) => c.name)).toEqual(["badge"]);
    });
});

describe("open effect", () => {
    it("emits an open effect for the selected component's family page", () => {
        const cat = catalogue();
        const s: DocsState = { ...initialState, pane: "detail" };
        const r = reduce(cat, s, { type: "char", value: "o" });
        expect(r.effects).toEqual([{ type: "open", url: "/packages/family/fancy-tui" }]);
        expect(componentHref(selectedComponent(cat, s)!)).toBe("/packages/family/fancy-tui");
    });
});

describe("sanitising untrusted state", () => {
    it("coerces a garbage payload to the home screen", () => {
        const s = sanitizeState({ pane: "HACK", familyIndex: "NaN", componentIndex: -5, search: 12345 });
        expect(s.pane).toBe("home");
        expect(s.familyIndex).toBe(0);
        expect(s.componentIndex).toBe(0);
        expect(s.search).toBe("");
    });

    it("caps the search length so a megabyte string can't arrive", () => {
        const s = sanitizeState({ pane: "home", search: "x".repeat(10_000) });
        expect(s.search.length).toBe(100);
    });

    it("clamps the terminal size to something renderable", () => {
        expect(sanitizeSize(5, 4)).toEqual({ cols: 20, rows: 8 });
        expect(sanitizeSize(9999, 9999)).toEqual({ cols: 400, rows: 200 });
        expect(sanitizeSize("junk", undefined)).toEqual({ cols: 100, rows: 32 });
    });
});
