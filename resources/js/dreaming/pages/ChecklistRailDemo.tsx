import { useMemo, useState } from "react";

export const USAGE = `import { ChecklistRail } from "@particle-academy/react-fancy";

<ChecklistRail
  steps={[
    { key: "workspace", title: "Create your workspace", body: "Pick a name and color.", cta: "Create" },
    { key: "invite",    title: "Invite a teammate",     body: "Skip if solo.",          cta: "Invite" },
    { key: "connect",   title: "Connect a data source", body: "Stripe, Postgres, CSV.", cta: "Connect" },
  ]}
  done={done}
  onToggle={(key) => setDone((d) => ({ ...d, [key]: !d[key] }))}
/>`;

/**
 * ChecklistRail — vertical onboarding checklist. Each step has a title,
 * a one-sentence body, a "do it" CTA, and a tickable state. The header
 * shows a progress ring; the floating "next" pill always points at the
 * top-most incomplete step so the user never has to scan.
 */
type Step = {
  key: string;
  title: string;
  body: string;
  cta: string;
};

const STEPS: Step[] = [
  {
    key: "workspace",
    title: "Create your workspace",
    body: "Pick a name and a color. You can change it any time from Settings.",
    cta: "Create workspace",
  },
  {
    key: "invite",
    title: "Invite a teammate",
    body: "Most teams add at least one collaborator on day one. Skip if you're flying solo.",
    cta: "Send invite",
  },
  {
    key: "connect",
    title: "Connect a data source",
    body: "Hook up Stripe, Postgres, or a CSV to see your first chart populate.",
    cta: "Connect",
  },
  {
    key: "ship",
    title: "Publish your first board",
    body: "Drag a chart onto a board, then hit Publish. Take a victory lap.",
    cta: "Open board",
  },
];

export function ChecklistRailDemo() {
  const [done, setDone] = useState<Record<string, boolean>>({});

  const nextIdx = useMemo(() => STEPS.findIndex((s) => !done[s.key]), [done]);
  const pct = Math.round(
    (Object.values(done).filter(Boolean).length / STEPS.length) * 100,
  );

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_220px]">
      <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <ol className="relative space-y-3">
          <span className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-zinc-200 dark:bg-zinc-800" />
          {STEPS.map((s, i) => {
            const isDone = !!done[s.key];
            const isNext = i === nextIdx;
            return (
              <li key={s.key} className="relative pl-8">
                <button
                  onClick={() => setDone((d) => ({ ...d, [s.key]: !d[s.key] }))}
                  aria-label={isDone ? "Mark incomplete" : "Mark done"}
                  className={`absolute left-0 top-0.5 grid h-5 w-5 place-items-center rounded-full border-2 transition ${
                    isDone
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : isNext
                        ? "animate-pulse border-violet-500 bg-white dark:bg-zinc-950"
                        : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950"
                  }`}
                >
                  {isDone ? "✓" : ""}
                </button>
                <div
                  className={`text-sm font-medium ${
                    isDone ? "text-zinc-400 line-through" : ""
                  }`}
                >
                  {s.title}
                </div>
                {!isDone && (
                  <>
                    <div className="mt-0.5 text-[12px] text-zinc-500">{s.body}</div>
                    {isNext && (
                      <button
                        onClick={() => setDone((d) => ({ ...d, [s.key]: true }))}
                        className="mt-2 rounded-md bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700"
                      >
                        {s.cta}
                      </button>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <ProgressRing pct={pct} />
        <div className="mt-2 text-sm font-medium">{pct}% complete</div>
        <div className="mt-0.5 text-[11px] text-zinc-500">
          {nextIdx === -1
            ? "You're all set 🎉"
            : `Next: ${STEPS[nextIdx].title}`}
        </div>
      </div>
    </div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <svg width={64} height={64} viewBox="0 0 64 64" className="mx-auto">
      <circle cx={32} cy={32} r={r} fill="none" strokeWidth={4} className="stroke-zinc-200 dark:stroke-zinc-800" />
      <circle
        cx={32}
        cy={32}
        r={r}
        fill="none"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform="rotate(-90 32 32)"
        className="stroke-violet-500 transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  );
}
