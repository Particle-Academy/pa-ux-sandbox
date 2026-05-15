import { ReactNode, useEffect, useState } from "react";

export const USAGE = `import { ResultStream } from "@particle-academy/react-fancy";

<ResultStream
  results={results}                           // [{ id, group?, ... }]
  loadState={loadState}                       // "idle" | "loading" | "streaming" | "done"
  renderRow={(r) => <Row result={r} />}
  getGroupLabel={(r) => r.group}
  selectedId={selectedId}
  onSelect={(id) => setSelected(id)}
  onLoadMore={() => fetchMore()}
/>

// Bridge sketch:
// registerResultStreamBridge(server, { adapter })
//   → stream_top()  stream_filter(q)  stream_pick(id)  stream_load_more()
`;

/**
 * ResultStream — list primitive that streams in async results with per-row
 * skeletons, group dividers, and a "load more" tail. Selection is controlled
 * by stable id; loadState is a plain enum so an agent watching the bridge
 * can wait for "done" before issuing a pick.
 */
type LoadState = "idle" | "loading" | "streaming" | "done";

type Result = {
  id: string;
  group?: string;
  pending?: boolean;
};

function ResultStream<T extends Result>({
  results,
  loadState,
  renderRow,
  getGroupLabel,
  selectedId,
  onSelect,
  onLoadMore,
  emptyHint = "No results.",
}: {
  results: T[];
  loadState: LoadState;
  renderRow: (r: T) => ReactNode;
  getGroupLabel?: (r: T) => string | undefined;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onLoadMore?: () => void;
  emptyHint?: string;
}) {
  let lastGroup: string | undefined = undefined;
  return (
    <div data-fancy="result-stream" data-load-state={loadState}>
      {loadState === "idle" && results.length === 0 && (
        <div className="px-3 py-8 text-center text-xs italic text-zinc-400">
          {emptyHint}
        </div>
      )}
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {results.map((r) => {
          const groupLabel = getGroupLabel?.(r);
          const showHeader = groupLabel && groupLabel !== lastGroup;
          if (groupLabel) lastGroup = groupLabel;
          return (
            <li key={r.id} data-result-id={r.id}>
              {showHeader && (
                <div className="bg-zinc-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:bg-zinc-950">
                  {groupLabel}
                </div>
              )}
              <button
                onClick={() => onSelect?.(r.id)}
                className={`flex w-full items-start gap-2 px-3 py-2 text-left transition ${
                  selectedId === r.id
                    ? "bg-violet-50 dark:bg-violet-900/30"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                } ${r.pending ? "animate-pulse" : ""}`}
              >
                {r.pending ? (
                  <div className="w-full space-y-1">
                    <div className="h-3 w-1/3 rounded bg-zinc-200 dark:bg-zinc-700" />
                    <div className="h-2 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800" />
                  </div>
                ) : (
                  renderRow(r)
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {(loadState === "loading" || loadState === "streaming") && (
        <div className="px-3 py-2 text-center text-[11px] text-zinc-500">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-violet-500 align-middle" />
          <span className="ml-2">
            {loadState === "loading" ? "Searching…" : "Streaming results…"}
          </span>
        </div>
      )}
      {loadState === "done" && onLoadMore && results.length > 0 && (
        <button
          onClick={onLoadMore}
          className="block w-full border-t border-zinc-100 px-3 py-2 text-center text-[11px] text-violet-600 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
        >
          Load more →
        </button>
      )}
    </div>
  );
}

type Item = Result & { title: string; subtitle: string };

const ALL: Item[] = [
  { id: "r1", group: "Documents", title: "Q4 board memo",          subtitle: "edited 2h ago by Glenn" },
  { id: "r2", group: "Documents", title: "Roadmap — Human+ kit",   subtitle: "edited yesterday by Sam" },
  { id: "r3", group: "People",    title: "Rita Kumar",             subtitle: "rita@particle.academy" },
  { id: "r4", group: "People",    title: "Sam Lin",                subtitle: "sam@particle.academy" },
  { id: "r5", group: "Tickets",   title: "ENG-1284 quote-resolution UX", subtitle: "open · assigned to you" },
  { id: "r6", group: "Tickets",   title: "ENG-1190 fix flaky test",      subtitle: "closed · 3 days ago" },
];

export function ResultStreamDemo() {
  const [results, setResults] = useState<Item[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [selected, setSelected] = useState<string | null>(null);

  const run = () => {
    setResults([
      { id: "ph1", pending: true } as Item,
      { id: "ph2", pending: true } as Item,
      { id: "ph3", pending: true } as Item,
    ]);
    setLoadState("loading");

    // Stream them in one at a time
    ALL.forEach((r, i) => {
      window.setTimeout(() => {
        setResults((prev) => {
          const real = prev.filter((p) => !p.pending);
          const stillPending = prev.filter((p) => p.pending).slice(1);
          return [...real, r, ...stillPending];
        });
        if (i === 0) setLoadState("streaming");
        if (i === ALL.length - 1) {
          window.setTimeout(() => setLoadState("done"), 200);
        }
      }, 220 + i * 180);
    });
  };

  useEffect(() => {
    run();
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={run}
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Re-run query
        </button>
        <span className="text-[11px] font-mono text-zinc-500">
          loadState: <span className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">{loadState}</span>
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <ResultStream
          results={results}
          loadState={loadState}
          selectedId={selected}
          onSelect={setSelected}
          getGroupLabel={(r) => r.group}
          renderRow={(r) => (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{r.title}</div>
              <div className="truncate text-[11px] text-zinc-500">{r.subtitle}</div>
            </div>
          )}
          onLoadMore={() => undefined}
        />
      </div>
    </div>
  );
}
