import { useEffect, useState } from "react";

/**
 * SlaPulse — countdown pill bound to a deadline. Green while comfortable,
 * amber inside the warn window, red-pulse when breached. One rAF heartbeat
 * (handled by the host page) keeps every pulse on the same screen in sync.
 */
function SlaPulse({
  deadline,
  warnMs = 5 * 60_000,
  now,
}: {
  deadline: number;
  warnMs?: number;
  now: number;
}) {
  const remaining = deadline - now;
  const breached = remaining <= 0;
  const warn = !breached && remaining < warnMs;

  const tone = breached
    ? "bg-rose-500 text-white animate-pulse"
    : warn
      ? "bg-amber-500 text-white"
      : "bg-emerald-500 text-white";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] ${tone}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
      {breached
        ? `breached ${formatDur(-remaining)} ago`
        : `${formatDur(remaining)} left`}
    </span>
  );
}

function formatDur(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function SlaPulseDemo() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setNow(Date.now());
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const samples = [
    { label: "Comfortable", deadline: now + 42 * 60_000 },
    { label: "Warn window", deadline: now + 90_000 },
    { label: "Just breached", deadline: now - 12_000 },
    { label: "Far breached", deadline: now - 27 * 60_000 },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {samples.map((s) => (
        <div
          key={s.label}
          className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div>
            <div className="text-sm font-medium">{s.label}</div>
            <div className="text-[11px] text-zinc-500">
              deadline = now {s.deadline >= now ? "+" : "−"}{" "}
              {formatDur(Math.abs(s.deadline - now))}
            </div>
          </div>
          <SlaPulse deadline={s.deadline} now={now} />
        </div>
      ))}
    </div>
  );
}
