import { useEffect, useState } from "react";

export const USAGE = `import { EmptyCanvas } from "@particle-academy/react-fancy";

<EmptyCanvas
  title="No boards yet"
  blurb="Spin up your first board — we'll learn which action you reach for most."
  actions={[
    { key: "blank",    icon: "▢", label: "Blank board",      hint: "Start from nothing." },
    { key: "template", icon: "✦", label: "From template",    hint: "Pick a starter layout." },
    { key: "import",   icon: "↥", label: "Import CSV",       hint: "Drop in a spreadsheet." },
    { key: "invite",   icon: "✉", label: "Invite a teammate", hint: "Make it collaborative." },
  ]}
  storageKey="boards.empty.counts"
  onPick={(key) => router.push(\`/new?via=\${key}\`)}
/>`;

/**
 * EmptyCanvas — illustrated empty-state container with a small grid of
 * first-action CTAs. Click counts persist to localStorage; the most-used
 * action floats to the top across sessions so familiar power moves stay
 * one click away even after the canvas has stopped being empty.
 */
type Action = {
  key: string;
  icon: string;
  label: string;
  hint: string;
};

const ACTIONS: Action[] = [
  { key: "blank", icon: "▢", label: "Blank board", hint: "Start from nothing." },
  { key: "template", icon: "✦", label: "From template", hint: "Pick a starter layout." },
  { key: "import", icon: "↥", label: "Import CSV", hint: "Drop in a spreadsheet." },
  { key: "invite", icon: "✉", label: "Invite a teammate", hint: "Make it collaborative." },
];

const STORAGE = "dreaming.empty-canvas.counts";

function readCounts(): Record<string, number> {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE) ?? "{}");
  } catch {
    return {};
  }
}

function writeCounts(c: Record<string, number>) {
  try {
    window.localStorage.setItem(STORAGE, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

export function EmptyCanvasDemo() {
  const [counts, setCounts] = useState<Record<string, number>>(() => readCounts());
  const [last, setLast] = useState<string | null>(null);

  useEffect(() => {
    writeCounts(counts);
  }, [counts]);

  const ordered = [...ACTIONS].sort(
    (a, b) => (counts[b.key] ?? 0) - (counts[a.key] ?? 0),
  );
  const top = ordered[0]?.key;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center dark:border-zinc-700 dark:bg-zinc-950">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 to-sky-400 text-3xl text-white">
          ✦
        </div>
        <h2 className="mt-3 text-lg font-semibold">No boards yet</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">
          Spin up your first board — we'll keep the action you reach for most
          right at the top.
        </p>

        <div className="mx-auto mt-5 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
          {ordered.map((a) => {
            const n = counts[a.key] ?? 0;
            const isTop = a.key === top && n > 0;
            return (
              <button
                key={a.key}
                onClick={() => {
                  setCounts((c) => ({ ...c, [a.key]: (c[a.key] ?? 0) + 1 }));
                  setLast(a.key);
                }}
                className={`rounded-lg border bg-white p-3 text-left transition hover:border-violet-300 hover:shadow-sm dark:bg-zinc-900 ${
                  isTop
                    ? "border-violet-400 ring-1 ring-violet-200 dark:border-violet-500 dark:ring-violet-900"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{a.icon}</span>
                  {n > 0 && (
                    <span className="rounded bg-zinc-100 px-1 text-[10px] font-mono text-zinc-500 dark:bg-zinc-800">
                      ×{n}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs font-medium">{a.label}</div>
                <div className="text-[10px] text-zinc-500">{a.hint}</div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            setCounts({});
            setLast(null);
          }}
          className="mt-4 text-[10px] text-zinc-400 underline-offset-2 hover:underline"
        >
          reset learned order
        </button>
      </div>

      {last && (
        <div className="rounded-md bg-zinc-900 px-3 py-2 text-xs text-zinc-100 dark:bg-zinc-800">
          Picked: <span className="font-mono text-violet-300">{last}</span> · counts
          persist so the most-used action floats up across sessions.
        </div>
      )}
    </div>
  );
}
