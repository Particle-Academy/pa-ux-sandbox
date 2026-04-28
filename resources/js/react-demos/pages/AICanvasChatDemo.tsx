import { useEffect, useRef, useState } from "react";
import {
  AccordionPanel,
  Action,
  Avatar,
  Badge,
  Input,
  useAccordionSection,
} from "@particle-academy/react-fancy";

// Full-page demo: a mock AI chat with a canvas area whose tool/inspector
// panels live in vertical AccordionPanels. The chat header doubles as a
// horizontal AccordionPanel showing how the same component scales from
// menu-sized (top bar) to panel-sized (left + right rails).

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const SEED_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    content: "Help me design a checkout flow.",
    timestamp: Date.now() - 1000 * 60 * 6,
  },
  {
    id: "m2",
    role: "assistant",
    content:
      "I sketched a three-step flow on the canvas — Cart → Address → Payment. Want me to add a confirmation step or merge address into payment?",
    timestamp: Date.now() - 1000 * 60 * 5,
  },
  {
    id: "m3",
    role: "user",
    content: "Merge address into payment, and add a guest-checkout toggle.",
    timestamp: Date.now() - 1000 * 60 * 4,
  },
  {
    id: "m4",
    role: "assistant",
    content:
      "Done. The canvas now shows two steps with a guest-checkout toggle in step 1. Inspect any node on the right to tweak its props.",
    timestamp: Date.now() - 1000 * 60 * 3,
  },
];

function formatTime(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

// ── Top bar ─────────────────────────────────────────────────────────────

function TopBar() {
  return (
    <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-3 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-sm font-bold text-zinc-900">
        AI
      </div>

      <AccordionPanel
        orientation="horizontal"
        defaultValue={["nav", "tools"]}
        className="gap-1"
      >
        <AccordionPanel.Section id="home" pinned>
          <Action variant="ghost" icon="home" size="sm" />
        </AccordionPanel.Section>

        <AccordionPanel.Section id="nav">
          <AccordionPanel.Trigger />
          <AccordionPanel.Content>
            <Action variant="ghost" size="sm" icon="message-circle">
              Chat
            </Action>
            <Action variant="ghost" size="sm" icon="grid">
              Canvas
            </Action>
            <Action variant="ghost" size="sm" icon="file-text">
              Docs
            </Action>
          </AccordionPanel.Content>
        </AccordionPanel.Section>

        <AccordionPanel.Section id="tools">
          <AccordionPanel.Trigger />
          <AccordionPanel.Content>
            <Action variant="ghost" size="sm" icon="terminal">
              Tools
            </Action>
            <Action variant="ghost" size="sm" icon="search">
              Search
            </Action>
          </AccordionPanel.Content>
        </AccordionPanel.Section>

        <AccordionPanel.Section id="advanced">
          <AccordionPanel.Trigger />
          <AccordionPanel.Content>
            <Action variant="ghost" size="sm" icon="zap" color="amber">
              Run agent
            </Action>
            <Action variant="ghost" size="sm" icon="git-branch">
              Branch
            </Action>
          </AccordionPanel.Content>
        </AccordionPanel.Section>
      </AccordionPanel>

      <div className="ml-auto flex items-center gap-2">
        <Badge color="green" size="sm">connected</Badge>
        <Action variant="ghost" icon="settings" size="sm" />
      </div>
    </div>
  );
}

// ── Left rail (history) ────────────────────────────────────────────────

function LeftRail() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
      <AccordionPanel
        orientation="vertical"
        defaultValue={["recent", "starred"]}
        className="w-full p-2"
      >
        <AccordionPanel.Section id="recent">
          <AccordionPanel.Content className="w-full items-stretch">
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Recent
            </div>
            {[
              "Checkout flow design",
              "Onboarding wizard",
              "Empty state copy",
              "Pricing table A/B",
            ].map((title, i) => (
              <button
                key={i}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-900"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                <span className="truncate">{title}</span>
              </button>
            ))}
          </AccordionPanel.Content>
          <AccordionPanel.Trigger />
        </AccordionPanel.Section>

        <AccordionPanel.Section id="starred">
          <AccordionPanel.Content className="w-full items-stretch">
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Starred
            </div>
            {["Design system audit", "Q3 roadmap"].map((t, i) => (
              <button
                key={i}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-900"
              >
                <span className="text-amber-400">★</span>
                <span className="truncate">{t}</span>
              </button>
            ))}
          </AccordionPanel.Content>
          <AccordionPanel.Trigger />
        </AccordionPanel.Section>

        <AccordionPanel.Section id="archive">
          <AccordionPanel.Content className="w-full items-stretch">
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Archive
            </div>
            <p className="px-2 text-xs text-zinc-500">No archived chats.</p>
          </AccordionPanel.Content>
          <AccordionPanel.Trigger />
        </AccordionPanel.Section>
      </AccordionPanel>
    </aside>
  );
}

// ── Right rail (inspector) ─────────────────────────────────────────────

// Custom trigger demonstrating a labeled section header with a chevron.
function LabeledTrigger({ label }: { label: string }) {
  const { open, toggle } = useAccordionSection();
  return (
    <button
      type="button"
      onClick={toggle}
      className="flex w-full items-center justify-between border-y border-zinc-800 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-100"
    >
      <span>{label}</span>
      <span className={`transition-transform ${open ? "rotate-90" : ""}`}>›</span>
    </button>
  );
}

function RightRail() {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-zinc-800 bg-zinc-950">
      <AccordionPanel
        orientation="vertical"
        defaultValue={["inspector", "tools"]}
        className="w-full"
      >
        <AccordionPanel.Section id="inspector">
          <AccordionPanel.Trigger>
            <LabeledTrigger label="Inspector" />
          </AccordionPanel.Trigger>
          <AccordionPanel.Content className="w-full items-stretch px-3 py-2">
            <div className="text-xs text-zinc-300">
              <div className="mb-2 font-medium text-zinc-100">Selected: Step 1 — Cart</div>
              <dl className="space-y-1">
                {[
                  ["Type", "FlowStep"],
                  ["Title", "Cart"],
                  ["Items", "1 product"],
                  ["Guest checkout", "yes"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <dt className="text-zinc-500">{k}</dt>
                    <dd className="text-zinc-200">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </AccordionPanel.Content>
        </AccordionPanel.Section>

        <AccordionPanel.Section id="tools">
          <AccordionPanel.Trigger>
            <LabeledTrigger label="Tools" />
          </AccordionPanel.Trigger>
          <AccordionPanel.Content className="w-full items-stretch px-3 py-2 gap-1">
            <Action variant="ghost" size="sm" icon="zap" className="justify-start">
              Generate copy
            </Action>
            <Action variant="ghost" size="sm" icon="image" className="justify-start">
              Suggest layout
            </Action>
            <Action variant="ghost" size="sm" icon="check-circle" className="justify-start">
              Validate flow
            </Action>
          </AccordionPanel.Content>
        </AccordionPanel.Section>

        <AccordionPanel.Section id="history">
          <AccordionPanel.Trigger>
            <LabeledTrigger label="Canvas history" />
          </AccordionPanel.Trigger>
          <AccordionPanel.Content className="w-full items-stretch px-3 py-2">
            <ol className="space-y-1 text-xs text-zinc-400">
              <li>v3 · merged Address into Payment</li>
              <li>v2 · added guest-checkout toggle</li>
              <li>v1 · initial 3-step flow</li>
            </ol>
          </AccordionPanel.Content>
        </AccordionPanel.Section>
      </AccordionPanel>
    </aside>
  );
}

// ── Canvas (mock) ──────────────────────────────────────────────────────

function MockCanvas() {
  const steps = [
    { id: "cart", label: "Cart", sub: "1 product · guest checkout" },
    { id: "payment", label: "Payment + Address", sub: "Card or Apple Pay" },
  ];
  return (
    <div className="flex-1 bg-zinc-950 p-6 overflow-auto">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-300">Canvas — checkout-flow</h2>
        <div className="flex items-center gap-2">
          <Badge color="zinc" size="sm">v3</Badge>
          <Action variant="ghost" size="xs" icon="zoom-in" />
          <Action variant="ghost" size="xs" icon="zoom-out" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-4">
            <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-sm w-56">
              <div className="text-xs uppercase tracking-wide text-zinc-500">Step {i + 1}</div>
              <div className="mt-1 text-base font-semibold text-zinc-100">{s.label}</div>
              <div className="mt-2 text-xs text-zinc-400">{s.sub}</div>
            </div>
            {i < steps.length - 1 && <span className="text-zinc-600">→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Chat (mock) ────────────────────────────────────────────────────────

function ChatPane({
  messages,
  onSend,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  return (
    <div className="flex h-72 flex-col border-t border-zinc-800 bg-zinc-900">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <Avatar fallback={m.role === "user" ? "You" : "AI"} size="sm" />
            <div className={`max-w-md rounded-2xl px-3 py-2 text-sm ${
              m.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-100"
            }`}>
              <div>{m.content}</div>
              <div className={`mt-1 text-[10px] ${m.role === "user" ? "text-blue-200" : "text-zinc-500"}`}>
                {formatTime(m.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-zinc-800 p-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ask the AI to update the canvas…"
          className="flex-1"
        />
        <Action onClick={submit} icon="send" size="sm" color="blue" />
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────

export function AICanvasChatDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES);

  const handleSend = (text: string) => {
    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now() + 1}`,
          role: "assistant",
          content: "Updated. Check the canvas — I added that to step 1.",
          timestamp: Date.now() + 1,
        },
      ]);
    }, 600);
  };

  return (
    <div className="-m-6 flex h-[calc(100vh-3rem)] flex-col bg-zinc-950 text-zinc-100">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftRail />
        <main className="flex flex-1 flex-col overflow-hidden">
          <MockCanvas />
          <ChatPane messages={messages} onSend={handleSend} />
        </main>
        <RightRail />
      </div>
    </div>
  );
}
