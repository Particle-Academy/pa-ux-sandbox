import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Map,
  type MapHandle,
  type MapMarker,
  type MapView,
} from "@particle-academy/fancy-map";
import { leafletProvider } from "@particle-academy/fancy-map/leaflet";
import "leaflet/dist/leaflet.css";
import { ToolRegistry } from "@particle-academy/agent-integrations";
import { registerMapBridge } from "@particle-academy/agent-integrations/bridges/map";
import "@particle-academy/agent-integrations/styles.css";

/**
 * MapAgentDemo — a map a human and an agent cohabit.
 *
 * The map's controlled state (view + markers + selection + follow) is owned by
 * React. `registerMapBridge` (agent-integrations) is wired to the SAME state via
 * a plain `ToolRegistry` host — no MCP server, no transport, no relay. The
 * buttons in the side panel fire the bridge's tools directly through
 * `host.callTool("map_*", …)`, exactly as a remote agent would over MCP, so you
 * can watch an "agent" drive the same map the human is looking at.
 *
 * A live-moving 🚚 "delivery" marker (advanced on a timer) stands in for a
 * real-time position feed — an agent can `map_start_track` it to make the camera
 * follow, or fit the bounds around everything, cohabiting with the human's own
 * panning and pin selection.
 */

const AGENT = { id: "assistant", name: "Assistant", color: "#7c3aed" };
const provider = leafletProvider();

const CENTER = { lat: 43.0389, lng: -87.9065 };

// Deterministic delivery route — a ring computed once at module load
// (no Math.random / Date.now, so SSR + hydration match).
const ROUTE = Array.from({ length: 60 }, (_, i) => {
  const t = (i / 60) * Math.PI * 2;
  return { lat: CENTER.lat + Math.sin(t) * 0.022, lng: CENTER.lng + Math.cos(t) * 0.034 };
});

// Fixed spots the "drop marker" action cycles through (deterministic, no random).
const DROP_SPOTS = [
  { lat: 43.0713, lng: -87.9018, icon: "📍", label: "Riverwest" },
  { lat: 43.0000, lng: -87.9065, icon: "🎯", label: "Bay View" },
  { lat: 43.0500, lng: -87.8800, icon: "⭐", label: "East Side" },
  { lat: 43.0250, lng: -87.9400, icon: "🏛️", label: "Menomonee Valley" },
];

type LogEntry = { at: number; tool: string; line: string; isError: boolean };

export function MapAgentDemo() {
  const [view, setView] = useState<MapView>({ center: CENTER, zoom: 12 });
  const [markers, setMarkers] = useState<MapMarker[]>([
    { id: "truck", position: ROUTE[0], icon: "🚚", color: "#2563eb", label: "Order #4821" },
    { id: "home", position: CENTER, icon: "🏠", color: "#16a34a", label: "You" },
  ]);
  const [selected, setSelected] = useState<string | null>(null);
  const [follow, setFollow] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);

  // Refs so the bridge adapter reads the latest state from inside async tool
  // handlers without stale closures.
  const stateRefs = useRef({ view, markers, selected });
  useEffect(() => {
    stateRefs.current = { view, markers, selected };
  }, [view, markers, selected]);

  // The imperative map handle (for fitBounds), grabbed via <Map onReady>.
  const handleRef = useRef<MapHandle | null>(null);

  const note = useCallback((tool: string, line: string, isError = false) => {
    setLog((cur) => [{ at: Date.now(), tool, line, isError }, ...cur].slice(0, 14));
  }, []);

  // One ToolRegistry host + the map bridge, wired to the controlled state.
  const host = useMemo(() => new ToolRegistry(), []);
  useEffect(() => {
    const bridge = registerMapBridge(host, {
      adapter: {
        getView: () => stateRefs.current.view,
        setView,
        getMarkers: () => stateRefs.current.markers,
        setMarkers: (next) => setMarkers(typeof next === "function" ? next : () => next),
        getSelected: () => stateRefs.current.selected,
        setSelected,
        fitBounds: (points, padding) => handleRef.current?.fitBounds(points, padding),
        setFollow,
      },
      agent: AGENT,
    });
    return () => bridge.dispose();
  }, [host]);

  // Live position feed: advance the 🚚 marker along the route. Preserves any
  // other markers the agent has added.
  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => (s + 1) % ROUTE.length), 1000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    setMarkers((all) => all.map((m) => (m.id === "truck" ? { ...m, position: ROUTE[step] } : m)));
  }, [step]);

  // Fire a bridge tool exactly as an agent would, and log the result text.
  const call = useCallback(
    async (tool: string, args: Record<string, unknown> = {}) => {
      const res = await host.callTool(tool, args);
      const text = res.content
        .filter((b): b is { type: "text"; text: string } => b.type === "text")
        .map((b) => b.text)
        .join(" ");
      note(tool, text || "ok", !!res.isError);
    },
    [host, note],
  );

  const dropCounter = useRef(0);
  const dropMarker = () => {
    const spot = DROP_SPOTS[dropCounter.current % DROP_SPOTS.length];
    dropCounter.current += 1;
    void call("map_add_marker", {
      id: `pin-${dropCounter.current}`,
      lat: spot.lat,
      lng: spot.lng,
      icon: spot.icon,
      color: AGENT.color,
      label: spot.label,
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Map — You &amp; the Assistant</h1>
        <p className="text-sm text-zinc-500">
          The map's state (camera, markers, selection, follow) is controlled React state. The buttons on the right fire{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">map_*</code> tools through the{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">registerMapBridge</code> adapter via a plain{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">ToolRegistry.callTool()</code> — the same calls a
          remote agent makes over MCP — so an agent drives the very map you're panning. The 🚚 marker moves on its own
          (a stand-in live feed); pan/select it yourself while the "agent" acts.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div style={{ height: 560 }} className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
          <Map
            provider={provider}
            view={view}
            onViewChange={setView}
            markers={markers}
            selectedId={selected}
            onSelect={setSelected}
            follow={follow}
            onReady={(h) => {
              handleRef.current = h;
            }}
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        <div className="flex flex-col gap-3" style={{ height: 560 }}>
          <section className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: AGENT.color }} />
              Agent actions
              {follow && (
                <span className="ml-auto text-[11px] text-zinc-500">
                  following <code>{follow}</code>
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <PanelButton onClick={dropMarker}>Drop marker</PanelButton>
              <PanelButton onClick={() => void call("map_pan", { dLat: 0, dLng: 0.02 })}>Pan east →</PanelButton>
              <PanelButton onClick={() => void call("map_zoom", { delta: 1 })}>Zoom in +</PanelButton>
              <PanelButton onClick={() => void call("map_zoom", { delta: -1 })}>Zoom out −</PanelButton>
              <PanelButton onClick={() => void call("map_fit_bounds", { padding: 60 })}>Fit all markers</PanelButton>
              <PanelButton onClick={() => void call("map_set_view", { lat: CENTER.lat, lng: CENTER.lng, zoom: 12 })}>
                Reset camera
              </PanelButton>
              <PanelButton onClick={() => void call("map_start_track", { id: "truck" })}>Follow 🚚</PanelButton>
              <PanelButton onClick={() => void call("map_stop_track")}>Stop following</PanelButton>
              <PanelButton onClick={() => void call("map_select", { id: "truck" })}>Select 🚚</PanelButton>
              <PanelButton onClick={() => void call("map_select", {})}>Clear selection</PanelButton>
            </div>
          </section>

          <section className="flex min-h-0 flex-1 flex-col rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-2 text-sm font-medium">Tool log</div>
            {log.length === 0 ? (
              <div className="text-[11px] italic text-zinc-400">
                Nothing yet — press an agent action to drive the map.
              </div>
            ) : (
              <ol className="min-h-0 flex-1 space-y-1 overflow-auto font-mono text-[11px]">
                {log.map((l, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="shrink-0 text-zinc-400">
                      {new Date(l.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <span className="shrink-0 font-semibold" style={{ color: l.isError ? "#dc2626" : AGENT.color }}>
                      {l.tool}
                    </span>
                    <span className={`truncate ${l.isError ? "text-red-500" : "text-zinc-600 dark:text-zinc-400"}`}>
                      {l.line}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Every mutation broadcasts <code>AgentActivity</code> and pushes an undo entry — presence and{" "}
        <code>agent_undo</code> compose for free. Swap <code>leafletProvider()</code> for{" "}
        <code>googleProvider(&#123; apiKey &#125;)</code> and none of this wiring changes.
      </p>
    </div>
  );
}

function PanelButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md border border-zinc-300 px-2 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {children}
    </button>
  );
}
