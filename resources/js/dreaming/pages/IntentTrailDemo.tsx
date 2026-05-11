import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Intent Trail — cross-surface activity visualization for
 * agent-integrations.
 *
 * Every bridge tool call drops a colored dot on the surface that was
 * touched. Dots fade over ~30s. The "trail" is the spatial sequence —
 * the human can see at a glance: "the agent visited sheet, then form,
 * then jumped back to the whiteboard." Hovering reveals what happened.
 *
 * Designed to overlay any fancy-screens / fancy-flow / fancy-sheets
 * surface. The host attaches an `Anchor` ref to each surface; the
 * presence registry feeds activity events; the trail renders an absolute-
 * positioned SVG layer above the surface grid.
 */
type Surface = "whiteboard" | "form" | "sheet" | "code" | "chart";

type Hit = {
  id: string;
  agent: { name: string; color: string };
  surface: Surface;
  /** 0..1 within the surface tile. */
  px: number;
  py: number;
  tool: string;
  at: number;
};

const AGENTS = [
  { name: "Planner", color: "#a855f7" },
  { name: "Scribe", color: "#10b981" },
  { name: "Forecaster", color: "#3b82f6" },
  { name: "Auditor", color: "#f59e0b" },
];

const SURFACES: Array<{ id: Surface; label: string }> = [
  { id: "whiteboard", label: "Whiteboard" },
  { id: "form", label: "Form" },
  { id: "sheet", label: "Sheet" },
  { id: "code", label: "Code" },
  { id: "chart", label: "Chart" },
];

const TOOL_BY_SURFACE: Record<Surface, string[]> = {
  whiteboard: ["whiteboard_add_sticky", "whiteboard_move_item", "whiteboard_connect"],
  form: ["form_set_value", "form_focus", "form_submit"],
  sheet: ["sheet_set_cell", "sheet_set_range", "sheet_add_sheet"],
  code: ["code_set_value", "code_stream_append", "code_replace_selection"],
  chart: ["chart_update_data", "chart_set_option"],
};

const TRAIL_TTL = 30_000;

export function IntentTrailDemo() {
  const [hits, setHits] = useState<Hit[]>([]);
  const [auto, setAuto] = useState(true);
  const [hover, setHover] = useState<Hit | null>(null);
  const [agentFilter, setAgentFilter] = useState<string>("");
  const nextId = useRef(0);

  const pushHit = useCallback((surface?: Surface, agentIdx?: number) => {
    const s = surface ?? SURFACES[Math.floor(Math.random() * SURFACES.length)].id;
    const a = AGENTS[agentIdx ?? Math.floor(Math.random() * AGENTS.length)];
    const tools = TOOL_BY_SURFACE[s];
    setHits((cur) => [
      ...cur,
      {
        id: `h-${nextId.current++}`,
        agent: a,
        surface: s,
        px: 0.1 + Math.random() * 0.8,
        py: 0.15 + Math.random() * 0.7,
        tool: tools[Math.floor(Math.random() * tools.length)],
        at: Date.now(),
      },
    ]);
  }, []);

  // Auto-tick: synthetic agent activity every ~900ms.
  useEffect(() => {
    if (!auto) return;
    const t = window.setInterval(() => pushHit(), 900);
    return () => window.clearInterval(t);
  }, [auto, pushHit]);

  // Garbage-collect old hits.
  useEffect(() => {
    const t = window.setInterval(() => {
      const cutoff = Date.now() - TRAIL_TTL;
      setHits((cur) => cur.filter((h) => h.at >= cutoff));
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  const visibleHits = useMemo(
    () => (agentFilter ? hits.filter((h) => h.agent.name === agentFilter) : hits),
    [hits, agentFilter],
  );

  const hitsBySurface = useMemo(() => {
    const map = new Map<Surface, Hit[]>();
    for (const h of visibleHits) {
      const arr = map.get(h.surface) ?? [];
      arr.push(h);
      map.set(h.surface, arr);
    }
    return map;
  }, [visibleHits]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Intent Trail</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Each agent tool-call drops a colored dot on the surface it touched.
          Dots fade over {TRAIL_TTL / 1000}s. Hover a dot to inspect the call;
          filter by agent to isolate one trail.
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={auto}
            onChange={(e) => setAuto(e.target.checked)}
          />
          Auto-tick (synthetic agents)
        </label>
        <button
          onClick={() => pushHit()}
          className="rounded-md bg-violet-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-700"
        >
          + random hit
        </button>
        <button
          onClick={() => setHits([])}
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          clear
        </button>

        <span className="mx-2 text-xs text-zinc-400">filter:</span>
        <button
          onClick={() => setAgentFilter("")}
          className={`rounded-full px-2 py-0.5 text-[11px] ${
            agentFilter === ""
              ? "bg-zinc-200 dark:bg-zinc-700"
              : "border border-zinc-300 dark:border-zinc-700"
          }`}
        >
          all
        </button>
        {AGENTS.map((a) => (
          <button
            key={a.name}
            onClick={() => setAgentFilter(a.name)}
            className="rounded-full px-2 py-0.5 text-[11px] font-medium transition"
            style={{
              backgroundColor:
                agentFilter === a.name ? a.color + "33" : a.color + "14",
              color: a.color,
              border:
                agentFilter === a.name
                  ? `1px solid ${a.color}`
                  : "1px solid transparent",
            }}
          >
            {a.name}
          </button>
        ))}

        <span className="ml-auto text-[11px] text-zinc-500">
          {visibleHits.length} hit(s)
        </span>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SURFACES.map((s) => (
          <SurfaceTile
            key={s.id}
            id={s.id}
            label={s.label}
            hits={hitsBySurface.get(s.id) ?? []}
            onHover={setHover}
            onHit={(surface) => pushHit(surface)}
          />
        ))}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 text-sm font-medium">Hover detail</div>
        {hover ? (
          <div className="font-mono text-[12px]">
            <div>
              <span
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: hover.agent.color + "22",
                  color: hover.agent.color,
                }}
              >
                {hover.agent.name}
              </span>{" "}
              <span className="text-violet-700 dark:text-violet-300">
                {hover.tool}
              </span>{" "}
              <span className="text-zinc-400">→ {hover.surface}</span>
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-500">
              {((Date.now() - hover.at) / 1000).toFixed(1)}s ago
            </div>
          </div>
        ) : (
          <div className="text-[11px] italic text-zinc-400">
            Hover a dot to see which call landed there.
          </div>
        )}
      </section>
    </div>
  );
}

function SurfaceTile({
  id,
  label,
  hits,
  onHover,
  onHit,
}: {
  id: Surface;
  label: string;
  hits: Hit[];
  onHover: (h: Hit | null) => void;
  onHit: (id: Surface) => void;
}) {
  // Sort newest-last so newer dots render on top.
  const sorted = useMemo(() => [...hits].sort((a, b) => a.at - b.at), [hits]);
  return (
    <div
      onClick={() => onHit(id)}
      className="relative cursor-pointer overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
      style={{ aspectRatio: "16 / 10" }}
      title="Click to drop a hit here"
    >
      <div className="absolute left-2 top-1.5 z-10 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="absolute right-2 top-1.5 z-10 text-[10px] font-mono text-zinc-400">
        {hits.length}
      </div>
      <svg className="absolute inset-0 h-full w-full">
        {/* Polyline by agent: connect consecutive hits from the same agent. */}
        {connectByAgent(sorted).map((line, i) => (
          <polyline
            key={i}
            points={line.points}
            fill="none"
            stroke={line.color}
            strokeWidth={1}
            opacity={0.35}
            strokeDasharray="2 2"
          />
        ))}
        {sorted.map((h) => {
          const age = (Date.now() - h.at) / TRAIL_TTL;
          const opacity = Math.max(0, 1 - age);
          const r = 6 + (1 - age) * 4;
          return (
            <g
              key={h.id}
              onMouseEnter={(e) => {
                e.stopPropagation();
                onHover(h);
              }}
              onMouseLeave={() => onHover(null)}
            >
              <circle
                cx={`${h.px * 100}%`}
                cy={`${h.py * 100}%`}
                r={r * 1.6}
                fill={h.agent.color}
                opacity={opacity * 0.15}
              />
              <circle
                cx={`${h.px * 100}%`}
                cy={`${h.py * 100}%`}
                r={r}
                fill={h.agent.color}
                opacity={opacity}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function connectByAgent(hits: Hit[]): Array<{ color: string; points: string }> {
  const groups = new Map<string, Hit[]>();
  for (const h of hits) {
    const arr = groups.get(h.agent.name) ?? [];
    arr.push(h);
    groups.set(h.agent.name, arr);
  }
  const out: Array<{ color: string; points: string }> = [];
  for (const arr of groups.values()) {
    if (arr.length < 2) continue;
    const color = arr[0].agent.color;
    const points = arr
      .map((h) => `${(h.px * 100).toFixed(1)}%,${(h.py * 100).toFixed(1)}%`)
      .join(" ");
    out.push({ color, points });
  }
  return out;
}
