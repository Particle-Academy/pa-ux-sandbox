import { useMemo, useState } from "react";

export const USAGE = `import { DigestPreview } from "@particle-academy/react-fancy";

<DigestPreview
  items={pendingDigestItems}
  sendAt={nextDigestIso}
  onToggle={(id, included) => setItemIncluded(id, included)}
  onReorder={(ids) => reorderDigest(ids)}
  onSendNow={() => sendDigestNow()}
/>`;

/**
 * DigestPreview — preview the next outgoing digest before it sends.
 * Per-item include/exclude toggle, drag-to-reorder (simulated with up/down
 * buttons here), and a "send now" override. Pairs naturally with
 * QuietHours so users always know what their next batch will look like.
 */
type Item = {
  id: string;
  source: string;
  title: string;
  body: string;
  included: boolean;
};

const SEED: Item[] = [
  { id: "d1", source: "GitHub",  title: "3 PRs merged",         body: "by @rita and @sam in api-gateway.",        included: true  },
  { id: "d2", source: "Linear",  title: "5 issues closed",      body: "in 'Onboarding overhaul' project.",       included: true  },
  { id: "d3", source: "Stripe",  title: "$2,431 MRR added",     body: "across 4 new subscriptions this week.",   included: true  },
  { id: "d4", source: "Slack",   title: "2 mentions in #design", body: "from @glenn — quick async questions.",   included: false },
  { id: "d5", source: "Sentry",  title: "1 new error type",     body: "TypeError in /api/v2/upload (3 events).",  included: true  },
];

export function DigestPreviewDemo() {
  const [items, setItems] = useState<Item[]>(SEED);

  const toggle = (id: string) =>
    setItems((all) => all.map((i) => (i.id === id ? { ...i, included: !i.included } : i)));

  const move = (id: string, dir: -1 | 1) =>
    setItems((all) => {
      const idx = all.findIndex((i) => i.id === id);
      if (idx < 0) return all;
      const next = idx + dir;
      if (next < 0 || next >= all.length) return all;
      const copy = all.slice();
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });

  const includedCount = useMemo(() => items.filter((i) => i.included).length, [items]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <div>
          <div className="text-sm font-semibold">Your digest, ready to send</div>
          <div className="text-[11px] text-zinc-500">
            Friday, 5:00 PM · {includedCount} of {items.length} items included
          </div>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
            Wait for schedule
          </button>
          <button className="rounded-md bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700">
            Send now
          </button>
        </div>
      </header>

      <ol>
        {items.map((it, i) => (
          <li
            key={it.id}
            className={`flex items-start gap-3 border-b border-zinc-50 px-4 py-2 last:border-b-0 dark:border-zinc-800 ${
              it.included ? "" : "opacity-50"
            }`}
          >
            <div className="flex flex-col gap-0.5 text-zinc-400">
              <button
                onClick={() => move(it.id, -1)}
                disabled={i === 0}
                className="text-[10px] disabled:opacity-30 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                ▲
              </button>
              <button
                onClick={() => move(it.id, 1)}
                disabled={i === items.length - 1}
                className="text-[10px] disabled:opacity-30 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                ▼
              </button>
            </div>

            <label className="flex shrink-0 cursor-pointer items-center pt-0.5">
              <input
                type="checkbox"
                checked={it.included}
                onChange={() => toggle(it.id)}
                className="h-3.5 w-3.5 accent-violet-600"
              />
            </label>

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="rounded bg-zinc-100 px-1 text-[10px] font-medium uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {it.source}
                </span>
                <span
                  className={`text-sm font-medium ${
                    it.included ? "" : "line-through"
                  }`}
                >
                  {it.title}
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-500">{it.body}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
