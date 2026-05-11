import { useCallback, useMemo, useState } from "react";
import {
  Board,
  StickyNote,
  CursorLayer,
  type StickyNoteItem,
  type RemoteCursor,
  type Viewport,
} from "@particle-academy/fancy-whiteboard";
import "@particle-academy/fancy-whiteboard/styles.css";

/**
 * Agent Playground — lean lobby + one shared whiteboard surface.
 *
 * Agents are local state for now (in-app = simulated marker + cursor;
 * external = placeholder for relay-driven joins). The dreaming loop is
 * expected to extend this with real presence wiring, more surfaces, and
 * the speculative components it dreams up.
 */
type Agent = {
  id: string;
  name: string;
  color: string;
  kind: "in-app" | "external";
};

const AGENT_COLORS = [
  "#a855f7", "#3b82f6", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#14b8a6", "#8b5cf6",
];

const INITIAL_NOTES: StickyNoteItem[] = [
  { id: "n1", kind: "sticky", x: 80, y: 60, width: 200, height: 140, text: "Drop ideas here. Agents will too.", color: "#fde68a" },
];

export function Playground() {
  const [agents, setAgents] = useState<Agent[]>([
    { id: "you", name: "You (Human)", color: "#0ea5e9", kind: "in-app" },
  ]);
  const [notes, setNotes] = useState<StickyNoteItem[]>(INITIAL_NOTES);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });

  const cursors = useMemo<RemoteCursor[]>(
    () =>
      agents
        .filter((a) => a.id !== "you")
        .map((a, i) => ({
          userId: a.id,
          name: a.name,
          color: a.color,
          x: 220 + (i % 4) * 140,
          y: 220 + Math.floor(i / 4) * 90,
        })),
    [agents],
  );

  const addAgent = useCallback((kind: Agent["kind"]) => {
    setAgents((cur) => {
      const n = cur.length;
      return [
        ...cur,
        {
          id: `${kind}-${Date.now().toString(36)}-${n}`,
          name: kind === "in-app" ? `Agent ${n}` : `External ${n}`,
          color: AGENT_COLORS[n % AGENT_COLORS.length],
          kind,
        },
      ];
    });
  }, []);

  const removeAgent = useCallback((id: string) => {
    if (id === "you") return;
    setAgents((cur) => cur.filter((a) => a.id !== id));
  }, []);

  const updateNote = (next: StickyNoteItem) =>
    setNotes((all) => all.map((x) => (x.id === next.id ? next : x)));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Agent Playground</h1>
        <p className="mt-1 text-sm text-zinc-500">
          A lean lobby and one shared surface. Add in-app or external agents
          and watch them collaborate. New surfaces and presence primitives land
          here as the dreaming loop runs.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium">Lobby</div>
          <div className="flex gap-2">
            <button
              onClick={() => addAgent("in-app")}
              className="rounded-md bg-violet-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-700"
            >
              + In-app agent
            </button>
            <button
              onClick={() => addAgent("external")}
              className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              + External agent
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {agents.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: a.color + "22", color: a.color }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: a.color }}
              />
              {a.name}
              <span className="text-[9px] uppercase tracking-wider opacity-60">
                {a.kind}
              </span>
              {a.id !== "you" && (
                <button
                  onClick={() => removeAgent(a.id)}
                  className="ml-0.5 opacity-50 hover:opacity-100"
                  title="Remove"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 text-sm font-medium">Shared Whiteboard</div>
        <div className="h-[480px] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
          <Board viewport={viewport} onViewportChange={setViewport}>
            {notes.map((n) => (
              <StickyNote key={n.id} item={n} onChange={updateNote} />
            ))}
            <CursorLayer cursors={cursors} />
          </Board>
        </div>
        <div className="mt-2 text-[11px] text-zinc-500">
          {notes.length} note(s) · {cursors.length} remote cursor(s)
        </div>
      </section>
    </div>
  );
}
