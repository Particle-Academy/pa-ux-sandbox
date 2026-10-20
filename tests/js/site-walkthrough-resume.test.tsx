/** @vitest-environment jsdom */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { SiteWalkthrough } from "../../resources/js/components/SiteWalkthrough";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/*
 * fancy-walkthrough 0.3 saves an in-progress tour and restores it on mount. The
 * site's first-visit auto-start ran one frame later and called `start()`, which
 * put a visitor who reloaded mid-tour back on step 1 -- the resume the package
 * had just done, undone by its own showcase.
 */
const PROGRESS_KEY = "fancy-walkthrough";

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

afterEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
});

async function mountTour() {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(<SiteWalkthrough>{null}</SiteWalkthrough>));
    await act(async () => {
        await frame();
        await frame();
    });
    return { host, unmount: () => act(() => root.unmount()) };
}

describe("the site tour across a reload", () => {
    it("resumes at the saved step instead of restarting", async () => {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify({ walkthrough: "site-tour", step: "docs", index: 1 }));

        const { unmount } = await mountTour();

        expect(JSON.parse(localStorage.getItem(PROGRESS_KEY)!)).toMatchObject({ walkthrough: "site-tour", step: "docs" });
        unmount();
    });

    it("still starts on a first visit", async () => {
        const { host, unmount } = await mountTour();

        expect(document.querySelector('[data-walkthrough-card="welcome"]') ?? host.querySelector("[data-walkthrough-card]")).not.toBeNull();
        unmount();
    });
});
