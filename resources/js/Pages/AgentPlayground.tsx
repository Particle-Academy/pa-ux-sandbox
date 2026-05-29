import { Component, useMemo, useState, type ErrorInfo, type ReactNode } from "react";
import { Head } from "@inertiajs/react";
import { ScreenSystem, Screen, useScreenSystem } from "@particle-academy/fancy-screens";
import { ShareControls, ScreensActivityBridge, useAgentActivity, type AgentActivityEvent } from "@particle-academy/agent-integrations";
import "@particle-academy/agent-integrations/styles.css";
import { Layout } from "./Layout";
import { usePlaygroundServer, PLAYGROUND_AGENT, type ScreenEntry } from "./AgentPlayground/usePlaygroundServer";
import { KIND_MODULES, KIND_BY_NAME } from "./AgentPlayground/kinds";

/**
 * Agent Playground — a user starts an MCP session, their own external agent
 * connects over the relay, and the agent generates Fancy UI Screens + data,
 * driving the full kit (composition / artboard / whiteboard / chart / form /
 * sheet / flow / slides / code / scene) over MCP.
 *
 * The canvas is fancy-screens' <ScreenSystem>. A Zustand-backed registry holds
 * a dynamic list of screens; the screens bridge lets the agent create/switch
 * them, and each kind's bridge drives the active screen of that kind.
 */
export default function AgentPlayground() {
  return (
    <Layout>
      <Head title="Agent Playground · Fancy UI" />
      <ScreenSystem>
        <PlaygroundInner />
      </ScreenSystem>
    </Layout>
  );
}

function PlaygroundInner() {
  const system = useScreenSystem();
  const pg = usePlaygroundServer();
  const activeEntry = pg.screens.find((s) => s.id === pg.activeId) ?? null;

  return (
    <div className="mx-auto max-w-[1500px] px-2 py-4">
      {/* fancy-screens' ScreenSystemValue is structurally the loose shape this
          bridge wants; cast to satisfy the cross-package boundary. */}
      <ScreensActivityBridge system={system as never} />

      <header className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Agent Playground</h1>
        <p className="max-w-3xl text-sm text-zinc-500">
          Start a session, connect your own agent, and watch it author Fancy UI screens + data live over MCP. The
          agent calls <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">screens_create</code> to spin
          up surfaces, then drives each one with its per-kind tools. No external agent? Use the in-page console below.
        </p>
      </header>

      <div className="mb-4">
        <ShareControls session={pg.session} onStart={pg.startShare} onStop={pg.stopShare} status={pg.statusText} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <ScreenSwitcher
            screens={pg.screens}
            activeId={pg.activeId}
            onSelect={pg.setActive}
            onClose={pg.removeScreen}
          />

          <div className="mt-3 min-h-[500px] rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            {pg.screens.length === 0 && <EmptyState />}
            {pg.screens.map((entry) => {
              const mod = KIND_BY_NAME[entry.kind];
              if (!mod) return null;
              const isActive = entry.id === pg.activeId;
              return (
                <Screen
                  key={entry.id}
                  id={entry.id}
                  title={entry.title}
                  className={isActive ? "" : "hidden"}
                >
                  <ScreenErrorBoundary
                    resetKey={entry.state}
                    onError={(msg) => pg.setScreenError(entry.id, msg)}
                  >
                    <mod.Surface
                      screenId={entry.id}
                      state={entry.state}
                      active={isActive}
                      onChange={(next) => pg.setScreenState(entry.id, next)}
                    />
                  </ScreenErrorBoundary>
                </Screen>
              );
            })}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <Console pg={pg} activeEntry={activeEntry} />
          <ActivityPanel />
        </aside>
      </div>
    </div>
  );
}

function ScreenSwitcher({
  screens,
  activeId,
  onSelect,
  onClose,
}: {
  screens: ScreenEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}) {
  if (screens.length === 0) return null;
  return (
    <nav className="flex flex-wrap gap-2 rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
      {screens.map((s) => {
        const isActive = s.id === activeId;
        const mod = KIND_BY_NAME[s.kind];
        return (
          <div
            key={s.id}
            className={[
              "group flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition",
              isActive ? "bg-purple-600 text-white shadow-sm" : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
            ].join(" ")}
          >
            <button onClick={() => onSelect(s.id)} className="flex items-center gap-2">
              <span className="text-[10px] uppercase opacity-70">{mod?.label ?? s.kind}</span>
              <span>{s.title}</span>
            </button>
            <button
              onClick={() => onClose(s.id)}
              title="Close screen"
              className={isActive ? "opacity-80 hover:opacity-100" : "opacity-0 group-hover:opacity-60 hover:!opacity-100"}
            >
              ✕
            </button>
          </div>
        );
      })}
    </nav>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[500px] flex-col items-center justify-center gap-2 text-center">
      <div className="text-4xl">🎛️</div>
      <div className="font-semibold text-zinc-700 dark:text-zinc-200">No screens yet</div>
      <p className="max-w-sm text-sm text-zinc-500">
        Connect your agent (Share above) and ask it to create a screen, or use the console on the right to add one
        yourself.
      </p>
    </div>
  );
}

/**
 * Isolates a single screen's render. A surface that throws — a bad agent-emitted
 * schema, a buggy kind, an upstream bug like marked() on undefined — shows an
 * error card instead of blanking the whole playground, and reports the failure
 * via onError so screens_list tells the agent its attempt failed (rather than
 * the agent believing it succeeded).
 */
class ScreenErrorBoundary extends Component<
  { resetKey: unknown; onError: (message: string) => void; children: ReactNode },
  { message: string | null }
> {
  state = { message: null as string | null };
  static getDerivedStateFromError(err: unknown) {
    return { message: err instanceof Error ? err.message : String(err) };
  }
  componentDidCatch(err: unknown, _info: ErrorInfo) {
    this.props.onError(err instanceof Error ? err.message : String(err));
  }
  componentDidUpdate(prev: { resetKey: unknown }) {
    // New content reference (agent updated the screen) → clear and retry.
    if (prev.resetKey !== this.props.resetKey && this.state.message) {
      this.setState({ message: null });
    }
  }
  render() {
    if (this.state.message) return <SurfaceError message={this.state.message} />;
    return this.props.children;
  }
}

function SurfaceError({ message }: { message: string }) {
  return (
    <div className="flex h-[480px] flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="text-3xl">⚠️</div>
      <div className="font-semibold text-rose-600 dark:text-rose-400">This screen failed to render</div>
      <pre className="max-w-lg overflow-auto whitespace-pre-wrap break-words rounded-md bg-rose-50 p-3 text-left text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
        {message}
      </pre>
      <p className="max-w-sm text-xs text-zinc-500">
        Isolated to this screen — others are unaffected. Update its content or remove it and try again.
      </p>
    </div>
  );
}

/**
 * In-page console — lets a visitor without an external agent drive the SAME
 * MCP surface. Quick-add buttons for every kind, plus a textarea that POSTs a
 * raw tool call ({"tool": "...", "args": {...}}) through the in-process
 * transport. This is the "see it work without your own agent" affordance.
 */
function Console({
  pg,
  activeEntry,
}: {
  pg: ReturnType<typeof usePlaygroundServer>;
  activeEntry: ScreenEntry | null;
}) {
  const [raw, setRaw] = useState(
    JSON.stringify({ tool: "screens_list_kinds", args: {} }, null, 2),
  );
  const [out, setOut] = useState<string>("");

  const placeholder = useMemo(
    () =>
      activeEntry
        ? `Active screen: ${activeEntry.title} (${activeEntry.kind}).`
        : "No active screen.",
    [activeEntry],
  );

  const run = async () => {
    setOut("…");
    try {
      const parsed = JSON.parse(raw) as { tool: string; args?: Record<string, unknown> };
      const result = await pg.callTool(parsed.tool, parsed.args ?? {});
      setOut(JSON.stringify(result, null, 2));
    } catch (e) {
      setOut(`Error: ${(e as Error).message}`);
    }
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">In-page console</div>
      <div className="mb-2 text-[11px] text-zinc-500">{placeholder}</div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {KIND_MODULES.map((k) => (
          <button
            key={k.kind}
            onClick={() => pg.addScreen(k.kind)}
            title={k.description}
            className="rounded-md border border-zinc-200 px-2 py-1 text-[11px] hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            + {k.label}
            {k.status === "stub" && <span className="ml-1 opacity-50">·stub</span>}
          </button>
        ))}
      </div>

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={5}
        spellCheck={false}
        className="w-full rounded-md border border-zinc-300 bg-transparent p-2 font-mono text-[11px] dark:border-zinc-600"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={run}
          disabled={!pg.serverReady}
          className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          Call tool
        </button>
        <span className="text-[10px] text-zinc-400">in-process · same surface as the relay</span>
      </div>
      {out && (
        <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-zinc-50 p-2 text-[10px] dark:bg-zinc-800">{out}</pre>
      )}
    </section>
  );
}

function ActivityPanel() {
  const { events } = useAgentActivity(undefined, { capacity: 80 });
  const list = [...events].reverse();
  return (
    <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900" style={{ maxHeight: 360, display: "flex", flexDirection: "column" }}>
      <header className="border-b border-zinc-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-700">
        Agent activity
      </header>
      <ul className="flex-1 divide-y divide-zinc-100 overflow-auto text-xs dark:divide-zinc-800">
        {list.length === 0 && (
          <li className="px-3 py-2 text-zinc-500">No activity yet — connect an agent or use the console.</li>
        )}
        {list.map((e) => (
          <ActivityRow key={`${e.timestamp}-${e.action}`} event={e} />
        ))}
      </ul>
    </section>
  );
}

function ActivityRow({ event }: { event: AgentActivityEvent }) {
  const time = new Date(event.timestamp).toLocaleTimeString([], { hour12: false });
  return (
    <li className="px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="agent-active-badge" style={{ ["--agent-color" as never]: event.agentColor ?? PLAYGROUND_AGENT.color }}>
          {event.agentName ?? PLAYGROUND_AGENT.name}
        </span>
        <span className="text-zinc-500">{time}</span>
      </div>
      <div className="mt-1 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
        {event.target.kind} · {event.action}
      </div>
      {event.target.label && <div className="text-[11px] text-zinc-500 truncate">{event.target.label}</div>}
    </li>
  );
}
