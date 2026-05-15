import { useState } from "react";

export const USAGE = `import { InboxZero } from "@particle-academy/react-fancy";

<InboxZero
  clearedCount={cleared}
  timeToZero="14 minutes"
  nextDigestAt={nextDigestIso}
  onTuneSettings={() => navigate("/settings/notifications")}
/>`;

/**
 * InboxZero — celebratory empty-state card that appears the moment a
 * user clears their inbox. Shows time-to-zero, items cleared, the next
 * digest ETA, and a single "tune what notifies me" CTA. The card fades
 * out gracefully when new items arrive.
 */
function InboxZero({
  clearedCount,
  timeToZero,
  nextDigestAt,
  onTuneSettings,
}: {
  clearedCount: number;
  timeToZero: string;
  nextDigestAt: string;
  onTuneSettings: () => void;
}) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-6 py-10 text-center dark:border-emerald-700 dark:from-emerald-500/10 dark:via-zinc-900 dark:to-sky-500/10">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-400 text-3xl text-white shadow-lg shadow-emerald-500/30">
        ✓
      </div>
      <h2 className="mt-4 text-xl font-semibold">Inbox zero.</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-600 dark:text-zinc-300">
        You cleared <span className="font-semibold">{clearedCount}</span> notifications
        in <span className="font-semibold">{timeToZero}</span>. Take a victory lap.
      </p>

      <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-3 text-left">
        <Stat label="Next digest" value={nextDigestAt} />
        <Stat label="Streak" value="3 days in a row" />
      </div>

      <button
        onClick={onTuneSettings}
        className="mt-6 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      >
        Tune what notifies me →
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}

export function InboxZeroDemo() {
  const [tab, setTab] = useState<"zero" | "after">("zero");
  return (
    <div className="space-y-3">
      <div className="inline-flex overflow-hidden rounded-md border border-zinc-300 text-xs dark:border-zinc-700">
        <button
          onClick={() => setTab("zero")}
          className={`px-3 py-1 ${
            tab === "zero" ? "bg-violet-600 text-white" : "text-zinc-600 dark:text-zinc-300"
          }`}
        >
          Inbox zero
        </button>
        <button
          onClick={() => setTab("after")}
          className={`border-l border-zinc-300 px-3 py-1 dark:border-zinc-700 ${
            tab === "after" ? "bg-violet-600 text-white" : "text-zinc-600 dark:text-zinc-300"
          }`}
        >
          After settings tune
        </button>
      </div>

      <InboxZero
        clearedCount={tab === "zero" ? 12 : 4}
        timeToZero={tab === "zero" ? "14 minutes" : "3 minutes"}
        nextDigestAt={tab === "zero" ? "tomorrow, 9:00 AM" : "Friday, 5:00 PM"}
        onTuneSettings={() => alert("→ /settings/notifications")}
      />
    </div>
  );
}
