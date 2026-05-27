import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

export const USAGE = `import { InfiniteScroll } from "@particle-academy/react-fancy";

<InfiniteScroll
  items={items}
  getId={(it) => it.id}
  renderRow={(it) => <Row item={it} />}
  loadNext={fetchNext}                           // () => Promise<{ items, done }>
  loadState={state}                              // "idle"|"loading"|"error"|"exhausted"
  onError={(e) => console.error(e)}
/>

// Bridge sketch:
// registerInfiniteScrollBridge(server, { adapter })
//   → scroll_visible_range()  scroll_to(id)  scroll_load_next()
`;

/**
 * InfiniteScroll — virtualized-ish fetch-on-scroll list. Generic over
 * item shape; dedupes by stable id; uses an IntersectionObserver
 * sentinel to trigger loads. loadState is a plain enum so an agent
 * bridge can wait for "idle" before requesting scroll_to(id).
 */
type LoadState = "idle" | "loading" | "error" | "exhausted";

function InfiniteScroll<T>({
  items,
  getId,
  renderRow,
  loadNext,
  loadState,
  onLoadStateChange,
  rootMargin = "200px",
}: {
  items: T[];
  getId: (item: T) => string;
  renderRow: (item: T) => ReactNode;
  loadNext: () => Promise<{ items: T[]; done: boolean }>;
  loadState: LoadState;
  onLoadStateChange: (next: LoadState, batch?: { items: T[]; done: boolean }) => void;
  rootMargin?: string;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  const stateRef = useRef(loadState);
  useEffect(() => {
    stateRef.current = loadState;
  }, [loadState]);

  useEffect(() => {
    if (!sentinel.current) return;
    const obs = new IntersectionObserver(
      async (entries) => {
        const e = entries[0];
        if (!e?.isIntersecting) return;
        if (stateRef.current !== "idle") return;
        onLoadStateChange("loading");
        try {
          const batch = await loadNext();
          onLoadStateChange(batch.done ? "exhausted" : "idle", batch);
        } catch {
          onLoadStateChange("error");
        }
      },
      { rootMargin },
    );
    obs.observe(sentinel.current);
    return () => obs.disconnect();
  }, [loadNext, onLoadStateChange, rootMargin]);

  return (
    <div data-fancy="infinite-scroll" data-load-state={loadState}>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {items.map((it) => (
          <li key={getId(it)} data-item-id={getId(it)} className="px-3 py-2">
            {renderRow(it)}
          </li>
        ))}
      </ul>
      <div ref={sentinel} className="py-3 text-center text-[11px]">
        {loadState === "loading" && (
          <span className="text-zinc-500">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-violet-500 align-middle" />
            <span className="ml-2">Loading more…</span>
          </span>
        )}
        {loadState === "exhausted" && (
          <span className="italic text-zinc-400">— end of list —</span>
        )}
        {loadState === "error" && (
          <button
            onClick={() => onLoadStateChange("idle")}
            className="text-rose-600 hover:underline"
          >
            Failed. Tap to retry.
          </button>
        )}
      </div>
    </div>
  );
}

type Row = { id: string; title: string; subtitle: string };

let nextId = 1;
function makeBatch(n = 12): Row[] {
  return Array.from({ length: n }, () => {
    const id = `row-${nextId++}`;
    return {
      id,
      title: `Item #${nextId - 1}`,
      subtitle: ["Documents", "People", "Tickets", "Boards"][nextId % 4] + " · auto-generated",
    };
  });
}

export function InfiniteScrollDemo() {
  const [items, setItems] = useState<Row[]>(() => makeBatch(8));
  const [state, setState] = useState<LoadState>("idle");
  const totalPagesRef = useRef(0);

  const loadNext = useCallback(async (): Promise<{ items: Row[]; done: boolean }> => {
    await new Promise((r) => setTimeout(r, 500));
    totalPagesRef.current++;
    const batch = makeBatch(8);
    return { items: batch, done: totalPagesRef.current >= 4 };
  }, []);

  const onStateChange = useCallback((next: LoadState, batch?: { items: Row[]; done: boolean }) => {
    setState(next);
    if (batch?.items) {
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...batch.items.filter((b) => !seen.has(b.id))];
      });
    }
  }, []);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zinc-200 bg-white text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <header className="border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
          <span className="text-[11px] font-mono text-zinc-500">
            loadState: <span className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">{state}</span>{" "}
            · count: {items.length}
          </span>
        </header>
        <div className="max-h-[420px] overflow-y-auto">
          <InfiniteScroll
            items={items}
            getId={(r) => r.id}
            renderRow={(r) => (
              <>
                <div className="font-medium">{r.title}</div>
                <div className="text-[11px] text-zinc-500">{r.subtitle}</div>
              </>
            )}
            loadNext={loadNext}
            loadState={state}
            onLoadStateChange={onStateChange}
          />
        </div>
      </div>
      <p className="text-[11px] italic text-zinc-500">
        Scroll to the bottom — sentinel + IntersectionObserver pages in the next batch.
        After 4 pages the list reports exhausted. Each row carries a stable{" "}
        <code>data-item-id</code> so a bridge can address it.
      </p>
    </div>
  );
}
