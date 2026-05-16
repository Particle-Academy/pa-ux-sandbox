import { useEffect, useMemo, useRef, useState } from "react";
import { ScreenSystem, Screen, useScreenSystem, useScreens } from "@particle-academy/fancy-screens";
import {
  Board,
  StickyNote,
  CursorLayer,
  type StickyNoteItem,
  type RemoteCursor,
  type Viewport,
} from "@particle-academy/fancy-whiteboard";
import "@particle-academy/fancy-whiteboard/styles.css";
import { SheetWorkbook, createEmptyWorkbook, type WorkbookData } from "@particle-academy/fancy-sheets";
import "@particle-academy/fancy-sheets/styles.css";
import { EChart, registerAll as registerAllEcharts } from "@particle-academy/fancy-echarts";
import {
  MicroMcpServer,
  attachInProcess,
  attachSseRelay,
  registerScreensBridge,
  ShareControls,
  ScreensActivityBridge,
  BridgedForm,
  AgentCursor,
  createSessionDescriptor,
  useAgentActivity,
  type SessionDescriptor,
  type RelayState,
  type SseRelayTransport,
  type InProcessTransport,
  type FormFieldDescriptor,
  type AgentActivityEvent,
} from "@particle-academy/agent-integrations";
import { registerWhiteboardBridge } from "@particle-academy/agent-integrations/bridges/whiteboard";
import { registerFormBridge } from "@particle-academy/agent-integrations/bridges/forms";
import { registerSheetsBridge } from "@particle-academy/agent-integrations/bridges/sheets";
import { registerChartsBridge } from "@particle-academy/agent-integrations/bridges/charts";
import "@particle-academy/agent-integrations/styles.css";

registerAllEcharts();

const AGENT = { id: "claude", name: "Claude", color: "#a855f7" };

const SCREEN_DEFS = [
  { id: "intake", title: "Intake", kind: "form", icon: "📝", description: "Customer info form" },
  { id: "sketch", title: "Sketchboard", kind: "whiteboard", icon: "🎨", description: "Brainstorm + diagram" },
  { id: "report", title: "Report", kind: "report", icon: "📊", description: "Sheet + chart" },
] as const;

const FORM_FIELDS: FormFieldDescriptor[] = [
  { name: "company", label: "Company", type: "text", required: true },
  { name: "contact", label: "Contact name", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  {
    name: "tier", label: "Tier", type: "select",
    options: [
      { value: "starter", label: "Starter" },
      { value: "pro", label: "Pro" },
      { value: "enterprise", label: "Enterprise" },
    ],
  },
  { name: "notes", label: "Notes", type: "textarea" },
];

const SEED_NOTES: StickyNoteItem[] = [
  { id: "intro", kind: "sticky", x: 80, y: 80, width: 240, height: 100, text: "Sketch your ideas here. Claude can also draw.", color: "#fde68a" },
];

const SEED_WORKBOOK: WorkbookData = (() => {
  const wb = createEmptyWorkbook();
  const sheet = wb.sheets[0];
  const set = (a: string, v: any) => { sheet.cells[a] = { address: a, value: v }; };
  set("A1", "Period"); set("B1", "Revenue"); set("C1", "Customers");
  set("A2", "Q1"); set("B2", 12000); set("C2", 14);
  set("A3", "Q2"); set("B3", 18500); set("C3", 22);
  set("A4", "Q3"); set("B4", 22000); set("C4", 28);
  set("A5", "Q4"); set("B5", 0); set("C5", 0);
  return wb;
})();

const seedChart = (): any => ({
  grid: { left: 40, right: 16, top: 30, bottom: 30 },
  xAxis: { type: "category", data: ["Q1", "Q2", "Q3", "Q4"] },
  yAxis: { type: "value" },
  series: [{ type: "line", smooth: true, data: [12000, 18500, 22000, 0], areaStyle: {} }],
  tooltip: { trigger: "axis" },
});

export function ScreensAgentDemo() {
  return (
    <ScreenSystem>
      <ScreensAgentDemoInner />
    </ScreenSystem>
  );
}

function ScreensAgentDemoInner() {
  const system = useScreenSystem();
  const [activeScreen, setActiveScreen] = useState<string>(SCREEN_DEFS[0].id);

  // Per-screen state
  const [formValues, setFormValues] = useState<Record<string, unknown>>({ company: "", contact: "", email: "", tier: "pro", notes: "" });
  const [notes, setNotes] = useState<StickyNoteItem[]>(SEED_NOTES);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [agentCursor, setAgentCursor] = useState<RemoteCursor | null>(null);
  const [workbook, setWorkbook] = useState<WorkbookData>(SEED_WORKBOOK);
  const [chartOption, setChartOption] = useState<any>(seedChart());

  // Refs for bridge adapters (so they always read latest state)
  const refs = useRef({ formValues, notes, viewport, workbook, chartOption, activeScreen });
  useEffect(() => {
    refs.current = { formValues, notes, viewport, workbook, chartOption, activeScreen };
  }, [formValues, notes, viewport, workbook, chartOption, activeScreen]);

  // ── MCP server + bridges ──
  const serverRef = useRef<MicroMcpServer | null>(null);
  const inProcRef = useRef<InProcessTransport | null>(null);

  useEffect(() => {
    const server = new MicroMcpServer({
      info: { name: "screens-agent-demo", version: "0.3.0" },
      instructions: `Multi-screen agent demo. Three screens: ${SCREEN_DEFS.map((s) => `${s.id} (${s.title})`).join(", ")}. Use screens_list / screens_navigate to switch between them, then per-surface tools (form_*, whiteboard_*, sheet_*, chart_*) for each screen's content. Activity events broadcast per-screen so the human sees which screen you're on.`,
    });

    const screensBridge = registerScreensBridge(server, {
      adapter: {
        listScreens: () => SCREEN_DEFS.map((s) => ({
          id: s.id, title: s.title, kind: s.kind, active: s.id === refs.current.activeScreen,
        })),
        getActive: () => refs.current.activeScreen,
        setActive: (id) => setActiveScreen(id),
      },
      agent: AGENT,
    });

    const formBridge = registerFormBridge(server, {
      adapter: {
        id: "intake-form", title: "Intake form", screenId: "intake",
        getFields: () => FORM_FIELDS,
        getValue: (n) => refs.current.formValues[n],
        getValues: () => ({ ...refs.current.formValues }),
        setValue: (n, v) => setFormValues((all) => ({ ...all, [n]: v })),
        setValues: (next) => setFormValues((all) => ({ ...all, ...next })),
        focus: (n) => (document.querySelector(`[data-form-id="intake-form"] [name="${n}"]`) as HTMLElement | null)?.focus(),
        submit: async () => ({ ok: true, values: { ...refs.current.formValues } }),
      },
      agent: AGENT,
    });

    const wbBridge = registerWhiteboardBridge(server, {
      adapter: {
        getNotes: () => refs.current.notes,
        setNotes: (n) => setNotes(typeof n === "function" ? n : () => n as StickyNoteItem[]),
        getShapes: () => [],
        setShapes: () => {},
        getConnectors: () => [],
        setConnectors: () => {},
        getStrokes: () => [],
        setStrokes: () => {},
        getViewport: () => refs.current.viewport,
        setViewport,
        setAgentCursor,
      },
      agent: AGENT,
    });

    const sheetBridge = registerSheetsBridge(server, {
      adapter: {
        screenId: "report",
        getWorkbook: () => refs.current.workbook,
        setWorkbook: (next) => setWorkbook(next),
      },
      agent: AGENT,
    });

    const chartBridge = registerChartsBridge(server, {
      adapter: {
        id: "revenue-chart", title: "Revenue chart", screenId: "report",
        getOption: () => refs.current.chartOption,
        setOption: (next) => setChartOption(next),
        updateOption: (partial) => setChartOption({ ...refs.current.chartOption, ...partial }),
        updateData: (data) => {
          const opt = { ...refs.current.chartOption };
          opt.series = Array.isArray(data) ? data : [{ type: "line", data }];
          setChartOption(opt);
        },
      },
      agent: AGENT,
    });

    inProcRef.current = attachInProcess(server);
    serverRef.current = server;
    return () => {
      screensBridge.dispose();
      formBridge.dispose();
      wbBridge.dispose();
      sheetBridge.dispose();
      chartBridge.dispose();
      if (inProcRef.current) server.detach(inProcRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sharing ──
  const [session, setSession] = useState<SessionDescriptor | null>(null);
  const [relayState, setRelayState] = useState<RelayState>("idle");
  const sseRef = useRef<SseRelayTransport | null>(null);

  const startShare = async () => {
    if (session || !serverRef.current) return;
    const desc = createSessionDescriptor();
    const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? "";
    const reg = await fetch("/whiteboard-share/register", {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrf, accept: "application/json" },
      body: JSON.stringify({ session: desc.id, token: desc.token }),
    });
    if (!reg.ok) return;
    const relay = attachSseRelay(serverRef.current, { baseUrl: "/whiteboard-share", sessionId: desc.id, token: desc.token });
    sseRef.current = relay;
    relay.onStateChange(setRelayState);
    setSession(desc);
  };
  const stopShare = async () => {
    if (!session) return;
    const desc = session;
    setSession(null);
    if (sseRef.current && serverRef.current) serverRef.current.detach(sseRef.current);
    sseRef.current = null;
    setRelayState("closed");
    const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? "";
    await fetch(`/whiteboard-share/${desc.id}/unregister?token=${encodeURIComponent(desc.token)}`, {
      method: "POST",
      headers: { "x-csrf-token": csrf, accept: "application/json" },
    }).catch(() => {});
  };

  const cursors: RemoteCursor[] = useMemo(() => (agentCursor ? [agentCursor] : []), [agentCursor]);
  const statusText = relayState === "open" ? "live" : relayState === "connecting" ? "connecting…" : relayState === "error" ? "error" : undefined;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6">
      <ScreensActivityBridge system={system} />

      <header className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Screens — Agent-Driven UX</h1>
        <p className="text-sm text-zinc-500">
          Three screens, one agent. Use{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">screens_navigate</code> to walk between
          them; the active screen lights up and agents drive its content via per-surface bridges.
          The human can take over at any moment by clicking a tab or interacting directly.
        </p>
      </header>

      <div className="mb-4">
        <ShareControls session={session} onStart={startShare} onStop={stopShare} status={statusText} />
      </div>

      <ScreenTabs active={activeScreen} onChange={setActiveScreen} />

      <div className="mt-4 grid grid-cols-[1fr_320px] gap-4">
        <div className="min-h-[500px]">
          {SCREEN_DEFS.map((def) => (
            <Screen
              key={def.id}
              id={def.id}
              title={def.title}
              className={`rounded-xl border border-zinc-200 dark:border-zinc-700 ${def.id === activeScreen ? "" : "hidden"}`}
            >
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl">
                {def.id === "intake" && (
                  <IntakeScreen values={formValues} onChange={setFormValues} server={serverRef.current ?? undefined} />
                )}
                {def.id === "sketch" && (
                  <SketchScreen
                    notes={notes} setNotes={setNotes}
                    viewport={viewport} setViewport={setViewport}
                    cursors={cursors} agentCursor={agentCursor}
                  />
                )}
                {def.id === "report" && (
                  <ReportScreen
                    workbook={workbook} setWorkbook={setWorkbook}
                    chartOption={chartOption}
                  />
                )}
              </div>
            </Screen>
          ))}
        </div>

        <ActivityPanel activeScreen={activeScreen} />
      </div>
    </div>
  );
}

function ScreenTabs({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  const screens = useScreens();
  const screenById = new Map(screens.map((s) => [s.id, s]));
  return (
    <nav className="flex gap-2 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
      {SCREEN_DEFS.map((def) => {
        const meta = screenById.get(def.id);
        const isActive = def.id === active;
        const hasAgent = !!meta?.agentActivity;
        return (
          <button
            key={def.id}
            onClick={() => onChange(def.id)}
            className={[
              "relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
              isActive
                ? "bg-purple-600 text-white shadow-sm"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
            ].join(" ")}
          >
            <span aria-hidden>{def.icon}</span>
            <span>{def.title}</span>
            <span className="text-[10px] opacity-70">{def.description}</span>
            {hasAgent && (
              <span
                className="absolute -right-1 -top-1 inline-flex h-3 w-3 rounded-full"
                style={{ background: AGENT.color, boxShadow: "0 0 0 2px white" }}
                title="Agent is here"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function IntakeScreen({
  values, onChange, server,
}: {
  values: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  server?: MicroMcpServer;
}) {
  return (
    <BridgedForm id="intake-form" title="Intake form" screenId="intake" fields={FORM_FIELDS}
      values={values} onChange={onChange} server={server} agent={AGENT}>
      <div className="grid grid-cols-2 gap-4">
        <FieldRow label="Company">
          <input name="company" className="ff-input" value={String(values.company ?? "")}
            onChange={(e) => onChange({ ...values, company: e.target.value })} />
        </FieldRow>
        <FieldRow label="Contact name">
          <input name="contact" className="ff-input" value={String(values.contact ?? "")}
            onChange={(e) => onChange({ ...values, contact: e.target.value })} />
        </FieldRow>
        <FieldRow label="Email">
          <input name="email" type="email" className="ff-input" value={String(values.email ?? "")}
            onChange={(e) => onChange({ ...values, email: e.target.value })} />
        </FieldRow>
        <FieldRow label="Tier">
          <select name="tier" className="ff-input" value={String(values.tier ?? "")}
            onChange={(e) => onChange({ ...values, tier: e.target.value })}>
            {FORM_FIELDS.find((f) => f.name === "tier")?.options?.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="Notes" full>
          <textarea name="notes" rows={4} className="ff-input"
            value={String(values.notes ?? "")} onChange={(e) => onChange({ ...values, notes: e.target.value })} />
        </FieldRow>
      </div>
      <style>{`
        .ff-input { width:100%; padding: 6px 10px; border:1px solid #d4d4d8; border-radius: 6px; background: transparent; color: inherit; font: inherit; box-sizing: border-box; }
        .dark .ff-input { border-color: #3f3f46; }
        .ff-input:focus { outline: 2px solid #a855f7; outline-offset: -1px; }
      `}</style>
    </BridgedForm>
  );
}

function SketchScreen({
  notes, setNotes, viewport, setViewport, cursors, agentCursor,
}: {
  notes: StickyNoteItem[];
  setNotes: React.Dispatch<React.SetStateAction<StickyNoteItem[]>>;
  viewport: Viewport;
  setViewport: (v: Viewport) => void;
  cursors: RemoteCursor[];
  agentCursor: RemoteCursor | null;
}) {
  return (
    <div style={{ height: 480, position: "relative" }}
      className="rounded-lg bg-[radial-gradient(circle_at_1px_1px,_#d4d4d8_1px,_transparent_0)] [background-size:20px_20px] dark:bg-[radial-gradient(circle_at_1px_1px,_#3f3f46_1px,_transparent_0)]">
      <Board viewport={viewport} onViewportChange={setViewport} style={{ width: "100%", height: "100%" }}>
        {notes.map((n) => (
          <StickyNote key={n.id} item={n}
            onChange={(next) => setNotes((all) => all.map((x) => (x.id === next.id ? next : x)))} />
        ))}
        <CursorLayer cursors={cursors} />
        {agentCursor && <AgentCursor x={agentCursor.x} y={agentCursor.y} name={agentCursor.name} color={agentCursor.color} />}
      </Board>
    </div>
  );
}

function ReportScreen({
  workbook, setWorkbook, chartOption,
}: {
  workbook: WorkbookData;
  setWorkbook: (next: WorkbookData) => void;
  chartOption: any;
}) {
  return (
    <div className="grid grid-cols-2 gap-4" style={{ height: 480 }}>
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
        <SheetWorkbook data={workbook} onChange={setWorkbook} hideToolbar hideTabs />
      </div>
      <div className="overflow-hidden rounded-lg border border-zinc-200 p-2 dark:border-zinc-700">
        <EChart option={chartOption} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}

function FieldRow({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={"flex flex-col gap-1 " + (full ? "col-span-2" : "")}>
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

function ActivityPanel({ activeScreen }: { activeScreen: string }) {
  const { events } = useAgentActivity(undefined, { capacity: 80 });
  const screens = useScreens();
  const list = [...events].reverse();
  return (
    <aside className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" style={{ height: 540, display: "flex", flexDirection: "column" }}>
      <header className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-700">
        <div className="text-xs uppercase tracking-wide text-zinc-500">Active screen</div>
        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
          {SCREEN_DEFS.find((s) => s.id === activeScreen)?.icon} {SCREEN_DEFS.find((s) => s.id === activeScreen)?.title}
        </div>
        {screens.find((s) => s.id === activeScreen)?.agentActivity && (
          <span className="agent-active-badge mt-1" style={{ ["--agent-color" as any]: AGENT.color }}>{AGENT.name}</span>
        )}
      </header>
      <div className="border-b border-zinc-200 px-3 py-2 text-xs font-semibold dark:border-zinc-700 dark:text-zinc-100">
        Activity feed
      </div>
      <ul className="flex-1 divide-y divide-zinc-100 overflow-auto text-xs dark:divide-zinc-800">
        {list.length === 0 && <li className="px-3 py-2 text-zinc-500">Start sharing → connect an agent.</li>}
        {list.map((e) => (
          <ActivityRow key={`${e.timestamp}-${e.action}`} event={e} />
        ))}
      </ul>
    </aside>
  );
}

function ActivityRow({ event }: { event: AgentActivityEvent }) {
  const time = new Date(event.timestamp).toLocaleTimeString([], { hour12: false });
  const screenIcon = SCREEN_DEFS.find((s) => s.id === event.target.screenId)?.icon ?? "•";
  return (
    <li className="px-3 py-2">
      <div className="flex items-center gap-2 text-zinc-500">
        <span>{screenIcon}</span>
        <span className="font-mono">{event.target.screenId ?? event.target.kind}</span>
        <span className="ml-auto">{time}</span>
      </div>
      <div className="mt-0.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">{event.action}</div>
      {event.target.label && <div className="text-[10px] text-zinc-500 truncate">{event.target.label}</div>}
    </li>
  );
}
