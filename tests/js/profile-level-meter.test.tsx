// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Progress } from "@particle-academy/react-fancy";

/**
 * The profile level meter, rendered.
 *
 * `tests/Feature/GamifiedSurfaceAccessibilityTest.php` asserts that
 * `Pages/Profile/Show.tsx` USES `<Progress>` — it cannot assert more, because
 * `phpunit.xml` sets `INERTIA_SSR_ENABLED=false` and a PHP feature test
 * receives an empty `<div id="app">`. That leaves the half that actually
 * matters unverified: whether the swap put real semantics on the page.
 *
 * So this covers the contract the profile page now DEPENDS ON — that the kit's
 * `Progress` exposes `role="progressbar"` with a correct `aria-valuenow` for
 * the props the meter passes. If a react-fancy upgrade changed or dropped that
 * ARIA, the profile's level meter would silently go back to being an
 * unlabelled graphic and nothing else in this repo would notice. That is the
 * "wired to nothing" failure shape, one dependency bump away.
 *
 * It deliberately does NOT mount `ProfileShow` itself — that would mean
 * standing up Inertia's `usePage`, the Layout chrome and the whole prop tree to
 * assert one attribute, and the mock would end up agreeing with whatever we
 * wrote.
 */

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
});

afterEach(() => {
    act(() => root.unmount());
    host.remove();
});

/** Mirrors the call in `Pages/Profile/Show.tsx`. */
function renderMeter(progress: number) {
    act(() => {
        root.render(
            <Progress value={Math.min(100, progress)} max={100} color="indigo" size="md" />,
        );
    });

    return host.querySelector('[role="progressbar"]');
}

describe("profile level meter", () => {
    it("exposes the meter to assistive tech as a progressbar", () => {
        const bar = renderMeter(42);

        // The old markup was `<div class="pf-bar"><span style="width:42%" /></div>`
        // — a div with a coloured child, and nothing an assistive technology
        // could read.
        expect(bar).not.toBeNull();
        expect(bar!.getAttribute("aria-valuemin")).toBe("0");
        expect(bar!.getAttribute("aria-valuemax")).toBe("100");
    });

    it("announces the percentage the bar actually draws", () => {
        const bar = renderMeter(42);

        // The value and the fill must agree. `progress` arrives from the server
        // ALREADY as a percentage measured from the current level's floor
        // (MetricLevelGroupService::getProgressPercentage), which is why it is
        // passed as value-out-of-100 rather than as `totalXp` out of
        // `nextThreshold` — those look interchangeable and are not.
        expect(bar!.getAttribute("aria-valuenow")).toBe("42");

        const fill = bar!.querySelector<HTMLElement>(":scope > div > div");
        expect(fill?.style.width).toBe("42%");
    });

    it("clamps a full meter instead of overflowing it", () => {
        // `getProgressPercentage` returns exactly 100.0 at max tier, but the
        // page clamps anyway; a value above max would otherwise announce a
        // percentage the bar cannot draw.
        const bar = renderMeter(140);

        expect(bar!.getAttribute("aria-valuenow")).toBe("100");
        expect(bar!.querySelector<HTMLElement>(":scope > div > div")?.style.width).toBe("100%");
    });
});
