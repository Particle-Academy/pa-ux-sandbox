// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The showcase's theme control is the one place a visitor can reach "follow my
 * OS", so it is worth a test of its own even though the mechanics live in
 * react-fancy.
 *
 * The bug this guards against is not a crash — it is a two-state toggle. With
 * only light and dark, one click pinned a visitor to a manual choice forever and
 * "system" became unreachable, which meant the showcase demonstrated a theming
 * story the kit could tell but the site could not.
 */

type Listener = (event: { matches: boolean }) => void;
let osPrefersDark = false;
const listeners = new Set<Listener>();

beforeEach(() => {
    osPrefersDark = false;
    listeners.clear();
    window.localStorage.clear();
    document.documentElement.className = "";

    window.matchMedia = ((query: string) => ({
        media: query,
        get matches() {
            return query.includes("dark") ? osPrefersDark : false;
        },
        addEventListener: (_: string, listener: Listener) => listeners.add(listener),
        removeEventListener: (_: string, listener: Listener) => listeners.delete(listener),
        addListener: (listener: Listener) => listeners.add(listener),
        removeListener: (listener: Listener) => listeners.delete(listener),
        dispatchEvent: () => true,
        onchange: null,
    })) as unknown as typeof window.matchMedia;
});

async function loadTheme() {
    // Imported fresh per test: the module applies the theme on import, which is
    // the app's actual bootstrap and therefore part of what is under test.
    vi.resetModules();
    return await import("../../resources/js/showcase-theme");
}

describe("showcase theme control", () => {
    it("always changes what is on screen when leaving system", async () => {
        const { cycleTheme } = await loadTheme();

        // Nothing stored, so the resting state is "system", resolving to light
        // because the stubbed OS prefers light. Stepping to "light" here would
        // repaint nothing and read as a dead button.
        expect(cycleTheme()).toBe("dark");
        expect(cycleTheme()).toBe("light");
        expect(cycleTheme()).toBe("system");
    });

    it("hands control back to the OS, rather than storing a third value", async () => {
        const { cycleTheme } = await loadTheme();

        cycleTheme(); // dark
        cycleTheme(); // light
        expect(window.localStorage.getItem("fancy-ui.theme")).toBe("light");

        cycleTheme(); // system

        // "System" is the ABSENCE of a stored choice. Storing the string
        // "system" would work too, right up until you want the OS to speak for
        // a visitor who has never touched the control -- which is the default
        // case, and the one the old two-state toggle got wrong.
        expect(window.localStorage.getItem("fancy-ui.theme")).toBeNull();
    });

    it("applies each choice to the document as it goes", async () => {
        const { cycleTheme } = await loadTheme();

        cycleTheme(); // dark, opposite the stubbed OS
        expect(document.documentElement.classList.contains("dark")).toBe(true);

        cycleTheme(); // light
        expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
});
