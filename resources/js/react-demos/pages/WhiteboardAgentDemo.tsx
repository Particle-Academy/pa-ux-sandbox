import { useEffect, useMemo, useRef, useState } from "react";
import {
  Board,
  StickyNote,
  Drawing,
  Connector,
  Shape,
  CursorLayer,
  type StickyNoteItem,
  type ShapeItem,
  type ConnectorItem,
  type Stroke,
  type RemoteCursor,
  type Viewport,
} from "@particle-academy/fancy-whiteboard";
import "@particle-academy/fancy-whiteboard/styles.css";
import {
  MicroMcpServer,
  attachInProcess,
  AgentPanel,
  AgentCursor,
  AgentActivityHighlight,
  type AgentActivity,
  type InProcessTransport,
} from "@particle-academy/agent-integrations";
import { registerWhiteboardBridge } from "@particle-academy/agent-integrations/bridges/whiteboard";
import "@particle-academy/agent-integrations/styles.css";

const AGENT = { id: "claude", name: "Claude", color: "#a855f7" };

const SYSTEM_PROMPT = `You are Claude, collaborating live with the user on a shared whiteboard.

You can see the current board state in the conversation (it's prepended to the user's message each turn). When the user asks for something, use the whiteboard_* tools to actually do it on their canvas — they will see the changes appear instantly.

Guidelines:
- Be concrete and visual. If the user says "brainstorm five ideas about X", add 5 sticky notes laid out on the canvas, not a text list.
- Use realistic spacing: notes are typically 180×140; lay them out with ~40px gaps so they don't overlap.
- Use whiteboard_set_agent_cursor to "point" at things you're talking about — set it to where the action is, then move it as you work.
- Reference items by id when you respond, so the user can scan to them.
- Stop after 1-2 sentences of summary text once the work is done. The board IS the response.
- If you're unsure, ask before making destructive changes (delete_item).`;

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: any }
  | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };

type AnthropicMessage = {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
};

type AnthropicResponse = {
  id: string;
  role: "assistant";
  content: AnthropicContentBlock[];
  stop_reason: "end_turn" | "tool_use" | "max_tokens" | "stop_sequence";
};

export function WhiteboardAgentDemo() {
  // Whiteboard state.
  const [notes, setNotes] = useState<StickyNoteItem[]>([
    { id: "seed1", kind: "sticky", x: 80, y: 80, width: 200, height: 130, text: "Hi Claude — try `brainstorm 5 ideas to make our onboarding faster`", color: "#fde68a" },
  ]);
  const [shapes, setShapes] = useState<ShapeItem[]>([]);
  const [connectors, setConnectors] = useState<ConnectorItem[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [agentCursor, setAgentCursor] = useState<RemoteCursor | null>(null);

  // Agent / chat state.
  const [activity, setActivity] = useState<AgentActivity[]>([]);
  const [history, setHistory] = useState<AnthropicMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [highlight, setHighlight] = useState<{ id: string; bounds: { x: number; y: number; width: number; height: number }; pulseKey: number } | null>(null);

  // Refs to read latest state from inside async handlers without stale closures.
  const stateRefs = useRef({ notes, shapes, connectors, strokes, viewport });
  useEffect(() => { stateRefs.current = { notes, shapes, connectors, strokes, viewport }; }, [notes, shapes, connectors, strokes, viewport]);

  // Spin up the MCP server + whiteboard bridge once.
  const serverRef = useRef<MicroMcpServer | null>(null);
  const transportRef = useRef<InProcessTransport | null>(null);
  useEffect(() => {
    const server = new MicroMcpServer({
      info: { name: "whiteboard-session", version: "0.1.0" },
      instructions: SYSTEM_PROMPT,
    });
    const bridge = registerWhiteboardBridge(server, {
      adapter: {
        getNotes: () => stateRefs.current.notes,
        setNotes: (next) => setNotes(typeof next === "function" ? next : () => next),
        getShapes: () => stateRefs.current.shapes,
        setShapes: (next) => setShapes(typeof next === "function" ? next : () => next),
        getConnectors: () => stateRefs.current.connectors,
        setConnectors: (next) => setConnectors(typeof next === "function" ? next : () => next),
        getStrokes: () => stateRefs.current.strokes,
        setStrokes: (next) => setStrokes(typeof next === "function" ? next : () => next),
        getViewport: () => stateRefs.current.viewport,
        setViewport,
        setAgentCursor,
      },
      agent: AGENT,
    });
    transportRef.current = attachInProcess(server);
    serverRef.current = server;
    return () => {
      bridge.dispose();
      server.detach(transportRef.current!);
    };
  }, []);

  const log = (entry: Omit<AgentActivity, "id" | "at">) => {
    setActivity((all) => [
      ...all,
      { id: `a_${Date.now()}_${all.length}`, at: Date.now(), ...entry },
    ]);
  };

  const pulseItem = (id: string) => {
    const note = stateRefs.current.notes.find((n) => n.id === id);
    if (note) {
      setHighlight({ id, bounds: { x: note.x, y: note.y, width: note.width, height: note.height }, pulseKey: Date.now() });
      return;
    }
    const shape = stateRefs.current.shapes.find((s) => s.id === id);
    if (shape) {
      setHighlight({ id, bounds: { x: shape.x, y: shape.y, width: shape.width, height: shape.height }, pulseKey: Date.now() });
    }
  };

  /** Convert MCP tool defs (camelCase) to Anthropic tool defs (snake_case). */
  const buildAnthropicTools = () => {
    const server = serverRef.current;
    if (!server) return [];
    return server.listTools().map((t) => ({
      name: t.name,
      description: t.description ?? "",
      input_schema: t.inputSchema as any,
    }));
  };

  /** Execute one tool call against the in-process MCP server. Returns a string result. */
  const callTool = async (name: string, args: any): Promise<{ text: string; isError: boolean; structured?: any }> => {
    const transport = transportRef.current;
    if (!transport) return { text: "MCP transport not ready", isError: true };

    return await new Promise((resolve) => {
      const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const off = transport.onServerMessage((msg: any) => {
        if (msg.id !== id) return;
        off();
        if ("error" in msg) {
          resolve({ text: msg.error.message, isError: true });
        } else {
          const blocks = msg.result?.content ?? [];
          const text = blocks.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n");
          resolve({ text: text || "ok", isError: !!msg.result?.isError, structured: msg.result?.structuredContent });
        }
      });
      transport.deliver({ jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments: args } });
    });
  };

  /** One round-trip with Anthropic. May recurse if the model returns tool_use. */
  const runTurn = async (messages: AnthropicMessage[], depth = 0): Promise<AnthropicMessage[]> => {
    if (depth > 8) {
      log({ kind: "error", source: "loop", text: "Stopped after 8 tool rounds." });
      return messages;
    }

    const tools = buildAnthropicTools();
    const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? "";
    const res = await fetch("/whiteboard-agent/turn", {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrf, accept: "application/json" },
      body: JSON.stringify({ system: SYSTEM_PROMPT, tools, messages, max_tokens: 4096 }),
    });

    if (!res.ok) {
      const body = await res.text();
      log({ kind: "error", source: "anthropic", text: `HTTP ${res.status}`, detail: body });
      return messages;
    }
    const data: AnthropicResponse = await res.json();

    const assistantMsg: AnthropicMessage = { role: "assistant", content: data.content };
    const next = [...messages, assistantMsg];

    // Surface text + tool calls in the activity feed.
    for (const block of data.content) {
      if (block.type === "text" && block.text.trim()) {
        log({ kind: "message", source: "Claude", text: block.text });
      } else if (block.type === "tool_use") {
        log({ kind: "tool", source: block.name, text: `→ ${shortInput(block.input)}`, detail: block.input });
      }
    }

    if (data.stop_reason !== "tool_use") return next;

    // Execute every tool_use, gather results.
    const toolResults: AnthropicContentBlock[] = [];
    for (const block of data.content) {
      if (block.type !== "tool_use") continue;
      const result = await callTool(block.name, block.input ?? {});
      log({
        kind: result.isError ? "error" : "tool",
        source: block.name,
        text: `← ${result.text.slice(0, 200)}`,
        detail: result.structured ?? result.text,
      });
      // Pulse highlight if the result mentions an id we know.
      if (result.structured && typeof result.structured.id === "string") {
        setTimeout(() => pulseItem(result.structured.id), 30);
      }
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result.text,
        is_error: result.isError,
      });
    }

    const toolResultMsg: AnthropicMessage = { role: "user", content: toolResults };
    return runTurn([...next, toolResultMsg], depth + 1);
  };

  const handleSubmit = async (input: string) => {
    if (busy) return;
    setBusy(true);
    log({ kind: "message", source: "You", text: input });

    // Snapshot current board state and prepend to the user message so Claude can see it.
    const snapshot = {
      notes: stateRefs.current.notes,
      shapes: stateRefs.current.shapes,
      connectors: stateRefs.current.connectors,
      strokes_count: stateRefs.current.strokes.length,
      viewport: stateRefs.current.viewport,
    };
    const userMsg: AnthropicMessage = {
      role: "user",
      content: [
        { type: "text", text: `<board_state>\n${JSON.stringify(snapshot, null, 2)}\n</board_state>\n\n${input}` },
      ],
    };

    try {
      const next = await runTurn([...history, userMsg]);
      setHistory(next);
    } catch (e) {
      log({ kind: "error", source: "loop", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setNotes([]);
    setShapes([]);
    setConnectors([]);
    setStrokes([]);
    setHistory([]);
    setActivity([]);
    setAgentCursor(null);
    setHighlight(null);
  };

  // Convenience: keep refs of update fns (already wired via stateRefs). Layout below.
  const cursors: RemoteCursor[] = useMemo(() => (agentCursor ? [agentCursor] : []), [agentCursor]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Whiteboard — You & Claude</h1>
        <p className="text-sm text-zinc-500">
          Type a request in the agent panel. Claude sees your board state, decides which whiteboard tools to call,
          and the changes appear here in real time. Tools run via{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">@particle-academy/agent-integrations</code>{" "}
          (in-process MCP server + whiteboard bridge).
        </p>
      </header>

      <div className="grid grid-cols-[1fr_360px] gap-4">
        <div
          className="relative overflow-hidden rounded-xl border border-zinc-200 bg-[radial-gradient(circle_at_1px_1px,_#d4d4d8_1px,_transparent_0)] [background-size:20px_20px] dark:border-zinc-700 dark:bg-[radial-gradient(circle_at_1px_1px,_#3f3f46_1px,_transparent_0)]"
          style={{ height: 640 }}
        >
          <Board
            viewport={viewport}
            onViewportChange={setViewport}
            style={{ width: "100%", height: "100%" }}
          >
            {connectors.map((c) => {
              const a = resolveCenter(c.from, notes, shapes);
              const b = resolveCenter(c.to, notes, shapes);
              if (!a || !b) return null;
              return <Connector key={c.id} from={a} to={b} color={c.color ?? "#64748b"} width={2} />;
            })}
            {shapes.map((s) => (
              <Shape
                key={s.id}
                item={s}
                onChange={(next) => setShapes((all) => all.map((x) => (x.id === next.id ? next : x)))}
              />
            ))}
            {notes.map((n) => (
              <StickyNote
                key={n.id}
                item={n}
                onChange={(next) => setNotes((all) => all.map((x) => (x.id === next.id ? next : x)))}
              />
            ))}
            <CursorLayer cursors={cursors} />
            {agentCursor && (
              <AgentCursor
                x={agentCursor.x}
                y={agentCursor.y}
                name={agentCursor.name}
                color={agentCursor.color}
              />
            )}
            {highlight && (
              <AgentActivityHighlight
                x={highlight.bounds.x}
                y={highlight.bounds.y}
                width={highlight.bounds.width}
                height={highlight.bounds.height}
                color={AGENT.color}
                pulseKey={highlight.pulseKey}
              />
            )}
          </Board>

          <Drawing
            strokes={strokes}
            enabled={false}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          />
        </div>

        <div style={{ height: 640 }}>
          <AgentPanel
            agent={AGENT}
            activity={activity}
            onSubmit={handleSubmit}
            busy={busy}
            actions={
              <button
                onClick={reset}
                className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Reset
              </button>
            }
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Try: <em>brainstorm 5 ideas about onboarding</em> · <em>arrange the notes by theme</em>{" "}
        · <em>add a flowchart of our checkout funnel</em> · <em>draw an arrow from idea-1 to idea-3</em>.
      </p>
    </div>
  );
}

function resolveCenter(
  ref: ConnectorItem["from"],
  notes: StickyNoteItem[],
  shapes: ShapeItem[],
): { x: number; y: number } | null {
  if (typeof ref === "string") {
    const n = notes.find((x) => x.id === ref);
    if (n) return { x: n.x + n.width / 2, y: n.y + n.height / 2 };
    const s = shapes.find((x) => x.id === ref);
    if (s) return { x: s.x + s.width / 2, y: s.y + s.height / 2 };
    return null;
  }
  return ref;
}

function shortInput(input: any): string {
  try {
    const json = JSON.stringify(input);
    return json.length > 80 ? json.slice(0, 77) + "…" : json;
  } catch {
    return "(unserializable)";
  }
}
