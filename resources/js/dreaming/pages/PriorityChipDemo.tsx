import { useState } from "react";

export const USAGE = `import { PriorityChip } from "@particle-academy/agent-integrations";

<PriorityChip
  level={item.priority}             // "now" | "soon" | "whenever" | "never"
  reason={item.priorityReason}      // agent's one-sentence justification
  onReclassify={(next) => trainPriorityFor(item.signature, next)}
/>`;

/**
 * PriorityChip — auto-classified priority badge for an inbox item.
 * Hover reveals the agent's reasoning; click opens an inline picker
 * that lets the user override. The override is sent back to the agent
 * along with the item's "signature" so the classifier trains itself.
 */
type Level = "now" | "soon" | "whenever" | "never";

const TONE: Record<Level, string> = {
  now: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  soon: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  whenever: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  never: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

function PriorityChip({
  level,
  reason,
  onReclassify,
}: {
  level: Level;
  reason: string;
  onReclassify: (next: Level) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        title={reason}
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TONE[level]}`}
      >
        {level}
        <span className="opacity-60">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 w-56 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-violet-500">
            Reason
          </div>
          <p className="mb-2 text-[11px] text-zinc-600 dark:text-zinc-300">{reason}</p>
          <div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-400">
            Override
          </div>
          <div className="grid grid-cols-2 gap-1">
            {(["now", "soon", "whenever", "never"] as Level[]).map((l) => (
              <button
                key={l}
                onClick={() => {
                  onReclassify(l);
                  setOpen(false);
                }}
                className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition ${
                  l === level
                    ? "ring-1 ring-violet-400 " + TONE[l]
                    : TONE[l] + " opacity-70 hover:opacity-100"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}
    </span>
  );
}

type Item = { id: string; title: string; level: Level; reason: string };

const SEED: Item[] = [
  { id: "i1", title: "Stripe charge failed for ACME", level: "now", reason: "Revenue impact and last successful charge >7d ago." },
  { id: "i2", title: "PR #421 ready for review", level: "soon", reason: "Tagged 'blocking-release' in the description." },
  { id: "i3", title: "Weekly digest from Substack", level: "whenever", reason: "Newsletter; never opened in last 6 issues." },
  { id: "i4", title: "Promo email from Postmark", level: "never", reason: "Sender pattern matches marketing list muted twice." },
];

export function PriorityChipDemo() {
  const [items, setItems] = useState<Item[]>(SEED);
  return (
    <div className="space-y-3">
      <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-3 px-3 py-2 text-sm">
            <PriorityChip
              level={it.level}
              reason={it.reason}
              onReclassify={(next) =>
                setItems((all) => all.map((x) => (x.id === it.id ? { ...x, level: next } : x)))
              }
            />
            <span className="flex-1 truncate">{it.title}</span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] italic text-zinc-500">
        Hover any chip for the agent's reasoning. Click to override — production
        bridge sends the override + item signature back so the agent stops mis-classifying.
      </p>
    </div>
  );
}
