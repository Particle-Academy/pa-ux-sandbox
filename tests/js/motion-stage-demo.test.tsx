// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ComponentDemo } from "../../resources/js/Pages/Packages/ComponentDemo";
import { getComponentPreview } from "../../resources/js/Pages/Packages/ComponentPreviews";

/**
 * The fancy-motion MotionStage example must actually animate.
 *
 * It shipped rendering a card that never moved, with a clean console: the card
 * was tagged `data-motion` while MotionStage tweens `[data-cms]` unless told
 * otherwise, both keyframes carried empty snapshots, and the stage sat in a
 * clipped box that broke its sticky pin. Nothing errors in any of those cases,
 * which is why the only honest check is the one a viewer makes: scroll, and see
 * whether the card's transform changes.
 *
 * jsdom has no layout, so the stage's geometry is simulated: the spacer reports
 * a height, and its top edge moves up as the page "scrolls".
 */

const STAGE_HEIGHT = 2000;
let scrolled = 0;
let frames: FrameRequestCallback[] = [];
let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
    scrolled = 0;
    // Queue frames and flush them explicitly, like a browser would: running the
    // callback inside requestAnimationFrame lets the stage record a frame id
    // after the frame already ran, and every later scroll is then dropped.
    frames = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
        frames.push(cb);
        return frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
        return this.hasAttribute("data-fancy-motion-stage") ? STAGE_HEIGHT : 0;
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
        const top = this.hasAttribute("data-fancy-motion-stage") ? -scrolled : 0;
        return { top, left: 0, right: 0, bottom: top, width: 0, height: 0, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
    });
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
});

afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

/** Scroll to playhead `p` (0..1) and return the moving card's inline transform. */
function transformAt(p: number): string {
    scrolled = p * (STAGE_HEIGHT - window.innerHeight);
    act(() => {
        window.dispatchEvent(new Event("scroll"));
        const pending = frames;
        frames = [];
        pending.forEach((cb) => cb(0));
    });
    const card = host.querySelector<HTMLElement>('[data-motion="card"]');
    expect(card, "the example renders a card for the stage to move").not.toBeNull();
    return card!.style.transform;
}

function expectItAnimates() {
    const start = transformAt(0);
    const middle = transformAt(0.5);
    const end = transformAt(1);
    // An untouched element keeps an empty transform: that was the bug.
    expect(start).not.toBe("");
    expect(end).not.toBe("");
    expect(new Set([start, middle, end]).size).toBe(3);
}

describe("fancy-motion MotionStage example", () => {
    it("the package-grid tile moves its card as the playhead scrubs", () => {
        const preview = getComponentPreview("fancy-motion", "motion-stage");
        expect(preview).not.toBeNull();
        act(() => root.render(createElement(() => preview!())));
        expectItAnimates();
    });

    it("the component page demo moves its card as the playhead scrubs", () => {
        act(() => root.render(createElement(ComponentDemo, { pkg: "fancy-motion", slug: "motion-stage", name: "MotionStage" })));
        expectItAnimates();
    });

    it("the component page demo does not clip the stage, which would break its sticky pin", () => {
        act(() => root.render(createElement(ComponentDemo, { pkg: "fancy-motion", slug: "motion-stage", name: "MotionStage" })));
        const stage = host.querySelector("[data-fancy-motion-stage]");
        expect(stage).not.toBeNull();
        for (let el = stage!.parentElement; el && el !== host; el = el.parentElement) {
            expect(el.className, "an ancestor of the stage clips it").not.toMatch(/\boverflow-(hidden|auto|scroll|clip)\b/);
        }
    });
});
