import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Veto Ribbon — speculative trust-but-verify primitive for
 * agent-integrations. When an agent stages a write, a thin ribbon
 * docks above the affected surface with: who the agent is, what
 * they're about to do, a short editable payload, and an N-second
 * countdown. The human can approve now, edit, or veto. If they do
 * nothing, the action commits when the countdown ends.
 *
 * The real implementation would wrap every mutation tool via a
 * `pendingMode` switch: instead of applying directly, the bridge
 * emits a `notifications/pending_action` frame and the host renders
 * a ribbon. On veto, the bridge tool returns a rejection result the
 * agent can react to.
 */
type Surface = "sheet" | "form" | "whiteboard";

type PendingAction = {
  id: string;
  agent: { name: string; color: string };
  surface: Surface;
  verb: string;
  /** Editable summary the human can tweak before committing. */
  payload: string;
  /** Wall-clock ms when this auto-commits. */
  expiresAt: number;
};

const SURFACE_LABEL: Record<Surface, string> = {
  sheet: "Spreadsheet",
  form: "Onboarding form",
  whiteboard: "Whiteboard",
};

const COUNTDOWN_MS = 6000;
const AGENTS = [
  { name: "Planner", color: "#a855f7" },
  { name: "Scribe", color: "#10b981" },
  { name: "Forecaster", color: "#3b82f6" },
];

const SAMPLE_ACTIONS: Array<Omit<PendingAction, "id" | "expiresAt">> = [
  {
    agent: AGENTS[0],
    surface: "sheet",
    verb: "set range A2:A6",
    payload: "Q1 plan, Q2 plan, Q3 plan, Q4 plan, FY total",
  },
  {
    agent: AGENTS[1],
    surface: "form",
    verb: "fill field 'summary'",
    payload:
      "Customer is a mid-sized fintech evaluating Stripe Connect; main blocker is split-payment compliance.",
  },
  {
    agent: AGENTS[2],
    surface: "whiteboard",
    verb: "drop sticky 'Hypothesis'",
    payload: "If we cap retries at 3, p99 latency drops below the SLA.",
  },
];

export function VetoRibbonDemo() {
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [committed, setCommitted] = useState<
    Array<{ verb: string; surface: Surface; payload: string; outcome: "approved" | "expired" | "vetoed" }>
  >([]);
  const [editing, setEditing] = useState<string>("");
  const sampleIdx = useRef(0);

  const queueRandom = useCallback(() => {
    const base = SAMPLE_ACTIONS[sampleIdx.current % SAMPLE_ACTIONS.length];
    sampleIdx.current++;
    const action: PendingAction = {
      ...base,
      id: `pa-${Date.now().toString(36)}`,
      expiresAt: Date.now() + COUNTDOWN_MS,
    };
    setPending(action);
    setEditing(action.payload);
  }, []);

  const commit = useCallback(
    (outcome: "approved" | "expired" | "vetoed") => {
      setPending((p) => {
        if (!p) return null;
        if (outcome !== "vetoed") {
          setCommitted((c) =>
            [
              { verb: p.verb, surface: p.surface, payload: editing, outcome },
              ...c,
            ].slice(0, 8),
          );
        } else {
          setCommitted((c) =>
            [
              { verb: p.verb, surface: p.surface, payload: editing, outcome },
              ...c,
            ].slice(0, 8),
          );
        }
        return null;
      });
    },
    [editing],
  );

  // Auto-commit when the countdown ends.
  useEffect(() => {
    if (!pending) return;
    const remaining = Math.max(0, pending.expiresAt - Date.now());
    const t = window.setTimeout(() => commit("expired"), remaining);
    return () => window.clearTimeout(t);
  }, [pending, commit]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Veto Ribbon</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Agents stage their write through a thin ribbon. Humans get a
          {" "}
          {COUNTDOWN_MS / 1000}-second window to approve, edit the payload, or
          veto. Idle → auto-commit. No modals, no interruptions — just a quiet
          chance to course-correct.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white p-0 dark:border-zinc-800 dark:bg-zinc-900">
        {pending ? (
          <Ribbon
            action={pending}
            editing={editing}
            onEdit={setEditing}
            onApprove={() => commit("approved")}
            onVeto={() => commit("vetoed")}
          />
        ) : (
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-zinc-500">
            <span>No pending action.</span>
            <button
              onClick={queueRandom}
              className="rounded-md bg-violet-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-700"
            >
              Stage agent action
            </button>
          </div>
        )}

        <div className="border-t border-zinc-200 px-4 py-6 dark:border-zinc-800">
          <SurfaceMock
            highlight={pending?.surface}
            preview={pending ? { verb: pending.verb, payload: editing } : null}
          />
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 text-sm font-medium">Committed log</div>
        {committed.length === 0 ? (
          <div className="text-[11px] italic text-zinc-400">
            Nothing committed yet. Stage an action above.
          </div>
        ) : (
          <ol className="space-y-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
            {committed.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span
                  className={`rounded px-1 ${
                    c.outcome === "approved"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : c.outcome === "vetoed"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {c.outcome}
                </span>
                <span className="text-zinc-400">{SURFACE_LABEL[c.surface]}</span>
                <span>· {c.verb}</span>
                {c.outcome !== "vetoed" && (
                  <span className="truncate text-zinc-500">— "{c.payload.slice(0, 60)}"</span>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Ribbon({
  action,
  editing,
  onEdit,
  onApprove,
  onVeto,
}: {
  action: PendingAction;
  editing: string;
  onEdit: (v: string) => void;
  onApprove: () => void;
  onVeto: () => void;
}) {
  const [remaining, setRemaining] = useState(action.expiresAt - Date.now());
  useEffect(() => {
    const t = window.setInterval(() => {
      setRemaining(Math.max(0, action.expiresAt - Date.now()));
    }, 80);
    return () => window.clearInterval(t);
  }, [action.expiresAt]);
  const pct = Math.max(0, Math.min(100, (remaining / COUNTDOWN_MS) * 100));

  return (
    <div className="relative">
      <div
        className="absolute inset-x-0 top-0 h-0.5"
        style={{
          width: `${pct}%`,
          background: action.agent.color,
          transition: "width 100ms linear",
        }}
      />
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-xs">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{
            backgroundColor: action.agent.color + "22",
            color: action.agent.color,
          }}
        >
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ backgroundColor: action.agent.color }}
          />
          {action.agent.name}
        </span>
        <span className="text-zinc-500">wants to</span>
        <span className="font-mono text-zinc-800 dark:text-zinc-200">
          {action.verb}
        </span>
        <span className="text-zinc-400">on</span>
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {SURFACE_LABEL[action.surface]}
        </span>
        <span className="ml-auto font-mono text-[11px] text-zinc-500">
          {(remaining / 1000).toFixed(1)}s
        </span>
        <div className="flex gap-1">
          <button
            onClick={onVeto}
            className="rounded-md border border-rose-300 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950"
          >
            veto
          </button>
          <button
            onClick={onApprove}
            className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-700"
          >
            approve now
          </button>
        </div>
      </div>
      <div className="border-t border-dashed border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <label className="block text-[10px] uppercase tracking-wider text-zinc-400">
          payload (editable)
        </label>
        <input
          value={editing}
          onChange={(e) => onEdit(e.target.value)}
          className="mt-0.5 w-full rounded border border-zinc-200 bg-transparent px-2 py-1 font-mono text-[12px] outline-none focus:border-violet-400 dark:border-zinc-800"
        />
      </div>
    </div>
  );
}

function SurfaceMock({
  highlight,
  preview,
}: {
  highlight: Surface | undefined;
  preview: { verb: string; payload: string } | null;
}) {
  const surfaces: Surface[] = useMemo(() => ["sheet", "form", "whiteboard"], []);
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {surfaces.map((s) => {
        const active = highlight === s;
        return (
          <div
            key={s}
            className={`rounded-md border p-3 transition ${
              active
                ? "border-violet-400 bg-violet-50 dark:border-violet-600 dark:bg-violet-950/40"
                : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              {SURFACE_LABEL[s]}
            </div>
            {active && preview ? (
              <div className="mt-1.5 space-y-1">
                <div className="font-mono text-[11px] text-violet-700 dark:text-violet-300">
                  {preview.verb}
                </div>
                <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                  "{preview.payload}"
                </div>
              </div>
            ) : (
              <div className="mt-1.5 text-[11px] italic text-zinc-400">
                idle
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
