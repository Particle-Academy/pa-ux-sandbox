import { useEffect, useLayoutEffect, useRef, useState } from "react";

export const USAGE = `import { TourBeacon } from "@particle-academy/react-fancy";

<TourBeacon
  steps={[
    { selector: "[data-tour='new']",     title: "Start here",  body: "Click + to create a project." },
    { selector: "[data-tour='search']",  title: "Find anything", body: "Cmd-K opens global search." },
    { selector: "[data-tour='profile']", title: "Your profile", body: "Finish your profile from here." },
  ]}
  onDone={() => markTourComplete()}
/>`;

/**
 * TourBeacon — pulsing dot anchored to a target element. Click the dot
 * or its coachmark to advance. Keyboard: → next, ← prev, Esc dismiss.
 * The beacon auto-positions above its target and stays glued during
 * scroll/resize via a single rAF loop.
 */
type Step = {
  selector: string;
  title: string;
  body: string;
};

function TourBeacon({
  steps,
  active,
  onAdvance,
  onPrev,
  onDismiss,
}: {
  steps: Step[];
  active: number;
  onAdvance: () => void;
  onPrev: () => void;
  onDismiss: () => void;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = steps[active];

  useLayoutEffect(() => {
    if (!step) return;
    let raf = 0;
    const tick = () => {
      const el = document.querySelector(step.selector);
      if (el) setRect(el.getBoundingClientRect());
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onAdvance();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onAdvance, onPrev, onDismiss]);

  if (!step || !rect) return null;
  const top = rect.top + window.scrollY + rect.height / 2;
  const left = rect.right + window.scrollX + 8;

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <button
        onClick={onAdvance}
        className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500 p-1 shadow-lg shadow-violet-500/40 transition hover:scale-110"
        style={{ top, left }}
        aria-label="Continue tour"
      >
        <span className="block h-2.5 w-2.5 animate-ping rounded-full bg-violet-300" />
        <span className="absolute inset-1 rounded-full bg-violet-500" />
      </button>
      <div
        className="pointer-events-auto absolute w-64 rounded-lg border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        style={{ top: top - 8, left: left + 16 }}
      >
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-medium uppercase tracking-wider text-violet-500">
            Step {active + 1} of {steps.length}
          </div>
          <button
            onClick={onDismiss}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>
        <div className="mt-1 text-sm font-semibold">{step.title}</div>
        <p className="mt-0.5 text-[12px] text-zinc-500">{step.body}</p>
        <div className="mt-2 flex justify-between text-[11px]">
          <button
            onClick={onPrev}
            disabled={active === 0}
            className="rounded px-2 py-0.5 text-zinc-500 disabled:opacity-40 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ← prev
          </button>
          <button
            onClick={onAdvance}
            className="rounded-md bg-violet-600 px-2.5 py-0.5 font-medium text-white"
          >
            {active === steps.length - 1 ? "done" : "next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

const TOUR: Step[] = [
  {
    selector: "[data-tour='new']",
    title: "Start here",
    body: "Click + to spin up a new project. Templates are one click away.",
  },
  {
    selector: "[data-tour='search']",
    title: "Find anything",
    body: "Cmd-K opens the global search — works across boards, people, tickets.",
  },
  {
    selector: "[data-tour='profile']",
    title: "Your profile",
    body: "Finish your profile from here. It only takes a minute.",
  },
];

export function TourBeaconDemo() {
  const [active, setActive] = useState(0);
  const [running, setRunning] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 text-sm">
          <button
            data-tour="new"
            className="rounded-md bg-violet-600 px-3 py-1 text-xs font-medium text-white"
          >
            + New
          </button>
          <input
            data-tour="search"
            placeholder="Search… (Cmd-K)"
            className="rounded-md border border-zinc-200 bg-transparent px-2 py-1 text-xs outline-none dark:border-zinc-700"
          />
        </div>
        <button
          data-tour="profile"
          className="grid h-7 w-7 place-items-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
        >
          GW
        </button>
      </div>

      <button
        onClick={() => {
          setActive(0);
          setRunning(true);
        }}
        className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
      >
        {running ? "Tour running…" : "Start product tour"}
      </button>
      <p className="text-[11px] text-zinc-500">
        Keyboard: <kbd className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">→</kbd> next /{" "}
        <kbd className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">←</kbd> prev /{" "}
        <kbd className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">Esc</kbd> dismiss.
      </p>

      {running && (
        <TourBeacon
          steps={TOUR}
          active={active}
          onAdvance={() => {
            if (active === TOUR.length - 1) setRunning(false);
            else setActive((i) => i + 1);
          }}
          onPrev={() => setActive((i) => Math.max(0, i - 1))}
          onDismiss={() => setRunning(false)}
        />
      )}
    </div>
  );
}
