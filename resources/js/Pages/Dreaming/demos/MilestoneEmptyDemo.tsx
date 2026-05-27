import { ReactNode, useState } from "react";

export const USAGE = `import { MilestoneEmpty } from "@particle-academy/react-fancy";

<MilestoneEmpty
  icon="✓"
  tone="emerald"
  title="Inbox zero."
  blurb="You cleared 12 notifications in 14 minutes. Take a victory lap."
  stats={[
    { label: "Next digest", value: "tomorrow, 9:00 AM" },
    { label: "Streak",      value: "3 days in a row" },
  ]}
  primaryAction={{ label: "Tune what notifies me →", onClick: () => navigate("/settings") }}
/>`;

/**
 * MilestoneEmpty — celebratory empty-state primitive. Works for inbox
 * zero, all-tests-passing, queue-drained, onboarding-complete, deploy-
 * succeeded — any "you reached a desirable empty/complete state" moment.
 * The demo flips between three configurations to show the same component
 * across unrelated use cases.
 */
type Tone = "emerald" | "sky" | "violet" | "amber";

const TONE: Record<Tone, { ring: string; hero: string; border: string; bg: string }> = {
  emerald: {
    ring: "border-emerald-200 dark:border-emerald-700",
    hero: "from-emerald-400 to-sky-400 shadow-emerald-500/30",
    border: "border-emerald-200 dark:border-emerald-700",
    bg: "from-emerald-50 via-white to-sky-50 dark:from-emerald-500/10 dark:via-zinc-900 dark:to-sky-500/10",
  },
  sky: {
    ring: "border-sky-200 dark:border-sky-700",
    hero: "from-sky-400 to-indigo-400 shadow-sky-500/30",
    border: "border-sky-200 dark:border-sky-700",
    bg: "from-sky-50 via-white to-indigo-50 dark:from-sky-500/10 dark:via-zinc-900 dark:to-indigo-500/10",
  },
  violet: {
    ring: "border-violet-200 dark:border-violet-700",
    hero: "from-violet-400 to-fuchsia-400 shadow-violet-500/30",
    border: "border-violet-200 dark:border-violet-700",
    bg: "from-violet-50 via-white to-fuchsia-50 dark:from-violet-500/10 dark:via-zinc-900 dark:to-fuchsia-500/10",
  },
  amber: {
    ring: "border-amber-200 dark:border-amber-700",
    hero: "from-amber-400 to-rose-400 shadow-amber-500/30",
    border: "border-amber-200 dark:border-amber-700",
    bg: "from-amber-50 via-white to-rose-50 dark:from-amber-500/10 dark:via-zinc-900 dark:to-rose-500/10",
  },
};

function MilestoneEmpty({
  icon,
  tone = "emerald",
  title,
  blurb,
  stats,
  primaryAction,
  secondaryAction,
  extra,
}: {
  icon: ReactNode;
  tone?: Tone;
  title: string;
  blurb?: ReactNode;
  stats?: { label: string; value: ReactNode }[];
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  extra?: ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div className={`rounded-xl border ${t.border} bg-gradient-to-br ${t.bg} px-6 py-10 text-center`}>
      <div
        className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${t.hero} text-3xl text-white shadow-lg`}
      >
        {icon}
      </div>
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      {blurb && <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-600 dark:text-zinc-300">{blurb}</p>}

      {stats && stats.length > 0 && (
        <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-3 text-left">
          {stats.map((s, i) => (
            <div
              key={i}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                {s.label}
              </div>
              <div className="mt-0.5 text-sm font-medium">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {(primaryAction || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              {secondaryAction.label}
            </button>
          )}
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {primaryAction.label}
            </button>
          )}
        </div>
      )}

      {extra}
    </div>
  );
}

type Preset = "inbox" | "ci" | "queue";

const PRESETS: Record<Preset, Parameters<typeof MilestoneEmpty>[0]> = {
  inbox: {
    icon: "✓",
    tone: "emerald",
    title: "Inbox zero.",
    blurb: "You cleared 12 notifications in 14 minutes. Take a victory lap.",
    stats: [
      { label: "Next digest", value: "tomorrow, 9:00 AM" },
      { label: "Streak", value: "3 days in a row" },
    ],
    primaryAction: { label: "Tune what notifies me →", onClick: () => undefined },
  },
  ci: {
    icon: "⚙",
    tone: "sky",
    title: "All tests green.",
    blurb: "1,847 tests passing across 23 suites — including the flaky one.",
    stats: [
      { label: "Slowest suite", value: "api/billing · 4.2s" },
      { label: "Coverage", value: "84.7%" },
    ],
    primaryAction: { label: "Deploy to staging →", onClick: () => undefined },
    secondaryAction: { label: "Open run", onClick: () => undefined },
  },
  queue: {
    icon: "↘",
    tone: "violet",
    title: "Queue drained.",
    blurb: "Last job finished 12 seconds ago. Workers idle.",
    stats: [
      { label: "Throughput today", value: "8,931 jobs" },
      { label: "Avg latency", value: "118 ms" },
    ],
    primaryAction: { label: "Scale down workers", onClick: () => undefined },
  },
};

export function MilestoneEmptyDemo() {
  const [preset, setPreset] = useState<Preset>("inbox");
  return (
    <div className="space-y-3">
      <div className="inline-flex overflow-hidden rounded-md border border-zinc-300 text-xs dark:border-zinc-700">
        {(["inbox", "ci", "queue"] as Preset[]).map((p) => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className={`border-l border-zinc-300 px-3 py-1 first:border-l-0 dark:border-zinc-700 ${
              preset === p ? "bg-violet-600 text-white" : "text-zinc-600 dark:text-zinc-300"
            }`}
          >
            {p === "inbox" ? "Inbox zero" : p === "ci" ? "All tests green" : "Queue drained"}
          </button>
        ))}
      </div>
      <MilestoneEmpty {...PRESETS[preset]} />
    </div>
  );
}
