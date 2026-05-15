import { ReactNode, useEffect, useMemo, useRef, useState } from "react";

export const USAGE = `import { CommandPalette } from "@particle-academy/react-fancy";

<CommandPalette
  open={open}
  onOpenChange={setOpen}
  query={query}
  onQueryChange={setQuery}
  sections={[
    { id: "nav",     label: "Go to",     commands: [
      { id: "go-inbox",    label: "Inbox",      hotkey: "g i" },
      { id: "go-projects", label: "Projects",   hotkey: "g p" },
    ]},
    { id: "create",  label: "Create",    commands: [
      { id: "new-doc",     label: "New document", hotkey: "n d" },
      { id: "new-board",   label: "New board",    hotkey: "n b" },
    ]},
  ]}
  onSelect={(cmd) => execute(cmd.id)}
/>

// Bridge sketch:
// registerCommandPaletteBridge(server, { adapter })
//   → palette_open()  palette_filter(q)  palette_execute(commandId)
`;

/**
 * CommandPalette — Cmd-K palette primitive. Controlled open/query/selection;
 * commands are plain JSON sections; stable ids per command; agents drive it
 * via a bridge that exposes palette_open / palette_filter / palette_execute.
 */
type Command = { id: string; label: string; hotkey?: string; hint?: string };
type Section = { id: string; label: string; commands: Command[] };

function CommandPalette({
  open,
  onOpenChange,
  query,
  onQueryChange,
  sections,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  query: string;
  onQueryChange: (next: string) => void;
  sections: Section[];
  onSelect: (cmd: Command) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({
        ...s,
        commands: s.commands.filter((c) => c.label.toLowerCase().includes(q)),
      }))
      .filter((s) => s.commands.length > 0);
  }, [sections, query]);

  const flat = useMemo(() => filtered.flatMap((s) => s.commands), [filtered]);
  const [cursor, setCursor] = useState(0);

  useEffect(() => setCursor(0), [query, open]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      } else if (open && e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      } else if (open && e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(c + 1, flat.length - 1));
      } else if (open && e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
      } else if (open && e.key === "Enter" && flat[cursor]) {
        e.preventDefault();
        onSelect(flat[cursor]);
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, flat, cursor, onOpenChange, onSelect]);

  if (!open) return null;

  let runningIdx = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-900/30 pt-24 backdrop-blur-sm">
      <div
        className="w-[520px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
        data-fancy="command-palette"
      >
        <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
          <span className="text-zinc-400">⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />
          <kbd className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800">
            Esc
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {flat.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs italic text-zinc-400">
              No matches.
            </div>
          ) : (
            filtered.map((s) => (
              <div key={s.id} data-section-id={s.id}>
                <div className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  {s.label}
                </div>
                <ul>
                  {s.commands.map((c) => {
                    const here = runningIdx === cursor;
                    runningIdx++;
                    return (
                      <li key={c.id}>
                        <button
                          data-command-id={c.id}
                          onMouseEnter={() => setCursor(flat.findIndex((x) => x.id === c.id))}
                          onClick={() => {
                            onSelect(c);
                            onOpenChange(false);
                          }}
                          className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition ${
                            here
                              ? "bg-violet-50 dark:bg-violet-900/40"
                              : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                          }`}
                        >
                          <span className="flex-1 truncate">{c.label}</span>
                          {c.hint && (
                            <span className="text-[10px] text-zinc-400">{c.hint}</span>
                          )}
                          {c.hotkey && (
                            <kbd className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:bg-zinc-800">
                              {c.hotkey}
                            </kbd>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-zinc-100 bg-zinc-50 px-3 py-1.5 text-[10px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
          <kbd className="rounded bg-white px-1 dark:bg-zinc-900">↑↓</kbd> nav ·{" "}
          <kbd className="rounded bg-white px-1 dark:bg-zinc-900">↵</kbd> run ·{" "}
          <kbd className="rounded bg-white px-1 dark:bg-zinc-900">⌘K</kbd> toggle
        </div>
      </div>
    </div>
  );
}

const SECTIONS: Section[] = [
  {
    id: "nav",
    label: "Go to",
    commands: [
      { id: "go-inbox", label: "Inbox", hotkey: "g i" },
      { id: "go-projects", label: "Projects", hotkey: "g p" },
      { id: "go-settings", label: "Settings", hotkey: "g s" },
    ],
  },
  {
    id: "create",
    label: "Create",
    commands: [
      { id: "new-doc", label: "New document", hotkey: "n d" },
      { id: "new-board", label: "New board", hotkey: "n b" },
      { id: "new-project", label: "New project", hint: "from template" },
    ],
  },
  {
    id: "actions",
    label: "Actions",
    commands: [
      { id: "invite", label: "Invite teammate" },
      { id: "export", label: "Export workspace" },
      { id: "toggle-theme", label: "Toggle dark mode", hotkey: "⌘⇧L" },
    ],
  },
];

export function CommandPaletteDemo() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [log, setLog] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-3 text-sm text-zinc-500">
          Press <kbd className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">⌘K</kbd> (or
          Ctrl-K) to open. Type to filter. Selection state and query are controlled,
          so an agent bridge can drive open / filter / execute end-to-end.
        </p>
        <button
          onClick={() => setOpen(true)}
          className="rounded-md bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700"
        >
          Open palette
        </button>
      </div>

      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        query={query}
        onQueryChange={setQuery}
        sections={SECTIONS}
        onSelect={(c) => setLog((l) => [`${new Date().toLocaleTimeString()} · ${c.id}`, ...l].slice(0, 6))}
      />

      <div className="rounded-lg border border-zinc-200 bg-white p-4 text-[11px] dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-1 font-medium">Execution log</div>
        {log.length === 0 ? (
          <div className="italic text-zinc-400">Nothing yet.</div>
        ) : (
          <ol className="space-y-0.5 font-mono text-zinc-600 dark:text-zinc-300">
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

// Silence unused-import warning for ReactNode in some TS configs
export type _Unused = ReactNode;
