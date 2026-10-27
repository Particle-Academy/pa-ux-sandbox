/** @vitest-environment jsdom */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { SITE_TOUR_SEEN_KEY, SiteWalkthrough, isTourAutoStartRoute } from "../../resources/js/components/SiteWalkthrough";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/*
 * The first-visit tour opens a card over the page. On a Feature micro-site the
 * page IS a set of live demos, so a visitor who lands there first had to dismiss
 * the tour before they could click anything. It does not auto-start on the
 * Features area; it still does everywhere else, and the manual trigger is
 * untouched.
 */
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

afterEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
    window.history.replaceState(null, "", "/");
});

async function mountTourAt(path: string) {
    window.history.replaceState(null, "", path);
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(<SiteWalkthrough>{null}</SiteWalkthrough>));
    await act(async () => {
        await frame();
        await frame();
    });
    return { unmount: () => act(() => root.unmount()) };
}

const tourCard = () => document.querySelector("[data-walkthrough-card]");

describe("the site tour on the Features area", () => {
    it.each(["/features", "/features/", "/features/flow", "/features/3d?x=1"])("does not auto-start on %s", async (path) => {
        const { unmount } = await mountTourAt(path);

        expect(tourCard()).toBeNull();
        // Not marked seen either: the visitor never saw it, so it still runs on
        // their first visit to the rest of the site.
        expect(localStorage.getItem(SITE_TOUR_SEEN_KEY)).toBeNull();
        unmount();
    });

    it("still auto-starts on a first visit elsewhere", async () => {
        const { unmount } = await mountTourAt("/packages");

        expect(tourCard()).not.toBeNull();
        unmount();
    });

    it("matches the Features area only, not a route that merely starts with the word", () => {
        expect(isTourAutoStartRoute("/features")).toBe(false);
        expect(isTourAutoStartRoute("/features/git")).toBe(false);
        expect(isTourAutoStartRoute("/featuresque")).toBe(true);
        expect(isTourAutoStartRoute("/")).toBe(true);
        expect(isTourAutoStartRoute("/docs/features")).toBe(true);
    });
});
