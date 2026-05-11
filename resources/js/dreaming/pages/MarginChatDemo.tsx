import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Margin Chat — anchored conversation primitive for agent-integrations.
 *
 * A slim chat thread docks beside a screen. Messages can embed
 * `@elementId` references (auto-detected from text). Hovering a
 * reference highlights the target element on the surface; clicking
 * scrolls to it. Lets humans and agents talk *about* the work without
 * losing the spatial context — replies stay anchored to the thing they
 * concern.
 *
 * The real implementation: each screen exposes a chat thread channel
 * over the SSE relay (`notifications/margin_chat`). Element targets are
 * resolved via the same `AgentTarget` shape used by presence + undo.
 */
type Author = {
  id: string;
  name: string;
  color: string;
  kind: "human" | "agent";
};

type Msg = {
  id: string;
  author: Author;
  body: string;
  at: number;
};

type Element = {
  id: string;
  label: string;
  /** Surface coords (px). */
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
};

const AUTHORS: Record<string, Author> = {
  you: { id: "you", name: "You", color: "#0ea5e9", kind: "human" },
  planner: { id: "planner", name: "Planner", color: "#a855f7", kind: "agent" },
  scribe: { id: "scribe", name: "Scribe", color: "#10b981", kind: "agent" },
};

const ELEMENTS: Element[] = [
  { id: "stickyHypothesis", label: "sticky · Hypothesis", x: 30, y: 30, w: 150, h: 100, color: "#fde68a" },
  { id: "stickyRisk", label: "sticky · Risk", x: 210, y: 60, w: 150, h: 100, color: "#fecaca" },
  { id: "stickyPlan", label: "sticky · Plan", x: 80, y: 170, w: 150, h: 100, color: "#bbf7d0" },
  { id: "stickyMetric", label: "sticky · Metric", x: 260, y: 180, w: 150, h: 100, color: "#bfdbfe" },
];

const REF_RE = /@([a-zA-Z][a-zA-Z0-9_-]*)/g;

const SEED: Msg[] = [
  {
    id: "m1",
    author: AUTHORS.planner,
    body: "Drafted @stickyHypothesis from the meeting notes. Worth challenging?",
    at: Date.now() - 180_000,
  },
  {
    id: "m2",
    author: AUTHORS.you,
    body: "Reads fine. @stickyRisk feels too narrow though.",
    at: Date.now() - 120_000,
  },
  {
    id: "m3",
    author: AUTHORS.scribe,
    body: "Splitting @stickyRisk into two cards on the next pass.",
    at: Date.now() - 60_000,
  },
];

export function MarginChatDemo() {
  const [messages, setMessages] = useState<Msg[]>(SEED);
  const [draft, setDraft] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);
  const [pulsed, setPulsed] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Detect refs in a body — return the set of element ids it mentions.
  const refsOf = useCallback((body: string): string[] => {
    const out: string[] = [];
    for (const m of body.matchAll(REF_RE)) out.push(m[1]);
    return out;
  }, []);

  const elementMap = useMemo(
    () => Object.fromEntries(ELEMENTS.map((e) => [e.id, e])),
    [],
  );

  const send = (author: Author) => {
    if (!draft.trim()) return;
    setMessages((cur) => [
      ...cur,
      { id: `m-${Date.now().toString(36)}`, author, body: draft.trim(), at: Date.now() },
    ]);
    setDraft("");
  };

  const simulateAgent = (id: string) => {
    const author = AUTHORS[id];
    const lines = [
      "@stickyMetric should reference the q3 baseline, not q2.",
      "Updated @stickyPlan to call out the rollout window.",
      "Flagging @stickyHypothesis — assumption isn't checked.",
      "@stickyRisk and @stickyMetric are coupled. Worth merging?",
    ];
    const body = lines[Math.floor(Math.random() * lines.length)];
    setMessages((cur) => [
      ...cur,
      { id: `m-${Date.now().toString(36)}`, author, body, at: Date.now() },
    ]);
  };

  // Scroll the messages pane to the bottom on new message.
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const pulseElement = useCallback((id: string) => {
    setPulsed(id);
    window.setTimeout(() => setPulsed((cur) => (cur === id ? null : cur)), 1100);
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Margin Chat</h1>
        <p className="mt-1 text-sm text-zinc-500">
          A chat thread docked beside a surface. Messages auto-link
          {" "}
          <code>@elementId</code> references — hover to highlight, click to
          pulse the target. Conversation stays anchored to the work.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 text-sm font-medium">Surface (whiteboard mock)</div>
          <div
            className="relative h-[340px] overflow-hidden rounded-md border border-dashed border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
          >
            {ELEMENTS.map((el) => {
              const isHovered = hovered === el.id;
              const isPulsed = pulsed === el.id;
              return (
                <div
                  key={el.id}
                  className={`absolute flex items-center justify-center rounded-md border-2 text-center text-[11px] font-medium shadow-sm transition ${
                    isHovered
                      ? "ring-2 ring-violet-500 ring-offset-1"
                      : "border-transparent"
                  } ${isPulsed ? "animate-pulse" : ""}`}
                  style={{
                    left: el.x,
                    top: el.y,
                    width: el.w,
                    height: el.h,
                    backgroundColor: el.color,
                    color: "#1f2937",
                  }}
                >
                  <div>
                    <div className="font-mono text-[9px] text-zinc-700">@{el.id}</div>
                    <div className="mt-0.5">{el.label.split("·")[1]?.trim()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="flex flex-col rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-3 py-2 text-sm font-medium dark:border-zinc-800">
            Margin chat
          </div>
          <div
            ref={messagesRef}
            className="flex-1 overflow-y-auto px-3 py-2"
            style={{ maxHeight: 280 }}
          >
            <ul className="space-y-2.5">
              {messages.map((m) => {
                const refs = refsOf(m.body);
                return (
                  <li key={m.id} className="text-[12px] leading-snug">
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className="font-medium"
                        style={{ color: m.author.color }}
                      >
                        {m.author.name}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-zinc-400">
                        {m.author.kind}
                      </span>
                      <span className="ml-auto text-[10px] text-zinc-400">
                        {new Date(m.at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="mt-0.5 text-zinc-700 dark:text-zinc-200">
                      {renderBody(m.body, elementMap, {
                        onHover: setHovered,
                        onClick: pulseElement,
                      })}
                    </div>
                    {refs.length > 0 && (
                      <div className="mt-0.5 flex flex-wrap gap-0.5 text-[10px] text-zinc-400">
                        refs:{" "}
                        {refs.map((r, i) => (
                          <span key={i}>
                            {elementMap[r] ? "✓" : "✗"} @{r}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type — use @id to reference. Try @stickyPlan"
              rows={2}
              className="w-full resize-none rounded border border-zinc-200 bg-transparent p-1.5 text-[12px] outline-none focus:border-violet-400 dark:border-zinc-800"
            />
            <div className="mt-1.5 flex flex-wrap gap-1">
              <button
                onClick={() => send(AUTHORS.you)}
                className="rounded-md bg-violet-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-violet-700"
              >
                send as You
              </button>
              <button
                onClick={() => simulateAgent("planner")}
                className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                + Planner says…
              </button>
              <button
                onClick={() => simulateAgent("scribe")}
                className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                + Scribe says…
              </button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function renderBody(
  body: string,
  elementMap: Record<string, Element>,
  handlers: { onHover: (id: string | null) => void; onClick: (id: string) => void },
) {
  const parts: Array<string | { id: string; ok: boolean }> = [];
  let last = 0;
  for (const m of body.matchAll(REF_RE)) {
    const start = m.index ?? 0;
    if (start > last) parts.push(body.slice(last, start));
    const id = m[1];
    parts.push({ id, ok: !!elementMap[id] });
    last = start + m[0].length;
  }
  if (last < body.length) parts.push(body.slice(last));
  return parts.map((p, i) =>
    typeof p === "string" ? (
      <span key={i}>{p}</span>
    ) : (
      <button
        key={i}
        onMouseEnter={() => handlers.onHover(p.id)}
        onMouseLeave={() => handlers.onHover(null)}
        onClick={() => p.ok && handlers.onClick(p.id)}
        className={`rounded px-1 font-mono text-[11px] ${
          p.ok
            ? "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:hover:bg-violet-500/25"
            : "bg-rose-100 text-rose-700 line-through dark:bg-rose-500/15 dark:text-rose-300"
        }`}
        title={p.ok ? "click to pulse on the surface" : "no such element"}
      >
        @{p.id}
      </button>
    ),
  );
}
