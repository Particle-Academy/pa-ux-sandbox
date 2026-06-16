/**
 * usePlaygroundServer — the engine behind the Agent Playground.
 *
 * Owns:
 *  - a Zustand store holding the dynamic screen registry
 *    ({ id, kind, title }[]) + per-screen state slices + activeId
 *  - one MicroMcpServer carrying ALL bridges:
 *      • registerScreensBridge — create/destroy/navigate/update screens of
 *        any KIND from a host-defined template catalog
 *      • every kind's surface bridge (one per kind), each adapter resolving
 *        to the ACTIVE screen of that kind
 *      • registerUndoTools — per-agent undo/redo/history
 *  - transports: attachInProcess (in-page console) + attachSseRelay
 *    (external agent over the /agent-relay relay)
 *
 * Ephemeral + anonymous: nothing is persisted. Closing the tab tears it down.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createStore, useStore } from "zustand";
import {
  MicroMcpServer,
  attachInProcess,
  attachSseRelay,
  registerScreensBridge,
  registerUndoTools,
  createSessionDescriptor,
  type SessionDescriptor,
  type RelayState,
  type SseRelayTransport,
  type InProcessTransport,
} from "@particle-academy/agent-integrations";
import { ensureSchemaComponents } from "./schemaComponents";
import { KIND_MODULES, KIND_BY_NAME, type Agent } from "./kinds";

export const PLAYGROUND_AGENT: Agent = { id: "claude", name: "Claude", color: "#a855f7" };

export type ScreenEntry = {
  id: string;
  kind: string;
  title: string;
  /** Opaque per-kind state slice. */
  state: unknown;
  /**
   * Set when the surface threw while rendering. Isolated by an error boundary
   * (so one bad screen never blanks the page) and surfaced to the agent via
   * screens_list so a failed attempt reads as a failure, not a silent no-op.
   */
  error?: string | null;
};

type PlaygroundStore = {
  screens: ScreenEntry[];
  activeId: string | null;
  addScreen: (kind: string, title?: string, id?: string) => string | null;
  removeScreen: (id: string) => void;
  setActive: (id: string) => void;
  setScreenState: (id: string, next: unknown) => void;
  setScreenError: (id: string, error: string | null) => void;
};

let counter = 0;
const nextId = (kind: string) => `${kind}-${++counter}`;

function createPlaygroundStore() {
  return createStore<PlaygroundStore>((set, get) => ({
    screens: [],
    activeId: null,
    addScreen: (kind, title, id) => {
      const mod = KIND_BY_NAME[kind];
      if (!mod) return null;
      const sid = id ?? nextId(kind);
      const entry: ScreenEntry = {
        id: sid,
        kind,
        title: title ?? `${mod.label} ${sid}`,
        state: mod.createState(),
      };
      set((s) => ({ screens: [...s.screens, entry], activeId: sid }));
      return sid;
    },
    removeScreen: (id) =>
      set((s) => {
        const screens = s.screens.filter((x) => x.id !== id);
        const activeId = s.activeId === id ? (screens[screens.length - 1]?.id ?? null) : s.activeId;
        return { screens, activeId };
      }),
    setActive: (id) => {
      if (get().screens.some((x) => x.id === id)) set({ activeId: id });
    },
    setScreenState: (id, next) =>
      // A content update clears any prior render error so the surface gets a
      // fresh attempt (the boundary resets on the new state reference).
      set((s) => ({ screens: s.screens.map((x) => (x.id === id ? { ...x, state: next, error: null } : x)) })),
    setScreenError: (id, error) =>
      set((s) => ({ screens: s.screens.map((x) => (x.id === id ? { ...x, error } : x)) })),
  }));
}

export type PlaygroundController = ReturnType<typeof usePlaygroundServer>;

export function usePlaygroundServer() {
  // Register schema components once before any composition screen renders.
  useMemo(() => ensureSchemaComponents(), []);

  // Stable store instance for the lifetime of the page.
  const storeRef = useRef<ReturnType<typeof createPlaygroundStore> | null>(null);
  if (!storeRef.current) storeRef.current = createPlaygroundStore();
  const store = storeRef.current;

  // Reactive selectors for the UI.
  const screens = useStore(store, (s) => s.screens);
  const activeId = useStore(store, (s) => s.activeId);

  // ── MCP server + bridges (mounted once) ──
  const serverRef = useRef<MicroMcpServer | null>(null);
  const inProcRef = useRef<InProcessTransport | null>(null);
  const [serverReady, setServerReady] = useState(false);

  useEffect(() => {
    const server = new MicroMcpServer({
      info: { name: "agent-playground", version: "0.1.0" },
      instructions:
        "Fancy UI Agent Playground. Start by calling screens_list_kinds to see the surface catalog " +
        "(composition / artboard / whiteboard / chart / form / sheet / flow / slides / code / scene). " +
        "Create screens with screens_create { id, kind }, switch with screens_navigate, then drive each " +
        "screen with its per-kind tools (artboard_*, whiteboard_*, chart_*, form_*, sheet_*, flow_*, deck_*, " +
        "code_*, scene_*). A 'composition' screen renders agent-emitted Fancy UI JSON: call screens_update_content " +
        "with { schema: { type, props, children } } to populate it. Undo with agent_undo / agent_redo / agent_history.",
    });

    registerUndoTools(server, { defaultAgentId: PLAYGROUND_AGENT.id });

    // Screens (navigation + dynamic authoring) bridge.
    const screensBridge = registerScreensBridge(server, {
      adapter: {
        listScreens: () => {
          const s = store.getState();
          return s.screens.map((x) => ({
            id: x.id,
            title: x.title,
            kind: x.kind,
            active: x.id === s.activeId,
            // Tells the agent a screen it created failed to render.
            status: x.error ? "error" : "ok",
            error: x.error ?? undefined,
          }));
        },
        getActive: () => store.getState().activeId,
        setActive: (id) => store.getState().setActive(id),
        createScreen: (spec) => {
          const id = store.getState().addScreen(spec.kind, spec.title, spec.id);
          // Composition screens accept an initial schema via config.schema.
          if (id && spec.kind === "composition" && spec.config && "schema" in spec.config) {
            store.getState().setScreenState(id, { schema: (spec.config as { schema: unknown }).schema });
          }
        },
        destroyScreen: (id) => store.getState().removeScreen(id),
        updateScreenContent: (id, partial) => {
          const entry = store.getState().screens.find((x) => x.id === id);
          if (!entry) return;
          // For composition screens, `partial` carries { schema }. For other
          // kinds, shallow-merge into the existing state slice.
          const cur = (entry.state as Record<string, unknown>) ?? {};
          store.getState().setScreenState(id, { ...cur, ...partial });
        },
        listKinds: () =>
          KIND_MODULES.map((k) => ({ kind: k.kind, label: k.label, description: k.description })),
      },
      agent: PLAYGROUND_AGENT,
    });

    // One bridge per kind. Each adapter resolves to the active screen of that
    // kind so a single bridge drives whichever screen of that kind is current.
    const kindBridges = KIND_MODULES.map((mod) =>
      mod.register(server, {
        agent: PLAYGROUND_AGENT,
        getActiveScreenId: () => activeScreenIdOfKind(store, mod.kind),
        getActiveState: () => {
          const id = activeScreenIdOfKind(store, mod.kind);
          return id ? store.getState().screens.find((x) => x.id === id)?.state : undefined;
        },
        setActiveState: (next) => {
          const id = activeScreenIdOfKind(store, mod.kind);
          if (id) store.getState().setScreenState(id, next);
        },
      }),
    );

    inProcRef.current = attachInProcess(server);
    serverRef.current = server;
    setServerReady(true);

    return () => {
      screensBridge.dispose();
      kindBridges.forEach((b) => b.dispose());
      if (inProcRef.current) server.detach(inProcRef.current);
      serverRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sharing (external agent over the relay) ──
  const [session, setSession] = useState<SessionDescriptor | null>(null);
  const [relayState, setRelayState] = useState<RelayState>("idle");
  const sseRef = useRef<SseRelayTransport | null>(null);

  const startShare = useCallback(async () => {
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
  }, [session]);

  const stopShare = useCallback(async () => {
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
  }, [session]);

  const statusText =
    relayState === "open" ? "live" : relayState === "connecting" ? "connecting…" : relayState === "error" ? "error" : undefined;

  // In-process tool calls for the in-page console (visitor without an agent).
  // Drives the same MCP surface the external agent uses, via JSON-RPC over the
  // in-process transport with request-id correlation.
  const rpcId = useRef(1);
  const callTool = useCallback(async (name: string, args: Record<string, unknown>) => {
    const tx = inProcRef.current;
    if (!tx) throw new Error("server not ready");
    const id = rpcId.current++;
    return new Promise<unknown>((resolve, reject) => {
      const unsub = tx.onServerMessage((msg) => {
        const m = msg as { id?: number; result?: unknown; error?: { message?: string } };
        if (m.id !== id) return;
        unsub();
        if (m.error) reject(new Error(m.error.message ?? "tool error"));
        else resolve(m.result);
      });
      tx.deliver({ jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments: args } } as never).catch((e) => {
        unsub();
        reject(e);
      });
    });
  }, []);

  return {
    store,
    screens,
    activeId,
    serverReady,
    server: serverRef.current,
    // sharing
    session,
    relayState,
    statusText,
    startShare,
    stopShare,
    // direct store helpers (used by the in-page console buttons)
    addScreen: (kind: string, title?: string) => store.getState().addScreen(kind, title),
    removeScreen: (id: string) => store.getState().removeScreen(id),
    setActive: (id: string) => store.getState().setActive(id),
    setScreenState: (id: string, next: unknown) => store.getState().setScreenState(id, next),
    setScreenError: (id: string, error: string | null) => store.getState().setScreenError(id, error),
    // in-process tool invocation
    callTool,
  };
}

/** Resolve the active screen id IF it's of the given kind, else the most
 *  recently-added screen of that kind, else null. This lets a per-kind bridge
 *  target the screen the human is on, falling back sensibly when the active
 *  screen is a different kind. */
function activeScreenIdOfKind(store: ReturnType<typeof createPlaygroundStore>, kind: string): string | null {
  const s = store.getState();
  const active = s.screens.find((x) => x.id === s.activeId);
  if (active && active.kind === kind) return active.id;
  const sameKind = s.screens.filter((x) => x.kind === kind);
  return sameKind.length ? sameKind[sameKind.length - 1].id : null;
}
