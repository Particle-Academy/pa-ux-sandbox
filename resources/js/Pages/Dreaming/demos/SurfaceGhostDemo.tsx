import { useCallback, useMemo, useState } from "react";

/**
 * Surface Ghost — in-place preview primitive for agent-integrations.
 *
 * Instead of committing a write directly, the bridge stages it as a
 * "ghost" on the surface: translucent rendering of what *would* be
 * there, with a hairline outline in the agent's color and a small
 * inspector chip on hover (who, why, what kind of change). The human
 * accepts a ghost individually, accepts all, or dismisses any.
 *
 * Contrast with Briefing Card (textual plan-upfront, before any work
 * starts) and Veto Ribbon (per-action with a countdown). Surface Ghost
 * is spatial and visual — you see the change in place, mid-edit,
 * before agreeing.
 *
 * Demo surface is a 4×4 sheet so changes are easy to see. Real impl:
 * any surface bridge can render ghosts via a `pendingDelta` overlay
 * keyed by element id, with `accept_ghost` / `dismiss_ghost` tools and
 * `accept_all_ghosts` for sweep approval.
 */
type ChangeKind = "set" | "delete" | "rename" | "tag";

type Ghost = {
  id: string;
  row: number;
  col: number;
  kind: ChangeKind;
  /** What the cell would become. For delete, undefined. */
  nextValue?: string;
  /** Previous cell value. */
  prevValue: string;
  agent: { name: string; color: string };
  reason: string;
};

type Agent = { name: string; color: string };

const AGENTS: Agent[] = [
  { name: "Planner", color: "#a855f7" },
  { name: "Scribe", color: "#10b981" },
  { name: "Auditor", color: "#f59e0b" },
];

const HEADERS = ["Account", "Status", "ARR", "Owner"];

const initialCells: string[][] = [
  ["Acme", "Active", "$120k", "Ada"],
  ["Globex", "Trial", "$45k", "Linus"],
  ["Initech", "—", "—", "—"],
  ["Hooli", "Churned", "$0", "Grace"],
];

const SEED_GHOSTS: Ghost[] = [
  {
    id: "g1",
    row: 1,
    col: 1,
    kind: "set",
    nextValue: "Renewal",
    prevValue: "Trial",
    agent: AGENTS[0],
    reason: "auto-flagged after positive QBR",
  },
  {
    id: "g2",
    row: 1,
    col: 2,
    kind: "set",
    nextValue: "$60k",
    prevValue: "$45k",
    agent: AGENTS[0],
    reason: "expansion projection from forecast",
  },
  {
    id: "g3",
    row: 2,
    col: 0,
    kind: "rename",
    nextValue: "Initech Corp",
    prevValue: "Initech",
    agent: AGENTS[1],
    reason: "canonicalizing legal name",
  },
  {
    id: "g4",
    row: 2,
    col: 1,
    kind: "set",
    nextValue: "Prospect",
    prevValue: "—",
    agent: AGENTS[1],
    reason: "added from intake form",
  },
  {
    id: "g5",
    row: 3,
    col: 3,
    kind: "delete",
    prevValue: "Grace",
    agent: AGENTS[2],
    reason: "owner left org · clear assignment",
  },
];

const KIND_LABEL: Record<ChangeKind, string> = {
  set: "set →",
  delete: "delete",
  rename: "rename →",
  tag: "tag",
};

export function SurfaceGhostDemo() {
  const [cells, setCells] = useState<string[][]>(initialCells);
  const [ghosts, setGhosts] = useState<Ghost[]>(SEED_GHOSTS);
  const [hovered, setHovered] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Ghost[]>([]);
  const [accepted, setAccepted] = useState<Ghost[]>([]);

  const ghostByCell = useMemo(() => {
    const map = new Map<string, Ghost>();
    for (const g of ghosts) map.set(`${g.row}-${g.col}`, g);
    return map;
  }, [ghosts]);

  const accept = useCallback((g: Ghost) => {
    setCells((cur) =>
      cur.map((row, r) =>
        row.map((cell, c) => {
          if (r !== g.row || c !== g.col) return cell;
          if (g.kind === "delete") return "—";
          return g.nextValue ?? cell;
        }),
      ),
    );
    setGhosts((cur) => cur.filter((x) => x.id !== g.id));
    setAccepted((cur) => [...cur, g]);
  }, []);

  const dismiss = useCallback((g: Ghost) => {
    setGhosts((cur) => cur.filter((x) => x.id !== g.id));
    setDismissed((cur) => [...cur, g]);
  }, []);

  const acceptAll = () => {
    let next = cells;
    for (const g of ghosts) {
      next = next.map((row, r) =>
        row.map((cell, c) => {
          if (r !== g.row || c !== g.col) return cell;
          if (g.kind === "delete") return "—";
          return g.nextValue ?? cell;
        }),
      );
    }
    setCells(next);
    setAccepted((cur) => [...cur, ...ghosts]);
    setGhosts([]);
  };

  const dismissAll = () => {
    setDismissed((cur) => [...cur, ...ghosts]);
    setGhosts([]);
  };

  const reset = () => {
    setCells(initialCells);
    setGhosts(SEED_GHOSTS);
    setAccepted([]);
    setDismissed([]);
    setHovered(null);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Surface Ghost</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Agent writes are staged as translucent ghosts on the surface itself.
          Hover for the reason and source agent; click ✓ to accept, ✕ to
          dismiss. Sweep buttons handle the whole batch.
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-xs text-zinc-500">
          {ghosts.length} pending · {accepted.length} accepted ·{" "}
          {dismissed.length} dismissed
        </span>
        <button
          onClick={acceptAll}
          disabled={ghosts.length === 0}
          className="ml-auto rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          accept all
        </button>
        <button
          onClick={dismissAll}
          disabled={ghosts.length === 0}
          className="rounded-md border border-rose-300 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-40 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950"
        >
          dismiss all
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          reset demo
        </button>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 text-sm font-medium">Surface (sheet)</div>
        <div
          className="grid overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800"
          style={{ gridTemplateColumns: `repeat(${HEADERS.length}, minmax(0, 1fr))` }}
        >
          {HEADERS.map((h) => (
            <div
              key={h}
              className="border-b border-r border-zinc-200 bg-zinc-50 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 last:border-r-0 dark:border-zinc-800 dark:bg-zinc-900"
            >
              {h}
            </div>
          ))}
          {cells.map((row, r) =>
            row.map((v, c) => {
              const key = `${r}-${c}`;
              const ghost = ghostByCell.get(key);
              const isHovered = hovered === ghost?.id;
              return (
                <div
                  key={key}
                  className="relative border-b border-r border-zinc-200 px-2 py-2 last:border-r-0 dark:border-zinc-800"
                  onMouseEnter={() => ghost && setHovered(ghost.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div
                    className={`font-mono text-[12px] ${
                      v === "—" ? "text-zinc-300" : ""
                    } ${ghost ? "opacity-40 line-through decoration-zinc-400" : ""}`}
                  >
                    {v}
                  </div>
                  {ghost && (
                    <Ghost
                      ghost={ghost}
                      hovered={isHovered}
                      onAccept={() => accept(ghost)}
                      onDismiss={() => dismiss(ghost)}
                    />
                  )}
                </div>
              );
            }),
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChangeLog title="Accepted" tone="emerald" items={accepted} />
        <ChangeLog title="Dismissed" tone="rose" items={dismissed} />
      </section>
    </div>
  );
}

function Ghost({
  ghost,
  hovered,
  onAccept,
  onDismiss,
}: {
  ghost: Ghost;
  hovered: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0.5 rounded-sm"
      style={{
        background: ghost.agent.color + "22",
        outline: `1px dashed ${ghost.agent.color}`,
      }}
    >
      <div
        className={`pointer-events-auto absolute inset-x-1 ${
          hovered ? "top-0 bottom-0" : "bottom-0.5"
        } flex flex-col justify-between rounded-sm text-[10px]`}
      >
        <div
          className="rounded px-1 py-0.5 font-mono"
          style={{ color: ghost.agent.color }}
        >
          {KIND_LABEL[ghost.kind]}{" "}
          {ghost.kind === "delete" ? "" : ghost.nextValue}
        </div>
        {hovered && (
          <div className="mt-1 space-y-1 rounded bg-white px-1.5 py-1 shadow-md ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
            <div className="flex items-center gap-1">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: ghost.agent.color }}
              />
              <span
                className="font-medium"
                style={{ color: ghost.agent.color }}
              >
                {ghost.agent.name}
              </span>
            </div>
            <div className="text-zinc-600 dark:text-zinc-300">
              {ghost.reason}
            </div>
            <div className="flex gap-1 pt-0.5">
              <button
                onClick={onAccept}
                className="flex-1 rounded bg-emerald-600 px-1 py-0.5 text-white hover:bg-emerald-700"
              >
                ✓ accept
              </button>
              <button
                onClick={onDismiss}
                className="flex-1 rounded border border-rose-300 px-1 py-0.5 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950"
              >
                ✕ dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChangeLog({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "emerald" | "rose";
  items: Ghost[];
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div
        className={`mb-2 text-sm font-medium ${
          tone === "emerald"
            ? "text-emerald-700 dark:text-emerald-300"
            : "text-rose-700 dark:text-rose-300"
        }`}
      >
        {title} · {items.length}
      </div>
      {items.length === 0 ? (
        <div className="text-[11px] italic text-zinc-400">nothing yet.</div>
      ) : (
        <ol className="space-y-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
          {items.map((g) => (
            <li key={g.id} className="flex flex-wrap gap-1">
              <span style={{ color: g.agent.color }}>{g.agent.name}</span>
              <span>·</span>
              <span>
                ({"ABCDE"[g.col]}
                {g.row + 1})
              </span>
              <span className="text-zinc-400">
                {KIND_LABEL[g.kind]}{" "}
                {g.kind === "delete"
                  ? g.prevValue
                  : `${g.prevValue} → ${g.nextValue ?? "?"}`}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
