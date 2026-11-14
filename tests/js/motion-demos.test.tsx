// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleTimeline, toCss } from "@particle-academy/fancy-motion";
import {
    DOCK_TIMELINE,
    MotionDockDemo,
    MotionMicrositeDemo,
    SITE_TIMELINE,
} from "../../resources/js/Pages/Packages/MotionDemos";

/**
 * The fancy-motion component pages: MotionStage's preview is a small microsite
 * whose sections reveal as they scroll into view inside a fixed-height box, and
 * TimelineDock's preview drives a real animated stage beside the dock.
 *
 * Both used to be one card on a blank panel. The stage one needed the whole
 * page to scroll a `frames x 100vh` spacer, which is what left a tall empty
 * column; the dock one had no `onScrub`, so its Play button was disabled and
 * nothing on the page moved.
 */

let host: HTMLDivElement;
let root: Root;
let errors: unknown[][];
let reduced = false;

beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    errors = [];
    reduced = false;
    vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
        errors.push(args);
    });
    vi.stubGlobal("matchMedia", (query: string) => ({
        matches: reduced && query.includes("prefers-reduced-motion: reduce"),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        onchange: null,
        dispatchEvent: () => false,
    }));
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
});

afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

/** Give jsdom (which lays nothing out) the scroll geometry of a real box. */
function scrollTo(el: HTMLElement, top: number, scrollHeight = 2000, clientHeight = 400): void {
    Object.defineProperty(el, "scrollHeight", { configurable: true, value: scrollHeight });
    Object.defineProperty(el, "clientHeight", { configurable: true, value: clientHeight });
    el.scrollTop = top;
    act(() => {
        el.dispatchEvent(new Event("scroll"));
    });
}

describe("MotionStage preview: a scrolling microsite", () => {
    it("is a hero, content sections and a footer CTA inside one fixed-height scroll box", () => {
        act(() => root.render(<MotionMicrositeDemo />));

        const scroller = host.querySelector<HTMLElement>("[data-motion-site-scroller]");
        expect(scroller).not.toBeNull();
        expect(scroller!.className).toMatch(/overflow-y-auto/);
        expect(scroller!.className).toMatch(/\bh-\[/);

        expect(scroller!.querySelector("[data-motion-site-section='hero'] h1")).not.toBeNull();
        expect(scroller!.querySelectorAll("[data-motion-site-section]").length).toBeGreaterThanOrEqual(5);
        expect(scroller!.querySelector("[data-motion-site-section='cta'] button")).not.toBeNull();
        expect(errors).toEqual([]);
    });

    it("reveals each section through fancy-motion's Reveal", () => {
        act(() => root.render(<MotionMicrositeDemo />));

        const sections = host.querySelectorAll("[data-motion-site-section]");
        for (const section of Array.from(sections)) {
            expect(section.querySelector("[data-fancy-reveal]"), section.getAttribute("data-motion-site-section")!).not.toBeNull();
        }
    });

    it("plays the timeline engine from the box's own scroll, not the window's", () => {
        act(() => root.render(<MotionMicrositeDemo />));
        const scroller = host.querySelector<HTMLElement>("[data-motion-site-scroller]")!;
        const mark = host.querySelector<HTMLElement>("[data-motion='mark']")!;

        scrollTo(scroller, 800); // 800 / (2000 - 400) = 0.5
        expect(host.querySelector("[data-motion-site]")!.getAttribute("data-progress")).toBe("0.50");
        expect(mark.style.transform).toBe(toCss(sampleTimeline(SITE_TIMELINE, 0.5).mark).transform);

        scrollTo(scroller, 1600);
        expect(mark.style.transform).toBe(toCss(sampleTimeline(SITE_TIMELINE, 1).mark).transform);
        expect(mark.style.transform).not.toBe(toCss(sampleTimeline(SITE_TIMELINE, 0.5).mark).transform);
    });

    it("jump links scroll the box, not the page", () => {
        act(() => root.render(<MotionMicrositeDemo />));
        const scroller = host.querySelector<HTMLElement>("[data-motion-site-scroller]")!;
        const boxScroll = vi.fn();
        scroller.scrollTo = boxScroll as unknown as typeof scroller.scrollTo;
        const pageScroll = vi.fn();
        vi.stubGlobal("scrollTo", pageScroll);

        const roasts = Array.from(host.querySelectorAll("button")).find((b) => b.textContent === "Roasts" && !scroller.contains(b))!;
        act(() => roasts.click());

        expect(boxScroll).toHaveBeenCalledTimes(1);
        expect(pageScroll).not.toHaveBeenCalled();
    });

    it("shows everything, unmoved, to someone who asked for reduced motion", () => {
        reduced = true;
        act(() => root.render(<MotionMicrositeDemo />));
        const scroller = host.querySelector<HTMLElement>("[data-motion-site-scroller]")!;

        scrollTo(scroller, 800);
        for (const reveal of Array.from(host.querySelectorAll("[data-fancy-reveal]"))) {
            expect(reveal.getAttribute("data-in-view")).toBe("true");
        }
        expect(host.querySelector<HTMLElement>("[data-motion='mark']")!.style.transform).toBe("");
    });
});

describe("TimelineDock preview: the dock drives a stage", () => {
    const node = (id: string) => host.querySelector<HTMLElement>(`[data-dock-stage] [data-motion='${id}']`)!;
    const expected = (id: string, p: number) => toCss(sampleTimeline(DOCK_TIMELINE, p)[id]).transform;

    it("renders the stage at the playhead's frame", () => {
        act(() => root.render(<MotionDockDemo />));

        expect(host.querySelector("[data-fancy-motion-dock]")).not.toBeNull();
        const p = Number(host.querySelector("[data-dock-stage]")!.getAttribute("data-progress"));
        expect(node("headline").style.transform).toBe(expected("headline", p));
        expect(errors).toEqual([]);
    });

    it("is a MotionStage on the dock's playhead, not a hand-sampled box", () => {
        act(() => root.render(<MotionDockDemo />));

        const stage = host.querySelector<HTMLElement>("[data-dock-stage] [data-fancy-motion-stage]");
        expect(stage).not.toBeNull();
        // Host-owned playhead: MotionStage reports the same progress and renders no spacer.
        expect(stage!.getAttribute("data-progress")).toBe(host.querySelector("[data-dock-stage]")!.getAttribute("data-progress"));
        expect(stage!.querySelector("[data-motion='headline']")).toBe(node("headline"));
    });

    it("scrubbing moves the stage frame by frame", () => {
        act(() => root.render(<MotionDockDemo />));
        const track = host.querySelector<HTMLElement>("[data-fmo-track]")!;

        act(() => {
            track.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
        });
        expect(node("headline").style.transform).toBe(expected("headline", 0));

        act(() => {
            track.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
        });
        expect(node("headline").style.transform).toBe(expected("headline", 0.02));
    });

    it("Play animates the stage", () => {
        vi.useFakeTimers();
        act(() => root.render(<MotionDockDemo />));
        const track = host.querySelector<HTMLElement>("[data-fmo-track]")!;
        act(() => {
            track.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
        });
        const before = node("cta").style.transform;

        const play = Array.from(host.querySelectorAll("button")).find((b) => b.textContent?.includes("Play"))!;
        expect(play.disabled).toBe(false);
        act(() => {
            play.click();
        });
        act(() => {
            vi.advanceTimersByTime(1800); // 1800 / 2400ms: past k2, where the CTA starts to grow
        });

        const p = Number(host.querySelector("[data-dock-stage]")!.getAttribute("data-progress"));
        expect(p).toBeGreaterThan(0);
        expect(node("cta").style.transform).not.toBe(before);
        // data-progress is rounded to 2dp, so compare the sampled scale, not the string.
        const scale = (t: string) => Number(/scale\(([\d.]+)\)/.exec(t)![1]);
        expect(scale(node("cta").style.transform)).toBeCloseTo(scale(expected("cta", p)), 1);
        expect(scale(node("cta").style.transform)).toBeGreaterThan(0.4);
    });

    it("selecting a keyframe jumps the playhead to it", () => {
        act(() => root.render(<MotionDockDemo />));
        const last = DOCK_TIMELINE.keyframes[DOCK_TIMELINE.keyframes.length - 1];

        act(() => {
            host.querySelector<HTMLButtonElement>(`[data-fmo-keyframe='${last.id}']`)!.click();
        });
        expect(host.querySelector("[data-dock-stage]")!.getAttribute("data-progress")).toBe(last.at.toFixed(2));
        expect(node("headline").style.transform).toBe(expected("headline", last.at));
    });
});
