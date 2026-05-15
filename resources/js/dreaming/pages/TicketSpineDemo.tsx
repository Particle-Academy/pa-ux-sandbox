import { useState } from "react";

/**
 * TicketSpine — vertical lifecycle indicator for a support ticket.
 * Stages are dots on a colored rail; the active stage glows, past stages
 * are filled, future stages are outlined. SLA tone (ok / warn / breach)
 * colors the rail. Escalation branches off as a side rail.
 */
type Stage = { key: string; label: string; at?: string };
type Tone = "ok" | "warn" | "breach";

function TicketSpine({
  stages,
  active,
  tone = "ok",
  escalatedAt,
}: {
  stages: Stage[];
  active: number;
  tone?: Tone;
  escalatedAt?: number;
}) {
  const rail =
    tone === "breach"
      ? "bg-rose-500"
      : tone === "warn"
        ? "bg-amber-500"
        : "bg-emerald-500";
  return (
    <div className="relative pl-7">
      <div className={`absolute left-2.5 top-1.5 bottom-1.5 w-0.5 ${rail} opacity-30`} />
      {stages.map((s, i) => {
        const past = i < active;
        const here = i === active;
        const branched = escalatedAt === i;
        return (
          <div key={s.key} className="relative pb-4 last:pb-0">
            <span
              className={`absolute -left-[18px] top-0.5 inline-block h-3 w-3 rounded-full border-2 ${
                here
                  ? `${rail} border-white shadow-[0_0_0_3px_rgba(99,102,241,0.18)]`
                  : past
                    ? `${rail} border-transparent`
                    : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950"
              }`}
              title={s.at ?? ""}
            />
            <div className="text-sm font-medium">{s.label}</div>
            {s.at && <div className="text-[11px] text-zinc-500">{s.at}</div>}
            {branched && (
              <div className="mt-1 ml-2 inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                ↳ escalated to Tier 2
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const STAGES: Stage[] = [
  { key: "open", label: "Opened", at: "9:02 AM" },
  { key: "triaged", label: "Triaged", at: "9:14 AM" },
  { key: "in_progress", label: "In progress", at: "9:31 AM" },
  { key: "waiting", label: "Waiting on customer" },
  { key: "resolved", label: "Resolved" },
];

export function TicketSpineDemo() {
  const [active, setActive] = useState(2);
  const [tone, setTone] = useState<Tone>("warn");
  const [escalated, setEscalated] = useState(true);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 text-[11px] uppercase tracking-wider text-zinc-500">
          Ticket #4821 · "billing inquiry"
        </div>
        <TicketSpine
          stages={STAGES}
          active={active}
          tone={tone}
          escalatedAt={escalated ? 2 : undefined}
        />
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 text-sm font-medium">Controls</div>
        <label className="block text-[11px] text-zinc-500">Active stage</label>
        <input
          type="range"
          min={0}
          max={STAGES.length - 1}
          value={active}
          onChange={(e) => setActive(parseInt(e.target.value, 10))}
          className="w-full"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {(["ok", "warn", "breach"] as Tone[]).map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`rounded-md border px-2 py-1 text-[11px] capitalize ${
                tone === t
                  ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200"
                  : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
              }`}
            >
              {t}
            </button>
          ))}
          <button
            onClick={() => setEscalated((e) => !e)}
            className="rounded-md border border-zinc-300 px-2 py-1 text-[11px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
          >
            {escalated ? "un-escalate" : "escalate"}
          </button>
        </div>
      </div>
    </div>
  );
}
