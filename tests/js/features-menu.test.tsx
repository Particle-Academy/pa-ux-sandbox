// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const visit = vi.fn();
vi.mock("@inertiajs/react", () => ({ router: { visit: (href: string) => visit(href) } }));

import { FeaturesMenu } from "../../resources/js/Pages/Features/shared/FeaturesMenu";
import type { FeatureNav } from "../../resources/js/Pages/Features/shared/types";

/**
 * The header's Features dropdown: a wide panel holding the Features in a
 * react-fancy Grid (1 / 2 / 4 columns), with "All features" as the footer row,
 * still driven by the Dropdown's own keyboard handling in reading order.
 */

const FEATURES: FeatureNav[] = Array.from({ length: 10 }, (_, i) => ({
    slug: `f${i}`,
    name: `Feature ${i}`,
    tagline: `Tagline ${i}`,
    icon: "box",
    href: `/features/f${i}`,
}));

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
    visit.mockClear();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
});

afterEach(() => {
    act(() => root.unmount());
    host.remove();
});

async function openMenu() {
    await act(async () => {
        root.render(<FeaturesMenu features={FEATURES} active={false} />);
    });
    const trigger = host.querySelector<HTMLButtonElement>("[data-co-handle=nav-features]")!;
    await act(async () => trigger.click());
    return { trigger, menu: document.querySelector<HTMLElement>("[role=menu]")! };
}

const items = (menu: HTMLElement) => [...menu.querySelectorAll<HTMLElement>("[role=menuitem]")];

describe("the Features menu", () => {
    it("lays every Feature out in a react-fancy Grid, icon, title and tagline in each cell", async () => {
        const { menu } = await openMenu();
        expect(menu.classList.contains("features-menu")).toBe(true);
        const grid = menu.querySelector<HTMLElement>("[data-features-grid]")!;
        expect(grid.hasAttribute("data-react-fancy-grid")).toBe(true);
        expect(grid.getAttribute("role")).toBe("none");
        expect(grid.style.getPropertyValue("--fancy-grid-cols")).toBe("4");
        const cells = [...grid.querySelectorAll<HTMLElement>("[data-feature-item]")];
        expect(cells.map((c) => c.dataset.featureItem)).toEqual(FEATURES.map((f) => f.slug));
        for (const cell of cells) {
            expect(cell.querySelector(".features-menu__icon")).not.toBeNull();
            expect(cell.querySelector(".features-menu__name")?.textContent).toMatch(/^Feature \d$/);
            expect(cell.querySelector(".features-menu__tagline")?.textContent).toMatch(/^Tagline \d$/);
        }
    });

    it("keeps All features as the footer row, outside the grid and last in the menu", async () => {
        const { menu } = await openMenu();
        const all = items(menu).at(-1)!;
        expect(all.textContent).toBe("All features");
        expect(all.closest("[data-features-grid]")).toBeNull();
        expect(all.classList.contains("features-menu__footer")).toBe(true);
        await act(async () => all.click());
        expect(visit).toHaveBeenCalledWith("/features");
    });

    it("walks the items in reading order with the arrow keys, wrapping, then Escape returns focus to the trigger", async () => {
        const { trigger, menu } = await openMenu();
        const all = items(menu);
        expect(all).toHaveLength(FEATURES.length + 1);
        const key = (k: string) => act(async () => menu.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true })));
        await key("ArrowDown");
        expect(document.activeElement).toBe(all[0]);
        await key("ArrowDown");
        expect(document.activeElement).toBe(all[1]);
        await key("End");
        expect(document.activeElement?.textContent).toBe("All features");
        await key("ArrowDown");
        expect(document.activeElement).toBe(all[0]);
        await act(async () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
        expect(document.activeElement).toBe(trigger);
    });

    it("sizes the panel wide but inside the viewport, at 1 / 2 / 4 columns", () => {
        const css = readFileSync(resolve(__dirname, "../../resources/css/showcase/features.css"), "utf8");
        expect(css).toMatch(/\.features-menu \{ width: min\(1040px, calc\(100vw - 24px\)\)/);
        expect(css).toMatch(/\.features-menu__grid \{ --fancy-grid-cols: 1 !important;/);
        expect(css).toMatch(/@media \(min-width: 768px\) \{ \.features-menu__grid \{ --fancy-grid-cols: 2 !important; \} \}/);
        expect(css).toMatch(/@media \(min-width: 1024px\) \{ \.features-menu__grid \{ --fancy-grid-cols: 4 !important; \} \}/);
    });
});
