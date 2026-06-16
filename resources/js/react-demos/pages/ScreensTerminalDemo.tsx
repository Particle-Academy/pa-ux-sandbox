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
import { Field, Input, Textarea, Select, Switch } from "@particle-academy/react-fancy";
import "@particle-academy/react-fancy/styles.css";
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
  type ScreenCreateSpec,
  type AgentActivityEvent,
} from "@particle-academy/agent-integrations";
import { registerWhiteboardBridge } from "@particle-academy/agent-integrations/bridges/whiteboard";
import { registerFormBridge } from "@particle-academy/agent-integrations/bridges/forms";
import { registerSheetsBridge } from "@particle-academy/agent-integrations/bridges/sheets";
import { registerChartsBridge } from "@particle-academy/agent-integrations/bridges/charts";
import "@particle-academy/agent-integrations/styles.css";

registerAllEcharts();

const AGENT = { id: "claude", name: "Claude", color: "#a855f7" };

/** Catalog of screen kinds the host knows how to instantiate. The agent
 *  reads this via screens_list_kinds before calling screens_create. */
const KIND_CATALOG = [
  { kind: "form",       label: "Form",       description: "Schema-driven controlled form. Config: { fields: FormFieldDescriptor[] }" },
  { kind: "whiteboard", label: "Whiteboard", description: "Pannable canvas with sticky notes. Config: { seedNotes?: StickyNoteItem[] }" },
  { kind: "sheet",      label: "Sheet",      description: "Spreadsheet workbook. Config: { headers?: string[], rows?: any[][] }" },
  { kind: "chart",      label: "Chart",      description: "ECharts chart. Config: { option: ECharts option object }" },
  { kind: "markdown",   label: "Markdown",   description: "Read-only text panel. Config: { body: string }" },
  { kind: "composite",  label: "Composite",  description: "Multiple sub-screens in one. Config: { layout: 'single' | 'split-h' | 'split-v' | 'grid-2x2' | 'stack', slots: [{ id, kind, config }] }. Sub-screens get their own bridges, scoped as <screenId>.<slotId>." },
];

const LAYOUTS = ["single", "split-h", "split-v", "grid-2x2", "stack"] as const;
type Layout = typeof LAYOUTS[number];

/** A live screen the agent (or human) created at runtime. */
type DynamicScreen = ScreenCreateSpec;

export function ScreensTerminalDemo() {
  return (
    <ScreenSystem>
      <ScreensTerminalInner />
    </ScreenSystem>
  );
}

function ScreensTerminalInner() {
  const system = useScreenSystem();
  const [dynamicScreens, setDynamicScreens] = useState<DynamicScreen[]>([]);
  const [activeScreen, setActiveScreen] = useState<string | null>(null);

  const refs = useRef({ dynamicScreens, activeScreen });
  useEffect(() => { refs.current = { dynamicScreens, activeScreen }; }, [dynamicScreens, activeScreen]);

  // Per-screen content state (lives in a single map so the screens bridge
  // can hand individual surface bridges per screen on creation).
  const [screenStates] = useState(() => new Map<string, ScreenLocalState>());

  // ── MCP server + screens bridge (mounted once). Per-surface bridges
  // are created lazily as new screens come into existence. ──
  const serverRef = useRef<MicroMcpServer | null>(null);
  const inProcRef = useRef<InProcessTransport | null>(null);
  const surfaceBridges = useRef(new Map<string, () => void>()); // screenId → dispose

  useEffect(() => {
    const server = new MicroMcpServer({
      info: { name: "screens-terminal", version: "0.3.0" },
      instructions:
        "Blank screens terminal. There are NO screens initially. " +
        "Call screens_list_kinds to see what templates exist, then screens_create with id + kind + config to bring a screen to life. " +
        "Each new screen automatically gets its surface bridge (form_*, whiteboard_*, sheet_*, chart_*) — call those to populate it. " +
        "Use screens_navigate to switch active view, screens_destroy to clean up.",
    });

    const screensBridge = registerScreensBridge(server, {
      adapter: {
        listScreens: () => refs.current.dynamicScreens.map((s) => ({
          id: s.id, title: s.title, kind: s.kind, active: s.id === refs.current.activeScreen,
        })),
        getActive: () => refs.current.activeScreen,
        setActive: (id) => setActiveScreen(id),
        listKinds: () => KIND_CATALOG,
        createScreen: (spec) => {
          // Initialise per-screen state container based on kind.
          screenStates.set(spec.id, makeLocalState(spec));
          setDynamicScreens((all) => [...all, spec]);
          // Mount the matching surface bridge after React commits.
          requestAnimationFrame(() => {
            const dispose = mountSurfaceBridge(server, spec, screenStates);
            if (dispose) surfaceBridges.current.set(spec.id, dispose);
          });
        },
        destroyScreen: (id) => {
          surfaceBridges.current.get(id)?.();
          surfaceBridges.current.delete(id);
          screenStates.delete(id);
          setDynamicScreens((all) => all.filter((s) => s.id !== id));
          if (refs.current.activeScreen === id) {
            setActiveScreen((all) => {
              const remaining = refs.current.dynamicScreens.filter((s) => s.id !== id);
              return remaining.length ? remaining[0].id : null;
            });
          }
        },
        updateScreenContent: (id, partial) => {
          setDynamicScreens((all) => all.map((s) => s.id === id
            ? { ...s, config: { ...(s.config ?? {}), ...partial } }
            : s));

          // If the partial includes a fresh slot list for a composite,
          // tear down the old per-slot bridges, rebuild the slotStates,
          // and re-mount bridges for every slot in the new spec. Layout
          // changes (no `slots` key) skip this entirely.
          if (Array.isArray(partial.slots)) {
            const existing = screenStates.get(id);
            if (existing && existing.kind === "composite") {
              // Dispose old composite slot bridges
              surfaceBridges.current.get(id)?.();
              surfaceBridges.current.delete(id);
              // Rebuild the composite local state with the new slots
              const newSlots = partial.slots as Array<{ id: string; kind: string; config?: any }>;
              const newSlotStates = new Map<string, ScreenLocalState>();
              for (const slot of newSlots) {
                newSlotStates.set(slot.id, makeLocalState({ id: `${id}.${slot.id}`, title: slot.id, kind: slot.kind, config: slot.config }));
              }
              const updated: ScreenLocalState = {
                kind: "composite",
                layout: existing.layout,
                slots: newSlots,
                slotStates: newSlotStates,
              };
              screenStates.set(id, updated);
              // Re-mount bridges after the next paint so DynamicScreenBody
              // has time to install real setters for the new slots.
              requestAnimationFrame(() => {
                const newSpec: ScreenCreateSpec = {
                  id,
                  title: refs.current.dynamicScreens.find((s) => s.id === id)?.title,
                  kind: "composite",
                  config: { ...(refs.current.dynamicScreens.find((s) => s.id === id)?.config ?? {}), slots: newSlots },
                };
                const dispose = mountSurfaceBridge(server, newSpec, screenStates);
                if (dispose) surfaceBridges.current.set(id, dispose);
              });
            }
          }
        },
      },
      agent: AGENT,
    });

    inProcRef.current = attachInProcess(server);
    serverRef.current = server;
    return () => {
      screensBridge.dispose();
      for (const dispose of surfaceBridges.current.values()) dispose();
      surfaceBridges.current.clear();
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
    const reg = await fetch("/agent-relay/register", {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrf, accept: "application/json" },
      body: JSON.stringify({ session: desc.id, token: desc.token }),
    });
    if (!reg.ok) return;
    const relay = attachSseRelay(serverRef.current, { baseUrl: "/agent-relay", sessionId: desc.id, token: desc.token });
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
    await fetch(`/agent-relay/${desc.id}/unregister?token=${encodeURIComponent(desc.token)}`, {
      method: "POST",
      headers: { "x-csrf-token": csrf, accept: "application/json" },
    }).catch(() => {});
  };

  const statusText = relayState === "open" ? "live" : relayState === "connecting" ? "connecting…" : relayState === "error" ? "error" : undefined;

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-6">
      <ScreensActivityBridge system={system} />

      <header className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Screens Terminal</h1>
        <p className="text-sm text-zinc-500">
          Blank shell. Click <em>Start shared session</em> below, paste me the URL, and I'll{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">screens_create</code> entire
          screens from nothing — forms, whiteboards, sheets, charts — populating each as I go.
          You can take over any screen at any moment.
        </p>
      </header>

      <div className="mb-4">
        <ShareControls session={session} onStart={startShare} onStop={stopShare} status={statusText} />
      </div>

      <ScreenTabs
        screens={dynamicScreens}
        active={activeScreen}
        onChange={setActiveScreen}
      />

      <div className="mt-4 grid grid-cols-[1fr_320px] gap-4">
        <div className="min-h-[520px]">
          {dynamicScreens.length === 0 ? (
            <EmptyShellPlaceholder />
          ) : (
            dynamicScreens.map((spec) => (
              <Screen
                key={spec.id}
                id={spec.id}
                title={spec.title}
                className={`rounded-xl border border-zinc-200 dark:border-zinc-700 ${spec.id === activeScreen ? "" : "hidden"}`}
              >
                <DynamicScreenBody
                  spec={spec}
                  state={screenStates.get(spec.id)!}
                  server={serverRef.current ?? undefined}
                />
              </Screen>
            ))
          )}
        </div>

        <ActivityPanel screens={dynamicScreens} active={activeScreen} />
      </div>
    </div>
  );
}

// ───────────── Per-screen state + dynamic bridge mounting ─────────────

type ScreenLocalState =
  | { kind: "form"; values: Record<string, unknown>; setValues: React.Dispatch<React.SetStateAction<Record<string, unknown>>> }
  | { kind: "whiteboard"; notes: StickyNoteItem[]; setNotes: React.Dispatch<React.SetStateAction<StickyNoteItem[]>>; viewport: Viewport; setViewport: React.Dispatch<React.SetStateAction<Viewport>>; cursor: RemoteCursor | null; setCursor: React.Dispatch<React.SetStateAction<RemoteCursor | null>> }
  | { kind: "sheet"; workbook: WorkbookData; setWorkbook: React.Dispatch<React.SetStateAction<WorkbookData>> }
  | { kind: "chart"; option: any; setOption: React.Dispatch<React.SetStateAction<any>> }
  | { kind: "markdown"; body: string }
  | { kind: "composite"; layout: Layout; slots: Array<{ id: string; kind: string; config?: any }>; slotStates: Map<string, ScreenLocalState> };

function makeLocalState(spec: ScreenCreateSpec): ScreenLocalState {
  // Note: setters are placeholders — DynamicScreenBody installs real ones on mount.
  switch (spec.kind) {
    case "form":
      return { kind: "form", values: {}, setValues: noopSetter() };
    case "whiteboard": {
      const seedNotes = (spec.config?.seedNotes as StickyNoteItem[]) ?? [];
      return {
        kind: "whiteboard",
        notes: seedNotes,
        setNotes: noopSetter(),
        viewport: { x: 0, y: 0, zoom: 1 },
        setViewport: noopSetter(),
        cursor: null,
        setCursor: noopSetter(),
      };
    }
    case "sheet": {
      const wb = createEmptyWorkbook();
      const sheet = wb.sheets[0];
      const headers = (spec.config?.headers as string[]) ?? [];
      const rows = (spec.config?.rows as any[][]) ?? [];
      headers.forEach((h, i) => { sheet.cells[`${colLetter(i)}1`] = { address: `${colLetter(i)}1`, value: h }; });
      rows.forEach((row, r) => row.forEach((v, c) => {
        const addr = `${colLetter(c)}${r + 2}`;
        sheet.cells[addr] = { address: addr, value: v };
      }));
      return { kind: "sheet", workbook: wb, setWorkbook: noopSetter() };
    }
    case "chart": {
      const option = (spec.config?.option as any) ?? defaultChart();
      return { kind: "chart", option, setOption: noopSetter() };
    }
    case "markdown":
      return { kind: "markdown", body: String(spec.config?.body ?? "") };
    case "composite": {
      const layout = ((spec.config?.layout as Layout) ?? "split-h");
      const rawSlots = (spec.config?.slots as Array<{ id: string; kind: string; config?: any }>) ?? [];
      const slotStates = new Map<string, ScreenLocalState>();
      for (const slot of rawSlots) {
        slotStates.set(slot.id, makeLocalState({ id: `${spec.id}.${slot.id}`, title: slot.id, kind: slot.kind, config: slot.config }));
      }
      return { kind: "composite", layout, slots: rawSlots, slotStates };
    }
    default:
      return { kind: "markdown", body: `(unknown screen kind: ${spec.kind})` };
  }
}

function noopSetter<T>(): React.Dispatch<React.SetStateAction<T>> {
  return (() => {}) as any;
}

function mountSurfaceBridge(server: MicroMcpServer, spec: ScreenCreateSpec, screenStates: Map<string, ScreenLocalState>): (() => void) | null {
  return mountBridgeFor(server, spec.kind, spec.id, spec.title, spec.config ?? {}, () => screenStates.get(spec.id));
}

/**
 * Mount a bridge for a single surface, given a kind + how to fetch its
 * state. Used both for top-level screens and for individual slots inside
 * a composite screen (in which case the id is `${parent}.${slotId}`).
 */
function mountBridgeFor(
  server: MicroMcpServer,
  kind: string,
  id: string,
  title: string | undefined,
  config: Record<string, unknown>,
  getState: () => ScreenLocalState | undefined,
): (() => void) | null {
  switch (kind) {
    case "form": {
      const fields = (config.fields as FormFieldDescriptor[]) ?? [];
      const bridge = registerFormBridge(server, {
        adapter: {
          id, title, screenId: id,
          getFields: () => fields,
          getValue: (n) => (getState() as any)?.values?.[n],
          getValues: () => ({ ...(getState() as any)?.values }),
          setValue: (n, v) => (getState() as any)?.setValues?.((all: any) => ({ ...all, [n]: v })),
          setValues: (next) => (getState() as any)?.setValues?.((all: any) => ({ ...all, ...next })),
          submit: async () => ({ ok: true, values: { ...(getState() as any)?.values } }),
        },
        agent: AGENT,
      });
      return () => bridge.dispose();
    }
    case "whiteboard": {
      const bridge = registerWhiteboardBridge(server, {
        adapter: {
          getNotes: () => (getState() as any)?.notes ?? [],
          setNotes: (n) => (getState() as any)?.setNotes?.(typeof n === "function" ? n : () => n),
          getShapes: () => [], setShapes: () => {},
          getConnectors: () => [], setConnectors: () => {},
          getStrokes: () => [], setStrokes: () => {},
          getViewport: () => (getState() as any)?.viewport ?? { x: 0, y: 0, zoom: 1 },
          setViewport: (v) => (getState() as any)?.setViewport?.(v),
          setAgentCursor: (c) => (getState() as any)?.setCursor?.(c),
        },
        agent: AGENT,
      });
      return () => bridge.dispose();
    }
    case "sheet": {
      const bridge = registerSheetsBridge(server, {
        adapter: {
          screenId: id,
          getWorkbook: () => (getState() as any)?.workbook ?? createEmptyWorkbook(),
          setWorkbook: (next) => (getState() as any)?.setWorkbook?.(next),
        },
        agent: AGENT,
      });
      return () => bridge.dispose();
    }
    case "chart": {
      const bridge = registerChartsBridge(server, {
        adapter: {
          id, title, screenId: id,
          getOption: () => (getState() as any)?.option ?? {},
          setOption: (next) => (getState() as any)?.setOption?.(next),
          updateOption: (partial) => (getState() as any)?.setOption?.((opt: any) => ({ ...opt, ...partial })),
          updateData: (data) => (getState() as any)?.setOption?.((opt: any) => ({ ...opt, series: Array.isArray(data) ? data : [{ type: "line", data }] })),
        },
        agent: AGENT,
      });
      return () => bridge.dispose();
    }
    case "composite": {
      // Mount one bridge per slot, scoped to `${id}.${slotId}`.
      const disposers: Array<() => void> = [];
      const composite = getState() as Extract<ScreenLocalState, { kind: "composite" }> | undefined;
      const slots = composite?.slots ?? [];
      for (const slot of slots) {
        const slotId = `${id}.${slot.id}`;
        const dispose = mountBridgeFor(
          server, slot.kind, slotId, slot.id, slot.config ?? {},
          () => composite?.slotStates.get(slot.id),
        );
        if (dispose) disposers.push(dispose);
      }
      return () => disposers.forEach((d) => d());
    }
    default:
      return null;
  }
}

function defaultChart(): any {
  return {
    grid: { left: 40, right: 16, top: 30, bottom: 30 },
    xAxis: { type: "category", data: [] },
    yAxis: { type: "value" },
    series: [{ type: "line", data: [], smooth: true, areaStyle: {} }],
    tooltip: { trigger: "axis" },
  };
}

function colLetter(i: number): string {
  let n = i + 1, s = "";
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

// ───────────── Screen body renderer ─────────────

function DynamicScreenBody({
  spec, state, server, fillContainer = false,
}: {
  spec: DynamicScreen;
  state: ScreenLocalState;
  server?: MicroMcpServer;
  /** When true (composite slot context), use h-full instead of fixed heights. */
  fillContainer?: boolean;
}) {
  const fillStyle: React.CSSProperties = fillContainer
    ? { height: "100%", position: "relative" }
    : { height: 480, position: "relative" };
  const fillStyleNoPos: React.CSSProperties = fillContainer ? { height: "100%" } : { height: 480 };
  // Each kind needs to wire its setters into the shared screenStates map
  // so the bridge handlers (set up at create time) can reach them.
  if (state.kind === "form") {
    const [values, setValues] = useState<Record<string, unknown>>(() => state.values);
    useEffect(() => { state.values = values; state.setValues = setValues; }, [values, state]);
    const fields = (spec.config?.fields as FormFieldDescriptor[]) ?? [];
    return (
      <BridgedForm id={spec.id} title={spec.title} screenId={spec.id} fields={fields}
        values={values} onChange={setValues} server={server} agent={AGENT}>
        <div className="grid gap-3 p-4">
          {fields.map((f) => (
            <Field key={f.name} label={f.label ?? f.name} required={f.required}>
              <FancyFormControl field={f} value={values[f.name]} onChange={(v) => setValues((all) => ({ ...all, [f.name]: v }))} />
            </Field>
          ))}
          {fields.length === 0 && <em className="text-xs text-zinc-500 p-2">(no fields configured — agent should pass fields in config)</em>}
        </div>
      </BridgedForm>
    );
  }

  if (state.kind === "whiteboard") {
    const [notes, setNotes] = useState<StickyNoteItem[]>(state.notes);
    const [viewport, setViewport] = useState<Viewport>(state.viewport);
    const [cursor, setCursor] = useState<RemoteCursor | null>(null);
    useEffect(() => {
      state.notes = notes; state.setNotes = setNotes;
      state.viewport = viewport; state.setViewport = setViewport;
      state.cursor = cursor; state.setCursor = setCursor;
    }, [notes, viewport, cursor, state]);
    const cursors: RemoteCursor[] = useMemo(() => (cursor ? [cursor] : []), [cursor]);
    return (
      <div style={fillStyle}
        className="bg-[radial-gradient(circle_at_1px_1px,_#d4d4d8_1px,_transparent_0)] [background-size:20px_20px] dark:bg-[radial-gradient(circle_at_1px_1px,_#3f3f46_1px,_transparent_0)]">
        <Board viewport={viewport} onViewportChange={setViewport} style={{ width: "100%", height: "100%" }}>
          {notes.map((n) => (
            <StickyNote key={n.id} item={n}
              onChange={(next) => setNotes((all) => all.map((x) => (x.id === next.id ? next : x)))} />
          ))}
          <CursorLayer cursors={cursors} />
          {cursor && <AgentCursor x={cursor.x} y={cursor.y} name={cursor.name} color={cursor.color} />}
        </Board>
      </div>
    );
  }

  if (state.kind === "sheet") {
    const [workbook, setWorkbook] = useState<WorkbookData>(state.workbook);
    useEffect(() => { state.workbook = workbook; state.setWorkbook = setWorkbook; }, [workbook, state]);
    return (
      <div style={fillStyleNoPos}>
        <SheetWorkbook data={workbook} onChange={setWorkbook} hideToolbar hideTabs />
      </div>
    );
  }

  if (state.kind === "chart") {
    const [option, setOption] = useState<any>(state.option);
    useEffect(() => { state.option = option; state.setOption = setOption; }, [option, state]);
    return (
      <div style={{ ...fillStyleNoPos, padding: fillContainer ? 8 : 12 }}>
        <EChart option={option} style={{ width: "100%", height: "100%", minWidth: 300 }} />
      </div>
    );
  }

  if (state.kind === "markdown") {
    return <MarkdownPanel body={state.body} />;
  }

  if (state.kind === "composite") {
    return <CompositeBody spec={spec} state={state} />;
  }

  return null;
}

function CompositeBody({
  spec, state,
}: {
  spec: DynamicScreen;
  state: Extract<ScreenLocalState, { kind: "composite" }>;
}) {
  // Read both layout AND slots from the live spec so screens_set_layout
  // and screens_update_content (with new slot lists) re-render correctly.
  const layout: Layout = (spec.config?.layout as Layout) ?? state.layout;
  const slots = ((spec.config?.slots as Array<{ id: string; kind: string; config?: any }>) ?? state.slots);
  const layoutClass = useMemo(() => layoutToClass(layout, slots.length), [layout, slots.length]);

  return (
    <div className="p-3">
      <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
        <span className="font-mono">layout: {layout}</span>
        <span>·</span>
        <span>{slots.length} slot{slots.length === 1 ? "" : "s"}</span>
        <span className="ml-auto flex gap-1">
          <span className="text-[10px]">try:</span>
          {LAYOUTS.map((l) => (
            <code key={l} className={"rounded px-1 py-0.5 text-[10px] " + (l === layout ? "bg-purple-600 text-white" : "bg-zinc-200 dark:bg-zinc-800")}>{l}</code>
          ))}
        </span>
      </div>
      <div className={layoutClass} style={{ height: 540 }}>
        {slots.map((slot) => (
          <CompositeSlot key={slot.id} screenId={spec.id} slot={slot} composite={state} />
        ))}
      </div>
    </div>
  );
}

function CompositeSlot({
  screenId, slot, composite,
}: {
  screenId: string;
  slot: { id: string; kind: string; config?: any };
  composite: Extract<ScreenLocalState, { kind: "composite" }>;
}) {
  // If a slot was just added via screens_update_content, the state map may
  // not have an entry yet — lazily create one.
  let slotState = composite.slotStates.get(slot.id);
  if (!slotState) {
    slotState = makeLocalState({ id: `${screenId}.${slot.id}`, title: slot.id, kind: slot.kind, config: slot.config });
    composite.slotStates.set(slot.id, slotState);
  }
  // Charts / whiteboards / sheets fill 100% (with possible horizontal scroll
  // for charts). Forms + markdown can grow taller than the slot — wrap them
  // in a vertical-scroll container.
  const fillKinds = new Set(["chart", "whiteboard", "sheet", "scene"]);
  const fillsContainer = fillKinds.has(slot.kind);
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        <span>{slot.kind} · {slot.id}</span>
        <span className="font-mono opacity-50">{screenId}.{slot.id}</span>
      </div>
      <div
        className={
          fillsContainer
            ? "flex-1 min-h-0 overflow-x-auto overflow-y-hidden"
            : "flex-1 min-h-0 overflow-y-auto"
        }
      >
        <DynamicScreenBody
          spec={{ id: `${screenId}.${slot.id}`, title: slot.id, kind: slot.kind, config: slot.config }}
          state={slotState}
          fillContainer={fillsContainer}
        />
      </div>
    </div>
  );
}

function layoutToClass(layout: Layout, slotCount: number): string {
  switch (layout) {
    case "split-h": return "grid grid-cols-2 gap-3";
    case "split-v": return "grid grid-rows-2 gap-3";
    case "grid-2x2": return "grid grid-cols-2 grid-rows-2 gap-3";
    case "stack": return "grid grid-rows-1 gap-3"; // host could overlay if desired
    case "single":
    default:
      return slotCount > 1 ? "grid grid-cols-1 gap-3" : "";
  }
}

function MarkdownPanel({ body }: { body: string }) {
  const [html, setHtml] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    import("marked").then(({ marked }) => {
      if (!cancelled) setHtml(marked.parse(body, { async: false }) as string);
    });
    return () => { cancelled = true; };
  }, [body]);
  return (
    <div
      className="prose prose-sm max-w-none p-6 dark:prose-invert prose-headings:font-semibold prose-pre:bg-zinc-900"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function FancyFormControl({ field, value, onChange }: { field: FormFieldDescriptor; value: unknown; onChange: (v: unknown) => void }) {
  switch (field.type) {
    case "textarea":
      return (
        <Textarea
          name={field.name}
          rows={4}
          value={String(value ?? "")}
          onValueChange={(v) => onChange(v)}
        />
      );
    case "number":
      return (
        <Input
          name={field.name}
          type="number"
          value={value === undefined || value === null ? "" : String(value)}
          onValueChange={(v) => onChange(v === "" ? undefined : Number(v))}
        />
      );
    case "switch":
    case "checkbox":
      return (
        <Switch
          name={field.name}
          checked={!!value}
          onCheckedChange={(v: boolean) => onChange(v)}
        />
      );
    case "select":
      return (
        <Select
          name={field.name}
          value={String(value ?? "")}
          onValueChange={(v) => onChange(v)}
          list={field.options ?? []}
          placeholder="—"
        />
      );
    default:
      return (
        <Input
          name={field.name}
          type={field.type === "email" ? "email" : "text"}
          value={String(value ?? "")}
          onValueChange={(v) => onChange(v)}
        />
      );
  }
}

// ───────────── Tab nav + activity panel + empty state ─────────────

function ScreenTabs({ screens, active, onChange }: { screens: DynamicScreen[]; active: string | null; onChange: (id: string) => void }) {
  const registry = useScreens();
  const byId = new Map(registry.map((s) => [s.id, s]));
  if (screens.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-3 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
        No screens yet. Connect an agent and let them build the UX.
      </div>
    );
  }
  return (
    <nav className="flex gap-2 overflow-auto rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
      {screens.map((s) => {
        const isActive = s.id === active;
        const meta = byId.get(s.id);
        const hasAgent = !!meta?.agentActivity;
        return (
          <button key={s.id} onClick={() => onChange(s.id)}
            className={["relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap",
              isActive ? "bg-purple-600 text-white shadow-sm" : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
            ].join(" ")}>
            <span className="text-xs uppercase opacity-70">{s.kind}</span>
            <span>{s.title ?? s.id}</span>
            {hasAgent && (
              <span className="absolute -right-1 -top-1 inline-flex h-3 w-3 rounded-full"
                style={{ background: AGENT.color, boxShadow: "0 0 0 2px white" }}
                title="Agent is here" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function EmptyShellPlaceholder() {
  return (
    <div className="flex h-[480px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-2 text-4xl">🪟</div>
      <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-200">Empty terminal</h2>
      <p className="mt-2 max-w-md text-sm text-zinc-500">
        This page is a blank Screens shell. When an agent connects via{" "}
        <em>Start shared session</em> above, they'll call{" "}
        <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">screens_create</code> to bring forms,
        whiteboards, sheets, and charts into existence — each with its own bridge so the agent can populate it
        and you can take over.
      </p>
      <div className="mt-4 text-xs text-zinc-500">
        Available kinds: <code>form · whiteboard · sheet · chart · markdown</code>
      </div>
    </div>
  );
}

function ActivityPanel({ screens, active }: { screens: DynamicScreen[]; active: string | null }) {
  const { events } = useAgentActivity(undefined, { capacity: 80 });
  const list = [...events].reverse();
  const activeMeta = active ? screens.find((s) => s.id === active) : null;
  return (
    <aside className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" style={{ height: 540, display: "flex", flexDirection: "column" }}>
      <header className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-700">
        <div className="text-xs uppercase tracking-wide text-zinc-500">Active screen</div>
        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
          {activeMeta ? `${activeMeta.kind} · ${activeMeta.title ?? activeMeta.id}` : "(none)"}
        </div>
        <div className="text-xs text-zinc-500">{screens.length} screen{screens.length === 1 ? "" : "s"}</div>
      </header>
      <div className="border-b border-zinc-200 px-3 py-2 text-xs font-semibold dark:border-zinc-700 dark:text-zinc-100">
        Activity feed
      </div>
      <ul className="flex-1 divide-y divide-zinc-100 overflow-auto text-xs dark:divide-zinc-800">
        {list.length === 0 && <li className="px-3 py-2 text-zinc-500">No activity yet.</li>}
        {list.map((e) => <ActivityRow key={`${e.timestamp}-${e.action}`} event={e} />)}
      </ul>
    </aside>
  );
}

function ActivityRow({ event }: { event: AgentActivityEvent }) {
  const time = new Date(event.timestamp).toLocaleTimeString([], { hour12: false });
  return (
    <li className="px-3 py-2">
      <div className="flex items-center gap-2 text-zinc-500">
        <span className="font-mono">{event.target.screenId ?? event.target.kind}</span>
        <span className="ml-auto">{time}</span>
      </div>
      <div className="mt-0.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">{event.action}</div>
      {event.target.label && <div className="text-[10px] text-zinc-500 truncate">{event.target.label}</div>}
    </li>
  );
}
