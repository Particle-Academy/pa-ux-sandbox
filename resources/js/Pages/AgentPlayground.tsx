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
 *
 * Presentation mirrors the editorial showcase agent demo (landing.css):
 * eyebrow + gradient display hero, a dot-grid `.demo-board` canvas, glassy
 * connect card with a gradient agent avatar, and a color-coded `.activity`
 * panel fed by live `useAgentActivity` events. All logic — usePlaygroundServer,
 * ShareControls, the in-page console, screen rendering + error boundary, and
 * ScreensActivityBridge — is unchanged; only the markup/classes are reskinned.
 */
export default function AgentPlayground() {
  return (
    <Layout bleed>
      <Head title="Agent Playground · Fancy UI" />
      <ScreenSystem>
        <PlaygroundInner />
      </ScreenSystem>
    </Layout>
  );
}

const MCP_VERSION = "0.7";

function PlaygroundInner() {
  const system = useScreenSystem();
  const pg = usePlaygroundServer();
  const activeEntry = pg.screens.find((s) => s.id === pg.activeId) ?? null;

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 72 }}>
      {/* fancy-screens' ScreenSystemValue is structurally the loose shape this
          bridge wants; cast to satisfy the cross-package boundary. */}
      <ScreensActivityBridge system={system as never} />

      {/* ── Hero ── */}
      <header style={{ marginBottom: 32 }}>
        <div className="eyebrow-row">
          <span className="dot" />
          Agent Playground · Live
        </div>
        <h1 className="display" style={{ marginBottom: 16 }}>
          Your agent. Our UI. <span className="gradient-text">Live.</span>
        </h1>
        <p className="lede" style={{ marginBottom: 0 }}>
          Start a session, connect your own agent over MCP, and watch it author Fancy UI screens + live data —
          calling <code style={{ fontFamily: "var(--font-mono)" }}>screens_create</code> to spin up surfaces, then
          driving each one with its per-kind tools. No external agent? Use the in-page console below to drive the
          same surface.
        </p>
      </header>

      {/* ── Connect your own agent ── */}
      <div className="pg-connect" style={{ marginBottom: 20 }}>
        <div className="pg-connect-head">
          <span className="av">C</span>
          <div className="pg-connect-copy">
            <div className="pg-connect-title">Connect your own agent</div>
            <div className="pg-connect-sub">
              Open a relay session, then point any MCP client at it. Frames stream both ways — your agent inhabits
              the canvas, you ride shotgun.
            </div>
          </div>
        </div>
        <div className="pg-connect-controls">
          <ShareControls session={pg.session} onStart={pg.startShare} onStop={pg.stopShare} status={pg.statusText} />
        </div>
      </div>

      <div className="pg-layout">
        <div className="min-w-0">
          <ScreenSwitcher
            screens={pg.screens}
            activeId={pg.activeId}
            onSelect={pg.setActive}
            onClose={pg.removeScreen}
          />

          <div className={`pg-board demo-board${pg.screens.length === 0 ? " pg-board--empty" : ""}`}>
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
          <ActivityPanel session={pg.session} status={pg.statusText} />
          <Console pg={pg} activeEntry={activeEntry} />
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
    <nav className="pg-tabs">
      {screens.map((s) => {
        const isActive = s.id === activeId;
        const mod = KIND_BY_NAME[s.kind];
        return (
          <div key={s.id} className={`pg-tab${isActive ? " active" : ""}`}>
            <button onClick={() => onSelect(s.id)} className="pg-tab-btn" type="button">
              <span className="pg-tab-kind">{mod?.label ?? s.kind}</span>
              <span className="pg-tab-title">{s.title}</span>
            </button>
            <button onClick={() => onClose(s.id)} title="Close screen" className="pg-tab-close" type="button">
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
    <div className="pg-empty">
      <div className="pg-empty-mark">
        <span className="av">C</span>
      </div>
      <div className="pg-empty-title">The canvas is yours to inhabit</div>
      <p className="pg-empty-sub">
        Open a session and ask your agent to <code style={{ fontFamily: "var(--font-mono)" }}>screens_create</code> a
        surface — or use the console to drop one in yourself. Screens render right here on the grid.
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
    <section className="pg-card">
      <div className="pg-card-head">
        <span className="pg-card-title">In-page console</span>
        <span className="pg-card-tag">in-process</span>
      </div>
      <div className="pg-card-sub">{placeholder}</div>

      <div className="pg-quickadd">
        {KIND_MODULES.map((k) => (
          <button
            key={k.kind}
            onClick={() => pg.addScreen(k.kind)}
            title={k.description}
            type="button"
            className="pg-chip-btn"
          >
            + {k.label}
            {k.status === "stub" && <span className="pg-chip-stub">·stub</span>}
          </button>
        ))}
      </div>

      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={5}
        spellCheck={false}
        className="pg-console-input"
      />
      <div className="pg-console-actions">
        <button onClick={run} disabled={!pg.serverReady} className="btn btn-primary pg-call-btn" type="button">
          Call tool
        </button>
        <span className="pg-console-note">in-process · same surface as the relay</span>
      </div>
      {out && <pre className="pg-console-out">{out}</pre>}
    </section>
  );
}

/** Map an activity event to one of the four color-coded `.ico` classes by
 *  inferring intent from the action verb (and target kind as a fallback). */
type ActivityTone = "write" | "move" | "read" | "tool";

function toneForEvent(event: AgentActivityEvent): ActivityTone {
  const action = (event.action || "").toLowerCase();
  // move / reorder / navigate / switch → blue
  if (/(move|reorder|navigate|switch|drag|position|reposition|pan|zoom)/.test(action)) return "move";
  // read-only inspection → amber
  if (/(get|list|read|describe|inspect|query|select|focus|view)/.test(action)) return "read";
  // additive / mutating writes → emerald
  if (/(add|create|insert|write|set|update|append|paint|draw|fill|put|edit|rename|attach|connect|apply|generate)/.test(action))
    return "write";
  // screens orchestration + everything else → violet "tool"
  return "tool";
}

const ICON_BY_TONE: Record<ActivityTone, string> = {
  write: "M",
  move: "→",
  read: "i",
  tool: "λ",
};

function ActivityPanel({ session, status }: { session: { id: string } | null; status?: string }) {
  const { events } = useAgentActivity(undefined, { capacity: 80 });
  const list = [...events].reverse();
  const sessionLabel = session ? session.id : status ?? "in-process";

  // Distinct agents seen in recent activity → presence chips. Always include
  // the local playground agent; surface any connected peers from events.
  const peers = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; color?: string }>();
    for (const e of events) {
      if (!e.agentId || e.agentId === PLAYGROUND_AGENT.id) continue;
      if (!seen.has(e.agentId)) {
        seen.set(e.agentId, { id: e.agentId, name: e.agentName ?? e.agentId, color: e.agentColor });
      }
    }
    return [...seen.values()];
  }, [events]);

  return (
    <section className="activity pg-activity">
      <div className="activity-head">
        <div className="title">
          <span className="av">C</span>
          <span>Agent activity</span>
          <span
            style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-3)" }}
          >
            {sessionLabel}
          </span>
        </div>
        <div className="sub">Live tool calls from the in-page MCP server.</div>
        <div className="pg-presence-row">
          <span className="presence-chip">
            <span
              className="av"
              style={{ background: "linear-gradient(135deg,#7dd3fc,#818cf8,#c4b5fd)" }}
            >
              C
            </span>
            {PLAYGROUND_AGENT.name ?? "Claude"}
          </span>
          {peers.map((p) => (
            <span className="presence-chip" key={p.id}>
              <span className="av" style={{ background: p.color ?? "#3b82f6" }}>
                {(p.name || "?").slice(0, 1).toUpperCase()}
              </span>
              {p.name}
            </span>
          ))}
        </div>
      </div>

      <div className="activity-list pg-activity-list">
        {list.length === 0 && (
          <div className="pg-activity-empty">No activity yet — connect an agent or use the console.</div>
        )}
        {list.map((e, i) => (
          <ActivityRow key={`${e.timestamp}-${e.action}-${i}`} event={e} fresh={i === 0} />
        ))}
      </div>

      <div className="activity-foot">
        <span className="mcp">mcp:{MCP_VERSION}</span>
        <span>
          Bridged to <code style={{ fontFamily: "var(--font-mono)" }}>fancy-ui</code>
        </span>
      </div>
    </section>
  );
}

function ActivityRow({ event, fresh }: { event: AgentActivityEvent; fresh: boolean }) {
  const tone = toneForEvent(event);
  const time = new Date(event.timestamp).toLocaleTimeString([], { hour12: false });
  const label = event.target.label;
  return (
    <div className={`activity-row${fresh ? " fresh" : ""}`}>
      <span className={`ico ${tone}`} aria-hidden>
        {ICON_BY_TONE[tone]}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-1)" }}>{event.action}</span>
        <span style={{ color: "var(--fg-3)" }}>
          {" "}
          · {event.target.kind}
        </span>
        {label && (
          <span
            style={{ display: "block", color: "var(--fg-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {label}
          </span>
        )}
      </span>
      <span className="when">{time}</span>
    </div>
  );
}
