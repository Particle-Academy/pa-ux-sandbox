import { Kbd } from "@particle-academy/react-fancy";
import { useEffect, useMemo, useState } from "react";

export const USAGE = `import { KeymapExplorer, useKeymap } from "@particle-academy/react-fancy";

// In any component, register shortcuts for the current scope:
useKeymap([
  { keys: "g i",   scope: "Navigation", label: "Go to inbox",   onTrigger: () => navigate("/inbox") },
  { keys: "⌘k",    scope: "Global",     label: "Command palette", onTrigger: () => setPaletteOpen(true) },
]);

// Render the explorer once near the root:
<KeymapExplorer triggerKey="?" />

// Bridge sketch:
// registerKeymapBridge(server, { adapter })
//   → keymap_list()  keymap_trigger(id)
//   → agents discover what's bindable + invoke without sending fake keystrokes
`;

/**
 * KeymapExplorer — `?`-triggered overlay listing every keyboard shortcut
 * registered in the current scope. Searchable + group-by-scope. The
 * registry is the bridge surface: agents read keymap_list() to discover
 * what an app can do, and call keymap_trigger(id) to invoke without
 * synthesizing keystrokes.
 *
 * (Demo version uses a local registry instead of a real React context
 * for brevity — production primitive would expose useKeymap() that
 * subscribes/unsubscribes from a KeymapProvider.)
 */
type Shortcut = {
  id: string;
  keys: string;
  scope: string;
  label: string;
  onTrigger: () => void;
};

function KeymapExplorer({
  shortcuts,
  triggerKey = "?",
  onTrigger,
}: {
  shortcuts: Shortcut[];
  triggerKey?: string;
  onTrigger?: (s: Shortcut) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;
      if (inField) return;
      if (e.key === triggerKey) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [triggerKey, open]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return shortcuts;
    return shortcuts.filter(
      (s) =>
        s.label.toLowerCase().includes(needle) ||
        s.keys.toLowerCase().includes(needle) ||
        s.scope.toLowerCase().includes(needle),
    );
  }, [shortcuts, q]);

  const grouped = useMemo(() => {
    const m = new Map<string, Shortcut[]>();
    filtered.forEach((s) => {
      const arr = m.get(s.scope) ?? [];
      arr.push(s);
      m.set(s.scope, arr);
    });
    return Array.from(m, ([scope, list]) => ({ scope, list }));
  }, [filtered]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-900/30 pt-24 backdrop-blur-sm">
      <div className="w-[560px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        <header className="flex items-center justify-between border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
          <div className="text-sm font-semibold">Keyboard shortcuts</div>
          <Kbd>
            Esc
          </Kbd>
        </header>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          placeholder="Filter…"
          className="block w-full border-b border-zinc-100 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-400 dark:border-zinc-800"
        />
        <div className="max-h-80 overflow-y-auto">
          {grouped.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs italic text-zinc-400">No shortcuts match.</div>
          ) : (
            grouped.map(({ scope, list }) => (
              <div key={scope}>
                <div className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  {scope}
                </div>
                <ul>
                  {list.map((s) => (
                    <li key={s.id}>
                      <button
                        data-shortcut-id={s.id}
                        onClick={() => {
                          s.onTrigger();
                          onTrigger?.(s);
                          setOpen(false);
                        }}
                        className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        <span>{s.label}</span>
                        <KeysBadge keys={s.keys} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-zinc-100 bg-zinc-50 px-3 py-1.5 text-[10px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
          <Kbd>?</Kbd> toggle ·{" "}
          <Kbd>Esc</Kbd> close
        </div>
      </div>
    </div>
  );
}

function KeysBadge({ keys }: { keys: string }) {
  return (
    <span className="inline-flex gap-1">
      {keys.split(" ").map((k, i) => (
        <kbd
          key={i}
          className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}

const REGISTRY: Shortcut[] = [
  { id: "go-inbox", keys: "g i", scope: "Navigation", label: "Go to inbox", onTrigger: () => undefined },
  { id: "go-projects", keys: "g p", scope: "Navigation", label: "Go to projects", onTrigger: () => undefined },
  { id: "go-settings", keys: "g s", scope: "Navigation", label: "Go to settings", onTrigger: () => undefined },
  { id: "palette", keys: "⌘ k", scope: "Global", label: "Open command palette", onTrigger: () => undefined },
  { id: "theme", keys: "⌘ ⇧ l", scope: "Global", label: "Toggle dark mode", onTrigger: () => undefined },
  { id: "new-doc", keys: "n d", scope: "Create", label: "New document", onTrigger: () => undefined },
  { id: "new-board", keys: "n b", scope: "Create", label: "New board", onTrigger: () => undefined },
  { id: "save", keys: "⌘ s", scope: "Editor", label: "Save", onTrigger: () => undefined },
  { id: "find", keys: "⌘ f", scope: "Editor", label: "Find in document", onTrigger: () => undefined },
  { id: "replace", keys: "⌘ ⌥ f", scope: "Editor", label: "Find and replace", onTrigger: () => undefined },
];

export function KeymapExplorerDemo() {
  const [log, setLog] = useState<string[]>([]);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p>
          Press <Kbd>?</Kbd> to open the
          keyboard-shortcut explorer. Filter, click a row to invoke. An MCP bridge could
          enumerate this same registry as discoverable tools — an agent can ask "what can I
          drive?" without scraping menus.
        </p>
      </div>

      <KeymapExplorer
        shortcuts={REGISTRY.map((s) => ({
          ...s,
          onTrigger: () => setLog((l) => [`triggered ${s.id}`, ...l].slice(0, 6)),
        }))}
      />

      <div className="rounded-lg border border-zinc-200 bg-white p-3 text-[11px] dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-1 font-medium">Invocation log</div>
        {log.length === 0 ? (
          <div className="italic text-zinc-400">No shortcuts invoked yet.</div>
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
