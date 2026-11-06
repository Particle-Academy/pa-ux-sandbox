/** @vitest-environment jsdom */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { SITE_TOUR_SEEN_KEY, SiteWalkthrough } from "../../resources/js/components/SiteWalkthrough";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/*
 * On a first visit the consent banner and the site tour both appear, and the
 * tour's spotlight covers the whole viewport: a mouse user could not reach
 * Reject all until they had dismissed a tour they never asked for (found by the
 * headless page check, 2026-11-05). Layout holds the tour while the banner is
 * up; it opens once the person has decided.
 */
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const settle = () =>
    act(async () => {
        await frame();
        await frame();
    });
const tourCard = () => document.querySelector("[data-walkthrough-card]");

afterEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
});

describe("the site tour while consent is undecided", () => {
    it("waits for the consent decision, then opens", async () => {
        const host = document.createElement("div");
        document.body.append(host);
        const root = createRoot(host);

        await act(async () => root.render(<SiteWalkthrough holdAutoStart>{null}</SiteWalkthrough>));
        await settle();
        expect(tourCard()).toBeNull();
        expect(localStorage.getItem(SITE_TOUR_SEEN_KEY)).toBeNull();

        await act(async () => root.render(<SiteWalkthrough holdAutoStart={false}>{null}</SiteWalkthrough>));
        await settle();
        expect(tourCard()).not.toBeNull();

        act(() => root.unmount());
    });
});
