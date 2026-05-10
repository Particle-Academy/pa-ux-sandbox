import { useEffect, useRef, useState } from "react";
import {
  FlowEditor,
  useFlowRun,
  useFlowState,
  type ExecutorRegistry,
  type FlowGraph,
} from "@particle-academy/fancy-flow";
import "@xyflow/react/dist/style.css";
import "@particle-academy/fancy-flow/styles.css";
import {
  MicroMcpServer,
  attachInProcess,
  attachSseRelay,
  registerFlowBridge,
  ShareControls,
  createSessionDescriptor,
  type SessionDescriptor,
  type RelayState,
  type SseRelayTransport,
  type InProcessTransport,
} from "@particle-academy/agent-integrations";
import "@particle-academy/agent-integrations/styles.css";

const AGENT = { id: "agent", name: "Claude", color: "#a855f7" };

const SEED: FlowGraph = {
  nodes: [
    { id: "trigger-1", type: "manual_trigger", position: { x: 0, y: 80 }, data: { kind: "manual_trigger", label: "Manual run", config: {} } as any },
    { id: "user-1", type: "user_input", position: { x: 280, y: 80 }, data: { kind: "user_input", label: "Ask user", config: { title: "What can I help with?" } } as any },
    { id: "llm-1", type: "llm_call", position: { x: 560, y: 80 }, data: { kind: "llm_call", label: "LLM Call", config: { provider: "anthropic", model: "claude-sonnet-4-5" } } as any },
    { id: "out-1", type: "output", position: { x: 840, y: 80 }, data: { kind: "output", label: "Result", config: {} } as any },
  ],
  edges: [
    { id: "e1", source: "trigger-1", target: "user-1" },
    { id: "e2", source: "user-1", target: "llm-1" },
    { id: "e3", source: "llm-1", target: "out-1" },
  ],
};

/** Demo executors for the kinds the seed uses. Hosts wire their own real ones. */
const DEMO_EXECUTORS: ExecutorRegistry = {
  manual_trigger: () => ({ startedAt: Date.now() }),
  user_input: async ({ emit, node }) => {
    emit({ type: "log", level: "info", message: `Would prompt: ${(node.data as any).config?.title ?? "input"}`, nodeId: node.id });
    await delay(400);
    return { answer: "demo answer (host wires real form)" };
  },
  llm_call: async ({ inputs, emit, node }) => {
    emit({ type: "log", level: "info", message: "Stub LLM call (host wires real provider)", nodeId: node.id });
    await delay(700);
    return { reply: `(demo) you said: ${JSON.stringify(inputs)}` };
  },
  output: ({ inputs }) => (inputs as any).in,
};

export function WorkflowAgentDemo() {
  // Lightweight log routed to console — chat panel removed; the agent
  // talks back through the Claude Code session, not the in-page UI.
  const log = (entry: { kind: string; source: string; text: string }) => {
    // eslint-disable-next-line no-console
    console.log(`[${entry.source}] ${entry.text}`);
  };

  // The editor manages its own state internally via FlowEditor — but we
  // need a separate state hook here so we can plug into the MCP bridge,
  // not the inner editor's. The editor reports changes via onChange.
  const flow = useFlowState(SEED);
  const runner = useFlowRun();

  const refs = useRef({ nodes: flow.nodes, edges: flow.edges });
  useEffect(() => { refs.current = { nodes: flow.nodes, edges: flow.edges }; }, [flow.nodes, flow.edges]);

  // ── MCP server + flow bridge ──
  const serverRef = useRef<MicroMcpServer | null>(null);
  const inProcRef = useRef<InProcessTransport | null>(null);

  useEffect(() => {
    const server = new MicroMcpServer({
      info: { name: "workflow-session", version: "0.2.0" },
      instructions: "Authoring a fancy-flow workflow. Call flow_list_node_kinds to discover what's available, flow_get_node_schema for a kind's config, then flow_add_node + flow_connect to build.",
    });
    const bridge = registerFlowBridge(server, {
      adapter: {
        getNodes: () => refs.current.nodes,
        setNodes: (next) => flow.setNodes(typeof next === "function" ? next : () => next),
        getEdges: () => refs.current.edges,
        setEdges: (next) => flow.setEdges(typeof next === "function" ? next : () => next),
        run: async () => runner.run({ nodes: refs.current.nodes, edges: refs.current.edges }, DEMO_EXECUTORS),
        cancel: runner.cancel,
        setNodeStatus: (id, status, text) => {
          flow.setNodes((all) => all.map((n) => (n.id === id ? { ...n, data: { ...n.data, status, statusText: text } as any } : n)));
        },
      },
      agent: AGENT,
    });
    inProcRef.current = attachInProcess(server);
    serverRef.current = server;
    return () => {
      bridge.dispose();
      if (inProcRef.current) server.detach(inProcRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sharing ──
  const [session, setSession] = useState<SessionDescriptor | null>(null);
  const [relayState, setRelayState] = useState<RelayState>("idle");
  const sseRef = useRef<SseRelayTransport | null>(null);
  const logEsRef = useRef<EventSource | null>(null);

  const startShare = async () => {
    if (session || !serverRef.current) return;
    const desc = createSessionDescriptor();
    const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? "";
    const reg = await fetch("/whiteboard-share/register", {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrf, accept: "application/json" },
      body: JSON.stringify({ session: desc.id, token: desc.token }),
    });
    if (!reg.ok) {
      log({ kind: "error", source: "share", text: `Registration failed: HTTP ${reg.status}` });
      return;
    }
    const relay = attachSseRelay(serverRef.current, {
      baseUrl: "/whiteboard-share",
      sessionId: desc.id,
      token: desc.token,
    });
    sseRef.current = relay;
    relay.onStateChange(setRelayState);

    const es = new EventSource(`/whiteboard-share/${desc.id}/events?token=${desc.token}&direction=inbound`);
    es.addEventListener("mcp", (ev: MessageEvent) => {
      try {
        const frame = JSON.parse(ev.data);
        if (frame.method === "notifications/peer_joined") return log({ kind: "info", source: "presence", text: `${AGENT.name} connected` });
        if (frame.method === "notifications/peer_left") return log({ kind: "info", source: "presence", text: `${AGENT.name} disconnected` });
        if (frame.method === "notifications/agent_message") return log({ kind: "message", source: AGENT.name, text: String(frame.params?.text ?? "") });
        if (frame.method?.startsWith("notifications/")) return;
        log({ kind: "tool", source: "remote", text: `← ${frame.method ?? `id:${frame.id}`}`, detail: frame });
      } catch { /* noop */ }
    });
    logEsRef.current = es;

    setSession(desc);
    log({ kind: "info", source: "share", text: `Sharing started · session ${desc.id}` });
  };

  const stopShare = async () => {
    if (!session) return;
    const desc = session;
    setSession(null);
    logEsRef.current?.close();
    logEsRef.current = null;
    if (sseRef.current && serverRef.current) serverRef.current.detach(sseRef.current);
    sseRef.current = null;
    setRelayState("closed");
    const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? "";
    await fetch(`/whiteboard-share/${desc.id}/unregister?token=${encodeURIComponent(desc.token)}`, {
      method: "POST",
      headers: { "x-csrf-token": csrf, accept: "application/json" },
    }).catch(() => {});
    log({ kind: "info", source: "share", text: "Sharing stopped." });
  };

  const statusText = relayState === "open" ? "live" : relayState === "connecting" ? "connecting…" : relayState === "error" ? "error" : undefined;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Workflow — Agent Editor</h1>
        <p className="text-sm text-zinc-500">
          Schema-driven editor with the agentic kit (memory store, data store, user input, API request, LLM call, webhooks, etc).
          Drag a node from the palette, configure it in the right panel, run it. Agents call the same{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">flow_*</code> tools to author the same way.
        </p>
      </header>

      <div className="mb-4">
        <ShareControls session={session} onStart={startShare} onStop={stopShare} status={statusText} />
      </div>

      <FlowEditor
        value={{ nodes: flow.nodes, edges: flow.edges }}
        executors={DEMO_EXECUTORS}
        metadata={{ id: "workflow-agent-demo", name: "Workflow agent demo" }}
        height={760}
        onChange={(graph) => {
          flow.setNodes(graph.nodes);
          flow.setEdges(graph.edges);
        }}
      />
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
