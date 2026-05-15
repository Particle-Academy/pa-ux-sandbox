import { ReactNode, useMemo, useState } from "react";

export const USAGE = `import { GroupedTray } from "@particle-academy/react-fancy";

<GroupedTray
  items={items}
  groupBy={(it) => it.source}
  renderGroupHeader={(g) => <><Icon name={g.key} /> {g.key}</>}
  renderItem={(it) => <><b>{it.title}</b> · {it.body}</>}
  itemActions={(it) => [
    { label: "snooze",  onClick: () => snooze(it.id) },
    { label: "dismiss", onClick: () => dismiss(it.id) },
  ]}
  groupActions={(g) => [
    { label: "mark all read", onClick: () => markRead(g.items) },
    { label: "mute",          onClick: () => mute(g.key) },
  ]}
  unreadKey="unread"           // optional: highlight + show counts
/>`;

/**
 * GroupedTray — generic over item shape and group-by key. The demo
 * shows notifications, but the same component renders a folder-grouped
 * file list, ticket-by-source queue, or build-by-pipeline feed.
 */
function GroupedTray<T>({
  items,
  groupBy,
  renderGroupHeader,
  renderItem,
  itemActions,
  groupActions,
  unreadKey,
  trailing,
  emptyHint = "Nothing here.",
}: {
  items: T[];
  groupBy: (item: T) => string;
  renderGroupHeader: (group: { key: string; items: T[] }) => ReactNode;
  renderItem: (item: T) => ReactNode;
  itemActions?: (item: T) => { label: string; onClick: () => void }[];
  groupActions?: (group: { key: string; items: T[] }) => { label: string; onClick: () => void }[];
  unreadKey?: keyof T;
  trailing?: (item: T) => ReactNode;
  emptyHint?: string;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const m = new Map<string, T[]>();
    items.forEach((it) => {
      const k = groupBy(it);
      const arr = m.get(k) ?? [];
      arr.push(it);
      m.set(k, arr);
    });
    return Array.from(m, ([key, list]) => ({ key, items: list }));
  }, [items, groupBy]);

  if (groups.length === 0) {
    return (
      <div className="px-3 py-8 text-center text-xs italic text-zinc-400">{emptyHint}</div>
    );
  }

  return (
    <div className="max-h-[420px] overflow-y-auto">
      {groups.map((g) => {
        const isCollapsed = collapsed[g.key];
        const unread = unreadKey ? g.items.filter((i) => i[unreadKey]).length : 0;
        return (
          <div key={g.key} className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800">
            <header className="flex items-center gap-2 px-3 py-1.5 text-[11px]">
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [g.key]: !isCollapsed }))}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                {isCollapsed ? "▸" : "▾"}
              </button>
              <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
                {renderGroupHeader(g)}
                {unread > 0 && (
                  <span className="rounded bg-zinc-100 px-1 font-mono text-[10px] text-zinc-500 dark:bg-zinc-800">
                    {unread}
                  </span>
                )}
              </span>
              {groupActions?.(g).map((a) => (
                <button
                  key={a.label}
                  onClick={a.onClick}
                  className="rounded px-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  {a.label}
                </button>
              ))}
            </header>
            {!isCollapsed && (
              <ul>
                {g.items.map((it, i) => (
                  <li
                    key={i}
                    className={`group flex items-center gap-2 border-t border-zinc-50 px-3 py-2 dark:border-zinc-800 ${
                      unreadKey && !it[unreadKey] ? "opacity-60" : ""
                    }`}
                  >
                    {unreadKey && it[unreadKey] && (
                      <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                    )}
                    <div className="min-w-0 flex-1 text-[12px]">{renderItem(it)}</div>
                    {trailing && (
                      <span className="shrink-0 text-[10px] text-zinc-400">{trailing(it)}</span>
                    )}
                    {itemActions && (
                      <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                        {itemActions(it).map((a) => (
                          <button
                            key={a.label}
                            onClick={a.onClick}
                            className="rounded px-1 text-[10px] text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

type N = {
  id: string;
  source: string;
  icon: string;
  title: string;
  body: string;
  ts: string;
  unread: boolean;
};

const SEED: N[] = [
  { id: "n1", source: "GitHub", icon: "⎇", title: "PR #421 reviewed",   body: "Approved by @rita.",                       ts: "2m",  unread: true },
  { id: "n2", source: "GitHub", icon: "⎇", title: "PR #418 conflicts",  body: "Rebase on main.",                          ts: "14m", unread: true },
  { id: "n3", source: "Linear", icon: "↗", title: "ENG-1284 assigned",  body: "'Quote-resolution UX'",                    ts: "32m", unread: true },
  { id: "n4", source: "Slack",  icon: "✦", title: "Glenn mentioned you", body: "in #design — 'thoughts on the new tray?'", ts: "1h",  unread: true },
  { id: "n5", source: "Stripe", icon: "$", title: "Charge succeeded",   body: "$29.00 from acme-robotics",                ts: "3h",  unread: false },
  { id: "n6", source: "Linear", icon: "↗", title: "ENG-1190 closed",    body: "by @sam — 'fixed via #1283'",              ts: "5h",  unread: false },
];

export function GroupedTrayDemo() {
  const [items, setItems] = useState<N[]>(SEED);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <header className="border-b border-zinc-100 px-3 py-2 text-sm font-semibold dark:border-zinc-800">
        Notifications
      </header>
      <GroupedTray
        items={items}
        groupBy={(n) => n.source}
        unreadKey="unread"
        renderGroupHeader={(g) => (
          <>
            <span className="text-base">{g.items[0].icon}</span>
            <span className="font-medium">{g.key}</span>
          </>
        )}
        renderItem={(n) => (
          <>
            <div className="truncate font-medium">{n.title}</div>
            <div className="truncate text-zinc-500">{n.body}</div>
          </>
        )}
        trailing={(n) => n.ts}
        itemActions={(n) => [
          {
            label: "snooze",
            onClick: () =>
              setItems((all) => all.map((x) => (x.id === n.id ? { ...x, unread: false } : x))),
          },
          {
            label: "dismiss",
            onClick: () => setItems((all) => all.filter((x) => x.id !== n.id)),
          },
        ]}
        groupActions={(g) => [
          {
            label: "✓ all",
            onClick: () =>
              setItems((all) =>
                all.map((x) => (x.source === g.key ? { ...x, unread: false } : x)),
              ),
          },
        ]}
      />
    </div>
  );
}
