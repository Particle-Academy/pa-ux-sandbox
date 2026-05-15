import { useState } from "react";

export const USAGE = `import { ClassifierChip } from "@particle-academy/agent-integrations";

<ClassifierChip
  value={item.label}                           // current classification
  options={[
    { value: "now",      label: "Now",      tone: "rose" },
    { value: "soon",     label: "Soon",     tone: "amber" },
    { value: "whenever", label: "Whenever", tone: "sky" },
    { value: "never",    label: "Never",    tone: "zinc" },
  ]}
  reason={item.reason}                         // agent's one-sentence justification
  onReclassify={(next) => trainFor(item.signature, next)}
/>`;

/**
 * ClassifierChip — generic auto-classified badge. The value can be any
 * string key; hover reveals the agent's reasoning; click opens an inline
 * picker for human override that should be wired back to the classifier
 * for training. Works for priority, sentiment, severity, category, risk,
 * sensitivity, anywhere an AI label needs human-correctable trust.
 */
type Tone = "rose" | "amber" | "emerald" | "sky" | "violet" | "zinc";

const TONE: Record<Tone, string> = {
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

type Option = { value: string; label: string; tone: Tone };

function ClassifierChip({
  value,
  options,
  reason,
  onReclassify,
}: {
  value: string;
  options: Option[];
  reason: string;
  onReclassify: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <span className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        title={reason}
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TONE[current.tone]}`}
      >
        {current.label}
        <span className="opacity-60">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 w-56 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-violet-500">Reason</div>
          <p className="mb-2 text-[11px] text-zinc-600 dark:text-zinc-300">{reason}</p>
          <div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-400">Override</div>
          <div className="grid grid-cols-2 gap-1">
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => {
                  onReclassify(o.value);
                  setOpen(false);
                }}
                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition ${
                  o.value === value
                    ? "ring-1 ring-violet-400 " + TONE[o.tone]
                    : TONE[o.tone] + " opacity-70 hover:opacity-100"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </span>
  );
}

const PRIORITY: Option[] = [
  { value: "now", label: "Now", tone: "rose" },
  { value: "soon", label: "Soon", tone: "amber" },
  { value: "whenever", label: "Whenever", tone: "sky" },
  { value: "never", label: "Never", tone: "zinc" },
];

const SENTIMENT: Option[] = [
  { value: "happy", label: "Happy", tone: "emerald" },
  { value: "neutral", label: "Neutral", tone: "zinc" },
  { value: "frustrated", label: "Frustrated", tone: "amber" },
  { value: "churn-risk", label: "Churn-risk", tone: "rose" },
];

const SEVERITY: Option[] = [
  { value: "p0", label: "P0", tone: "rose" },
  { value: "p1", label: "P1", tone: "amber" },
  { value: "p2", label: "P2", tone: "sky" },
  { value: "p3", label: "P3", tone: "zinc" },
];

type Row = { id: string; title: string; value: string; reason: string; options: Option[] };

const SEED: Row[] = [
  {
    id: "r1",
    title: "Stripe charge failed for ACME · notification",
    value: "now",
    reason: "Revenue impact; last successful charge >7d ago.",
    options: PRIORITY,
  },
  {
    id: "r2",
    title: "Customer reply — 'this is awesome' · ticket",
    value: "happy",
    reason: "Lexical positive markers + exclamation + zero complaint signal.",
    options: SENTIMENT,
  },
  {
    id: "r3",
    title: "TypeError in /api/v2/upload · error",
    value: "p1",
    reason: "Affecting < 1% of requests, but 5xx rate spiked 12× baseline.",
    options: SEVERITY,
  },
];

export function ClassifierChipDemo() {
  const [rows, setRows] = useState(SEED);
  return (
    <div className="space-y-3">
      <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-3 px-3 py-2 text-sm">
            <ClassifierChip
              value={r.value}
              options={r.options}
              reason={r.reason}
              onReclassify={(next) =>
                setRows((all) => all.map((x) => (x.id === r.id ? { ...x, value: next } : x)))
              }
            />
            <span className="flex-1 truncate">{r.title}</span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] italic text-zinc-500">
        Same primitive, three classifier vocabularies (priority, sentiment, severity).
        Hover for reason, click to override; production bridge sends the override back
        to retrain.
      </p>
    </div>
  );
}
