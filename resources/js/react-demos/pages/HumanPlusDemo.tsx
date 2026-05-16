import { useEffect, useMemo, useRef, useState } from "react";
import { ScreenSystem, Screen, useScreenSystem } from "@particle-academy/fancy-screens";
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
import { EChart } from "@particle-academy/fancy-echarts";
import {
  MicroMcpServer,
  attachInProcess,
  attachSseRelay,
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

const AGENT = { id: "claude", name: "Claude", color: "#a855f7" };

const FORM_FIELDS: FormFieldDescriptor[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  {
    name: "role",
    label: "Role",
    type: "select",
    options: [
      { value: "engineer", label: "Engineer" },
      { value: "designer", label: "Designer" },
      { value: "pm", label: "PM" },
      { value: "founder", label: "Founder" },
    ],
  },
  { name: "newsletter", label: "Subscribe to newsletter", type: "switch" },
  { name: "notes", label: "Notes", type: "textarea" },
];

const SEED_NOTES: StickyNoteItem[] = [
  { id: "seed", kind: "sticky", x: 60, y: 60, width: 220, height: 110, text: "Click Share, paste me the URL — I'll drive everything below.", color: "#fde68a" },
];

const SEED_WORKBOOK: WorkbookData = (() => {
  const wb = createEmptyWorkbook();
  const sheet = wb.sheets[0];
  sheet.cells["A1"] = { address: "A1", value: "Quarter" };
  sheet.cells["B1"] = { address: "B1", value: "Revenue" };
  sheet.cells["A2"] = { address: "A2", value: "Q1" };
  sheet.cells["B2"] = { address: "B2", value: 12000 };
  sheet.cells["A3"] = { address: "A3", value: "Q2" };
  sheet.cells["B3"] = { address: "B3", value: 18500 };
  sheet.cells["A4"] = { address: "A4", value: "Q3" };
  sheet.cells["B4"] = { address: "B4", value: 22000 };
  sheet.cells["A5"] = { address: "A5", value: "Q4" };
  sheet.cells["B5"] = { address: "B5", value: 0 };
  return wb;
})();

const SEED_CHART = {
  grid: { left: 40, right: 16, top: 30, bottom: 30 },
  xAxis: { type: "category" as const, data: ["Q1", "Q2", "Q3", "Q4"] },
  yAxis: { type: "value" as const },
  series: [{ type: "line" as const, smooth: true, data: [12000, 18500, 22000, 0], areaStyle: {} }],
  tooltip: { trigger: "axis" as const },
};

export function HumanPlusDemo() {
  return (
    <ScreenSystem>
      <HumanPlusDemoInner />
    </ScreenSystem>
  );
}

function HumanPlusDemoInner() {
  const system = useScreenSystem();

  // ── Surface state (controlled) ──
  const [notes, setNotes] = useState<StickyNoteItem[]>(SEED_NOTES);
  const [shapes] = useState<any[]>([]);
  const [connectors] = useState<any[]>([]);
  const [strokes, setStrokes] = useState<any[]>([]);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [agentCursor, setAgentCursor] = useState<RemoteCursor | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown>>({ name: "", email: "", role: "engineer", newsletter: false, notes: "" });
  const [workbook, setWorkbook] = useState<WorkbookData>(SEED_WORKBOOK);
  const [chartOption, setChartOption] = useState<any>(SEED_CHART);

  // ── MCP server + bridges (mounted once) ──
  const serverRef = useRef<MicroMcpServer | null>(null);
  const inProcRef = useRef<InProcessTransport | null>(null);
  const refs = useRef({ notes, shapes, connectors, strokes, viewport, formValues, workbook, chartOption });
  useEffect(() => {
    refs.current = { notes, shapes, connectors, strokes, viewport, formValues, workbook, chartOption };
  }, [notes, shapes, connectors, strokes, viewport, formValues, workbook, chartOption]);

  useEffect(() => {
    const server = new MicroMcpServer({
      info: { name: "human-plus-demo", version: "0.3.0" },
      instructions: "Multi-surface demo. Each screen has its own bridge: whiteboard / signup-form / quarterly-sheet / revenue-chart. Tools are namespaced per kind. Use form_describe, sheet_describe, chart_describe to discover schemas.",
    });

    const wbBridge = registerWhiteboardBridge(server, {
      adapter: {
        getNotes: () => refs.current.notes,
        setNotes: (n) => setNotes(typeof n === "function" ? n : () => n as StickyNoteItem[]),
        getShapes: () => refs.current.shapes,
        setShapes: (s) => (typeof s === "function" ? null : null),
        getConnectors: () => refs.current.connectors,
        setConnectors: () => {},
        getStrokes: () => refs.current.strokes,
        setStrokes: (s) => setStrokes(typeof s === "function" ? s : () => s as any[]),
        getViewport: () => refs.current.viewport,
        setViewport,
        setAgentCursor,
      },
      agent: AGENT,
    });

    const formBridge = registerFormBridge(server, {
      adapter: {
        id: "signup",
        title: "Sign-up form",
        screenId: "form-screen",
        getFields: () => FORM_FIELDS,
        getValue: (n) => refs.current.formValues[n],
        getValues: () => ({ ...refs.current.formValues }),
        setValue: (n, v) => setFormValues((all) => ({ ...all, [n]: v })),
        setValues: (next) => setFormValues((all) => ({ ...all, ...next })),
        focus: (n) => {
          const el = document.querySelector(`[data-form-id="signup"] [name="${n}"]`) as HTMLElement | null;
          el?.focus();
        },
        submit: async () => ({ ok: true, values: { ...refs.current.formValues } }),
      },
      agent: AGENT,
    });

    const sheetBridge = registerSheetsBridge(server, {
      adapter: {
        screenId: "sheet-screen",
        getWorkbook: () => refs.current.workbook,
        setWorkbook: (next) => setWorkbook(next),
      },
      agent: AGENT,
    });

    const chartBridge = registerChartsBridge(server, {
      adapter: {
        id: "revenue",
        title: "Revenue chart",
        screenId: "chart-screen",
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
      wbBridge.dispose();
      formBridge.dispose();
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
    const relay = attachSseRelay(serverRef.current, {
      baseUrl: "/whiteboard-share",
      sessionId: desc.id,
      token: desc.token,
    });
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
    <div className="mx-auto max-w-[1500px] px-6 py-6">
      <ScreensActivityBridge system={system} />

      <header className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Human+ UX Demo</h1>
        <p className="text-sm text-zinc-500">
          Four surfaces, four bridges, one session. Agents call{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">whiteboard_*</code> /{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">form_*</code> /{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">sheet_*</code> /{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">chart_*</code> tools and you see
          presence indicators light up across whichever surface they're driving.
        </p>
      </header>

      <div className="mb-4">
        <ShareControls session={session} onStart={startShare} onStop={stopShare} status={statusText} />
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        {/* 4-pane grid of surfaces, each wrapped in its own Screen. */}
        <div className="grid grid-cols-2 gap-4">
          <Screen id="whiteboard-screen" title="Whiteboard" className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div style={{ height: 320, position: "relative" }} className="bg-[radial-gradient(circle_at_1px_1px,_#d4d4d8_1px,_transparent_0)] [background-size:20px_20px] dark:bg-[radial-gradient(circle_at_1px_1px,_#3f3f46_1px,_transparent_0)]">
              <Board viewport={viewport} onViewportChange={setViewport} style={{ width: "100%", height: "100%" }}>
                {notes.map((n) => (
                  <StickyNote
                    key={n.id}
                    item={n}
                    onChange={(next) => setNotes((all) => all.map((x) => (x.id === next.id ? next : x)))}
                  />
                ))}
                <CursorLayer cursors={cursors} />
                {agentCursor && <AgentCursor x={agentCursor.x} y={agentCursor.y} name={agentCursor.name} color={agentCursor.color} />}
              </Board>
            </div>
          </Screen>

          <Screen id="form-screen" title="Sign-up form" className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="p-4">
              <BridgedForm
                id="signup"
                title="Sign-up"
                screenId="form-screen"
                fields={FORM_FIELDS}
                values={formValues}
                onChange={setFormValues}
                server={serverRef.current ?? undefined}
                agent={AGENT}
              >
                <div className="flex flex-col gap-2 text-sm">
                  <FieldRow label="Name">
                    <input
                      name="name"
                      className="w-full rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
                      value={String(formValues.name ?? "")}
                      onChange={(e) => setFormValues((v) => ({ ...v, name: e.target.value }))}
                    />
                  </FieldRow>
                  <FieldRow label="Email">
                    <input
                      name="email"
                      type="email"
                      className="w-full rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
                      value={String(formValues.email ?? "")}
                      onChange={(e) => setFormValues((v) => ({ ...v, email: e.target.value }))}
                    />
                  </FieldRow>
                  <FieldRow label="Role">
                    <select
                      name="role"
                      className="w-full rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
                      value={String(formValues.role ?? "")}
                      onChange={(e) => setFormValues((v) => ({ ...v, role: e.target.value }))}
                    >
                      {FORM_FIELDS.find((f) => f.name === "role")?.options?.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FieldRow>
                  <FieldRow label="Newsletter">
                    <input
                      name="newsletter"
                      type="checkbox"
                      checked={!!formValues.newsletter}
                      onChange={(e) => setFormValues((v) => ({ ...v, newsletter: e.target.checked }))}
                    />
                  </FieldRow>
                  <FieldRow label="Notes">
                    <textarea
                      name="notes"
                      rows={3}
                      className="w-full rounded border border-zinc-300 px-2 py-1 dark:border-zinc-600 dark:bg-zinc-900"
                      value={String(formValues.notes ?? "")}
                      onChange={(e) => setFormValues((v) => ({ ...v, notes: e.target.value }))}
                    />
                  </FieldRow>
                </div>
              </BridgedForm>
            </div>
          </Screen>

          <Screen id="sheet-screen" title="Quarterly sheet" className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div style={{ height: 320 }}>
              <SheetWorkbook data={workbook} onChange={setWorkbook} hideToolbar hideTabs />
            </div>
          </Screen>

          <Screen id="chart-screen" title="Revenue chart" className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div style={{ height: 320, padding: 8 }}>
              <EChart option={chartOption} style={{ width: "100%", height: "100%" }} />
            </div>
          </Screen>
        </div>

        <ActivityPanel />
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

function ActivityPanel() {
  const { events } = useAgentActivity(undefined, { capacity: 80 });
  const list = [...events].reverse();
  return (
    <aside className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" style={{ height: 720, overflow: "auto" }}>
      <header className="border-b border-zinc-200 px-3 py-2 text-sm font-semibold dark:border-zinc-700 dark:text-zinc-100">
        Agent activity
      </header>
      <ul className="divide-y divide-zinc-100 text-xs dark:divide-zinc-800">
        {list.length === 0 && (
          <li className="px-3 py-2 text-zinc-500">No activity yet — start sharing and have an agent connect.</li>
        )}
        {list.map((e) => (
          <ActivityRow key={e.timestamp + e.action} event={e} />
        ))}
      </ul>
    </aside>
  );
}

function ActivityRow({ event }: { event: AgentActivityEvent }) {
  const time = new Date(event.timestamp).toLocaleTimeString([], { hour12: false });
  return (
    <li className="px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="agent-active-badge" style={{ ["--agent-color" as any]: event.agentColor }}>{event.agentName ?? "Agent"}</span>
        <span className="text-zinc-500">{time}</span>
      </div>
      <div className="mt-1 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
        {event.target.kind} · {event.action}
      </div>
      {event.target.label && <div className="text-[11px] text-zinc-500">{event.target.label}</div>}
    </li>
  );
}
