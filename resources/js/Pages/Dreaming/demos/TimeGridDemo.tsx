import { useMemo, useState } from "react";
import { TimeGrid } from "@particle-academy/react-fancy";

export const USAGE = `import { TimeGrid } from "@particle-academy/react-fancy";

<TimeGrid
  rows={["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]}
  cols={Array.from({ length: 24 }, (_, h) => String(h))}
  value={grid}                          // boolean[][]
  onChange={setGrid}
  toneOn="violet"                       // 8-tone palette
  ariaCell={(r, c) => \`\${rows[r]} \${c}:00\`}
/>`;

/**
 * TimeGrid — three configurations to underline how few props the
 * component takes per use case. Lives in @particle-academy/react-fancy
 * (promoted from this dream in v3.3.0).
 */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, h) => String(h));
const SLOTS_30 = Array.from({ length: 14 }, (_, i) => {
  const h = 9 + Math.floor(i / 2);
  return `${h}:${i % 2 === 0 ? "00" : "30"}`;
});

function blank(rows: number, cols: number): boolean[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));
}

function defaultQuiet(): boolean[][] {
  const g = blank(7, 24);
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const weekend = d === 0 || d === 6;
      if (weekend || h < 8 || h >= 19) g[d][h] = true;
    }
  }
  return g;
}

export function TimeGridDemo() {
  const [quiet, setQuiet] = useState<boolean[][]>(() => defaultQuiet());
  const [avail, setAvail] = useState<boolean[][]>(() => blank(7, SLOTS_30.length));
  const [heat, setHeat] = useState<boolean[][]>(() => blank(7, 24));

  const quietPct = useMemo(
    () => Math.round((quiet.flat().filter(Boolean).length / (7 * 24)) * 100),
    [quiet],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-sm font-semibold">Use 1 · quiet hours</h3>
          <span className="text-xs text-zinc-500">{quietPct}% quiet</span>
        </div>
        <TimeGrid rows={DAYS} cols={HOURS} value={quiet} onChange={setQuiet} toneOn="violet" />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-2 text-sm font-semibold">Use 2 · meeting availability (30-min slots)</h3>
        <TimeGrid
          rows={DAYS}
          cols={SLOTS_30}
          value={avail}
          onChange={setAvail}
          toneOn="emerald"
          cellWidth={32}
          sparseColLabels={false}
        />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-2 text-sm font-semibold">Use 3 · server-load heatmap pattern</h3>
        <TimeGrid rows={DAYS} cols={HOURS} value={heat} onChange={setHeat} toneOn="rose" />
      </section>
    </div>
  );
}
