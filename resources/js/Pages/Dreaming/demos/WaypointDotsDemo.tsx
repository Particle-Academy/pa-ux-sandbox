import { useEffect, useRef, useState } from "react";

export const USAGE = `import { WaypointDots } from "@particle-academy/react-fancy";

<div className="relative">
  <WaypointDots
    containerRef={scrollRef}
    waypoints={waypoints}                    // [{ id, at, tone, label }]
    onJump={(id) => scrollToWaypoint(id)}
  />
  <article ref={scrollRef} className="overflow-y-auto h-[60vh]">
    {/* content with [data-waypoint-id="…"] anchors */}
  </article>
</div>

// Bridge sketch:
// registerWaypointBridge(server, { adapter })
//   → waypoint_list()  waypoint_jump(id)  waypoint_pin({ at, tone, label })
`;

/**
 * WaypointDots — colored dots floating in the page margin marking
 * sections, errors, comments, agent-activity, anything. Each dot has a
 * scroll-fraction position (0–1) so the column doubles as a minimap.
 * Hover peeks the label; click jumps. Agents drop a waypoint at "where
 * I'm working" so humans can find them later.
 */
type Tone = "violet" | "emerald" | "amber" | "rose" | "sky";

const TONE: Record<Tone, string> = {
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
};

type Waypoint = {
  id: string;
  /** 0–1 position along the scroll range, or a selector resolved by the host. */
  at: number;
  tone: Tone;
  label: string;
};

function WaypointDots({
  waypoints,
  onJump,
  activeId,
}: {
  waypoints: Waypoint[];
  onJump: (id: string) => void;
  activeId?: string | null;
}) {
  return (
    <ol
      data-fancy="waypoint-dots"
      className="absolute right-1 top-0 z-10 flex h-full w-3 flex-col"
    >
      {waypoints.map((w) => (
        <li
          key={w.id}
          style={{ position: "absolute", top: `${w.at * 100}%` }}
          className="group -translate-y-1/2"
          data-waypoint-id={w.id}
        >
          <button
            onClick={() => onJump(w.id)}
            aria-label={w.label}
            className={`block h-2 w-2 rounded-full shadow ring-1 ring-white transition ${
              TONE[w.tone]
            } ${activeId === w.id ? "scale-150 ring-2 ring-zinc-900 dark:ring-zinc-100" : "hover:scale-150"}`}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100 dark:bg-zinc-100 dark:text-zinc-900">
            {w.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

const SECTIONS = [
  { id: "intro", title: "Introduction", tone: "violet" as Tone, body: "Para 1 of an article…" },
  { id: "h2-a", title: "First section", tone: "violet" as Tone, body: "Some content for section A. Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  { id: "err-1", title: "Build error here", tone: "rose" as Tone, body: "An error was reported around this paragraph by the linter at line 24." },
  { id: "h2-b", title: "Second section", tone: "violet" as Tone, body: "More content. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
  { id: "agent-1", title: "Agent edited a chart here", tone: "emerald" as Tone, body: "Claude inserted a chart with revenue trends." },
  { id: "h2-c", title: "Third section", tone: "violet" as Tone, body: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris." },
  { id: "comment-1", title: "Rita commented", tone: "amber" as Tone, body: "Rita: 'Should we cut this section?'" },
  { id: "h2-d", title: "Conclusion", tone: "violet" as Tone, body: "Duis aute irure dolor in reprehenderit in voluptate velit esse." },
];

export function WaypointDotsDemo() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);

  const waypoints: Waypoint[] = SECTIONS.map((s, i) => ({
    id: s.id,
    at: i / Math.max(1, SECTIONS.length - 1),
    tone: s.tone,
    label: s.title,
  }));

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const frac = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
      const nearest = waypoints.reduce((best, w) =>
        Math.abs(w.at - frac) < Math.abs(best.at - frac) ? w : best,
      );
      setActive(nearest.id);
    };
    onScroll();
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [waypoints]);

  const jump = (id: string) => {
    const idx = SECTIONS.findIndex((s) => s.id === id);
    const el = scrollRef.current;
    if (!el || idx < 0) return;
    const target = el.scrollHeight * (idx / Math.max(1, SECTIONS.length - 1));
    el.scrollTo({ top: target, behavior: "smooth" });
  };

  return (
    <div className="relative rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <WaypointDots waypoints={waypoints} onJump={jump} activeId={active} />
      <article
        ref={scrollRef}
        className="h-[60vh] overflow-y-auto px-6 py-4 pr-10 leading-relaxed"
      >
        {SECTIONS.map((s) => (
          <section key={s.id} data-waypoint-id={s.id} className="mb-8">
            <h3 className="mb-1 text-sm font-semibold">{s.title}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{s.body}</p>
            <p className="mt-2 text-sm text-zinc-500">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
              tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
              veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
              commodo consequat.
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
              dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
              proident.
            </p>
          </section>
        ))}
      </article>
    </div>
  );
}
