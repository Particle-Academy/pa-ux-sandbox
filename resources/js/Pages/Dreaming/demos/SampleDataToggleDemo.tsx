import { useState } from "react";

export const USAGE = `import { SampleDataToggle } from "@particle-academy/react-fancy";

<SampleDataToggle
  seeded={isSeeded}
  onSeed={async () => {
    await seedSampleData();
    setIsSeeded(true);
  }}
  onClear={async () => {
    await wipeWorkspace();
    setIsSeeded(false);
  }}
  onKeep={() => promoteSampleToReal()}
/>`;

/**
 * SampleDataToggle — persistent strip that offers to seed a workspace
 * with sample data and gives a single revert. Stops the dreaded
 * "empty product feels broken" first-run hesitation; the strip stays
 * visible until the user either keeps the data or wipes it.
 */
type Row = { name: string; status: "active" | "pending" | "churned"; mrr: number };

const SAMPLE: Row[] = [
  { name: "Acme Robotics", status: "active", mrr: 990 },
  { name: "Vector Foods", status: "active", mrr: 290 },
  { name: "Lumen Cycles", status: "pending", mrr: 0 },
  { name: "Maple & Tile", status: "churned", mrr: 0 },
];

const STATUS_TONE: Record<Row["status"], string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  churned: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

function SampleDataToggle({
  seeded,
  onSeed,
  onClear,
  onKeep,
}: {
  seeded: boolean;
  onSeed: () => void;
  onClear: () => void;
  onKeep: () => void;
}) {
  if (!seeded) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-xs dark:border-violet-700 dark:bg-violet-500/10">
        <span className="text-base">✦</span>
        <div className="flex-1">
          <span className="font-medium text-violet-900 dark:text-violet-200">
            Try with sample data?
          </span>
          <span className="ml-2 text-violet-700 dark:text-violet-300">
            See the product alive in one click — wipe any time.
          </span>
        </div>
        <button
          onClick={onSeed}
          className="rounded-md bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700"
        >
          Seed sample data
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs dark:border-amber-700 dark:bg-amber-500/10">
      <span className="text-base">ℹ</span>
      <div className="flex-1 text-amber-900 dark:text-amber-200">
        <span className="font-medium">Showing sample data.</span> Replace it
        with your real data when ready.
      </div>
      <button
        onClick={onClear}
        className="rounded-md border border-amber-400 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-200 dark:hover:bg-amber-900/30"
      >
        Wipe & start fresh
      </button>
      <button
        onClick={onKeep}
        className="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
      >
        Keep as my data
      </button>
    </div>
  );
}

export function SampleDataToggleDemo() {
  const [rows, setRows] = useState<Row[]>([]);
  const [seeded, setSeeded] = useState(false);

  return (
    <div className="space-y-3">
      <SampleDataToggle
        seeded={seeded}
        onSeed={() => {
          setRows(SAMPLE);
          setSeeded(true);
        }}
        onClear={() => {
          setRows([]);
          setSeeded(false);
        }}
        onKeep={() => setSeeded(false)}
      />

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500 dark:bg-zinc-950">
            <tr>
              <th className="px-3 py-2 text-left">Customer</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">MRR</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-10 text-center text-xs italic text-zinc-400"
                >
                  No customers yet. Seed sample data above to see the table alive.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.name} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${STATUS_TONE[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono">${r.mrr}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
