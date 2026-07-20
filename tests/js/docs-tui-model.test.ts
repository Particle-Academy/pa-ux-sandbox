import { describe, expect, it } from "vitest";
import {
    buildCatalogue,
    componentHref,
    decodeKey,
    initialState,
    reduce,
    selectedComponent,
    visibleComponents,
    type Catalogue,
    type DocsState,
    type Key,
    type RegistryItem,
} from "../../resources/js/Pages/FancyTui/docs-tui/model";

const item = (name: string, pkg: string, extra: Partial<RegistryItem> = {}): RegistryItem => ({
    name,
    title: name.replace(/^tui-/, "").replace(/-/g, " "),
    description: `${name} from ${pkg}`,
    package: pkg,
    type: "registry:ui",
    href: `/packages/${pkg}`,
    ...extra,
});

const items: RegistryItem[] = [
    item("tui-box", "fancy-tui"),
    item("tui-status-bar", "fancy-tui"),
    item("tui-accordion", "fancy-tui"),
    item("accordion", "react-fancy", { href: "/packages/react-fancy/accordion" }),
    item("button", "react-fancy", { href: "/packages/react-fancy/button" }),
    item("orphan", "no-pages", { href: null }),
];

const cat = buildCatalogue(items);

/** Feed a sequence of keys through the reducer, returning the last reduction. */
const play = (keys: Key[], from: DocsState = initialState) =>
    keys.reduce<{ state: DocsState; quit?: boolean; open?: string }>(
        (acc, key) => {
            const next = reduce(cat, acc.state, key);
            return { ...next, state: next.state };
        },
        { state: from },
    );

const char = (value: string): Key => ({ type: "char", value });

describe("buildCatalogue", () => {
    it("groups items by package, largest first", () => {
        expect(cat.packages.map((p) => [p.name, p.count])).toEqual([
            ["fancy-tui", 3],
            ["react-fancy", 2],
            ["no-pages", 1],
        ]);
    });

    it("sorts each package's components by name", () => {
        expect(cat.byPackage.get("fancy-tui")?.map((i) => i.name)).toEqual([
            "tui-accordion",
            "tui-box",
            "tui-status-bar",
        ]);
    });

    it("handles an empty registry", () => {
        const empty = buildCatalogue([]);
        expect(empty.packages).toEqual([]);
        expect(selectedComponent(empty, initialState)).toBeNull();
    });
});

describe("visibleComponents", () => {
    it("returns the selected package's components unfiltered", () => {
        expect(visibleComponents(cat, initialState)).toHaveLength(3);
    });

    it("filters by name", () => {
        const state = { ...initialState, search: "status" };
        expect(visibleComponents(cat, state).map((i) => i.name)).toEqual(["tui-status-bar"]);
    });

    it("filters by title as well as name", () => {
        // "box" appears in the title "box" AND the name "tui-box"; "accordion"
        // proves a title-only-ish match still lands.
        const state = { ...initialState, search: "ACCORD" };
        expect(visibleComponents(cat, state).map((i) => i.name)).toEqual(["tui-accordion"]);
    });

    it("returns nothing when the query matches nothing", () => {
        expect(visibleComponents(cat, { ...initialState, search: "zzzz" })).toEqual([]);
    });

    it("scopes the search to the selected package", () => {
        const state = { ...initialState, packageIndex: 1, search: "button" };
        expect(visibleComponents(cat, state).map((i) => i.name)).toEqual(["button"]);
        expect(visibleComponents(cat, { ...state, packageIndex: 0 })).toEqual([]);
    });
});

describe("decodeKey", () => {
    it("decodes arrows, paging, enter, escape and backspace", () => {
        expect(decodeKey("\x1b[A")).toEqual({ type: "up" });
        expect(decodeKey("\x1b[B")).toEqual({ type: "down" });
        expect(decodeKey("\x1b[C")).toEqual({ type: "right" });
        expect(decodeKey("\x1b[D")).toEqual({ type: "left" });
        expect(decodeKey("\x1b[5~")).toEqual({ type: "pageUp" });
        expect(decodeKey("\x1b[6~")).toEqual({ type: "pageDown" });
        expect(decodeKey("\r")).toEqual({ type: "enter" });
        expect(decodeKey("\n")).toEqual({ type: "enter" });
        expect(decodeKey("\x1b")).toEqual({ type: "escape" });
        expect(decodeKey("\x7f")).toEqual({ type: "backspace" });
    });

    it("decodes printable characters", () => {
        expect(decodeKey("q")).toEqual({ type: "char", value: "q" });
        expect(decodeKey(" ")).toEqual({ type: "char", value: " " });
        expect(decodeKey("/")).toEqual({ type: "char", value: "/" });
    });

    it("ignores unrecognised escape sequences rather than typing garbage", () => {
        expect(decodeKey("\x1b[1;5C")).toBeNull();
        expect(decodeKey("\x1bOP")).toBeNull();
        expect(decodeKey("\x01")).toBeNull();
    });
});

describe("reduce — navigation", () => {
    it("moves down and up the package list, clamped at both ends", () => {
        const down = play([{ type: "down" }]);
        expect(down.state.packageIndex).toBe(1);

        const clampedTop = play([{ type: "up" }]);
        expect(clampedTop.state.packageIndex).toBe(0);

        const clampedBottom = play([{ type: "down" }, { type: "down" }, { type: "down" }, { type: "down" }]);
        expect(clampedBottom.state.packageIndex).toBe(cat.packages.length - 1);
    });

    it("treats j/k as down/up", () => {
        expect(play([char("j")]).state.packageIndex).toBe(1);
        expect(play([char("j"), char("j"), char("k")]).state.packageIndex).toBe(1);
    });

    it("descends packages → components → detail with → and enter", () => {
        expect(play([{ type: "right" }]).state.pane).toBe("components");
        expect(play([{ type: "right" }, { type: "enter" }]).state.pane).toBe("detail");
        // Detail is the deepest pane — enter there is a no-op.
        expect(play([{ type: "right" }, { type: "enter" }, { type: "enter" }]).state.pane).toBe("detail");
    });

    it("climbs back with ← and clears the search on the way out of components", () => {
        const deep = play([{ type: "right" }, char("/"), char("b"), { type: "enter" }, { type: "right" }]);
        expect(deep.state.pane).toBe("detail");
        expect(deep.state.search).toBe("b");

        const up = play([{ type: "left" }], deep.state);
        expect(up.state.pane).toBe("components");

        const root = play([{ type: "left" }], up.state);
        expect(root.state.pane).toBe("packages");
        expect(root.state.search).toBe("");
    });

    it("quits on escape at the root but not deeper", () => {
        expect(play([{ type: "escape" }]).quit).toBe(true);
        expect(play([{ type: "right" }, { type: "escape" }]).quit).toBeUndefined();
    });

    it("resets the component index when the package changes", () => {
        const state = { ...initialState, componentIndex: 2 };
        expect(reduce(cat, state, { type: "down" }).state.componentIndex).toBe(0);
    });

    it("clamps the component index to the visible list", () => {
        const state: DocsState = { ...initialState, pane: "components" };
        const bottom = play([{ type: "down" }, { type: "down" }, { type: "down" }, { type: "down" }], state);
        expect(bottom.state.componentIndex).toBe(2);
    });

    it("scrolls the detail view and never scrolls above the top", () => {
        const detail: DocsState = { ...initialState, pane: "detail" };
        expect(play([{ type: "down" }], detail).state.detailOffset).toBe(1);
        expect(play([{ type: "up" }], detail).state.detailOffset).toBe(0);
        expect(play([{ type: "pageDown" }], detail).state.detailOffset).toBe(10);
        expect(play([{ type: "pageDown" }, { type: "pageUp" }, { type: "pageUp" }], detail).state.detailOffset).toBe(0);
    });
});

describe("reduce — search", () => {
    it("enters search mode on / and types into the query", () => {
        const searching = play([char("/"), char("b"), char("o")]);
        expect(searching.state.searching).toBe(true);
        expect(searching.state.search).toBe("bo");
    });

    it("types q instead of quitting while searching", () => {
        const searching = play([char("/"), char("q")]);
        expect(searching.quit).toBeUndefined();
        expect(searching.state.search).toBe("q");
        expect(searching.state.searching).toBe(true);
    });

    it("does not open a URL when o is typed into the query", () => {
        expect(play([char("/"), char("o")]).open).toBeUndefined();
    });

    it("backspaces, and stays put on an empty query", () => {
        expect(play([char("/"), char("a"), char("b"), { type: "backspace" }]).state.search).toBe("a");
        expect(play([char("/"), { type: "backspace" }]).state.search).toBe("");
    });

    it("commits the query on enter, keeping the filter", () => {
        const committed = play([char("/"), char("b"), { type: "enter" }]);
        expect(committed.state.searching).toBe(false);
        expect(committed.state.search).toBe("b");
        expect(committed.state.componentIndex).toBe(0);
    });

    it("abandons the query on escape", () => {
        const abandoned = play([char("/"), char("b"), { type: "escape" }]);
        expect(abandoned.state.searching).toBe(false);
        expect(abandoned.state.search).toBe("");
    });

    it("swallows arrow keys while searching", () => {
        const searching = play([char("/"), { type: "down" }]);
        expect(searching.state.packageIndex).toBe(0);
        expect(searching.state.searching).toBe(true);
    });
});

describe("reduce — effects", () => {
    it("quits on q", () => {
        expect(play([char("q")]).quit).toBe(true);
    });

    it("opens the selected component's server-resolved href on o", () => {
        expect(play([char("o")]).open).toBe("/packages/fancy-tui");
        expect(play([{ type: "down" }, char("o")]).open).toBe("/packages/react-fancy/accordion");
    });

    it("opens nothing when the item has no web page", () => {
        const orphan = play([{ type: "down" }, { type: "down" }, char("o")]);
        expect(orphan.state.packageIndex).toBe(2);
        expect(orphan.open).toBeUndefined();
    });

    it("ignores unmapped characters", () => {
        expect(play([char("z")]).state).toEqual(initialState);
    });
});

describe("componentHref", () => {
    it("returns the server-resolved href, never a guessed one", () => {
        expect(componentHref(item("accordion", "react-fancy", { href: "/packages/react-fancy/accordion" })))
            .toBe("/packages/react-fancy/accordion");
        expect(componentHref(item("nope", "nope", { href: null }))).toBeNull();
        expect(componentHref({ name: "x", package: "y" } as RegistryItem)).toBeNull();
    });
});

describe("selectedComponent", () => {
    it("tracks the component index within the filtered list", () => {
        const state: Catalogue extends never ? never : DocsState = {
            ...initialState,
            search: "tui",
            componentIndex: 1,
        };
        expect(selectedComponent(cat, state)?.name).toBe("tui-box");
    });

    it("is null when the filter empties the list", () => {
        expect(selectedComponent(cat, { ...initialState, search: "zzz" })).toBeNull();
    });
});
