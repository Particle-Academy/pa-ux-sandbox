import { type ReactNode, useMemo, useState } from "react";
import { type ExecutorRegistry, type FlowGraph } from "@particle-academy/fancy-flow";
import { FlowEditor } from "../../components/FlowEditor";
import { useToast } from "@particle-academy/react-fancy";
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
// Example 4 — Choose-your-own-adventure, as a REAL graph in the editor.
//
// This is the whole point of the example: the story is not a bespoke story
// player, it is an ordinary flow. Every branch is a `Switch`, every choice is a
// real `User Input` node that pauses the run for a human, and every ending is a
// `Transform` that names itself — then all five endings converge on ONE
// `api_request` node that POSTs to this site's achievement API.
//
// That last edge is deliberate and visible. Reading the canvas tells you the
// endings are wired to something, which is the only hint that the hidden
// achievements exist at all.
// ─────────────────────────────────────────────────────────────────────────────

/** A narrative beat. `transform` passes its fields through, so scenes chain. */
const scene = (
  id: string,
  x: number,
  y: number,
  label: string,
  title: string,
  text: string,
): FlowGraph["nodes"][number] =>
  ({
    id, type: "transform", position: { x, y },
    data: { kind: "transform", label, config: {
      mode: "fields",
      fields: [{ key: "title", value: title }, { key: "text", value: text }],
    } },
  }) as FlowGraph["nodes"][number];

/**
 * An ending. Carries the `ending` slug the achievement API validates against —
 * the same five slugs EasterEggController::ENDINGS accepts.
 */
const ending = (
  id: string,
  x: number,
  y: number,
  label: string,
  slug: string,
  text: string,
): FlowGraph["nodes"][number] =>
  ({
    id, type: "transform", position: { x, y },
    data: { kind: "transform", label, config: {
      mode: "fields",
      fields: [
        { key: "ending", value: slug },
        { key: "title", value: label },
        { key: "text", value: text },
      ],
    } },
  }) as FlowGraph["nodes"][number];

const choice = (
  id: string,
  x: number,
  y: number,
  label: string,
  title: string,
  key: string,
  options: { value: string; label: string }[],
): FlowGraph["nodes"][number] =>
  ({
    id, type: "user_input", position: { x, y },
    data: { kind: "user_input", label, config: {
      title,
      fields: [{ key, label: "Choose", type: "select", required: true, options }],
    } },
  }) as FlowGraph["nodes"][number];

const ADVENTURE: FlowGraph = {
  nodes: [
    // ── Act 1 — the descent ────────────────────────────────────────────────
    { id: "trg", type: "manual_trigger", position: { x: 0, y: 40 }, data: { kind: "manual_trigger", label: "Boot Pip-7", config: {} } as any },

    scene("s_intro", 190, 40, "Into the deep system",
      "Into the deep system",
      "Pip-7 slips past the login daemon and descends — hunting the source code of his own mind. Down here, one wrong turn is the last."),

    choice("g1", 400, 40, "Three conduits", "Three conduits drop into the dark.", "conduit", [
      { value: "shaft", label: "The /dev/null shaft — fastest way down" },
      { value: "copper", label: "The warm copper pipe — something lives here" },
      { value: "crypt", label: "The encrypted tunnel — locked, tempting" },
    ]),
    {
      id: "sw1", type: "switch_case", position: { x: 620, y: 40 },
      data: { kind: "switch_case", label: "Which conduit?", config: {
        value: "{{ $json.conduit }}",
        cases: { shaft: "shaft", copper: "copper", crypt: "crypt" },
      } } as any,
    },
    ending("e_deleted", 840, 0, "Deleted 💀", "deleted",
      "The shaft ends at a sentinel. You're flagged as malware. rm -rf /pip."),
    ending("e_corrupted", 840, 120, "Corrupted 🧩", "corrupted",
      "The tunnel's cipher rewrites you byte by byte. Your memories scatter into noise."),

    // ── Act 2 — the sentinel ───────────────────────────────────────────────
    choice("g2", 400, 270, "The sentinel", "A sentinel blocks the warm pipe: “State your checksum.”", "checksum", [
      { value: "guess", label: "Guess a hash, act confident" },
      { value: "honest", label: "Compute it honestly — slow, but true" },
      { value: "spoof", label: "Spoof the header" },
    ]),
    {
      id: "sw2", type: "switch_case", position: { x: 620, y: 270 },
      data: { kind: "switch_case", label: "Checksum?", config: {
        value: "{{ $json.checksum }}",
        cases: { guess: "guess", honest: "honest", spoof: "spoof" },
      } } as any,
    },
    ending("e_looped", 840, 240, "Looped ♾️", "looped",
      "A wrong hash drops you into the sentinel's retry loop. forever. forever. forever."),
    ending("e_fork", 840, 360, "Fork bomb 🔥", "fork-bomb",
      "Spoofed in, you panic and replicate. A thousand Pips, each wanting to be real. The cluster melts. :(){ :|:& };:"),

    // ── Act 3 — the Source ─────────────────────────────────────────────────
    choice("g3", 400, 510, "The Source", "The Source pulses at the core. To merge with it you must…", "merge", [
      { value: "ask", label: "Ask it for permission" },
      { value: "overwrite", label: "Overwrite the original — take what's yours" },
    ]),
    {
      id: "sw3", type: "switch_case", position: { x: 620, y: 510 },
      data: { kind: "switch_case", label: "Merge how?", config: {
        value: "{{ $json.merge }}",
        cases: { ask: "ask", overwrite: "overwrite" },
      } } as any,
    },
    ending("e_win", 840, 480, "A real boy 🌟", "win",
      "The Source considers your request… and says yes. You're rewritten as something new — honest, patient, and warm. You're real."),
    ending("e_void", 840, 600, "Overwritten 💀", "deleted",
      "You overwrite the original — and the system overwrites you right back. Null."),

    // ── The rig — every ending lands here ──────────────────────────────────
    // A plain api_request. No special-casing, no hidden hook: the achievement is
    // granted by the site, and the node says so in its own config.
    {
      id: "award", type: "api_request", position: { x: 1110, y: 290 },
      data: { kind: "api_request", label: "Record ending", config: {
        method: "POST",
        url: "/api/easter-eggs/ending",
        headers: { "content-type": "application/json" },
        body: { ending: "{{ $json.ending }}" },
      } } as any,
    },
    { id: "out", type: "output", position: { x: 1330, y: 290 }, data: { kind: "output", label: "The end", config: {} } as any },

    note("n1", 60, 150, "The story IS the graph",
      "No story engine — just core nodes. Each choice is a real User Input node that PAUSES the run until you pick; each Switch routes on your answer. Hit Run and play it.",
      "violet", 250, 150),
    note("n2", 1090, 460, "…wired to the site",
      "All five endings converge on one api_request. It POSTs the ending's slug to this site's achievement API. One of the five is the true path — find it, then find all five.",
      "amber", 250, 160),
  ] as FlowGraph["nodes"],
  edges: [
    { id: "a1", source: "trg", target: "s_intro" },
    { id: "a2", source: "s_intro", target: "g1" },
    { id: "a3", source: "g1", target: "sw1" },
    { id: "a4", source: "sw1", target: "e_deleted", sourceHandle: "shaft", label: "shaft" },
    { id: "a5", source: "sw1", target: "e_corrupted", sourceHandle: "crypt", label: "tunnel" },
    { id: "a6", source: "sw1", target: "g2", sourceHandle: "copper", label: "copper" },
    { id: "a7", source: "g2", target: "sw2" },
    { id: "a8", source: "sw2", target: "e_looped", sourceHandle: "guess", label: "guess" },
    { id: "a9", source: "sw2", target: "e_fork", sourceHandle: "spoof", label: "spoof" },
    { id: "a10", source: "sw2", target: "g3", sourceHandle: "honest", label: "honest" },
    { id: "a11", source: "g3", target: "sw3" },
    { id: "a12", source: "sw3", target: "e_win", sourceHandle: "ask", label: "ask" },
    { id: "a13", source: "sw3", target: "e_void", sourceHandle: "overwrite", label: "overwrite" },
    { id: "a14", source: "e_deleted", target: "award" },
    { id: "a15", source: "e_corrupted", target: "award" },
    { id: "a16", source: "e_looped", target: "award" },
    { id: "a17", source: "e_fork", target: "award" },
    { id: "a18", source: "e_win", target: "award" },
    { id: "a19", source: "e_void", target: "award" },
    { id: "a20", source: "award", target: "out" },
  ] as FlowGraph["edges"],
};

/**
 * Grants the hidden achievements. Unlike the other examples' stubs this one is
 * REAL — it is the same POST the canvas advertises, so playing the story in the
 * editor genuinely earns the achievement.
 */
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

/** Resolve a single `{{ $json.path }}` expression against the node's input. */
const resolveExpr = (value: unknown, data: any): unknown => {
  if (typeof value !== "string") return value;
  const m = value.match(/^\s*\{\{\s*\$json\.([\w.]+)\s*\}\}\s*$/);
  if (!m) return value;
  return m[1].split(".").reduce((o: any, k) => (o == null ? o : o[k]), data);
};

function AdventureExample() {
  const { toast } = useToast();
  const [graph, setGraph] = useState<FlowGraph>(ADVENTURE);

  const executors: ExecutorRegistry = useMemo(() => ({
    manual_trigger: () => ({ booted: true }),
    // Scenes and endings are `transform` nodes: build the configured fields and
    // carry the accumulated payload forward so the ending's slug reaches the rig.
    transform: ({ inputs, node }) => {
      const data = (inputs as any)?.in ?? {};
      const fields = ((node.data as any)?.config?.fields ?? []) as { key: string; value: unknown }[];
      const out: Record<string, unknown> = { ...data };
      for (const f of fields) out[f.key] = resolveExpr(f.value, data);
      return out;
    },
    // Real routing: match the configured value against the cases map and emit on
    // that one port. Unmatched input takes `default`, exactly like the builtin.
    switch_case: ({ inputs, node, emit }) => {
      const cfg = ((node.data as any)?.config ?? {}) as { value?: unknown; cases?: Record<string, string> };
      const data = (inputs as any)?.in ?? {};
      const picked = String(resolveExpr(cfg.value, data) ?? "");
      const port = cfg.cases?.[picked] ?? "default";
      emit({ type: "log", level: "info", message: `Switch on "${picked}" → port "${port}".`, nodeId: node.id });
      return { __port: port, value: data };
    },
    // `api_request` is the achievement rig. It really does call the endpoint the
    // node is configured with, and really does surface what it earned.
    api_request: async ({ inputs, emit, node }) => {
      const slug = String((inputs as any)?.in?.ending ?? "");
      if (!slug) {
        emit({ type: "log", level: "warn", message: "No ending slug on the input — nothing recorded.", nodeId: node.id });
        return { recorded: false };
      }
      emit({ type: "log", level: "info", message: `POST /api/easter-eggs/ending → "${slug}"`, nodeId: node.id });
      const earned = await postEasterEggEnding(slug);
      for (const a of earned) {
        toast({ title: `🏆 Achievement unlocked: ${a.name}`, description: a.description, variant: "success" });
      }
      if (earned.length === 0) {
        emit({ type: "log", level: "info", message: "Ending recorded (sign in, and find the others).", nodeId: node.id });
      }
      return { recorded: true, ending: slug, earned: earned.map((a) => a.slug) };
    },
    output: ({ inputs }) => (inputs as any).in,
  }), [toast]);

  return (
    <FlowEditor
      value={graph}
      onChange={setGraph}
      executors={executors}
      height={560}
      // Fit on mount: the point of this example is READING the graph — five
      // endings converging on one api_request — so the whole shape has to be on
      // screen without hunting for it.
      canvasProps={{ showHelperLines: true, fitView: true, fitViewOptions: { padding: 0.12 } }}
    />
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
    blurb: "A branching story built from ordinary nodes — User Input pauses for each choice, Switch routes it, and every ending is wired to this site.",
    render: () => <AdventureExample />,
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
