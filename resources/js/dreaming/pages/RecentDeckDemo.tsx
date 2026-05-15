import { useEffect, useState } from "react";

export const USAGE = `import { RecentDeck } from "@particle-academy/react-fancy";

<RecentDeck
  items={items}                          // [{ id, label, icon, kind }]
  pinnedIds={pinnedIds}
  recentIds={recentIds}                  // most-recent first
  onJump={(id) => navigate(items.find(i => i.id === id))}
  onPin={(id) => setPinned([...pinnedIds, id])}
  onUnpin={(id) => setPinned(pinnedIds.filter(p => p !== id))}
  onReorderPins={(ids) => setPinned(ids)}
/>

// Bridge sketch:
// registerRecentDeckBridge(server, { adapter })
//   → deck_list()  deck_pin(id)  deck_unpin(id)  deck_jump(id)  deck_reorder(ids)
`;

/**
 * RecentDeck — persistent pinned + recent jump list (sidebar primitive).
 * Pinned items live above the divider in user-controlled order; recents
 * live below in MRU order. Both halves are JSON; agents pin/unpin/jump
 * via the bridge by stable id.
 */
type Item = {
  id: string;
  label: string;
  icon?: string;
  kind?: string;
  subtitle?: string;
};

function RecentDeck({
  items,
  pinnedIds,
  recentIds,
  selectedId,
  onJump,
  onPin,
  onUnpin,
  onReorderPins,
}: {
  items: Item[];
  pinnedIds: string[];
  recentIds: string[];
  selectedId?: string | null;
  onJump: (id: string) => void;
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
  onReorderPins: (ids: string[]) => void;
}) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const pinned = pinnedIds.map((id) => byId.get(id)).filter(Boolean) as Item[];
  const pinSet = new Set(pinnedIds);
  const recent = recentIds.map((id) => byId.get(id)).filter((i): i is Item => !!i && !pinSet.has(i.id));

  const movePin = (id: string, dir: -1 | 1) => {
    const idx = pinnedIds.indexOf(id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= pinnedIds.length) return;
    const copy = pinnedIds.slice();
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    onReorderPins(copy);
  };

  return (
    <aside
      data-fancy="recent-deck"
      className="w-64 overflow-hidden rounded-lg border border-zinc-200 bg-white text-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <header className="border-b border-zinc-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800">
        Pinned
      </header>
      {pinned.length === 0 && (
        <div className="px-3 py-3 text-[11px] italic text-zinc-400">
          Nothing pinned yet. Click the star on any recent item to pin it.
        </div>
      )}
      <ul>
        {pinned.map((it, i) => (
          <Row
            key={it.id}
            item={it}
            pinned
            isFirst={i === 0}
            isLast={i === pinned.length - 1}
            selected={it.id === selectedId}
            onJump={() => onJump(it.id)}
            onTogglePin={() => onUnpin(it.id)}
            onMoveUp={() => movePin(it.id, -1)}
            onMoveDown={() => movePin(it.id, 1)}
          />
        ))}
      </ul>

      <header className="border-y border-zinc-100 bg-zinc-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
        Recent
      </header>
      {recent.length === 0 && (
        <div className="px-3 py-3 text-[11px] italic text-zinc-400">No recent activity.</div>
      )}
      <ul>
        {recent.map((it) => (
          <Row
            key={it.id}
            item={it}
            selected={it.id === selectedId}
            onJump={() => onJump(it.id)}
            onTogglePin={() => onPin(it.id)}
          />
        ))}
      </ul>
    </aside>
  );
}

function Row({
  item,
  pinned,
  isFirst,
  isLast,
  selected,
  onJump,
  onTogglePin,
  onMoveUp,
  onMoveDown,
}: {
  item: Item;
  pinned?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  selected?: boolean;
  onJump: () => void;
  onTogglePin: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  return (
    <li
      data-item-id={item.id}
      data-pinned={pinned ? "true" : "false"}
      className={`group flex items-center gap-2 border-b border-zinc-50 px-2 py-1.5 last:border-b-0 dark:border-zinc-800 ${
        selected ? "bg-violet-50 dark:bg-violet-900/30" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
      }`}
    >
      <button onClick={onJump} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        {item.icon && <span className="text-base">{item.icon}</span>}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-medium">{item.label}</span>
          {item.subtitle && (
            <span className="block truncate text-[10px] text-zinc-500">{item.subtitle}</span>
          )}
        </span>
        {item.kind && (
          <span className="rounded bg-zinc-100 px-1 text-[9px] font-medium uppercase tracking-wider text-zinc-500 dark:bg-zinc-800">
            {item.kind}
          </span>
        )}
      </button>
      {pinned && onMoveUp && onMoveDown && (
        <span className="flex flex-col text-zinc-400 opacity-0 transition group-hover:opacity-100">
          <button onClick={onMoveUp} disabled={isFirst} className="text-[9px] disabled:opacity-30 hover:text-zinc-700 dark:hover:text-zinc-200">▲</button>
          <button onClick={onMoveDown} disabled={isLast} className="text-[9px] disabled:opacity-30 hover:text-zinc-700 dark:hover:text-zinc-200">▼</button>
        </span>
      )}
      <button
        onClick={onTogglePin}
        aria-label={pinned ? "Unpin" : "Pin"}
        className={`text-[12px] transition ${
          pinned ? "text-amber-500" : "text-zinc-300 opacity-0 group-hover:opacity-100 hover:text-amber-500"
        }`}
      >
        ★
      </button>
    </li>
  );
}

const ITEMS: Item[] = [
  { id: "inbox",      label: "Inbox",                    icon: "✉", kind: "page" },
  { id: "projects",   label: "Projects",                 icon: "▦", kind: "page" },
  { id: "doc-memo",   label: "Q4 board memo",            icon: "📄", kind: "doc", subtitle: "Documents / Particle Academy" },
  { id: "board-onb",  label: "Onboarding overhaul",      icon: "▩", kind: "board", subtitle: "Boards / Design" },
  { id: "ticket-1284", label: "ENG-1284 quote-resolution UX", icon: "↗", kind: "ticket", subtitle: "Engineering" },
  { id: "person-rita", label: "Rita Kumar",              icon: "◉", kind: "person", subtitle: "rita@particle.academy" },
  { id: "sheet-rev",  label: "Revenue Q4",               icon: "▥", kind: "sheet", subtitle: "Sheets / Finance" },
];

export function RecentDeckDemo() {
  const [pinned, setPinned] = useState<string[]>(["inbox", "projects"]);
  const [recent, setRecent] = useState<string[]>([
    "ticket-1284",
    "doc-memo",
    "board-onb",
    "person-rita",
    "sheet-rev",
  ]);
  const [selected, setSelected] = useState<string | null>("ticket-1284");

  const jump = (id: string) => {
    setSelected(id);
    setRecent((r) => [id, ...r.filter((x) => x !== id)].slice(0, 20));
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
      <RecentDeck
        items={ITEMS}
        pinnedIds={pinned}
        recentIds={recent}
        selectedId={selected}
        onJump={jump}
        onPin={(id) => setPinned((p) => [...p, id])}
        onUnpin={(id) => setPinned((p) => p.filter((x) => x !== id))}
        onReorderPins={setPinned}
      />
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-[11px] uppercase tracking-wider text-zinc-500">Active</div>
        <div className="mt-1 text-2xl font-semibold">
          {ITEMS.find((i) => i.id === selected)?.label ?? "Nothing selected"}
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          Pinned items stay across sessions; recents auto-trim. An agent bridge calls
          <code className="mx-1 rounded bg-zinc-100 px-1 dark:bg-zinc-800">deck_pin(id)</code>
          or
          <code className="mx-1 rounded bg-zinc-100 px-1 dark:bg-zinc-800">deck_jump(id)</code>
          without any DOM scraping — the deck is plain JSON.
        </p>
      </div>
    </div>
  );
}
