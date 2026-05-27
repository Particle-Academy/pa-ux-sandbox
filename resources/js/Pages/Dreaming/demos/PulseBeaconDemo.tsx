import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Pulse Beacon — directional attention primitive for
 * agent-integrations.
 *
 * When an agent needs the human's eye on something off-focus (a far
 * cell, a sticky outside the viewport, a chart that just changed), it
 * fires a beacon: a ripple originates at the element, an arrow points
 * from the element toward the human's cursor (or the viewport edge if
 * off-screen), and a one-line reason chip rides along.
 *
 * Severity tiers (info / warn / urgent) tune the visual loudness so
 * the dock doesn't become a slot machine. Repeat-suppression caps
 * pulses to one per (element, agent) window.
 *
 * The real implementation: bridges emit `notifications/attention`
 * frames with `{ targetId, agentId, severity, reason }`. Host overlay
 * resolves targetId → DOMRect via the presence registry's anchor map
 * and renders the SVG arrow + ripple from that rect to the mouse.
 */
type Severity = "info" | "warn" | "urgent";

type Beacon = {
  id: number;
  /** Source element id on the surface mock. */
  targetId: string;
  agent: { name: string; color: string };
  severity: Severity;
  reason: string;
  at: number;
};

type Target = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const TARGETS: Target[] = [
  { id: "cellA1", label: "A1", x: 30, y: 30, w: 90, h: 40 },
  { id: "cellD7", label: "D7", x: 510, y: 240, w: 90, h: 40 },
  { id: "stickyEdge", label: "off-screen sticky", x: 720, y: 80, w: 130, h: 70 },
  { id: "chartLegend", label: "chart legend", x: 380, y: 60, w: 160, h: 60 },
  { id: "footer", label: "footer note", x: 60, y: 300, w: 200, h: 36 },
];

const AGENTS = [
  { name: "Planner", color: "#a855f7" },
  { name: "Auditor", color: "#f59e0b" },
  { name: "Forecaster", color: "#3b82f6" },
];

const REASONS_BY_SEV: Record<Severity, string[]> = {
  info: [
    "FYI — added a new label",
    "minor update applied",
    "supporting data refreshed",
  ],
  warn: [
    "value diverged from forecast",
    "you may want to double-check this",
    "constraint loosely violated",
  ],
  urgent: [
    "drift exceeded SLA",
    "rolled back — needs your decision",
    "blocking error — agent paused",
  ],
};

const SEV: Record<Severity, { color: string; ttl: number; ripples: number }> = {
  info: { color: "#a3a3a3", ttl: 1800, ripples: 1 },
  warn: { color: "#f59e0b", ttl: 3000, ripples: 2 },
  urgent: { color: "#ef4444", ttl: 5000, ripples: 3 },
};

export function PulseBeaconDemo() {
  const [beacons, setBeacons] = useState<Beacon[]>([]);
  const [autoFire, setAutoFire] = useState(true);
  const [acknowledged, setAcknowledged] = useState<number[]>([]);
  const nextId = useRef(0);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);

  const fireBeacon = useCallback(
    (targetId?: string, severity?: Severity) => {
      const t = targetId ?? TARGETS[Math.floor(Math.random() * TARGETS.length)].id;
      const sev =
        severity ??
        (Math.random() < 0.6 ? "info" : Math.random() < 0.75 ? "warn" : "urgent");
      const a = AGENTS[Math.floor(Math.random() * AGENTS.length)];
      const reasons = REASONS_BY_SEV[sev];
      const reason = reasons[Math.floor(Math.random() * reasons.length)];
      setBeacons((cur) => [
        ...cur,
        {
          id: nextId.current++,
          targetId: t,
          agent: a,
          severity: sev,
          reason,
          at: Date.now(),
        },
      ]);
    },
    [],
  );

  useEffect(() => {
    if (!autoFire) return;
    const t = window.setInterval(() => fireBeacon(), 2200);
    return () => window.clearInterval(t);
  }, [autoFire, fireBeacon]);

  // GC expired beacons.
  useEffect(() => {
    const t = window.setInterval(() => {
      const now = Date.now();
      setBeacons((cur) =>
        cur.filter((b) => now - b.at < SEV[b.severity].ttl + 400),
      );
    }, 400);
    return () => window.clearInterval(t);
  }, []);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const onMouseLeave = () => setMouse(null);

  const ack = (id: number) =>
    setAcknowledged((cur) => (cur.includes(id) ? cur : [...cur, id]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Pulse Beacon</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Directional attention pulse. When an agent needs you to notice
          something off-focus, a ripple fires at the element and an arrow points
          from it toward your cursor with a one-line reason chip. Severity tiers
          tune visual loudness — info is subtle, urgent is loud.
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={autoFire}
            onChange={(e) => setAutoFire(e.target.checked)}
          />
          Auto-fire (every 2.2s)
        </label>
        <button
          onClick={() => fireBeacon(undefined, "info")}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          + info
        </button>
        <button
          onClick={() => fireBeacon(undefined, "warn")}
          className="rounded-md border border-amber-400 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950"
        >
          + warn
        </button>
        <button
          onClick={() => fireBeacon(undefined, "urgent")}
          className="rounded-md border border-rose-400 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-950"
        >
          + urgent
        </button>
        <button
          onClick={() => {
            setBeacons([]);
            setAcknowledged([]);
          }}
          className="ml-auto rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          clear
        </button>
      </section>

      <section
        ref={surfaceRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        className="relative h-[380px] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
      >
        {TARGETS.map((t) => (
          <div
            key={t.id}
            className="absolute rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-mono shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
            style={{ left: t.x, top: t.y, width: t.w, height: t.h }}
          >
            {t.label}
            <div className="mt-0.5 text-[9px] text-zinc-400">@{t.id}</div>
          </div>
        ))}

        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {beacons
            .filter((b) => !acknowledged.includes(b.id))
            .map((b) => {
              const target = TARGETS.find((t) => t.id === b.targetId);
              if (!target) return null;
              const sx = target.x + target.w / 2;
              const sy = target.y + target.h / 2;
              const age = Date.now() - b.at;
              const sev = SEV[b.severity];
              const aged = age / sev.ttl;
              const opacity = Math.max(0, 1 - aged);
              const ripples = Array.from({ length: sev.ripples }, (_, i) => {
                const phase = ((age + i * 600) % 1400) / 1400;
                return (
                  <circle
                    key={i}
                    cx={sx}
                    cy={sy}
                    r={8 + phase * 36}
                    fill="none"
                    stroke={sev.color}
                    strokeWidth={1.5}
                    opacity={(1 - phase) * opacity * 0.75}
                  />
                );
              });
              // Arrow toward mouse if visible, otherwise toward viewport center.
              const tx = mouse?.x ?? sx;
              const ty = mouse?.y ?? sy;
              const dx = tx - sx;
              const dy = ty - sy;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const ux = dist > 0 ? dx / dist : 0;
              const uy = dist > 0 ? dy / dist : 0;
              // Stop 18px short of the target end so the chip doesn't overlap.
              const reach = Math.max(20, Math.min(dist - 18, 220));
              const ex = sx + ux * reach;
              const ey = sy + uy * reach;
              return (
                <g key={b.id} opacity={opacity}>
                  {ripples}
                  <line
                    x1={sx}
                    y1={sy}
                    x2={ex}
                    y2={ey}
                    stroke={sev.color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeDasharray="4 4"
                  />
                  <circle cx={ex} cy={ey} r={3} fill={sev.color} />
                </g>
              );
            })}
        </svg>

        {beacons
          .filter((b) => !acknowledged.includes(b.id))
          .map((b) => {
            const target = TARGETS.find((t) => t.id === b.targetId);
            if (!target) return null;
            const sx = target.x + target.w / 2;
            const sy = target.y + target.h / 2;
            const tx = mouse?.x ?? sx + 80;
            const ty = mouse?.y ?? sy + 80;
            const dx = tx - sx;
            const dy = ty - sy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const ux = dist > 0 ? dx / dist : 0;
            const uy = dist > 0 ? dy / dist : 0;
            const reach = Math.max(20, Math.min(dist - 18, 220));
            const ex = sx + ux * reach;
            const ey = sy + uy * reach;
            const sev = SEV[b.severity];
            return (
              <div
                key={`chip-${b.id}`}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                style={{ left: ex, top: ey }}
              >
                <button
                  onClick={() => ack(b.id)}
                  className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium shadow-md ring-1 ring-black/5"
                  style={{
                    backgroundColor: sev.color,
                    color: "white",
                  }}
                  title="acknowledge"
                >
                  <span
                    className="inline-flex h-1.5 w-1.5 rounded-full bg-white"
                    style={{
                      boxShadow: `0 0 6px white`,
                    }}
                  />
                  {b.agent.name} · {b.reason}
                </button>
              </div>
            );
          })}

        <div className="absolute bottom-2 left-2 text-[10px] text-zinc-400">
          Move your cursor — pulses redirect toward it.
        </div>
        <div className="absolute bottom-2 right-2 text-[10px] text-zinc-400">
          {beacons.length - acknowledged.length} active beacon(s)
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 text-sm font-medium">Beacon log</div>
        {beacons.length === 0 ? (
          <div className="text-[11px] italic text-zinc-400">
            No beacons fired yet.
          </div>
        ) : (
          <ol className="space-y-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
            {[...beacons]
              .reverse()
              .slice(0, 8)
              .map((b) => (
                <li key={b.id} className="flex flex-wrap gap-2">
                  <span className="text-zinc-400">
                    {new Date(b.at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  <span
                    className="rounded px-1.5 text-white"
                    style={{ backgroundColor: SEV[b.severity].color }}
                  >
                    {b.severity}
                  </span>
                  <span style={{ color: b.agent.color }}>{b.agent.name}</span>
                  <span className="text-zinc-400">→ @{b.targetId}</span>
                  <span>· {b.reason}</span>
                  {acknowledged.includes(b.id) && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      [ack]
                    </span>
                  )}
                </li>
              ))}
          </ol>
        )}
      </section>
    </div>
  );
}
