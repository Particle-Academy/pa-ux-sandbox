import { useCallback, useMemo, useRef, useState } from "react";
import {
  Card,
  Action,
  Switch,
  Select,
  Badge,
  Tooltip,
} from "@particle-academy/react-fancy";

/**
 * Beadcrumb — react-fancy primitive for session history.
 *
 * Think breadcrumbs, but each crumb ("bead") is a labeled chip with a
 * miniature thumbnail and a timestamp, and the whole strip scrolls
 * horizontally. Beads represent meaningful steps in an exploration
 * or agent session: a query, a generated draft, a tool call, a
 * decision. The user can:
 *
 *   • click a bead to rewind to that point
 *   • shift-click a second bead to compare
 *   • right-click (here: ⌘-click) to fork — start a new trail from
 *     this bead while keeping the main strip intact
 *
 * Trails are rendered as parallel strips so divergent explorations
 * stay visually separate. A "back to head" button always returns to
 * the active trail's tip.
 *
 * Distinct from TimeScrubber (continuous timeline of one surface)
 * and WhatsNew (async inbox). Beadcrumb is the live, navigable
 * exploration history.
 */
type BeadKind = "query" | "answer" | "tool" | "decision";

type Bead = {
  id: string;
  trailId: string;
  at: number;
  kind: BeadKind;
  label: string;
  /** One-line blurb shown in the tooltip. */
  detail: string;
  /** Mini "thumbnail" — a 3-line text or a tiny ASCII chart. */
  thumb: string;
  by?: string;
};

const KIND_COLOR: Record<BeadKind, string> = {
  query: "#3b82f6",
  answer: "#a855f7",
  tool: "#10b981",
  decision: "#f59e0b",
};

const KIND_GLYPH: Record<BeadKind, string> = {
  query: "?",
  answer: "▶",
  tool: "⚙",
  decision: "★",
};

const NOW = Date.now();

const SEED: Bead[] = [
  {
    id: "b1",
    trailId: "main",
    at: NOW - 12 * 60_000,
    kind: "query",
    label: "Q3 forecast?",
    detail: "What's the Q3 ARR projection given yesterday's renewals?",
    thumb: "“Q3 ARR after renewals?”",
    by: "You",
  },
  {
    id: "b2",
    trailId: "main",
    at: NOW - 11 * 60_000,
    kind: "tool",
    label: "warehouse_query",
    detail: "Pulled expansion + renewal ARR from cohort table",
    thumb: "expansion: 29.4k\nrenewal: 104.3k\nnew: 18.9k",
    by: "Planner",
  },
  {
    id: "b3",
    trailId: "main",
    at: NOW - 10 * 60_000,
    kind: "answer",
    label: "draft v1",
    detail: "$1.22M projection (conservative, no expansion uplift)",
    thumb: "ARR ≈ $1.22M\nbasis: Q2 actuals",
    by: "Planner",
  },
  {
    id: "b4",
    trailId: "main",
    at: NOW - 8 * 60_000,
    kind: "decision",
    label: "stack renewals",
    detail: "Apply renewal-stacking + expansion uplift assumptions",
    thumb: "✓ apply renewals\n✓ expansion uplift",
    by: "You",
  },
  {
    id: "b5",
    trailId: "main",
    at: NOW - 5 * 60_000,
    kind: "answer",
    label: "draft v2",
    detail: "$1.40M with renewals stacked + 14% expansion",
    thumb: "ARR ≈ $1.40M\n+14% expansion",
    by: "Planner",
  },
  {
    id: "b6",
    trailId: "main",
    at: NOW - 90_000,
    kind: "tool",
    label: "risk_register_search",
    detail: "Found 2 red-flagged accounts (Globex, Hooli)",
    thumb: "red: 2\nGlobex, Hooli",
    by: "Auditor",
  },
  {
    id: "b7",
    trailId: "main",
    at: NOW - 60_000,
    kind: "answer",
    label: "draft v3",
    detail: "$1.40M with risk callouts and mitigation paths",
    thumb: "ARR ≈ $1.40M\nrisk: Globex/Hooli",
    by: "Planner",
  },
  // forked exploration
  {
    id: "b8",
    trailId: "what-if",
    at: NOW - 4 * 60_000,
    kind: "decision",
    label: "drop expansion",
    detail: "What if expansion uplift goes to 0?",
    thumb: "expansion=0",
    by: "You",
  },
  {
    id: "b9",
    trailId: "what-if",
    at: NOW - 3 * 60_000,
    kind: "answer",
    label: "what-if v1",
    detail: "$1.22M, matches the conservative baseline",
    thumb: "ARR ≈ $1.22M\nno expansion",
    by: "Planner",
  },
];

export function BeadcrumbDemo() {
  const [beads, setBeads] = useState<Bead[]>(SEED);
  const [active, setActive] = useState<string>("b7");
  const [compareWith, setCompareWith] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [trail, setTrail] = useState<string>("main");

  const trails = useMemo(() => {
    const t = new Map<string, Bead[]>();
    for (const b of beads) {
      const arr = t.get(b.trailId) ?? [];
      arr.push(b);
      t.set(b.trailId, arr);
    }
    return Array.from(t.entries()).map(([id, items]) => ({
      id,
      items: items.sort((a, b) => a.at - b.at),
    }));
  }, [beads]);

  const onBeadClick = useCallback(
    (b: Bead, e: React.MouseEvent) => {
      if (e.shiftKey) {
        setCompareWith((cur) => (cur === b.id ? null : b.id));
        return;
      }
      if (e.metaKey || e.ctrlKey) {
        // fork
        const newTrailId = `fork-${Date.now().toString(36)}`;
        setBeads((cur) => [
          ...cur,
          {
            id: `b-${Date.now().toString(36)}`,
            trailId: newTrailId,
            at: Date.now(),
            kind: "decision",
            label: `fork from ${b.label}`,
            detail: `New trail starting at ${b.label}.`,
            thumb: `forked from ${b.label}`,
            by: "You",
          },
        ]);
        setTrail(newTrailId);
        return;
      }
      setActive(b.id);
      setTrail(b.trailId);
    },
    [],
  );

  const head = trails.find((t) => t.id === trail)?.items.slice(-1)[0]?.id;
  const cmpA = beads.find((b) => b.id === active);
  const cmpB = compareWith ? beads.find((b) => b.id === compareWith) : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Beadcrumb</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Horizontal session history. Each bead is a step (query / tool /
          answer / decision) with a thumbnail. Click to rewind, shift-click to
          compare, ⌘/Ctrl-click to fork a new trail.
        </p>
      </header>

      <Card>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
          <Select
            label="Active trail"
            list={trails.map((t) => ({ value: t.id, label: t.id }))}
            value={trail}
            onValueChange={setTrail}
          />
          <div className="flex items-center gap-3 pt-5">
            <Switch checked={showLabels} onCheckedChange={setShowLabels} />
            <span className="text-sm text-zinc-700 dark:text-zinc-200">
              Show bead labels
            </span>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4">
            <Action
              size="sm"
              variant="outline"
              onClick={() => head && setActive(head)}
              disabled={!head || head === active}
            >
              ← back to head
            </Action>
            <Action
              size="sm"
              variant="outline"
              onClick={() => setCompareWith(null)}
              disabled={!compareWith}
            >
              clear compare
            </Action>
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-4 p-4">
          {trails.map((t) => (
            <BeadStrip
              key={t.id}
              trailId={t.id}
              beads={t.items}
              active={active}
              compareWith={compareWith}
              showLabels={showLabels}
              onBeadClick={onBeadClick}
              isActiveTrail={t.id === trail}
            />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <div className="p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <span>Active</span>
              {cmpA && (
                <Badge color="violet">{KIND_GLYPH[cmpA.kind]} {cmpA.kind}</Badge>
              )}
            </div>
            {cmpA ? (
              <BeadDetail bead={cmpA} />
            ) : (
              <div className="text-[11px] italic text-zinc-400">No bead selected.</div>
            )}
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <span>Comparing</span>
              {cmpB ? (
                <Badge color="amber">{KIND_GLYPH[cmpB.kind]} {cmpB.kind}</Badge>
              ) : (
                <Badge color="zinc">none</Badge>
              )}
            </div>
            {cmpB ? (
              <BeadDetail bead={cmpB} />
            ) : (
              <div className="text-[11px] italic text-zinc-400">
                Shift-click a bead to compare.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function BeadStrip({
  trailId,
  beads,
  active,
  compareWith,
  showLabels,
  onBeadClick,
  isActiveTrail,
}: {
  trailId: string;
  beads: Bead[];
  active: string;
  compareWith: string | null;
  showLabels: boolean;
  onBeadClick: (b: Bead, e: React.MouseEvent) => void;
  isActiveTrail: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  return (
    <div
      className={`rounded-md border p-2 ${
        isActiveTrail
          ? "border-violet-300 bg-violet-50/30 dark:border-violet-800 dark:bg-violet-950/20"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          trail · {trailId}
        </span>
        <span className="text-[10px] text-zinc-400">{beads.length} beads</span>
      </div>
      <div
        ref={scrollerRef}
        className="flex items-stretch gap-2 overflow-x-auto pb-1"
      >
        {beads.map((b, i) => {
          const isActive = b.id === active;
          const isCmp = b.id === compareWith;
          return (
            <div key={b.id} className="flex items-stretch gap-2">
              <Tooltip
                content={
                  <div className="max-w-xs text-[12px]">
                    <div className="mb-1 flex items-center gap-1.5">
                      <span
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white"
                        style={{ backgroundColor: KIND_COLOR[b.kind] }}
                      >
                        {KIND_GLYPH[b.kind]}
                      </span>
                      <span className="font-medium">{b.label}</span>
                      {b.by && (
                        <span className="text-[10px] text-zinc-500">· {b.by}</span>
                      )}
                    </div>
                    <div className="text-zinc-600 dark:text-zinc-300">{b.detail}</div>
                    <div className="mt-1 text-[10px] text-zinc-400">
                      {new Date(b.at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="mt-1 text-[10px] text-zinc-400">
                      click · rewind · shift-click · compare · ⌘-click · fork
                    </div>
                  </div>
                }
              >
                <button
                  onClick={(e) => onBeadClick(b, e)}
                  className={`flex w-32 shrink-0 cursor-pointer flex-col rounded-md border bg-white p-1.5 text-left transition dark:bg-zinc-900 ${
                    isActive
                      ? "border-violet-500 ring-2 ring-violet-200 dark:ring-violet-900"
                      : isCmp
                        ? "border-amber-400 ring-2 ring-amber-200 dark:ring-amber-900"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span
                      className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] text-white"
                      style={{ backgroundColor: KIND_COLOR[b.kind] }}
                    >
                      {KIND_GLYPH[b.kind]}
                    </span>
                    {showLabels && (
                      <span className="truncate text-[11px] font-medium">{b.label}</span>
                    )}
                  </div>
                  <pre className="mt-1 max-h-12 overflow-hidden whitespace-pre-wrap rounded bg-zinc-50 px-1 py-0.5 font-mono text-[9px] leading-tight text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                    {b.thumb}
                  </pre>
                  <div className="mt-1 text-[9px] text-zinc-400">
                    {ago(b.at)}
                  </div>
                </button>
              </Tooltip>
              {i < beads.length - 1 && (
                <div className="my-auto h-px w-3 bg-zinc-300 dark:bg-zinc-700" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BeadDetail({ bead }: { bead: Bead }) {
  return (
    <div className="space-y-2 text-[12px]">
      <div className="flex items-baseline gap-2">
        <span className="font-medium">{bead.label}</span>
        {bead.by && (
          <span className="text-[10px] text-zinc-500">· {bead.by}</span>
        )}
        <span className="ml-auto font-mono text-[10px] text-zinc-400">
          {new Date(bead.at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      </div>
      <div className="text-zinc-600 dark:text-zinc-300">{bead.detail}</div>
      <pre className="whitespace-pre-wrap rounded bg-zinc-50 px-2 py-1 font-mono text-[11px] text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
        {bead.thumb}
      </pre>
    </div>
  );
}

function ago(ms: number) {
  const d = Date.now() - ms;
  if (d < 60_000) return `${Math.floor(d / 1_000)}s`;
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m`;
  return `${Math.floor(d / 3_600_000)}h`;
}
