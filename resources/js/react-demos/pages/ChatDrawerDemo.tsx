import { useState } from "react";
import {
  PromptInput,
  ChatDrawer,
  Card,
  Icon,
} from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

type Tool = {
  id: string;
  name: string;
  icon: string;
  description?: string;
  category?: string;
  isFolder?: boolean;
  count?: number;
};

const TOOL_FOLDERS: Tool[] = [
  { id: "deal-docs", name: "Deal Documents", icon: "folder", isFolder: true, count: 2 },
  { id: "diagnostics", name: "Diagnostics", icon: "folder", isFolder: true, count: 2 },
  { id: "discovery", name: "Discovery & Pl…", icon: "folder", isFolder: true, count: 2 },
  { id: "email-author", name: "Email Author (…", icon: "sparkles", description: "Prepares context-aware sales emails for reps,…" },
  { id: "onboarding", name: "Onboarding", icon: "folder", isFolder: true, count: 4 },
];

const DEAL_TOOLS: Tool[] = [
  { id: "deal-summary", name: "Deal Summary…", icon: "file-text", description: "Generates a formatted Word doc…" },
  { id: "email", name: "Email Author…", icon: "sparkles", description: "Prepares context-aware sales e…" },
  { id: "product", name: "Product Broc…", icon: "presentation", description: "Generates a professional produ…" },
  { id: "solutions", name: "Solutions Ma…", icon: "users", description: "Paste a discovery call transcr…" },
];

const DEAL_QUICK_ACTIONS = [
  { id: "analyze", label: "Analyze", icon: "bar-chart-3" },
  { id: "next-steps", label: "Next Steps", icon: "arrow-right-circle" },
  { id: "summary", label: "Summary", icon: "file-text" },
  { id: "risks", label: "Risks", icon: "alert-triangle" },
];

const FILES = [
  { id: "1", name: "discovery-call.txt", size: "12 KB" },
  { id: "2", name: "rfp-response-v3.docx", size: "284 KB" },
  { id: "3", name: "pricing-sheet.xlsx", size: "48 KB" },
];

const PROMPTS = [
  { id: "p1", title: "Draft a follow-up email", body: "Use the last call transcript to draft a follow-up…" },
  { id: "p2", title: "Identify deal risks", body: "Surface the top 3 risks for this opportunity…" },
  { id: "p3", title: "Summarize for executive", body: "One-page exec summary, BLUF…" },
];

export function ChatDrawerDemo() {
  const [tab, setTab] = useState("tools");
  const [open, setOpen] = useState(true);
  const [sent, setSent] = useState<Array<{ text: string; at: number }>>([]);

  const tabs = [
    { id: "files", label: "Files" },
    { id: "tools", label: "Chat Tools" },
    { id: "prompts", label: "Chat Prompts" },
    { id: "deal", label: "IBM Analytics Platform", number: null as null },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">ChatDrawer</h1>
        <p className="mt-2 text-zinc-500">
          A tabbed, collapsible drawer that mounts in <code className="font-mono text-[12px]">PromptInput</code>'s
          {" "}<code className="font-mono text-[12px]">aboveInput</code> slot, so the drawer and composer share one
          rounded shell. Switch tabs to swap context (tools, files, prompts, deal-specific actions).
        </p>
      </header>

      <DemoSection
        title="Composed with PromptInput"
        description="The drawer renders inside the composer's rounded shell. Click the chevron to collapse."
      >
        <Card>
          <div className="p-4">
            <PromptInput
              budgetTokens={200_000}
              placeholder={tab === "deal" ? "Ask about this deal…" : "Type a message…"}
              onSubmit={(text) =>
                setSent((cur) => [{ text, at: Date.now() }, ...cur].slice(0, 6))
              }
              aboveInput={
                <ChatDrawer
                  tabs={tabs}
                  activeTabId={tab}
                  onTabChange={setTab}
                  open={open}
                  onToggle={setOpen}
                >
                  {tab === "files" && <FilesPanel />}
                  {tab === "tools" && <ToolsGridPanel tools={TOOL_FOLDERS} />}
                  {tab === "prompts" && <PromptsPanel />}
                  {tab === "deal" && <DealPanel />}
                </ChatDrawer>
              }
            />
          </div>
        </Card>
      </DemoSection>

      <DemoSection title="Sent log" description="Latest submissions.">
        <Card>
          <div className="p-4">
            {sent.length === 0 ? (
              <div className="text-[11px] italic text-zinc-400">Nothing sent yet.</div>
            ) : (
              <ul className="space-y-2">
                {sent.map((s) => (
                  <li
                    key={s.at}
                    className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12px] dark:border-zinc-800 dark:bg-zinc-900/60"
                  >
                    <div className="font-mono text-[10px] text-zinc-400">
                      {new Date(s.at).toLocaleTimeString()}
                    </div>
                    <div className="mt-0.5 whitespace-pre-wrap text-zinc-700 dark:text-zinc-200">
                      {s.text}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </DemoSection>
    </div>
  );
}

function ToolsGridPanel({ tools }: { tools: Tool[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {tools.map((t) => (
        <button
          key={t.id}
          type="button"
          className="group flex flex-col items-start gap-1 rounded-lg border border-violet-500/40 bg-violet-500/5 p-2.5 text-left transition hover:border-violet-500/70 hover:bg-violet-500/10"
        >
          <div className="flex w-full items-center gap-1.5">
            <Icon name={t.icon} className="h-3.5 w-3.5 text-violet-400" />
            <span className="flex-1 truncate text-[12px] font-medium text-zinc-200">
              {t.name}
            </span>
            {t.isFolder && (
              <Icon name="chevron-right" className="h-3 w-3 text-zinc-500" />
            )}
          </div>
          {t.isFolder && (
            <div className="text-[10px] text-zinc-500">{t.count} tools</div>
          )}
          {t.description && (
            <div className="line-clamp-2 text-[10px] text-zinc-500">
              {t.description}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

function FilesPanel() {
  return (
    <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
      {FILES.map((f) => (
        <li
          key={f.id}
          className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white/40 px-2.5 py-1.5 text-[12px] dark:border-zinc-700 dark:bg-zinc-900/40"
        >
          <Icon name="file" className="h-3.5 w-3.5 text-zinc-400" />
          <span className="flex-1 truncate text-zinc-200">{f.name}</span>
          <span className="font-mono text-[10px] text-zinc-500">{f.size}</span>
        </li>
      ))}
    </ul>
  );
}

function PromptsPanel() {
  return (
    <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
      {PROMPTS.map((p) => (
        <li
          key={p.id}
          className="rounded-md border border-zinc-200 bg-white/40 px-2.5 py-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-900/40"
        >
          <div className="font-medium text-zinc-200">{p.title}</div>
          <div className="mt-0.5 line-clamp-2 text-[10px] text-zinc-500">{p.body}</div>
        </li>
      ))}
    </ul>
  );
}

function DealPanel() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[220px_1fr]">
      {/* Deal card */}
      <div className="rounded-lg border border-violet-500/40 bg-violet-500/5 p-2.5">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/30">
            <Icon name="building-2" className="h-4 w-4 text-violet-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-semibold text-zinc-100">
              IBM Analytics Platform
            </div>
            <div className="text-[10px] text-zinc-500">IBM Corporation</div>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
          <dt className="flex items-center gap-1 text-emerald-400">
            <Icon name="dollar-sign" className="h-3 w-3" /> $3,200,000.00
          </dt>
          <dd className="flex items-center gap-1 text-violet-300">
            <Icon name="tag" className="h-3 w-3" /> Enterprise Deal
          </dd>
          <dt className="flex items-center gap-1 text-amber-400">
            <Icon name="trending-up" className="h-3 w-3" /> $1,600,000.00
          </dt>
          <dd className="flex items-center gap-1 text-blue-300">
            <Icon name="activity" className="h-3 w-3" /> In Progress
          </dd>
        </dl>
        <div className="mt-2 border-t border-zinc-800 pt-1.5">
          <div className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
            Markers <span className="float-right text-zinc-400">1/5</span>
          </div>
          <div className="flex gap-1">
            {["ES", "CE", "RV", "DL", "UV"].map((m, i) => (
              <span
                key={m}
                className={[
                  "inline-flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold",
                  i === 0
                    ? "bg-emerald-500 text-white"
                    : "border border-zinc-700 text-zinc-500",
                ].join(" ")}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: quick actions + deal tools */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-1.5">
          {DEAL_QUICK_ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white/40 px-2.5 py-1.5 text-[11px] text-zinc-200 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:bg-zinc-800"
            >
              <Icon name={a.icon} className="h-3.5 w-3.5 text-blue-300" />
              {a.label}
            </button>
          ))}
        </div>
        <div>
          <div className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-zinc-500">
            Deal Tools
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {DEAL_TOOLS.map((t) => (
              <button
                key={t.id}
                type="button"
                className="flex flex-col items-start gap-0.5 rounded-md border border-violet-500/40 bg-violet-500/5 px-2.5 py-1.5 text-left transition hover:border-violet-500/70 hover:bg-violet-500/10"
              >
                <div className="flex w-full items-center gap-1.5">
                  <Icon name={t.icon} className="h-3.5 w-3.5 text-violet-400" />
                  <span className="flex-1 truncate text-[11px] font-medium text-zinc-100">
                    {t.name}
                  </span>
                </div>
                <div className="line-clamp-1 text-[9px] text-zinc-500">
                  {t.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
