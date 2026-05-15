import { ReactNode, useEffect, useRef, useState } from "react";

export const USAGE = `import { JumpHistory } from "@particle-academy/react-fancy";

<JumpHistory
  entries={history}                    // [{ id, title, kind, thumbnail? }]
  cursor={cursor}                      // index into entries
  onJump={(id) => setCursor(history.findIndex(e => e.id === id))}
  onBack={() => setCursor(c => Math.max(0, c - 1))}
  onForward={() => setCursor(c => Math.min(history.length - 1, c + 1))}
  triggerKey="Alt"                     // hold to summon
/>

// Bridge sketch:
// registerJumpHistoryBridge(server, { adapter })
//   → history_list()  history_jump(id)  history_cursor()
`;

/**
 * JumpHistory — alt-tab for in-app screens. Hold a modifier key to
 * summon; cycle entries with Tab; release to land. Each entry carries
 * a stable id + an optional thumbnail. The bridge exposes the same
 * shape so an agent can retrace its own or the user's path.
 */
type Entry = {
  id: string;
  title: string;
  kind?: string;
  thumbnail?: ReactNode;
  subtitle?: string;
};

function JumpHistory({
  entries,
  cursor,
  onJump,
  onBack,
  onForward,
  triggerKey = "Alt",
}: {
  entries: Entry[];
  cursor: number;
  onJump: (id: string) => void;
  onBack: () => void;
  onForward: () => void;
  triggerKey?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === triggerKey) setOpen(true);
      if (open && e.key === "Tab") {
        e.preventDefault();
        setHover((h) => {
          const cur = h ?? cursor;
          return e.shiftKey
            ? (cur - 1 + entries.length) % entries.length
            : (cur + 1) % entries.length;
        });
      }
      if (open && e.key === "Escape") setOpen(false);
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === triggerKey && open) {
        setOpen(false);
        if (hover !== null && entries[hover]) onJump(entries[hover].id);
        setHover(null);
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [open, hover, cursor, entries, onJump, triggerKey]);

  return (
    <div data-fancy="jump-history">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          disabled={cursor <= 0}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium disabled:opacity-40 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          ← back
        </button>
        <button
          onClick={onForward}
          disabled={cursor >= entries.length - 1}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium disabled:opacity-40 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          forward →
        </button>
        <span className="text-[11px] text-zinc-500">
          {cursor + 1} / {entries.length}
        </span>
        <span className="ml-auto rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:bg-zinc-800">
          hold {triggerKey} + Tab
        </span>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm">
          <div className="max-w-[90vw] overflow-x-auto rounded-xl border border-zinc-200 bg-white p-3 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-zinc-500">
              Jump history — Tab to navigate, release {triggerKey} to land
            </div>
            <ul className="flex gap-2">
              {entries.map((e, i) => {
                const selected = (hover ?? cursor) === i;
                return (
                  <li
                    key={e.id}
                    data-entry-id={e.id}
                    onMouseEnter={() => setHover(i)}
                    className={`min-w-[140px] rounded-lg border p-2 transition ${
                      selected
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-900/40"
                        : "border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <div className="flex h-16 items-center justify-center rounded bg-zinc-100 text-2xl dark:bg-zinc-800">
                      {e.thumbnail ?? "▦"}
                    </div>
                    <div className="mt-1.5 truncate text-[11px] font-medium">{e.title}</div>
                    {e.kind && (
                      <div className="text-[9px] uppercase tracking-wider text-zinc-400">
                        {e.kind}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

const SEED: Entry[] = [
  { id: "inbox", title: "Inbox", kind: "page", thumbnail: "✉" },
  { id: "ticket-1284", title: "ENG-1284 · quote-resolution UX", kind: "ticket", thumbnail: "↗" },
  { id: "doc-memo", title: "Q4 board memo", kind: "doc", thumbnail: "📄" },
  { id: "board-onb", title: "Onboarding overhaul", kind: "board", thumbnail: "▩" },
  { id: "sheet-rev", title: "Revenue Q4", kind: "sheet", thumbnail: "▥" },
  { id: "settings", title: "Settings", kind: "page", thumbnail: "⚙" },
];

export function JumpHistoryDemo() {
  const [cursor, setCursor] = useState(2);
  const [entries] = useState(SEED);
  const current = entries[cursor];
  const usingAlt = useRef(false);

  // Suppress the browser's native Alt menu while we use it as a modifier.
  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      if (e.key === "Alt") {
        usingAlt.current = true;
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", block);
    return () => window.removeEventListener("keydown", block);
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <JumpHistory
          entries={entries}
          cursor={cursor}
          onJump={(id) => setCursor(entries.findIndex((e) => e.id === id))}
          onBack={() => setCursor((c) => Math.max(0, c - 1))}
          onForward={() => setCursor((c) => Math.min(entries.length - 1, c + 1))}
          triggerKey="Alt"
        />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-[10px] uppercase tracking-wider text-zinc-500">Currently viewing</div>
        <div className="mt-1 text-xl font-semibold">{current.title}</div>
        <div className="text-sm text-zinc-500">{current.kind}</div>
      </div>

      <p className="text-[11px] italic text-zinc-500">
        Click back/forward, or <strong>hold Alt + press Tab</strong> to summon the
        carousel and cycle. Release Alt to land on the highlighted entry. Bridge tools
        let an agent inspect and jump the same way.
      </p>
    </div>
  );
}
