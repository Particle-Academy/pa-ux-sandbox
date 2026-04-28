import { useEffect, useRef, useState } from "react";
import {
  AccordionPanel,
  Action,
  Avatar,
  Badge,
  Card,
  Input,
  useAccordionSection,
} from "@particle-academy/react-fancy";

// ─────────────────────────────────────────────────────────────────────────
// Right-anchored flyout: a single horizontal AccordionPanel pinned to the
// right edge of the viewport with two sections — Canvas (wide) and Chat
// (medium). Both default closed, so only their chevron triggers sit on the
// edge until the user opens them.
//
// JSX order matters: each section renders <Content /> before <Trigger />,
// so the trigger ends up on the section's right edge — between the
// content and the next section to its right (or the viewport edge).
// Section openClassName sets the width when open; closed sections shrink
// to just the chevron button.
// ─────────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface CanvasNode {
  id: string;
  title: string;
  kind: "screen" | "section" | "asset";
  body: string;
}

const SEED_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    content: "Sketch an onboarding flow for the new analytics product.",
    timestamp: Date.now() - 1000 * 60 * 8,
  },
  {
    id: "m2",
    role: "assistant",
    content:
      "Drafted a four-step flow on the canvas — Welcome, Connect data source, Pick metrics, Invite team. Want me to merge step 3 into 2?",
    timestamp: Date.now() - 1000 * 60 * 7,
  },
  {
    id: "m3",
    role: "user",
    content: "Keep them separate, but make 'Invite team' optional.",
    timestamp: Date.now() - 1000 * 60 * 5,
  },
  {
    id: "m4",
    role: "assistant",
    content:
      "Marked step 4 as skippable. Open the canvas to inspect — the skip button is a soft outline so it doesn't compete with the primary CTA.",
    timestamp: Date.now() - 1000 * 60 * 4,
  },
];

const SEED_CANVAS: CanvasNode[] = [
  {
    id: "n1",
    title: "Welcome",
    kind: "screen",
    body: "Hero illustration · sign-in button · privacy note",
  },
  {
    id: "n2",
    title: "Connect data source",
    kind: "screen",
    body: "Provider grid · OAuth modal · validation toast",
  },
  {
    id: "n3",
    title: "Pick metrics",
    kind: "screen",
    body: "Multi-select chips · live preview chart",
  },
  {
    id: "n4",
    title: "Invite team",
    kind: "screen",
    body: "Email pillbox · skip link (soft outline) · CTA",
  },
];

function formatTime(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Workspace (the page behind the flyout)
// ─────────────────────────────────────────────────────────────────────────

function ProjectWorkspace({
  onAskAI,
}: {
  onAskAI: () => void;
}) {
  const projects = [
    {
      id: "p1",
      name: "Analytics onboarding",
      updated: "2m ago",
      thumb: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
    },
    {
      id: "p2",
      name: "Pricing redesign",
      updated: "yesterday",
      thumb: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
    },
    {
      id: "p3",
      name: "Mobile checkout",
      updated: "Tue",
      thumb: "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
    },
    {
      id: "p4",
      name: "Empty-state copy",
      updated: "last week",
      thumb: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
    },
    {
      id: "p5",
      name: "Help center IA",
      updated: "Apr 18",
      thumb: "linear-gradient(135deg, #64748b 0%, #1e293b 100%)",
    },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Top app bar */}
      <header className="flex items-center gap-3 border-b border-zinc-800 px-6 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-sm font-bold text-zinc-900">
          AI
        </div>
        <h1 className="text-sm font-semibold text-zinc-100">Studio</h1>
        <Badge color="green" size="sm">
          connected
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          <Action variant="ghost" size="sm" icon="search">
            Search
          </Action>
          <Action onClick={onAskAI} size="sm" color="violet" icon="sparkles">
            Ask AI
          </Action>
        </div>
      </header>

      {/* Project grid */}
      <main className="flex-1 overflow-auto px-6 py-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">
              Recent projects
            </h2>
            <p className="text-sm text-zinc-500">
              Open the AI panel to render mockups directly into a project's
              canvas.
            </p>
          </div>
          <Action size="sm" icon="plus" color="blue">
            New project
          </Action>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card
              key={p.id}
              variant="elevated"
              padding="none"
              className="overflow-hidden border-zinc-800 bg-zinc-900 hover:ring-1 hover:ring-zinc-700"
            >
              <div
                style={{ background: p.thumb }}
                className="aspect-video w-full"
              />
              <div className="space-y-1 p-4">
                <p className="text-sm font-medium text-zinc-100">{p.name}</p>
                <p className="text-xs text-zinc-500">updated {p.updated}</p>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Canvas (mock AI render area)
// ─────────────────────────────────────────────────────────────────────────

function AICanvas({ nodes }: { nodes: CanvasNode[] }) {
  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2">
        <h3 className="text-sm font-medium text-zinc-200">
          Canvas — Analytics onboarding
        </h3>
        <Badge color="zinc" size="sm">
          v3
        </Badge>
        <div className="ml-auto flex items-center gap-1">
          <Action variant="ghost" size="xs" icon="zoom-in" />
          <Action variant="ghost" size="xs" icon="zoom-out" />
          <Action variant="ghost" size="xs" icon="rotate-cw" />
          <Action variant="ghost" size="xs" icon="download" />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 gap-6">
          {nodes.map((n, i) => (
            <Card
              key={n.id}
              variant="elevated"
              padding="none"
              className="overflow-hidden border-zinc-700 bg-zinc-900"
            >
              <div className="border-b border-zinc-800 bg-zinc-950/50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Step {i + 1} · {n.kind}
                  </span>
                  <Badge color="zinc" size="sm">
                    auto
                  </Badge>
                </div>
                <p className="mt-1 text-sm font-medium text-zinc-100">
                  {n.title}
                </p>
              </div>
              <div className="space-y-2 p-3">
                <div className="aspect-[4/3] rounded-md bg-gradient-to-br from-zinc-800 to-zinc-900 ring-1 ring-zinc-800" />
                <p className="text-xs text-zinc-400">{n.body}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Chat panel
// ─────────────────────────────────────────────────────────────────────────

function ChatPanel({
  messages,
  onSend,
  onShowCanvas,
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onShowCanvas: () => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <Avatar fallback="AI" size="sm" />
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-100">AI assistant</p>
          <p className="text-[10px] text-zinc-500">
            generates renders into the canvas
          </p>
        </div>
        <Action
          variant="ghost"
          size="xs"
          icon="layout-grid"
          onClick={onShowCanvas}
          aria-label="Open canvas"
        />
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <Avatar fallback={m.role === "user" ? "You" : "AI"} size="sm" />
            <div
              className={`max-w-[260px] rounded-2xl px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-100"
              }`}
            >
              <div className="leading-relaxed">{m.content}</div>
              <div
                className={`mt-1 text-[10px] ${
                  m.role === "user" ? "text-blue-200" : "text-zinc-500"
                }`}
              >
                {formatTime(m.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions strip — also push the canvas open */}
      <div className="flex flex-wrap gap-1 border-t border-zinc-800 px-3 py-2">
        <Action variant="ghost" size="xs" onClick={onShowCanvas}>
          Render mockup
        </Action>
        <Action variant="ghost" size="xs" onClick={onShowCanvas}>
          Suggest layout
        </Action>
        <Action variant="ghost" size="xs">
          Refine copy
        </Action>
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

// ─────────────────────────────────────────────────────────────────────────
// Custom triggers — chunky vertical bars instead of the default chevron
// ─────────────────────────────────────────────────────────────────────────

function FlyoutTriggerBar({ label }: { label: string }) {
  const { toggle, orientation } = useAccordionSection();
  if (orientation !== "horizontal") return null;

  // Subtle full-height bar: hairline divider on the left edge, rotated
  // label centered along the strip. Background, border, and text all
  // brighten gently on hover so the bar reads as interactive without
  // shouting at idle.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="group relative flex h-full w-6 shrink-0 cursor-pointer items-center justify-center border-l border-zinc-800/60 bg-transparent text-zinc-600 transition-colors hover:border-zinc-700 hover:bg-zinc-900/60 hover:text-zinc-200"
    >
      <span className="rotate-180 text-[10px] font-medium uppercase tracking-[0.25em] opacity-70 transition-opacity group-hover:opacity-100 [writing-mode:vertical-rl]">
        {label}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Right-anchored flyout
// ─────────────────────────────────────────────────────────────────────────

function RightFlyout({
  open,
  setOpen,
  messages,
  canvasNodes,
  onSendMessage,
}: {
  open: string[];
  setOpen: (next: string[]) => void;
  messages: ChatMessage[];
  canvasNodes: CanvasNode[];
  onSendMessage: (text: string) => void;
}) {
  const showCanvas = () => {
    if (!open.includes("canvas")) setOpen([...open, "canvas"]);
  };

  return (
    <div
      data-react-fancy-ai-flyout=""
      className="pointer-events-auto fixed right-0 top-0 z-40 flex h-full"
      style={{
        boxShadow: open.length > 0 ? "-8px 0 24px rgba(0,0,0,.35)" : undefined,
      }}
    >
      <AccordionPanel
        orientation="horizontal"
        value={open}
        onValueChange={setOpen}
        className="h-full"
      >
        {/* Canvas section — opens to the LEFT of chat */}
        <AccordionPanel.Section
          id="canvas"
          unstyled
          className="items-stretch"
          openClassName="w-[min(720px,60vw)]"
        >
          <AccordionPanel.Content unstyled className="h-full w-full">
            <AICanvas nodes={canvasNodes} />
          </AccordionPanel.Content>
          <AccordionPanel.Trigger>
            <FlyoutTriggerBar label="Canvas" />
          </AccordionPanel.Trigger>
        </AccordionPanel.Section>

        {/* Chat section — sits on the right edge */}
        <AccordionPanel.Section
          id="chat"
          unstyled
          className="items-stretch"
          openClassName="w-[380px]"
        >
          <AccordionPanel.Content unstyled className="h-full w-full">
            <ChatPanel
              messages={messages}
              onSend={onSendMessage}
              onShowCanvas={showCanvas}
            />
          </AccordionPanel.Content>
          <AccordionPanel.Trigger>
            <FlyoutTriggerBar label="Chat" />
          </AccordionPanel.Trigger>
        </AccordionPanel.Section>
      </AccordionPanel>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────

export function AICanvasChatDemo() {
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES);
  const [canvasNodes] = useState<CanvasNode[]>(SEED_CANVAS);

  const handleSend = (text: string) => {
    const userMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Mock AI reply.
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now() + 1}`,
          role: "assistant",
          content:
            "Pushed an updated render to the canvas — open it on the left when you're ready.",
          timestamp: Date.now() + 1,
        },
      ]);
      // Auto-pop the canvas section so the user can see what was generated.
      setOpenSections((prev) =>
        prev.includes("canvas") ? prev : [...prev, "canvas"],
      );
    }, 700);
  };

  const askAI = () => {
    setOpenSections((prev) =>
      prev.includes("chat") ? prev : [...prev, "chat"],
    );
  };

  return (
    <div className="-m-6 relative flex h-[calc(100vh-3rem)] overflow-hidden bg-zinc-950 text-zinc-100">
      <ProjectWorkspace onAskAI={askAI} />
      <RightFlyout
        open={openSections}
        setOpen={setOpenSections}
        messages={messages}
        canvasNodes={canvasNodes}
        onSendMessage={handleSend}
      />
    </div>
  );
}
