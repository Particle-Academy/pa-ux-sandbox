import { useCallback, useEffect, useRef, useState } from "react";
import { Walkthrough, useWalkthrough } from "@particle-academy/fancy-walkthrough";
import type { WalkthroughEvent, WalkthroughStep } from "@particle-academy/fancy-walkthrough";
import type { ReactNode } from "react";

/**
 * The site's own guided tour — and the dogfood for `fancy-walkthrough`.
 *
 * A package the showcase merely INSTALLS is not dogfooded. The kit's whole
 * claim about this one is that a first-time visitor should be introduced to
 * the surface by the surface, so it has to be a thing a visitor actually
 * experiences: it runs on a first visit, and `Take the tour` re-runs it.
 *
 * `firstValue` is `packages`, not the last step. The activation this site
 * wants is someone reaching the package catalogue and understanding what is
 * in the kit; whether they then read three more cards is politeness. Watch
 * `walkthrough:first-value`, and watch `abandoned`'s step id for where people
 * stop.
 */
const SEEN_KEY = "fancy:site-tour:v1";

const STEPS: WalkthroughStep[] = [
    {
        id: "welcome",
        title: "Welcome to the Fancy UI Kit",
        // No package count here on purpose. The homepage derives its figure from
        // the live registry (`packages.length + companions.length`); typing one
        // into the tour would be a second copy that goes stale silently and
        // contradicts the page it is introducing.
        body:
            "A kit for building apps where humans and agents share the same screen. " +
            "Ninety seconds and you will know where everything lives. You can leave any time.",
    },
    {
        id: "docs",
        target: "nav-docs",
        title: "Docs",
        body: "Getting started, the component contract, and the guides. Start here if you are wiring the kit into an app.",
        placement: "bottom",
    },
    {
        id: "packages",
        target: "nav-packages",
        title: "Every package, grouped by what it does",
        body:
            "Components, engines, backends and tooling — each with install instructions and a live preview. " +
            "Roughly half the kit is headless, so this is the fastest way to see what is actually here.",
        placement: "bottom",
    },
    {
        id: "inspiration",
        target: "nav-inspiration",
        title: "Inspiration",
        body: "Sixty complete designs, every one built from these components. Steal the layout, keep your own brand.",
        placement: "bottom",
    },
    {
        id: "flow",
        target: "nav-flow",
        title: "Flow",
        body: "Build a workflow on a canvas and run it. The same graph runs on four runtimes — TypeScript, PHP, Python and Rust.",
        placement: "bottom",
    },
    {
        id: "search",
        target: "nav-search",
        title: "Jump anywhere",
        body: "Press ⌘K (Ctrl+K) from any page to search components, packages and docs without leaving the keyboard.",
        placement: "bottom",
    },
    {
        id: "cobrowse",
        target: "nav-cobrowse",
        title: "Bring an agent with you",
        body:
            "Co-browse hands an agent the same navigation you have — it drives this site through the components, " +
            "not by scraping the page. That is the Human+ idea the whole kit is built around.",
        placement: "bottom",
    },
    {
        id: "theme",
        target: "nav-theme",
        title: "Light, dark, or your system",
        body: "Every component ships both modes. Worth flipping now — it is the fastest way to judge a kit.",
        placement: "bottom",
    },
];

function TourRunner({ autoStart }: { autoStart: boolean }) {
    const { start } = useWalkthrough();

    // `start` is read through a ref and is NOT a dependency. Both halves matter:
    //
    //   - It cannot be a dep. `start` comes from the walkthrough's context
    //     value, memoised on the current step index, so its identity changes
    //     every time the tour advances. As a dep this effect re-ran on that
    //     change and called `start()` again, putting the tour back to step 1 --
    //     pressing Next appeared to do nothing, with no error anywhere.
    //
    //   - A `fired` ref guard is NOT the fix, and was my first attempt. Under
    //     StrictMode's double-invoke the first pass sets the guard and schedules
    //     the frame, the cleanup cancels it, and the second pass returns early:
    //     the tour then never starts at all. Depending only on `autoStart`
    //     leaves the effect idempotent, so a re-invoke re-schedules.
    const startRef = useRef(start);
    startRef.current = start;

    useEffect(() => {
        if (!autoStart) return;
        // One frame, so the nav has mounted and registered its targets. A step
        // whose target is missing would otherwise render centred and then jump.
        const id = window.requestAnimationFrame(() => startRef.current());
        return () => window.cancelAnimationFrame(id);
    }, [autoStart]);

    return null;
}

export function SiteWalkthrough({ children }: { children: ReactNode }) {
    const [autoStart, setAutoStart] = useState(false);

    // Read AFTER mount, never during render: the server has no localStorage, so
    // deciding this in the initial render would hydrate differently than it
    // rendered and React would discard the tree.
    useEffect(() => {
        try {
            if (window.localStorage.getItem(SEEN_KEY)) return;
            setAutoStart(true);
        } catch {
            // Private mode / storage disabled. Not running the tour is the right
            // failure: showing it on every page load would be worse than never.
        }
    }, []);

    const markSeen = useCallback(() => {
        try {
            window.localStorage.setItem(SEEN_KEY, new Date().toISOString());
        } catch {
            /* nothing to do — see above */
        }
    }, []);

    const onEvent = useCallback(
        (event: WalkthroughEvent) => {
            // Seen on ANY ending, including abandoned. A tour that reappears
            // because someone skipped it is the exact thing people hate about
            // tours.
            if (event.type === "walkthrough:completed" || event.type === "walkthrough:abandoned") {
                markSeen();
            }
        },
        [markSeen],
    );

    return (
        <Walkthrough id="site-tour" steps={STEPS} firstValue="packages" onEvent={onEvent}>
            <TourRunner autoStart={autoStart} />
            {children}
        </Walkthrough>
    );
}

/** The manual trigger, so the tour is re-runnable rather than a one-shot. */
export function TakeTheTourButton({ className }: { className?: string }) {
    const { start, step } = useWalkthrough();
    if (step !== null) return null;
    return (
        <button type="button" className={className} onClick={() => start()}>
            Take the tour
        </button>
    );
}
