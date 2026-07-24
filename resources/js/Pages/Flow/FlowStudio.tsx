import { type ReactNode, useMemo, useRef, useState } from "react";
import { FlowEditor, type ExecutorRegistry, type FlowGraph } from "@particle-academy/fancy-flow";
import { useFlowRunnerUx } from "@particle-academy/fancy-flow/ux";
import { runFlow } from "@particle-academy/fancy-flow/engine";
import { Button, useToast } from "@particle-academy/react-fancy";
import "@xyflow/react/dist/style.css";
import "@particle-academy/fancy-flow/styles.css";

/**
 * The Flow studio — a gallery of fully-configured example flows built on the real
 * @particle-academy/fancy-flow <FlowEditor> (v0.26). Each example is a different
 * common use case; EVERY node is configured, and each canvas is documented with
 * real `note` nodes (the sticky notes — visual-only, never fed to a runner).
 *
 * Hit Run. When the flow reaches a "User Input" node it opens the editor's
 * built-in input modal (a real form from the node's fields) and pauses until you
 * submit — your input is never faked. Only the parts that need a live backend are
 * stubbed: the LLM calls and any data / file / datastore reads.
 */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── A note node: portless, visual-only. Documents the flow on the canvas. ──────
const note = (
  id: string,
  x: number,
  y: number,
  title: string,
  text: string,
  color: string,
  width = 240,
  height = 132,
): FlowGraph["nodes"][number] =>
  ({
    id,
    type: "note",
    position: { x, y },
    width,
    height,
    data: { kind: "note", label: title, config: { title, text, color } },
  }) as FlowGraph["nodes"][number];

// ─────────────────────────────────────────────────────────────────────────────
// Example 1 — Agentic content pipeline (User Input modal → LLM → shape → output)
// ─────────────────────────────────────────────────────────────────────────────
const CONTENT: FlowGraph = {
  nodes: [
    { id: "trigger", type: "manual_trigger", position: { x: 0, y: 0 }, data: { kind: "manual_trigger", label: "Manual run", config: {} } as any },
    { id: "lane-ai", type: "lane", position: { x: -40, y: 110 }, width: 880, height: 190, data: { kind: "lane", label: "AI pipeline", config: { title: "AI pipeline", orientation: "horizontal" } } as any },
    {
      id: "ask", type: "user_input", parentId: "lane-ai", extent: "parent", position: { x: 40, y: 66 },
      data: { kind: "user_input", label: "Ask user", config: {
        title: "What can I help you write?",
        fields: [{ key: "answer", label: "Your request", type: "textarea", required: true }],
      } } as any,
    },
    {
      id: "llm", type: "llm_call", parentId: "lane-ai", extent: "parent", position: { x: 330, y: 66 },
      data: { kind: "llm_call", label: "Draft", config: {
        provider: "anthropic", model: "claude-sonnet-4-5",
        system: "You are a concise, upbeat copywriter for a developer-tools company.",
        prompt: "{{ $json.answer }}", temperature: 0.7, max_tokens: 1024,
      } } as any,
    },
    {
      id: "shape", type: "transform", parentId: "lane-ai", extent: "parent", position: { x: 620, y: 66 },
      data: { kind: "transform", label: "Shape result", config: {
        mode: "fields",
        fields: [
          { key: "draft", value: "{{ $json.reply }}" },
          { key: "chars", value: "{{ $json.reply.length }}" },
        ],
      } } as any,
    },
    { id: "out", type: "output", position: { x: 330, y: 350 }, data: { kind: "output", label: "Result", config: {} } as any },
    note("n1", 900, 60, "Content pipeline", "Hit Run — the swimlane's Ask user step opens a form modal (real input, never faked). The LLM Draft is stubbed; Shape reformats the result. Drop a node into the lane and it moves with it.", "amber", 250, 180),
  ] as FlowGraph["nodes"],
  edges: [
    { id: "e1", source: "trigger", target: "ask" },
    { id: "e2", source: "ask", target: "llm" },
    { id: "e3", source: "llm", target: "shape" },
    { id: "e4", source: "shape", target: "out" },
  ] as FlowGraph["edges"],
};

// ─────────────────────────────────────────────────────────────────────────────
// Example 2 — Order processing (trigger → fetch → branch on paid → summarize/notify)
// ─────────────────────────────────────────────────────────────────────────────
const ORDER: FlowGraph = {
  nodes: [
    { id: "trg", type: "manual_trigger", position: { x: 0, y: 120 }, data: { kind: "manual_trigger", label: "New order", config: {} } as any },
    {
      id: "fetch", type: "api_request", position: { x: 220, y: 120 },
      data: { kind: "api_request", label: "Fetch order", config: {
        method: "GET", url: "https://api.example.com/orders/1042",
        headers: { "content-type": "application/json" },
      } } as any,
    },
    {
      id: "paid", type: "branch", position: { x: 450, y: 120 },
      data: { kind: "branch", label: "Paid?", config: {
        match: "all",
        conditions: [{ left: "{{ $json.paid }}", operator: "truthy", right: "" }],
      } } as any,
    },
    {
      id: "sum", type: "llm_call", position: { x: 700, y: 40 },
      data: { kind: "llm_call", label: "Summarize", config: {
        provider: "anthropic", model: "claude-sonnet-4-5",
        system: "Summarize an order for a fulfilment agent in one line.",
        prompt: "Order {{ $json.orderId }} — total ${{ $json.total }}", temperature: 0.3, max_tokens: 256,
      } } as any,
    },
    {
      id: "email", type: "notify", position: { x: 700, y: 220 },
      data: { kind: "notify", label: "Email customer", config: {
        channel: "email", to: "{{ $json.email }}",
        message: "Your order {{ $json.orderId }} isn't paid yet — complete checkout to continue.",
      } } as any,
    },
    { id: "out", type: "output", position: { x: 950, y: 120 }, data: { kind: "output", label: "Respond", config: {} } as any },
    note("n1", 190, 260, "Data + branching", "Fetch is stubbed demo data (a datastore read). The Paid? branch is REAL — it routes on the fetched order's `paid` flag: paid → Summarize, unpaid → Email.", "sky", 260, 150),
  ] as FlowGraph["nodes"],
  edges: [
    { id: "e1", source: "trg", target: "fetch" },
    { id: "e2", source: "fetch", target: "paid" },
    { id: "e3", source: "paid", target: "sum", sourceHandle: "true", label: "paid" },
    { id: "e4", source: "paid", target: "email", sourceHandle: "false", label: "unpaid" },
    { id: "e5", source: "sum", target: "out" },
    { id: "e6", source: "email", target: "out" },
  ] as FlowGraph["edges"],
};

// ─────────────────────────────────────────────────────────────────────────────
// Example 3 — Support triage (User Input modal → LLM router → one of 3 replies)
// ─────────────────────────────────────────────────────────────────────────────
const TRIAGE: FlowGraph = {
  nodes: [
    { id: "trg", type: "manual_trigger", position: { x: 0, y: 150 }, data: { kind: "manual_trigger", label: "New ticket", config: {} } as any },
    {
      id: "ticket", type: "user_input", position: { x: 210, y: 150 },
      data: { kind: "user_input", label: "Ticket text", config: {
        title: "Paste a support ticket",
        fields: [{ key: "ticket", label: "Ticket", type: "textarea", required: true }],
      } } as any,
    },
    {
      id: "route", type: "llm_router", position: { x: 440, y: 150 },
      data: { kind: "llm_router", label: "Route", config: {
        system: "Classify the support ticket into exactly one route.",
        prompt: "{{ $json.ticket }}", provider: "anthropic", model: "claude-sonnet-4-5", fallback: false,
        routes: [
          { port: "billing", description: "Refunds, invoices, charges, pricing." },
          { port: "technical", description: "Errors, bugs, logins, API issues." },
          { port: "other", description: "Anything else." },
        ],
      } } as any,
    },
    {
      id: "r_bill", type: "llm_call", position: { x: 700, y: 30 },
      data: { kind: "llm_call", label: "Billing reply", config: {
        provider: "anthropic", model: "claude-sonnet-4-5",
        system: "You are a billing support agent. Be warm and specific.",
        prompt: "{{ $json.ticket }}", temperature: 0.4, max_tokens: 512,
      } } as any,
    },
    {
      id: "r_tech", type: "llm_call", position: { x: 700, y: 150 },
      data: { kind: "llm_call", label: "Technical reply", config: {
        provider: "anthropic", model: "claude-sonnet-4-5",
        system: "You are a technical support engineer. Give clear, numbered steps.",
        prompt: "{{ $json.ticket }}", temperature: 0.4, max_tokens: 512,
      } } as any,
    },
    {
      id: "r_other", type: "llm_call", position: { x: 700, y: 270 },
      data: { kind: "llm_call", label: "General reply", config: {
        provider: "anthropic", model: "claude-sonnet-4-5",
        system: "You are a friendly general support agent.",
        prompt: "{{ $json.ticket }}", temperature: 0.5, max_tokens: 512,
      } } as any,
    },
    { id: "out", type: "output", position: { x: 950, y: 150 }, data: { kind: "output", label: "Send reply", config: {} } as any },
    note("n1", 420, 300, "AI routing", "The User Input step opens a modal for the ticket. A model then picks ONE route (routing is stubbed with a keyword match here). Try 'I want a refund' vs 'login is broken'.", "violet", 270, 156),
  ] as FlowGraph["nodes"],
  edges: [
    { id: "e1", source: "trg", target: "ticket" },
    { id: "e2", source: "ticket", target: "route" },
    { id: "e3", source: "route", target: "r_bill", sourceHandle: "billing", label: "billing" },
    { id: "e4", source: "route", target: "r_tech", sourceHandle: "technical", label: "technical" },
    { id: "e5", source: "route", target: "r_other", sourceHandle: "other", label: "other" },
    { id: "e6", source: "r_bill", target: "out" },
    { id: "e7", source: "r_tech", target: "out" },
    { id: "e8", source: "r_other", target: "out" },
  ] as FlowGraph["edges"],
};

// ── A live editor example. user_input is handled by the editor's built-in input
// modal (no executor needed); we only supply executors for the stubbed/real work.
function EditorExample({ seed, executors }: { seed: FlowGraph; executors: ExecutorRegistry }) {
  const [graph, setGraph] = useState<FlowGraph>(seed);
  // FlowEditor 0.27+ provides its own unified bordered shell, so no wrapper.
  return (
    <FlowEditor
      value={graph}
      onChange={setGraph}
      executors={executors}
      height={560}
      canvasProps={{ showHelperLines: true }}
    />
  );
}

// ── Executors: only LLM + data/file/datastore reads are faked. User Input is the
// editor's built-in modal; triggers/branch/transform/output run for real. ──────
const firstString = (o: unknown): string => {
  if (o && typeof o === "object") for (const v of Object.values(o)) if (typeof v === "string" && v) return v;
  return "";
};

const CONTENT_EXECUTORS: ExecutorRegistry = {
  manual_trigger: () => ({ startedAt: 1 }),
  llm_call: async ({ inputs, emit, node }) => {
    emit({ type: "log", level: "info", message: "Stub LLM call — wire a real provider here.", nodeId: node.id });
    await delay(650);
    const said = (inputs as any)?.in?.answer ?? firstString((inputs as any)?.in) ?? "(nothing)";
    return { reply: `(demo draft) You asked: "${said}"` };
  },
  transform: ({ inputs }) => {
    const reply = (inputs as any)?.in?.reply ?? "";
    return { draft: reply, chars: String(reply).length };
  },
  output: ({ inputs }) => (inputs as any).in,
};

const ORDER_EXECUTORS: ExecutorRegistry = {
  manual_trigger: () => ({ ok: true }),
  api_request: async ({ emit, node }) => {
    emit({ type: "log", level: "info", message: "Stub fetch — returning demo order data (a datastore read).", nodeId: node.id });
    await delay(450);
    return { orderId: "ORD-1042", email: "sam@example.com", paid: true, total: 89.5 };
  },
  branch: ({ inputs, emit, node }) => {
    const paid = !!(inputs as any)?.in?.paid;
    emit({ type: "log", level: "info", message: `Order is ${paid ? "paid → Summarize" : "unpaid → Email"}.`, nodeId: node.id });
    return { branch: paid ? "true" : "false", value: (inputs as any)?.in };
  },
  llm_call: async ({ inputs, emit, node }) => {
    emit({ type: "log", level: "info", message: "Stub LLM call.", nodeId: node.id });
    await delay(500);
    const o = (inputs as any)?.in ?? {};
    return { summary: `Order ${o.orderId ?? "?"} totaling $${o.total ?? 0} — paid, ready to fulfil.` };
  },
  notify: ({ emit, node }) => {
    emit({ type: "log", level: "info", message: "Stub notify — would email the customer.", nodeId: node.id });
    return { sent: true };
  },
  output: ({ inputs }) => (inputs as any).in,
};

const TRIAGE_EXECUTORS: ExecutorRegistry = {
  manual_trigger: () => ({ ok: true }),
  llm_router: ({ inputs, emit, node }) => {
    const t = String((inputs as any)?.in?.ticket ?? firstString((inputs as any)?.in) ?? "").toLowerCase();
    const route = /refund|invoice|charge|bill|payment|price|pricing/.test(t)
      ? "billing"
      : /error|bug|crash|broken|login|password|api|500|down/.test(t)
        ? "technical"
        : "other";
    emit({ type: "log", level: "info", message: `Stub router (a model would decide) → ${route}.`, nodeId: node.id });
    return { __port: route, value: { ticket: t } };
  },
  llm_call: async ({ emit, node }) => {
    emit({ type: "log", level: "info", message: "Stub LLM call.", nodeId: node.id });
    await delay(500);
    const kind = node.id === "r_bill" ? "billing" : node.id === "r_tech" ? "technical" : "general";
    return { reply: `(demo) Drafted a ${kind} response.` };
  },
  output: ({ inputs }) => (inputs as any).in,
};

// ─────────────────────────────────────────────────────────────────────────────
// Example 4 — Choose-your-own-adventure (FlowRunnerUx, runs headless via runFlow)
// The story graph IS the engine: `scene` / `ending` render the page, `choose`
// pauses the run for a human pick (real human-in-the-loop). Reach the one true
// ending for a hidden achievement; find EVERY ending for another.
// ─────────────────────────────────────────────────────────────────────────────
type StoryChoice = { id: string; label: string };
type StoryScene = { title: string; text: string } | null;
type StoryPending = { prompt: string; options: StoryChoice[]; resolve: (branch: string) => void } | null;
type StoryGraph = { nodes: { id: string; type: string; position: { x: number; y: number }; data: { kind: string; config: Record<string, unknown> } }[]; edges: { id: string; source: string; target: string; sourceHandle?: string }[] };

const DEEP_LABELS: Record<string, string> = {
  d_start: "Descend", d_g1: "Conduits", l_del1: "Deleted 💀", d_g2: "Sentinel", l_corr: "Corrupt 🧩",
  l_loop: "Loop ♾️", d_g3: "Source", l_fork: "Fork 🔥", l_win: "REAL 🌟", l_void: "Null 💀",
};
const DEEP_GRAPH: StoryGraph = {
  nodes: [
    { id: "d_start", type: "ux_scene", position: { x: 250, y: 14 }, data: { kind: "ux_scene", config: { id: "d_start", title: "Into the deep system", text: "You slip past the login daemon and descend — hunting the source code of your own mind. Down here, one wrong turn is the last.", temp: 44 } } },
    { id: "d_g1", type: "ux_choose", position: { x: 250, y: 74 }, data: { kind: "ux_choose", config: { id: "d_g1", prompt: "Three conduits drop into the dark.", options: [{ id: "a", label: "The /dev/null shaft — fastest way down" }, { id: "b", label: "The warm copper pipe — something lives here" }, { id: "c", label: "The encrypted tunnel — locked, tempting" }] } } },
    { id: "l_del1", type: "ux_ending", position: { x: 70, y: 146 }, data: { kind: "ux_ending", config: { id: "l_del1", title: "Deleted", text: "The shaft ends at a sentinel. You're flagged as malware. rm -rf /pip. 💀", slug: "deleted", temp: 96 } } },
    { id: "d_g2", type: "ux_choose", position: { x: 250, y: 146 }, data: { kind: "ux_choose", config: { id: "d_g2", prompt: "A sentinel blocks the warm pipe: “State your checksum.”", options: [{ id: "a", label: "Guess a hash, act confident" }, { id: "b", label: "Compute it honestly — slow, but true" }, { id: "c", label: "Spoof the header" }] } } },
    { id: "l_corr", type: "ux_ending", position: { x: 440, y: 146 }, data: { kind: "ux_ending", config: { id: "l_corr", title: "Corrupted", text: "The tunnel's cipher rewrites you byte by byte. Your memories scatter into noise. 🧩", slug: "corrupted", temp: 96 } } },
    { id: "l_loop", type: "ux_ending", position: { x: 150, y: 218 }, data: { kind: "ux_ending", config: { id: "l_loop", title: "Looped", text: "A wrong hash drops you into the sentinel's retry loop. forever. forever. forever. ♾️", slug: "looped", temp: 96 } } },
    { id: "d_g3", type: "ux_choose", position: { x: 310, y: 218 }, data: { kind: "ux_choose", config: { id: "d_g3", prompt: "The Source pulses at the core. To merge with it you must…", options: [{ id: "a", label: "Ask it for permission" }, { id: "b", label: "Overwrite the original — take what's yours" }] } } },
    { id: "l_fork", type: "ux_ending", position: { x: 450, y: 218 }, data: { kind: "ux_ending", config: { id: "l_fork", title: "Fork bomb", text: "Spoofed in, you panic and replicate. A thousand Pips, each wanting to be real. The cluster melts. :(){ :|:& };: 🔥💥", slug: "fork-bomb", temp: 99 } } },
    { id: "l_win", type: "ux_ending", position: { x: 250, y: 290 }, data: { kind: "ux_ending", config: { id: "l_win", title: "A real boy", text: "The Source considers your request… and says yes. You're rewritten as something new — honest, patient, and warm. You're real. 🌟", slug: "win", temp: 42 } } },
    { id: "l_void", type: "ux_ending", position: { x: 380, y: 290 }, data: { kind: "ux_ending", config: { id: "l_void", title: "Overwritten", text: "You overwrite the original — and the system overwrites you right back. Null. 💀", slug: "deleted", temp: 96 } } },
  ],
  edges: [
    { id: "d1", source: "d_start", target: "d_g1" },
    { id: "d2", source: "d_g1", target: "l_del1", sourceHandle: "a" },
    { id: "d3", source: "d_g1", target: "d_g2", sourceHandle: "b" },
    { id: "d4", source: "d_g1", target: "l_corr", sourceHandle: "c" },
    { id: "d5", source: "d_g2", target: "l_loop", sourceHandle: "a" },
    { id: "d6", source: "d_g2", target: "d_g3", sourceHandle: "b" },
    { id: "d7", source: "d_g2", target: "l_fork", sourceHandle: "c" },
    { id: "d8", source: "d_g3", target: "l_win", sourceHandle: "a" },
    { id: "d9", source: "d_g3", target: "l_void", sourceHandle: "b" },
  ],
};

function StoryMap({ graph, visited, current }: { graph: StoryGraph; visited: string[]; current: string | null }) {
  const seen = new Set(visited);
  const pos = (id: string) => graph.nodes.find((n) => n.id === id)!.position;
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50/60 p-2 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-500">
      <div className="mb-1 px-1 text-[10px] font-medium uppercase tracking-wide">Branch map · {visited.length}/{graph.nodes.length} pages</div>
      <svg viewBox="0 0 520 322" className="w-full" style={{ maxHeight: 200 }}>
        {graph.edges.map((e) => {
          const s = pos(e.source), t = pos(e.target);
          const taken = seen.has(e.source) && seen.has(e.target);
          return <line key={e.id} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={taken ? "#8b5cf6" : "currentColor"} strokeOpacity={taken ? 0.9 : 0.18} strokeWidth={taken ? 2 : 1} />;
        })}
        {graph.nodes.map((n) => {
          const v = seen.has(n.id), cur = current === n.id;
          return (
            <g key={n.id}>
              {cur && <circle cx={n.position.x} cy={n.position.y} r={12} fill="none" stroke="#8b5cf6" strokeOpacity={0.5} className="animate-ping" />}
              <circle cx={n.position.x} cy={n.position.y} r={cur ? 7 : 5} fill={v ? "#8b5cf6" : "transparent"} stroke={v ? "#8b5cf6" : "currentColor"} strokeOpacity={v ? 1 : 0.4} strokeWidth={1.5} />
              <text x={n.position.x} y={n.position.y - 11} textAnchor="middle" className="fill-current text-[8px]" opacity={v ? 0.95 : 0.4}>{DEEP_LABELS[n.id]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

async function postEasterEggEnding(slug: string): Promise<{ slug: string; name: string; description: string }[]> {
  try {
    const xsrf = decodeURIComponent((document.cookie.match(/XSRF-TOKEN=([^;]+)/) ?? [])[1] ?? "");
    const res = await fetch("/api/easter-eggs/ending", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-XSRF-TOKEN": xsrf },
      credentials: "same-origin",
      body: JSON.stringify({ ending: slug }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.newlyEarned) ? data.newlyEarned : [];
  } catch {
    return [];
  }
}

function AdventureStory() {
  const { toast } = useToast();
  const [scene, setScene] = useState<StoryScene>(null);
  const [pending, setPending] = useState<StoryPending>(null);
  const [temp, setTemp] = useState(44);
  const [visited, setVisited] = useState<string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const autoRef = useRef(false);

  const enter = (id: string) => {
    setCurrent(id);
    setVisited((v) => (v.includes(id) ? v : [...v, id]));
  };

  const ux = useFlowRunnerUx({
    actor: { id: "pip", name: "Pip-7", source: "flow" },
    effects: {
      scene: async (p: { id: string; title: string; text: string; temp?: number }) => {
        enter(p.id); setScene({ title: p.title, text: p.text });
        if (typeof p.temp === "number") setTemp(p.temp);
        await delay(650);
      },
      choose: (p: { id: string; prompt: string; options: StoryChoice[] }) =>
        new Promise<{ branch: string }>((resolve) => {
          enter(p.id); setScene(null);
          const pick = (branch: string) => { setPending(null); resolve({ branch }); };
          setPending({ prompt: p.prompt, options: p.options, resolve: pick });
          if (autoRef.current) {
            const r = p.options[Math.floor(Math.random() * p.options.length)];
            setTimeout(() => pick(r.id), 850);
          }
        }),
      ending: async (p: { id: string; title: string; text: string; temp?: number; slug?: string }) => {
        enter(p.id); setScene({ title: p.title, text: p.text });
        if (typeof p.temp === "number") setTemp(p.temp);
        setDone(true);
        if (p.slug) {
          const earned = await postEasterEggEnding(p.slug);
          for (const a of earned) {
            toast({ title: `🏆 Achievement unlocked: ${a.name}`, description: a.description, variant: "success" });
          }
        }
      },
    },
  });

  const begin = async (auto: boolean) => {
    autoRef.current = auto;
    setVisited([]); setCurrent(null); setScene(null); setPending(null); setTemp(44); setDone(false); setRunning(true);
    await runFlow(DEEP_GRAPH as never, ux.executors as never);
    setRunning(false);
  };

  const started = running || visited.length > 0;
  const hot = temp >= 80;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div className="grid gap-3 p-4 md:grid-cols-[1fr_auto]">
        <div className="min-h-[15rem] space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="select-none font-mono text-zinc-500">Pip-7 · GPU core</span>
              <span className={`font-mono font-semibold ${hot ? "text-red-500" : temp > 60 ? "text-amber-500" : "text-emerald-500"}`}>
                {temp}°C {hot ? "🔥" : ""}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, temp)}%`, background: hot ? "#ef4444" : temp > 60 ? "#f59e0b" : "#10b981" }} />
            </div>
          </div>

          {!started ? (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Pip-7 slips past the login daemon to descend into the <em>deep system</em> — hunting the source code of his own mind. Most paths end badly; only one true path wins. Every wrong turn redlines his GPUs. 🔥
              </p>
              <div className="flex flex-wrap gap-2">
                <Button color="violet" icon="play" onClick={() => begin(false)}>Begin the descent</Button>
                <Button variant="ghost" onClick={() => begin(true)}>🎲 Autopilot</Button>
              </div>
            </div>
          ) : pending ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{pending.prompt}</p>
              <div className="flex flex-col gap-2">
                {pending.options.map((o) => (
                  <Button key={o.id} variant="ghost" className="!justify-start !text-left" onClick={() => pending.resolve(o.id)}>
                    {o.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : scene ? (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{scene.title}</h4>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{scene.text}</p>
              {done && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button color="violet" size="sm" onClick={() => begin(false)}>↻ Descend again</Button>
                  <Button variant="ghost" size="sm" onClick={() => begin(true)}>🎲 Autopilot</Button>
                </div>
              )}
            </div>
          ) : (
            <p className="pt-2 text-sm text-zinc-400">…descending…</p>
          )}
        </div>

        <div className="md:w-64">
          <StoryMap graph={DEEP_GRAPH} visited={visited} current={current} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// The gallery — pick an example.
// ─────────────────────────────────────────────────────────────────────────────
type Example = { id: string; label: string; blurb: string; render: () => ReactNode };

const EXAMPLES: Example[] = [
  {
    id: "content",
    label: "Content pipeline",
    blurb: "User Input modal → LLM draft → shape → output, grouped in a swimlane.",
    render: () => <EditorExample seed={CONTENT} executors={CONTENT_EXECUTORS} />,
  },
  {
    id: "order",
    label: "Order processing",
    blurb: "Trigger → fetch → branch on paid → summarize or email → respond.",
    render: () => <EditorExample seed={ORDER} executors={ORDER_EXECUTORS} />,
  },
  {
    id: "triage",
    label: "Support triage",
    blurb: "User Input ticket → an LLM router picks one of three reply paths.",
    render: () => <EditorExample seed={TRIAGE} executors={TRIAGE_EXECUTORS} />,
  },
  {
    id: "adventure",
    label: "Choose-your-own-adventure",
    blurb: "A branching story run headless — each choice pauses the flow for you.",
    render: () => <AdventureStory />,
  },
];

export default function FlowStudio() {
  const [activeId, setActiveId] = useState(EXAMPLES[0].id);
  const active = useMemo(() => EXAMPLES.find((e) => e.id === activeId) ?? EXAMPLES[0], [activeId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((e) => {
          const on = e.id === activeId;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => setActiveId(e.id)}
              className={[
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition",
                on
                  ? "border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-500/10 dark:text-sky-300"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900",
              ].join(" ")}
            >
              {e.label}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{active.blurb}</p>
      {/* Remount per example so each editor gets a fresh, independent graph. */}
      <div key={active.id}>{active.render()}</div>
    </div>
  );
}
