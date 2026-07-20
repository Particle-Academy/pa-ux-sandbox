// @vitest-environment jsdom

/**
 * Fancy Docs TUI — the React layer.
 *
 * `docs-tui-model` and `docs-tui-render` cover the pure functions; this covers
 * the part that isn't pure: the catalogue fetch, the ref-based reducer wiring
 * that keeps xterm's out-of-React keystrokes off a stale closure, the resize
 * handler, and the two side effects the reducer only *requests* (quit, open).
 *
 * `<Terminal>` is browser-only (xterm measures a real DOM), so it is mocked
 * down to what DocsTui actually uses of it: an `output` string in, `onData` /
 * `onResize` callbacks out, and a `focus()` handle. Assertions then read the
 * ANSI frame the component would have painted.
 */

import { act, cleanup, render as renderComponent, waitFor } from "@testing-library/react";
import { forwardRef, useImperativeHandle } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stripAnsi } from "../../resources/js/Pages/FancyTui/docs-tui/ansi";
import type { RegistryItem } from "../../resources/js/Pages/FancyTui/docs-tui/model";

type TerminalProps = {
    output: string;
    onData: (data: string) => void;
    onResize: (size: { cols: number; rows: number }) => void;
};

/** The last props `<Terminal>` was rendered with, plus whether it was focused. */
const terminal = {
    props: null as TerminalProps | null,
    focused: 0,
};

vi.mock("@particle-academy/fancy-term", () => ({
    Terminal: forwardRef<{ focus: () => void }, TerminalProps>(function MockTerminal(props, ref) {
        terminal.props = props;
        useImperativeHandle(ref, () => ({
            focus: () => {
                terminal.focused += 1;
            },
        }));
        return <div data-testid="terminal" />;
    }),
}));

const items: RegistryItem[] = [
    {
        name: "accordion",
        title: "Accordion",
        description: "Accordion from react-fancy.",
        package: "react-fancy",
        href: "/packages/react-fancy/accordion",
    },
    {
        name: "badge",
        title: "Badge",
        description: "Badge from react-fancy.",
        package: "react-fancy",
        href: null,
    },
    {
        name: "tui-status-bar",
        title: "StatusBar",
        description: "A persistent footer bar for a terminal app.",
        package: "fancy-tui",
        href: "/packages/fancy-tui",
    },
];

/** The frame the component last painted, with ANSI stripped. */
const frame = () => stripAnsi(terminal.props?.output ?? "");

/** Feed a keystroke the way xterm does — outside React's render cycle. */
const press = async (data: string) => {
    await act(async () => {
        terminal.props?.onData(data);
    });
};

const resize = async (cols: number, rows: number) => {
    await act(async () => {
        terminal.props?.onResize({ cols, rows });
    });
};

let fetchMock: ReturnType<typeof vi.fn>;

/** Mount and wait for the catalogue fetch to land. */
async function mount(onExit: () => void = () => {}) {
    const { default: DocsTui } = await import("../../resources/js/Pages/FancyTui/DocsTui");
    renderComponent(<DocsTui onExit={onExit} />);
    await waitFor(() => expect(frame()).toContain("PACKAGES"));
}

beforeEach(() => {
    terminal.props = null;
    terminal.focused = 0;
    fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ items }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("open", vi.fn());
});

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

describe("DocsTui", () => {
    it("shows the loading screen, then fetches and renders the catalogue", async () => {
        const { default: DocsTui } = await import("../../resources/js/Pages/FancyTui/DocsTui");
        renderComponent(<DocsTui onExit={() => {}} />);

        // First paint, before the fetch resolves.
        expect(frame()).toContain("Loading the Fancy registry");

        await waitFor(() => expect(frame()).toContain("PACKAGES"));

        expect(fetchMock).toHaveBeenCalledWith(
            "/fancy-tui/catalogue.json",
            expect.objectContaining({ headers: { Accept: "application/json" } }),
        );
        expect(frame()).toContain("react-fancy");
        expect(frame()).toContain("fancy-tui");
        expect(frame()).toContain("3 components");
    });

    it("renders the registry's failure instead of an empty browser", async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
        const { default: DocsTui } = await import("../../resources/js/Pages/FancyTui/DocsTui");
        renderComponent(<DocsTui onExit={() => {}} />);

        await waitFor(() => expect(frame()).toContain("Could not load the registry"));
        expect(frame()).toContain("HTTP 503");
    });

    it("opens on fancy-tui and focuses the terminal", async () => {
        await mount();

        // fancy-tui is not the first package (react-fancy has more entries), so
        // this only holds if the "open on fancy-tui" effect ran.
        expect(frame()).toContain("StatusBar");
        expect(frame()).not.toContain("Accordion");
        expect(terminal.focused).toBeGreaterThan(0);
    });

    it("advances state on keystrokes routed through onData", async () => {
        await mount();
        const before = frame();

        // Up, out of fancy-tui and into react-fancy: the components pane follows
        // the package selection.
        await press("\x1b[A");
        expect(frame()).not.toEqual(before);
        expect(frame()).toContain("Accordion");
        expect(frame()).not.toContain("StatusBar");

        // Two keystrokes in a row — the second one only lands correctly if the
        // reducer read the state the first one produced, not a stale closure.
        await press("\r"); // into the components pane
        await press("\r"); // into the detail pane
        expect(frame()).toContain("Accordion from react-fancy.");
        expect(frame()).toContain("press o");
    });

    it("filters the component list through search keystrokes", async () => {
        await mount();
        await press("\x1b[A"); // react-fancy
        await press("\r"); // components pane

        await press("/");
        for (const char of "badge") {
            await press(char);
        }

        expect(frame()).toContain("Badge");
        expect(frame()).not.toContain("Accordion");
    });

    it("re-renders at the size reported by onResize", async () => {
        await mount();
        await resize(120, 40);

        expect(frame().split("\r\n")).toHaveLength(40);
        // The chrome above the terminal reports the same size.
        expect(document.body.textContent).toContain("120×40");

        await resize(90, 24);
        expect(frame().split("\r\n")).toHaveLength(24);
        expect(document.body.textContent).toContain("90×24");
    });

    it("collapses to a single pane when the terminal is narrow", async () => {
        await mount();
        await resize(120, 30);
        expect(frame()).toContain("COMPONENTS");
        expect(frame()).toContain("│");

        // Below the 62-column threshold only the focused pane survives.
        await resize(40, 20);
        expect(frame()).toContain("PACKAGES");
        expect(frame()).not.toContain("COMPONENTS");
        expect(frame()).not.toContain("│");

        // …and moving into the components pane swaps which one is shown.
        await press("\r");
        expect(frame()).toContain("COMPONENTS");
        expect(frame()).not.toContain("PACKAGES");
    });

    it("calls onExit when the reducer asks to quit", async () => {
        const onExit = vi.fn();
        await mount(onExit);

        await press("q");
        expect(onExit).toHaveBeenCalledTimes(1);
    });

    it("opens the resolved href in a new tab, never as an opener", async () => {
        await mount();
        await press("\x1b[A"); // react-fancy
        await press("\r"); // components pane — Accordion selected

        await press("o");
        expect(window.open).toHaveBeenCalledWith(
            "/packages/react-fancy/accordion",
            "_blank",
            "noopener,noreferrer",
        );
    });

    it("does not open anything for an entry with no web page", async () => {
        await mount();
        await press("\x1b[A"); // react-fancy
        await press("\r"); // components pane
        await press("j"); // down to Badge, whose href is null

        await press("o");
        expect(window.open).not.toHaveBeenCalled();
    });

    it("takes the page over while mounted and releases it on exit", async () => {
        const { default: DocsTui } = await import("../../resources/js/Pages/FancyTui/DocsTui");
        const view = renderComponent(<DocsTui onExit={() => {}} />);
        await waitFor(() => expect(frame()).toContain("PACKAGES"));

        expect(document.body.classList.contains("ftui-takeover-active")).toBe(true);
        view.unmount();
        expect(document.body.classList.contains("ftui-takeover-active")).toBe(false);
    });
});
