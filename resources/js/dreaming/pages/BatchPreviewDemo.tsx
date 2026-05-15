import { ReactNode, useMemo, useState } from "react";

export const USAGE = `import { BatchPreview } from "@particle-academy/react-fancy";

<BatchPreview
  items={pending}
  renderItem={(it) => <><b>{it.title}</b> · {it.body}</>}
  isIncluded={(it) => it.included}
  onToggle={(it) => setIncluded(it.id, !it.included)}
  onReorder={(ids) => reorder(ids)}
  title="Your digest, ready to send"
  whenAt="Friday, 5:00 PM"
  primaryAction={{ label: "Send now", onClick: sendDigest }}
  secondaryAction={{ label: "Wait for schedule", onClick: () => {} }}
/>`;

/**
 * BatchPreview — generic preview-before-commit list. Per-item include
 * toggle, drag-to-reorder (up/down buttons here for demo simplicity),
 * and primary/secondary actions. Works for digests, scheduled posts,
 * batch operations, AI write-queues — anywhere a pending batch deserves
 * a last look.
 */
type Identifiable = { id: string };

function BatchPreview<T extends Identifiable>({
  items,
  renderItem,
  isIncluded,
  onToggle,
  onReorder,
  title,
  whenAt,
  primaryAction,
  secondaryAction,
}: {
  items: T[];
  renderItem: (item: T) => ReactNode;
  isIncluded: (item: T) => boolean;
  onToggle: (item: T) => void;
  onReorder: (ids: string[]) => void;
  title: string;
  whenAt?: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}) {
  const includedCount = items.filter(isIncluded).length;

  const move = (id: string, dir: -1 | 1) => {
    const ids = items.map((i) => i.id);
    const idx = ids.indexOf(id);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= ids.length) return;
    [ids[idx], ids[next]] = [ids[next], ids[idx]];
    onReorder(ids);
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <header className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-[11px] text-zinc-500">
            {whenAt && `${whenAt} · `}
            {includedCount} of {items.length} included
          </div>
        </div>
        <div className="flex gap-2">
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {secondaryAction.label}
            </button>
          )}
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="rounded-md bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700"
            >
              {primaryAction.label}
            </button>
          )}
        </div>
      </header>

      <ol>
        {items.map((it, i) => {
          const included = isIncluded(it);
          return (
            <li
              key={it.id}
              className={`flex items-start gap-3 border-b border-zinc-50 px-4 py-2 last:border-b-0 dark:border-zinc-800 ${
                included ? "" : "opacity-50"
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
                  checked={included}
                  onChange={() => onToggle(it)}
                  className="h-3.5 w-3.5 accent-violet-600"
                />
              </label>

              <div className={`min-w-0 flex-1 text-sm ${included ? "" : "line-through"}`}>
                {renderItem(it)}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

type Item = {
  id: string;
  source: string;
  title: string;
  body: string;
  included: boolean;
};

const SEED: Item[] = [
  { id: "d1", source: "GitHub", title: "3 PRs merged", body: "by @rita and @sam in api-gateway.", included: true },
  { id: "d2", source: "Linear", title: "5 issues closed", body: "in 'Onboarding overhaul' project.", included: true },
  { id: "d3", source: "Stripe", title: "$2,431 MRR added", body: "across 4 new subscriptions this week.", included: true },
  { id: "d4", source: "Slack", title: "2 mentions in #design", body: "from @glenn — quick async questions.", included: false },
  { id: "d5", source: "Sentry", title: "1 new error type", body: "TypeError in /api/v2/upload (3 events).", included: true },
];

export function BatchPreviewDemo() {
  const [items, setItems] = useState<Item[]>(SEED);

  const reorder = (ids: string[]) => {
    const map = new Map(items.map((i) => [i.id, i]));
    setItems(ids.map((id) => map.get(id)!).filter(Boolean));
  };

  return (
    <BatchPreview
      items={items}
      title="Your digest, ready to send"
      whenAt="Friday, 5:00 PM"
      isIncluded={(it) => it.included}
      onToggle={(it) =>
        setItems((all) =>
          all.map((x) => (x.id === it.id ? { ...x, included: !x.included } : x)),
        )
      }
      onReorder={reorder}
      renderItem={(it) => (
        <div>
          <div className="flex items-baseline gap-2">
            <span className="rounded bg-zinc-100 px-1 text-[10px] font-medium uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {it.source}
            </span>
            <span className="font-medium">{it.title}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-500">{it.body}</div>
        </div>
      )}
      primaryAction={{ label: "Send now", onClick: () => alert("Sent.") }}
      secondaryAction={{ label: "Wait for schedule", onClick: () => undefined }}
    />
  );
}
