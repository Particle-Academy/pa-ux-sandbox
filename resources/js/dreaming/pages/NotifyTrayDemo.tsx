import { useMemo, useState } from "react";

export const USAGE = `import { NotifyTray } from "@particle-academy/react-fancy";

<NotifyTray
  notifications={notifications}    // [{ id, source, title, body, ts, unread }]
  groupBy="source"
  onSnooze={(id, until) => snooze(id, until)}
  onMute={(source) => mute(source)}
  onDismiss={(id) => dismiss(id)}
  onMarkGroupRead={(source) => markRead({ source })}
/>`;

/**
 * NotifyTray — edge-docked slide-in tray. Groups notifications by source,
 * each group collapses; per-item snooze / mute / dismiss; bulk
 * "mark group read". Unread count shown per group + total at the top.
 */
type Notification = {
  id: string;
  source: string;
  sourceIcon: string;
  title: string;
  body: string;
  ts: string;
  unread: boolean;
};

const SEED: Notification[] = [
  { id: "n1", source: "GitHub",   sourceIcon: "⎇", title: "PR #421 reviewed",       body: "Approved by @rita.",                        ts: "2m",  unread: true },
  { id: "n2", source: "GitHub",   sourceIcon: "⎇", title: "PR #418 has conflicts",   body: "Rebase on main.",                          ts: "14m", unread: true },
  { id: "n3", source: "Linear",   sourceIcon: "↗", title: "ENG-1284 assigned to you", body: "'Quote-resolution UX'",                   ts: "32m", unread: true },
  { id: "n4", source: "Slack",    sourceIcon: "✦", title: "Glenn mentioned you",      body: "in #design — 'thoughts on the new tray?'",  ts: "1h",  unread: true },
  { id: "n5", source: "Stripe",   sourceIcon: "$", title: "Charge succeeded",         body: "$29.00 from acme-robotics",               ts: "3h",  unread: false },
  { id: "n6", source: "Linear",   sourceIcon: "↗", title: "ENG-1190 closed",          body: "by @sam — 'fixed via #1283'",             ts: "5h",  unread: false },
];

export function NotifyTrayDemo() {
  const [items, setItems] = useState<Notification[]>(SEED);
  const [open, setOpen] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [muted, setMuted] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const m = new Map<string, Notification[]>();
    items.forEach((n) => {
      if (muted[n.source]) return;
      const g = m.get(n.source) ?? [];
      g.push(n);
      m.set(n.source, g);
    });
    return Array.from(m, ([source, list]) => ({
      source,
      icon: list[0].sourceIcon,
      list,
      unread: list.filter((n) => n.unread).length,
    }));
  }, [items, muted]);

  const totalUnread = groups.reduce((s, g) => s + g.unread, 0);

  const dismiss = (id: string) => setItems((it) => it.filter((n) => n.id !== id));
  const markGroupRead = (src: string) =>
    setItems((it) => it.map((n) => (n.source === src ? { ...n, unread: false } : n)));

  return (
    <div className="relative min-h-[420px]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      >
        {open ? "Close tray" : `Open tray (${totalUnread})`}
      </button>

      {open && (
        <aside className="absolute right-0 top-10 w-80 rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <header className="flex items-center justify-between border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
            <div className="text-sm font-semibold">Notifications</div>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
              {totalUnread} unread
            </span>
          </header>

          <div className="max-h-[360px] overflow-y-auto">
            {groups.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs italic text-zinc-400">
                Nothing here.
              </div>
            ) : (
              groups.map((g) => {
                const isCollapsed = collapsed[g.source];
                return (
                  <div key={g.source} className="border-b border-zinc-100 dark:border-zinc-800">
                    <header className="flex items-center gap-2 px-3 py-1.5 text-[11px]">
                      <button
                        onClick={() => setCollapsed((c) => ({ ...c, [g.source]: !isCollapsed }))}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        {isCollapsed ? "▸" : "▾"}
                      </button>
                      <span className="text-base">{g.icon}</span>
                      <span className="font-medium">{g.source}</span>
                      {g.unread > 0 && (
                        <span className="rounded bg-zinc-100 px-1 font-mono text-[10px] text-zinc-500 dark:bg-zinc-800">
                          {g.unread}
                        </span>
                      )}
                      <button
                        onClick={() => markGroupRead(g.source)}
                        className="ml-auto rounded px-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      >
                        ✓ all
                      </button>
                      <button
                        onClick={() => setMuted((m) => ({ ...m, [g.source]: true }))}
                        className="rounded px-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      >
                        🔕
                      </button>
                    </header>
                    {!isCollapsed && (
                      <ul>
                        {g.list.map((n) => (
                          <li
                            key={n.id}
                            className={`group flex gap-2 border-t border-zinc-50 px-3 py-2 dark:border-zinc-800 ${
                              n.unread ? "" : "opacity-60"
                            }`}
                          >
                            {n.unread && (
                              <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[12px] font-medium">{n.title}</div>
                              <div className="truncate text-[11px] text-zinc-500">{n.body}</div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end">
                              <span className="text-[10px] font-mono text-zinc-400">{n.ts}</span>
                              <button
                                onClick={() => dismiss(n.id)}
                                className="text-[10px] text-zinc-400 opacity-0 transition group-hover:opacity-100 hover:text-rose-500"
                              >
                                dismiss
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {Object.keys(muted).length > 0 && (
            <footer className="border-t border-zinc-100 px-3 py-1.5 text-[10px] text-zinc-500 dark:border-zinc-800">
              Muted: {Object.keys(muted).join(", ")} ·{" "}
              <button
                onClick={() => setMuted({})}
                className="underline-offset-2 hover:underline"
              >
                unmute all
              </button>
            </footer>
          )}
        </aside>
      )}
    </div>
  );
}
