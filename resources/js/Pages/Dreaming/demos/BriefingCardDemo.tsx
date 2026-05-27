import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Briefing Card — plan-upfront control-trading primitive for
 * agent-integrations.
 *
 * Before a multi-step batch lands, the agent posts a Briefing Card
 * listing every step it plans to take. The human can:
 *   • ack the whole plan → agent runs all steps in order
 *   • edit a step's body → corrected version executes
 *   • skip a step       → marked skipped, plan continues
 *   • reject the plan   → agent gets a rejection result with the reason
 *
 * As each step lands, a per-step badge advances (queued → running →
 * done / failed). Different from Veto Ribbon: veto is per-mutation,
 * briefing is per-plan — the human approves *intent* upfront and only
 * intervenes mid-flight if something surprises them.
 */
type StepStatus = "queued" | "running" | "done" | "failed" | "skipped" | "blocked";

type Step = {
  id: string;
  verb: string;
  body: string;
  status: StepStatus;
  /** Free-text result line shown when done. */
  result?: string;
};

type Plan = {
  agent: { name: string; color: string };
  title: string;
  rationale: string;
  steps: Step[];
};

const SAMPLE: Omit<Plan, "steps"> & { steps: Omit<Step, "status">[] } = {
  agent: { name: "Planner", color: "#a855f7" },
  title: "Close the loop on the Q3 plan",
  rationale:
    "Yesterday's meeting agreed to commit Acme + Globex to the renewal track. I'll mirror that into the sheet, write the customer-facing summary, and notify the AE.",
  steps: [
    { id: "s1", verb: "sheet_set_range", body: "Status column for Acme + Globex → Renewal" },
    { id: "s2", verb: "form_set_value", body: "Summary field → '2 customers locked in for Q3 renewal'" },
    { id: "s3", verb: "whiteboard_add_sticky", body: "Drop 'Q3 renewal' sticky near the timeline" },
    { id: "s4", verb: "chart_update_data", body: "Refresh ARR projection with renewal weighting" },
  ],
};

export function BriefingCardDemo() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [phase, setPhase] = useState<"posted" | "running" | "settled" | "rejected">("posted");
  const [reason, setReason] = useState<string>("");
  const runTimer = useRef<number | null>(null);

  const postPlan = useCallback(() => {
    setPlan({
      ...SAMPLE,
      steps: SAMPLE.steps.map((s) => ({ ...s, status: "queued" as StepStatus })),
    });
    setPhase("posted");
    setReason("");
  }, []);

  useEffect(() => {
    if (!plan) postPlan();
  }, [plan, postPlan]);

  // Stepwise executor: run queued steps one at a time. Status updates here
  // simulate what a real bridge would do — replace with actual tool calls.
  const startRun = useCallback(() => {
    setPhase("running");
    const runNext = () => {
      setPlan((cur) => {
        if (!cur) return cur;
        const idx = cur.steps.findIndex((s) => s.status === "queued");
        if (idx < 0) {
          setPhase("settled");
          return cur;
        }
        const next = [...cur.steps];
        next[idx] = { ...next[idx], status: "running" };
        return { ...cur, steps: next };
      });

      runTimer.current = window.setTimeout(() => {
        setPlan((cur) => {
          if (!cur) return cur;
          const idx = cur.steps.findIndex((s) => s.status === "running");
          if (idx < 0) return cur;
          const next = [...cur.steps];
          // 12% chance of a step failing — interesting for the demo.
          const failed = Math.random() < 0.12;
          next[idx] = {
            ...next[idx],
            status: failed ? "failed" : "done",
            result: failed
              ? "tool returned 4xx"
              : `committed at ${new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}`,
          };
          return { ...cur, steps: next };
        });
        runTimer.current = window.setTimeout(runNext, 600);
      }, 1100 + Math.random() * 800);
    };
    runNext();
  }, []);

  useEffect(() => () => {
    if (runTimer.current) window.clearTimeout(runTimer.current);
  }, []);

  const editStep = (id: string, body: string) => {
    if (phase !== "posted") return;
    setPlan((cur) =>
      cur ? { ...cur, steps: cur.steps.map((s) => (s.id === id ? { ...s, body } : s)) } : cur,
    );
  };

  const toggleSkip = (id: string) => {
    if (phase !== "posted") return;
    setPlan((cur) =>
      cur
        ? {
            ...cur,
            steps: cur.steps.map((s) =>
              s.id === id
                ? { ...s, status: s.status === "skipped" ? "queued" : "skipped" }
                : s,
            ),
          }
        : cur,
    );
  };

  const reject = () => {
    setPhase("rejected");
  };

  if (!plan) return null;

  const remaining = plan.steps.filter((s) => s.status === "queued").length;
  const running = plan.steps.find((s) => s.status === "running");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Briefing Card</h1>
        <p className="mt-1 text-sm text-zinc-500">
          The agent posts its multi-step plan upfront. Approve the whole plan,
          edit a step's payload, skip a step, or reject. Then each step lands
          in order with a live status badge.
        </p>
      </header>

      <section className="overflow-hidden rounded-lg border border-violet-200 bg-white shadow-sm dark:border-violet-900 dark:bg-zinc-900">
        <div
          className="flex items-center gap-2 border-b border-violet-100 px-4 py-2 dark:border-violet-950"
          style={{ background: plan.agent.color + "11" }}
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: plan.agent.color + "33", color: plan.agent.color }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: plan.agent.color }}
            />
            {plan.agent.name}
          </span>
          <span className="text-xs text-zinc-500">proposes a plan</span>
          <span className="ml-auto text-[11px] font-mono text-zinc-500">
            {plan.steps.length} steps · {remaining} pending
          </span>
        </div>

        <div className="px-4 py-3">
          <div className="text-base font-semibold">{plan.title}</div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {plan.rationale}
          </p>
        </div>

        <ol className="divide-y divide-zinc-100 border-t border-zinc-100 dark:divide-zinc-800 dark:border-zinc-800">
          {plan.steps.map((s, i) => (
            <StepRow
              key={s.id}
              n={i + 1}
              step={s}
              editable={phase === "posted"}
              onEdit={(body) => editStep(s.id, body)}
              onToggleSkip={() => toggleSkip(s.id)}
            />
          ))}
        </ol>

        <div className="flex items-center gap-2 border-t border-zinc-100 bg-zinc-50 px-4 py-2.5 text-xs dark:border-zinc-800 dark:bg-zinc-950">
          {phase === "posted" && (
            <>
              <button
                onClick={startRun}
                className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
              >
                ack plan & run
              </button>
              <button
                onClick={reject}
                className="rounded-md border border-rose-300 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950"
              >
                reject
              </button>
              <span className="text-[11px] text-zinc-500">
                Edit any step inline, or hit Skip to drop it from the plan.
              </span>
            </>
          )}
          {phase === "running" && (
            <span className="text-[11px] text-zinc-600 dark:text-zinc-300">
              running: <span className="font-mono">{running?.verb ?? "…"}</span>
            </span>
          )}
          {phase === "settled" && (
            <>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                plan settled — review the results above.
              </span>
              <button
                onClick={postPlan}
                className="ml-auto rounded-md border border-zinc-300 px-2.5 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                post a new plan
              </button>
            </>
          )}
          {phase === "rejected" && (
            <>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="reason (sent back to agent)…"
                className="flex-1 rounded border border-zinc-200 bg-transparent px-2 py-1 text-[12px] outline-none focus:border-violet-400 dark:border-zinc-700"
              />
              <button
                onClick={postPlan}
                className="rounded-md bg-violet-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-700"
              >
                request revised plan
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function StepRow({
  n,
  step,
  editable,
  onEdit,
  onToggleSkip,
}: {
  n: number;
  step: Step;
  editable: boolean;
  onEdit: (body: string) => void;
  onToggleSkip: () => void;
}) {
  const dim = step.status === "skipped";
  return (
    <li className={`px-4 py-2.5 ${dim ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2 text-[11px]">
        <span className="font-mono text-zinc-400">#{n}</span>
        <span className="font-mono text-violet-700 dark:text-violet-300">
          {step.verb}
        </span>
        <span className="ml-auto">
          <StepBadge status={step.status} />
        </span>
      </div>
      <div className="mt-1 flex items-start gap-2">
        <textarea
          value={step.body}
          onChange={(e) => onEdit(e.target.value)}
          disabled={!editable || step.status === "skipped"}
          rows={1}
          className={`flex-1 resize-none rounded border bg-transparent px-2 py-1 font-mono text-[12px] outline-none ${
            editable
              ? "border-zinc-200 focus:border-violet-400 dark:border-zinc-700"
              : "border-transparent text-zinc-500"
          }`}
        />
        {editable && (
          <button
            onClick={onToggleSkip}
            className="rounded border border-zinc-300 px-1.5 py-1 text-[10px] font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {step.status === "skipped" ? "include" : "skip"}
          </button>
        )}
      </div>
      {step.result && (
        <div className="mt-1 text-[11px] text-zinc-500">
          ↳ {step.result}
        </div>
      )}
    </li>
  );
}

function StepBadge({ status }: { status: StepStatus }) {
  const map: Record<StepStatus, { bg: string; fg: string; label: string }> = {
    queued: { bg: "#e4e4e7", fg: "#52525b", label: "queued" },
    running: { bg: "#bfdbfe", fg: "#1d4ed8", label: "running" },
    done: { bg: "#bbf7d0", fg: "#15803d", label: "done" },
    failed: { bg: "#fecaca", fg: "#b91c1c", label: "failed" },
    skipped: { bg: "#fef3c7", fg: "#92400e", label: "skipped" },
    blocked: { bg: "#fecdd3", fg: "#9f1239", label: "blocked" },
  };
  const m = map[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
      style={{ backgroundColor: m.bg, color: m.fg }}
    >
      {status === "running" && (
        <span
          className="h-1 w-1 animate-pulse rounded-full"
          style={{ backgroundColor: m.fg }}
        />
      )}
      {m.label}
    </span>
  );
}
