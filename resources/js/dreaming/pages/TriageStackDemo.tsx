import { useState } from "react";

/**
 * TriageStack — stack of agent-recommended ticket actions. Each card
 * shows the action, a confidence band, and the agent's reason. Swipe
 * (or click) right to accept, left to reject. Tap "edit" to override
 * the payload before committing.
 */
type Action = {
  id: string;
  verb: "refund" | "escalate" | "draft-reply" | "close";
  ticket: string;
  reason: string;
  confidence: number;
  payload?: string;
};

const VERB_TONE: Record<Action["verb"], string> = {
  refund: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  escalate: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
  "draft-reply": "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  close: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
};

const SEED: Action[] = [
  {
    id: "a1",
    verb: "refund",
    ticket: "#4821 · double-charged subscription",
    reason: "Two identical charges within 90s. Stripe receipt confirms duplicate. Policy: auto-approve under $50.",
    confidence: 0.92,
    payload: "$29.00 refund to card ending •4823",
  },
  {
    id: "a2",
    verb: "escalate",
    ticket: "#4824 · enterprise SSO broken",
    reason: "Customer ARR > $50k. Ticket aged 6h with no first-response. Per playbook, escalate to Tier 2 on-call.",
    confidence: 0.81,
    payload: "Page: @rita (Tier 2)",
  },
  {
    id: "a3",
    verb: "draft-reply",
    ticket: "#4826 · 'how do I export?'",
    reason: "Question matches KB-128 (Exporting your workspace). Suggest reply with the article link.",
    confidence: 0.97,
    payload: "Hi! You can export from Settings → Data. Full guide: kb/128.",
  },
  {
    id: "a4",
    verb: "close",
    ticket: "#4790 · 'never mind, fixed it'",
    reason: "Customer resolved themselves 3d ago. No further activity. Safe auto-close.",
    confidence: 0.74,
  },
];

export function TriageStackDemo() {
  const [queue, setQueue] = useState<Action[]>(SEED);
  const [log, setLog] = useState<Array<{ verb: string; outcome: "accepted" | "rejected"; ticket: string }>>([]);

  const top = queue[0];

  const decide = (outcome: "accepted" | "rejected") => {
    if (!top) return;
    setLog((l) => [{ verb: top.verb, outcome, ticket: top.ticket }, ...l].slice(0, 8));
    setQueue((q) => q.slice(1));
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_280px]">
      <div className="relative min-h-[260px]">
        {queue.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
            Empty stack. Triage complete.
            <button
              className="ml-3 rounded-md border border-zinc-300 px-2 py-0.5 text-[11px] dark:border-zinc-700"
              onClick={() => setQueue(SEED)}
            >
              reset
            </button>
          </div>
        ) : (
          queue.slice(0, 3).map((a, i) => (
            <div
              key={a.id}
              className="absolute left-0 right-0 rounded-lg border border-zinc-200 bg-white p-4 shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900"
              style={{
                top: i * 10,
                zIndex: 10 - i,
                transform: `scale(${1 - i * 0.04})`,
                opacity: 1 - i * 0.18,
                pointerEvents: i === 0 ? "auto" : "none",
              }}
            >
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${VERB_TONE[a.verb]}`}>
                  {a.verb}
                </span>
                <span className="text-xs text-zinc-500">{a.ticket}</span>
                <span className="ml-auto text-[11px] font-mono text-zinc-500">
                  {(a.confidence * 100).toFixed(0)}% confident
                </span>
              </div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full bg-violet-500"
                  style={{ width: `${a.confidence * 100}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-200">{a.reason}</p>
              {a.payload && (
                <div className="mt-2 rounded bg-zinc-50 p-2 font-mono text-[11px] text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
                  → {a.payload}
                </div>
              )}
              {i === 0 && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => decide("rejected")}
                    className="rounded-md border border-rose-300 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950"
                  >
                    ← reject
                  </button>
                  <button
                    onClick={() => decide("accepted")}
                    className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    accept →
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 text-sm font-medium">Decision log</div>
        {log.length === 0 ? (
          <div className="text-[11px] italic text-zinc-400">No decisions yet.</div>
        ) : (
          <ol className="space-y-1 text-[11px]">
            {log.map((l, i) => (
              <li key={i} className="flex gap-2">
                <span
                  className={`rounded px-1 ${
                    l.outcome === "accepted"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                  }`}
                >
                  {l.outcome}
                </span>
                <span className="font-mono text-zinc-500">{l.verb}</span>
                <span className="truncate text-zinc-600 dark:text-zinc-400">
                  {l.ticket}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
