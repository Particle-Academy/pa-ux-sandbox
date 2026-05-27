import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Agent Roster Dock — persistent presence affordance for
 * agent-integrations.
 *
 * A slim dock pinned to the edge of the app showing every active
 * agent: name, color, current status, what they're working on, and
 * quick controls (summon, mute, pause, hand off). The dock is the
 * one place humans can survey *all* parallel agents at a glance
 * without inspecting each surface.
 *
 * Status states drive the affordance:
 *   - thinking   → live spinner
 *   - working    → progress bar with the current verb
 *   - awaiting   → "needs you" chip + summon button
 *   - idle       → quiet, dimmed
 *   - blocked    → red dot + reason tooltip
 *   - muted      → strikethrough, no live updates rendered
 */
type Status = "thinking" | "working" | "awaiting" | "idle" | "blocked";

type Agent = {
  id: string;
  name: string;
  color: string;
  status: Status;
  /** Free-text current verb. */
  doing: string;
  /** 0..1 if status === working. */
  progress?: number;
  /** Reason if blocked. */
  block?: string;
  muted?: boolean;
  paused?: boolean;
  /** Wall-clock ms of last status flip. */
  since: number;
};

const SEED: Agent[] = [
  {
    id: "planner",
    name: "Planner",
    color: "#a855f7",
    status: "working",
    doing: "drafting Q3 roadmap",
    progress: 0.42,
    since: Date.now() - 9_000,
  },
  {
    id: "scribe",
    name: "Scribe",
    color: "#10b981",
    status: "thinking",
    doing: "summarizing meeting",
    since: Date.now() - 3_000,
  },
  {
    id: "forecaster",
    name: "Forecaster",
    color: "#3b82f6",
    status: "awaiting",
    doing: "needs confirmation on dataset",
    since: Date.now() - 28_000,
  },
  {
    id: "auditor",
    name: "Auditor",
    color: "#f59e0b",
    status: "blocked",
    doing: "verifying compliance rules",
    block: "missing API key for /v2/audit",
    since: Date.now() - 75_000,
  },
  {
    id: "doodler",
    name: "Doodler",
    color: "#ec4899",
    status: "idle",
    doing: "—",
    since: Date.now() - 240_000,
  },
];

const STATUS_LABEL: Record<Status, string> = {
  thinking: "Thinking",
  working: "Working",
  awaiting: "Awaiting you",
  idle: "Idle",
  blocked: "Blocked",
};

const STATUS_COLORS: Record<Status, string> = {
  thinking: "#a855f7",
  working: "#3b82f6",
  awaiting: "#f59e0b",
  idle: "#71717a",
  blocked: "#ef4444",
};

export function AgentRosterDockDemo() {
  const [agents, setAgents] = useState<Agent[]>(SEED);
  const [summoned, setSummoned] = useState<string | null>(null);
  const [log, setLog] = useState<Array<{ at: number; line: string }>>([]);
  const lastTick = useRef(Date.now());

  const note = useCallback((line: string) => {
    setLog((cur) => [{ at: Date.now(), line }, ...cur].slice(0, 8));
  }, []);

  // Tick: working agents advance, finished ones flip to awaiting / idle.
  useEffect(() => {
    const t = window.setInterval(() => {
      const now = Date.now();
      const dt = now - lastTick.current;
      lastTick.current = now;
      setAgents((cur) =>
        cur.map((a) => {
          if (a.paused || a.muted) return a;
          if (a.status === "working") {
            const next = Math.min(1, (a.progress ?? 0) + dt / 14_000);
            if (next >= 1) {
              return {
                ...a,
                status: Math.random() < 0.4 ? "awaiting" : "idle",
                doing: Math.random() < 0.4 ? "approve plan?" : "—",
                progress: undefined,
                since: now,
              };
            }
            return { ...a, progress: next };
          }
          if (a.status === "thinking" && Math.random() < 0.02) {
            return { ...a, status: "working", doing: a.doing, progress: 0, since: now };
          }
          if (a.status === "idle" && Math.random() < 0.01) {
            return {
              ...a,
              status: "thinking",
              doing: "picking next task",
              since: now,
            };
          }
          return a;
        }),
      );
    }, 400);
    return () => window.clearInterval(t);
  }, []);

  const update = (id: string, patch: Partial<Agent>) =>
    setAgents((cur) => cur.map((a) => (a.id === id ? { ...a, ...patch, since: Date.now() } : a)));

  const summon = (id: string) => {
    setSummoned(id);
    const a = agents.find((x) => x.id === id);
    if (a) note(`summoned ${a.name}`);
    update(id, { status: "thinking", doing: "responding to you" });
  };

  const toggleMute = (id: string) => {
    setAgents((cur) =>
      cur.map((a) => (a.id === id ? { ...a, muted: !a.muted } : a)),
    );
    const a = agents.find((x) => x.id === id);
    if (a) note(a.muted ? `unmuted ${a.name}` : `muted ${a.name}`);
  };

  const togglePause = (id: string) => {
    setAgents((cur) =>
      cur.map((a) => (a.id === id ? { ...a, paused: !a.paused } : a)),
    );
    const a = agents.find((x) => x.id === id);
    if (a) note(a.paused ? `resumed ${a.name}` : `paused ${a.name}`);
  };

  const handoff = (id: string) => {
    const a = agents.find((x) => x.id === id);
    if (a) note(`handed baton → ${a.name}`);
    update(id, { status: "working", doing: "took the baton", progress: 0.05 });
  };

  const counts = useMemo(() => {
    const c: Record<Status, number> = {
      thinking: 0,
      working: 0,
      awaiting: 0,
      idle: 0,
      blocked: 0,
    };
    for (const a of agents) c[a.status]++;
    return c;
  }, [agents]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Agent Roster Dock</h1>
        <p className="mt-1 text-sm text-zinc-500">
          A persistent dock listing every active agent with live status, current
          task, and quick controls. Survey all parallel agents at a glance
          without poking into each surface.
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{
              backgroundColor: STATUS_COLORS[s] + "22",
              color: STATUS_COLORS[s],
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[s] }}
            />
            {STATUS_LABEL[s]} · {counts[s]}
          </span>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-3 py-2 text-sm font-medium dark:border-zinc-800">
            Roster
          </div>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {agents.map((a) => (
              <AgentRow
                key={a.id}
                agent={a}
                selected={summoned === a.id}
                onSummon={() => summon(a.id)}
                onMute={() => toggleMute(a.id)}
                onPause={() => togglePause(a.id)}
                onHandoff={() => handoff(a.id)}
              />
            ))}
          </ul>
        </aside>

        <div className="space-y-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-sm font-medium">Detail</div>
            {summoned ? (
              <AgentDetail
                agent={agents.find((a) => a.id === summoned)!}
                onClose={() => setSummoned(null)}
              />
            ) : (
              <div className="mt-2 text-[12px] italic text-zinc-500">
                Click a roster row to summon an agent's detail.
              </div>
            )}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-2 text-sm font-medium">Dock log</div>
            {log.length === 0 ? (
              <div className="text-[12px] italic text-zinc-400">No actions yet.</div>
            ) : (
              <ol className="space-y-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                {log.map((l, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-zinc-400">
                      {new Date(l.at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    <span>{l.line}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function AgentRow({
  agent,
  selected,
  onSummon,
  onMute,
  onPause,
  onHandoff,
}: {
  agent: Agent;
  selected: boolean;
  onSummon: () => void;
  onMute: () => void;
  onPause: () => void;
  onHandoff: () => void;
}) {
  return (
    <li
      onClick={onSummon}
      className={`cursor-pointer px-3 py-2 transition ${
        selected
          ? "bg-violet-50 dark:bg-violet-950/30"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
      } ${agent.muted ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: agent.color }}
        />
        <span
          className={`text-sm font-medium ${
            agent.muted ? "line-through" : ""
          }`}
        >
          {agent.name}
        </span>
        <StatusChip status={agent.status} thinking={agent.status === "thinking"} />
        <span className="ml-auto text-[10px] text-zinc-400">
          {ago(agent.since)}
        </span>
      </div>
      <div className="mt-0.5 truncate text-[11px] text-zinc-500">
        {agent.paused ? "(paused) " : ""}
        {agent.block ?? agent.doing}
      </div>
      {agent.status === "working" && typeof agent.progress === "number" && (
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.round(agent.progress * 100)}%`,
              background: agent.color,
              transition: "width 350ms linear",
            }}
          />
        </div>
      )}
      <div className="mt-1.5 flex gap-1">
        <RowBtn onClick={(e) => { e.stopPropagation(); onMute(); }}>
          {agent.muted ? "unmute" : "mute"}
        </RowBtn>
        <RowBtn onClick={(e) => { e.stopPropagation(); onPause(); }}>
          {agent.paused ? "resume" : "pause"}
        </RowBtn>
        <RowBtn onClick={(e) => { e.stopPropagation(); onHandoff(); }}>
          hand off →
        </RowBtn>
      </div>
    </li>
  );
}

function RowBtn({
  onClick,
  children,
}: {
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded border border-zinc-200 px-1.5 py-0.5 text-[10px] hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {children}
    </button>
  );
}

function StatusChip({ status, thinking }: { status: Status; thinking: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-1.5 text-[10px] font-medium"
      style={{
        backgroundColor: STATUS_COLORS[status] + "22",
        color: STATUS_COLORS[status],
      }}
    >
      <span
        className={`h-1 w-1 rounded-full ${thinking ? "animate-ping-slow" : ""}`}
        style={{ backgroundColor: STATUS_COLORS[status] }}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

function AgentDetail({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-baseline gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: agent.color }}
        />
        <span className="text-base font-semibold">{agent.name}</span>
        <StatusChip status={agent.status} thinking={agent.status === "thinking"} />
        <button
          onClick={onClose}
          className="ml-auto text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          close
        </button>
      </div>
      <div className="text-[12px] text-zinc-600 dark:text-zinc-300">
        <span className="font-medium">Doing: </span>
        {agent.doing}
      </div>
      {agent.block && (
        <div className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          blocked: {agent.block}
        </div>
      )}
      <div className="text-[11px] text-zinc-400">last update {ago(agent.since)}</div>
    </div>
  );
}

function ago(ms: number) {
  const d = Date.now() - ms;
  if (d < 5_000) return "just now";
  if (d < 60_000) return `${Math.floor(d / 1_000)}s ago`;
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  return `${Math.floor(d / 3_600_000)}h ago`;
}
