import { describe, expect, it } from "vitest";
import { clip, pad, stripAnsi, width, wrap } from "../../resources/js/Pages/FancyTui/docs-tui/ansi";
import {
    buildCatalogue,
    initialState,
    type CapturedFrame,
    type DocsState,
    type RegistryItem,
} from "../../resources/js/Pages/FancyTui/docs-tui/model";
import {
    buildFrameIndex,
    detailLines,
    findFrame,
    render,
    renderLoading,
    windowFor,
    type Size,
} from "../../resources/js/Pages/FancyTui/docs-tui/render";

const SIZE: Size = { cols: 100, rows: 30 };

const items: RegistryItem[] = [
    {
        name: "tui-status-bar",
        title: "StatusBar",
        description: "A persistent footer bar for a terminal app.",
        package: "fancy-tui",
        type: "registry:ui",
        dependencies: ["ink"],
        registryDependencies: ["tui-box"],
        files: [{ path: "components/tui/StatusBar.tsx" }],
        href: "/packages/fancy-tui",
    },
    {
        name: "accordion",
        title: "Accordion",
        description: "Accordion from react-fancy.",
        package: "react-fancy",
        type: "registry:ui",
        dependencies: ["lucide-react"],
        registryDependencies: [],
        files: [{ path: "components/fancy/accordion/Accordion.tsx" }],
        href: "/packages/react-fancy/accordion",
    },
];

const frames: CapturedFrame[] = [
    {
        slug: "status-bar",
        name: "StatusBar",
        group: "Layout",
        source: "<StatusBar left=\"3 workers\" right=\"queue healthy\" />",
        frame: "3 workers\x1b[2m                    queue healthy\x1b[0m",
    },
];

const cat = buildCatalogue(items);
const index = buildFrameIndex(frames);
// fancy-tui and react-fancy both have 1 item; ties sort by name, so fancy-tui
// is index 0 and react-fancy index 1.
const tuiState: DocsState = { ...initialState, pane: "detail", packageIndex: 0 };
const webState: DocsState = { ...initialState, pane: "detail", packageIndex: 1 };

const lines = (output: string) => stripAnsi(output).split("\r\n");

describe("ansi helpers", () => {
    it("measures visible width, ignoring escapes", () => {
        expect(width("\x1b[1mhello\x1b[0m")).toBe(5);
        expect(stripAnsi("\x1b[2mdim\x1b[0m")).toBe("dim");
    });

    it("clips to visible columns and keeps escapes intact", () => {
        expect(clip("abcdef", 4)).toBe("abc…");
        expect(clip("abc", 10)).toBe("abc");
        expect(clip("x", 0)).toBe("");
        const clipped = clip("\x1b[1mabcdef\x1b[0m", 4);
        expect(stripAnsi(clipped)).toBe("abc…");
        // A clipped styled string must close its own styling.
        expect(clipped.endsWith("\x1b[0m")).toBe(true);
    });

    it("pads to an exact visible width", () => {
        expect(pad("ab", 5)).toBe("ab   ");
        expect(width(pad("\x1b[1mab\x1b[0m", 5))).toBe(5);
        expect(width(pad("abcdefgh", 5))).toBe(5);
    });

    it("wraps on word boundaries and hard-breaks long words", () => {
        expect(wrap("one two three", 7)).toEqual(["one two", "three"]);
        expect(wrap("aaaaaaaaaa", 4)).toEqual(["aaaa", "aaaa", "aa"]);
        expect(wrap("anything", 0)).toEqual([]);
    });
});

describe("windowFor", () => {
    it("keeps the index inside the window and never runs past the list", () => {
        expect(windowFor(0, 10, 4)).toEqual({ start: 0, end: 4 });
        expect(windowFor(9, 10, 4)).toEqual({ start: 6, end: 10 });
        expect(windowFor(5, 10, 4)).toEqual({ start: 3, end: 7 });
        expect(windowFor(0, 2, 10)).toEqual({ start: 0, end: 2 });
        expect(windowFor(0, 0, 5)).toEqual({ start: 0, end: 0 });
    });
});

describe("frame lookup", () => {
    it("matches a registry name against a kebab-case frame slug", () => {
        expect(findFrame(index, items[0])?.slug).toBe("status-bar");
    });

    it("never offers a frame for a non-fancy-tui component", () => {
        expect(findFrame(index, items[1])).toBeNull();
        expect(findFrame(index, null)).toBeNull();
    });

    it("falls back gracefully when fancy-tui ships no frame for an entry", () => {
        const missing = { ...items[0], name: "tui-nonexistent", title: "Nonexistent" };
        expect(findFrame(index, missing)).toBeNull();
    });
});

describe("render — frame shape", () => {
    it("emits exactly `rows` lines, none wider than `cols`", () => {
        const output = render(cat, initialState, index, SIZE);
        const rows = lines(output);
        expect(rows).toHaveLength(SIZE.rows);
        for (const row of rows) {
            expect(row.length).toBeLessThanOrEqual(SIZE.cols);
        }
    });

    it("pads the last line to full width so no frame is a prefix of another", () => {
        // <Terminal> appends when the new output EXTENDS the old, which would
        // corrupt a repaint. Growing the query must not produce an extension.
        const a = render(cat, { ...initialState, searching: true, search: "a" }, index, SIZE);
        const b = render(cat, { ...initialState, searching: true, search: "ab" }, index, SIZE);
        expect(b.startsWith(a)).toBe(false);
        expect(a.startsWith(b)).toBe(false);
        expect(stripAnsi(lines(a)[SIZE.rows - 1]).length).toBe(SIZE.cols);
    });

    it("lays out to whatever size it is given, including a tiny terminal", () => {
        for (const size of [{ cols: 40, rows: 12 }, { cols: 200, rows: 60 }, { cols: 20, rows: 5 }]) {
            const rows = lines(render(cat, initialState, index, size));
            expect(rows).toHaveLength(size.rows);
            expect(Math.max(...rows.map((r) => r.length))).toBeLessThanOrEqual(Math.max(20, size.cols));
        }
    });
});

describe("render — the browser", () => {
    it("lists packages with their component counts and the header totals", () => {
        const text = stripAnsi(render(cat, initialState, index, SIZE));
        expect(text).toContain("PACKAGES");
        expect(text).toContain("COMPONENTS");
        expect(text).toContain("fancy-tui");
        expect(text).toContain("react-fancy");
        expect(text).toContain("2 components");
        expect(text).toContain("2 packages");
    });

    it("leaves room for the selection gutter so the highlighted row isn't clipped", () => {
        // The "▸ " marker costs two columns; a row built to the full pane width
        // pushes its own count off the end and gets ellipsized instead.
        const row = lines(render(cat, initialState, index, SIZE)).find((line) => line.includes("▸ fancy-tui"));
        expect(row).toBeDefined();
        expect(row).not.toContain("…");
        expect(row).toMatch(/fancy-tui\s+1\s/);
    });

    it("shows the key legend on every screen", () => {
        for (const state of [initialState, { ...initialState, pane: "components" as const }, tuiState]) {
            expect(stripAnsi(render(cat, state, index, SIZE))).toContain("q quit");
        }
    });

    it("shows the live query while searching", () => {
        const text = stripAnsi(render(cat, { ...initialState, searching: true, search: "sta" }, index, SIZE));
        expect(text).toContain("/sta");
    });

    it("says so when the filter matches nothing", () => {
        const text = stripAnsi(render(cat, { ...initialState, search: "zzzz" }, index, SIZE));
        expect(text).toContain("nothing matches");
    });

    it("collapses to one pane on a narrow terminal", () => {
        const narrow = stripAnsi(render(cat, initialState, index, { cols: 40, rows: 20 }));
        expect(narrow).toContain("PACKAGES");
        expect(narrow).not.toContain("COMPONENTS");
    });
});

describe("render — the detail view", () => {
    it("renders the captured frame inline for a fancy-tui component", () => {
        const text = stripAnsi(render(cat, tuiState, index, SIZE));
        expect(text).toContain("StatusBar");
        expect(text).toContain("live preview");
        expect(text).toContain("queue healthy"); // straight out of the captured frame
        expect(text).toContain("<StatusBar"); // …and its source snippet
        expect(text).not.toContain("press o");
    });

    it("offers the web docs instead of a preview for every other package", () => {
        const text = stripAnsi(render(cat, webState, index, SIZE));
        expect(text).toContain("Accordion");
        expect(text).toContain("press o");
        expect(text).toContain("/packages/react-fancy/accordion");
        expect(text).toContain("renders in a browser");
        expect(text).not.toContain("live preview");
    });

    it("lists description, dependencies and files", () => {
        const text = stripAnsi(detailLines(items[0], findFrame(index, items[0]), 80).join("\n"));
        expect(text).toContain("A persistent footer bar");
        expect(text).toContain("DEPENDENCIES");
        expect(text).toContain("ink");
        expect(text).toContain("REGISTRY DEPS");
        expect(text).toContain("FILES");
        expect(text).toContain("components/tui/StatusBar.tsx");
    });

    it("says so when an item has no web page at all", () => {
        const orphan: RegistryItem = { ...items[1], href: null };
        const text = stripAnsi(detailLines(orphan, null, 80).join("\n"));
        expect(text).toContain("No web page");
        expect(text).not.toContain("press o");
    });

    it("scrolls, and shows a position indicator when the body overflows", () => {
        const small: Size = { cols: 80, rows: 12 };
        const top = stripAnsi(render(cat, tuiState, index, small));
        expect(top).toMatch(/\d+\/\d+ lines/);
        const scrolled = stripAnsi(render(cat, { ...tuiState, detailOffset: 4 }, index, small));
        expect(scrolled).not.toBe(top);
    });

    it("clamps an over-scrolled offset instead of rendering an empty page", () => {
        const text = stripAnsi(render(cat, { ...tuiState, detailOffset: 9_999 }, index, SIZE));
        expect(text.trim()).not.toBe("");
        expect(text).toContain("StatusBar");
    });

    it("survives an empty catalogue", () => {
        const empty = buildCatalogue([]);
        const text = stripAnsi(render(empty, { ...initialState, pane: "detail" }, index, SIZE));
        expect(text).toContain("Nothing selected");
    });
});

describe("renderLoading", () => {
    it("shows a loading state, then the error when the fetch fails", () => {
        expect(stripAnsi(renderLoading(SIZE))).toContain("Loading the Fancy registry");
        expect(stripAnsi(renderLoading(SIZE, "HTTP 500"))).toContain("HTTP 500");
        expect(lines(renderLoading(SIZE))).toHaveLength(SIZE.rows);
    });
});
