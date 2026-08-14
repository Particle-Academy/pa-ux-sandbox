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
import { registerPlaygroundBridges } from "./registerPlaygroundBridges";
import { useCoBrowse } from "../../agent/CoBrowseProvider";

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

export function createPlaygroundStore() {
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

    const disposeBridges = registerPlaygroundBridges(server, store, PLAYGROUND_AGENT);

    inProcRef.current = attachInProcess(server);
    serverRef.current = server;
    setServerReady(true);

    return () => {
      disposeBridges();
      if (inProcRef.current) server.detach(inProcRef.current);
      serverRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Contribute the same surface to the SITE co-browse session ──
  //
  // agent-integrations#7: "site tools always; page tools while mounted". The
  // playground kept its own server, console and share link above; this adds the
  // same bridges to the site-wide session for as long as this page is mounted,
  // so an agent handed the SITE link can drive these surfaces too, and loses
  // them on navigate.
  //
  // Both registrations drive the same store, so neither session owns the
  // screens. `contributeBridges` is safe to call before sharing has started —
  // it applies the contribution as soon as a server exists.
  const coBrowse = useCoBrowse();
  const contributeBridges = coBrowse?.contributeBridges;

  useEffect(() => {
    // Rendered outside the provider (or on an older agent-integrations): the
    // playground still works standalone, it just contributes nothing.
    if (!contributeBridges) return;
    return contributeBridges((siteServer) =>
      registerPlaygroundBridges(siteServer, store, PLAYGROUND_AGENT),
    );
  }, [contributeBridges, store]);

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
