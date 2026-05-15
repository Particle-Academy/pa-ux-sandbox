import { useMemo, useState } from "react";

export const USAGE = `import { TimeGrid } from "@particle-academy/react-fancy";

<TimeGrid
  rows={["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]}
  cols={Array.from({length: 24}, (_, h) => String(h))}
  value={grid}                          // boolean[][]
  onChange={setGrid}
  toneOn="violet"                       // palette per use case
  ariaCell={(r, c) => \`\${rows[r]} \${c}:00\`}
/>`;

/**
 * TimeGrid — generic N×M boolean-cell painter. Drag to paint, click a
 * row/column label to toggle a whole strip. The demo configures it three
 * different ways to underline how few props it takes per use case.
 */
type Tone = "violet" | "emerald" | "sky" | "rose";

const TONE: Record<Tone, string> = {
  violet: "bg-violet-500 hover:bg-violet-600",
  emerald: "bg-emerald-500 hover:bg-emerald-600",
  sky: "bg-sky-500 hover:bg-sky-600",
  rose: "bg-rose-500 hover:bg-rose-600",
};

function TimeGrid({
  rows,
  cols,
  value,
  onChange,
  toneOn = "violet",
  cellWidth = 20,
  cellHeight = 16,
  sparseColLabels = true,
}: {
  rows: string[];
  cols: string[];
  value: boolean[][];
  onChange: (next: boolean[][]) => void;
  toneOn?: Tone;
  cellWidth?: number;
  cellHeight?: number;
  sparseColLabels?: boolean;
}) {
  const [drag, setDrag] = useState<boolean | null>(null);

  const set = (r: number, c: number, v: boolean) => {
    if (value[r][c] === v) return;
    const next = value.map((row) => row.slice());
    next[r][c] = v;
    onChange(next);
  };

  const toggleRow = (r: number) => {
    const all = value[r].every(Boolean);
    const next = value.map((row) => row.slice());
    for (let c = 0; c < cols.length; c++) next[r][c] = !all;
    onChange(next);
  };

  const toggleCol = (c: number) => {
    const all = value.every((row) => row[c]);
    const next = value.map((row) => row.slice());
    for (let r = 0; r < rows.length; r++) next[r][c] = !all;
    onChange(next);
  };

  const colStep = Math.max(1, Math.floor(cols.length / 6));

  return (
    <div
      className="select-none overflow-x-auto"
      onMouseLeave={() => setDrag(null)}
      onMouseUp={() => setDrag(null)}
    >
      <table className="text-[10px]">
        <thead>
          <tr>
            <th />
            {cols.map((label, c) => (
              <th
                key={c}
                onClick={() => toggleCol(c)}
                style={{ width: cellWidth }}
                className="cursor-pointer text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                {sparseColLabels ? (c % colStep === 0 ? label : "") : label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((label, r) => (
            <tr key={r}>
              <th
                onClick={() => toggleRow(r)}
                className="cursor-pointer pr-1 text-right font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                {label}
              </th>
              {cols.map((_, c) => {
                const on = value[r][c];
                return (
                  <td key={c} className="p-px">
                    <button
                      onMouseDown={() => {
                        const v = !on;
                        setDrag(v);
                        set(r, c, v);
                      }}
                      onMouseEnter={() => drag !== null && set(r, c, drag)}
                      style={{ width: cellWidth, height: cellHeight }}
                      className={`block rounded-sm transition ${
                        on
                          ? TONE[toneOn]
                          : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                      }`}
                      aria-label={`${rows[r]} ${cols[c]} ${on ? "on" : "off"}`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
