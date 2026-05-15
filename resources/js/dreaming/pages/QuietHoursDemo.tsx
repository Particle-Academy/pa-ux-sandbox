import { useMemo, useState } from "react";

export const USAGE = `import { QuietHours } from "@particle-academy/react-fancy";

<QuietHours
  schedule={schedule}              // 7×24 boolean grid; true = quiet
  onChange={setSchedule}
  timezone="America/New_York"      // for the next-window preview
/>`;

/**
 * QuietHours — 7 × 24 grid for setting do-not-disturb bands. Drag to
 * paint quiet cells, click a column header to toggle a whole day, click
 * a row header to toggle a whole hour. Live preview shows the next
 * upcoming quiet window in the user's timezone.
 */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function emptyGrid(): boolean[][] {
  return Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => false));
}

function defaultGrid(): boolean[][] {
  const g = emptyGrid();
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const weekend = d === 0 || d === 6;
      if (weekend) g[d][h] = true;
      else if (h < 8 || h >= 19) g[d][h] = true;
    }
  }
  return g;
}

export function QuietHoursDemo() {
  const [grid, setGrid] = useState<boolean[][]>(() => defaultGrid());
  const [dragValue, setDragValue] = useState<boolean | null>(null);

  const set = (d: number, h: number, v: boolean) =>
    setGrid((g) => {
      const next = g.map((row) => row.slice());
      next[d][h] = v;
      return next;
    });

  const toggleDay = (d: number) => {
    const allQuiet = grid[d].every(Boolean);
    setGrid((g) => {
      const next = g.map((row) => row.slice());
      for (let h = 0; h < 24; h++) next[d][h] = !allQuiet;
      return next;
    });
  };

  const toggleHour = (h: number) => {
    const allQuiet = grid.every((row) => row[h]);
    setGrid((g) => {
      const next = g.map((row) => row.slice());
      for (let d = 0; d < 7; d++) next[d][h] = !allQuiet;
      return next;
    });
  };

  const summary = useMemo(() => {
    const quietCells = grid.flat().filter(Boolean).length;
    const pct = Math.round((quietCells / (7 * 24)) * 100);
    return { quietCells, pct };
  }, [grid]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Click or drag cells to paint. Click a day name to toggle a whole day; click an
            hour to toggle a column.
          </span>
          <span className="font-mono">{summary.pct}% quiet</span>
        </div>

        <div
          className="select-none overflow-x-auto"
          onMouseLeave={() => setDragValue(null)}
          onMouseUp={() => setDragValue(null)}
        >
          <table className="text-[10px]">
            <thead>
              <tr>
                <th className="w-10" />
                {Array.from({ length: 24 }, (_, h) => (
                  <th
                    key={h}
                    onClick={() => toggleHour(h)}
                    className="w-5 cursor-pointer text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    {h % 6 === 0 ? h : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, d) => (
                <tr key={d}>
                  <th
                    onClick={() => toggleDay(d)}
                    className="cursor-pointer pr-1 text-right font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  >
                    {DAYS[d]}
                  </th>
                  {row.map((quiet, h) => (
                    <td key={h} className="p-px">
                      <button
                        onMouseDown={() => {
                          const v = !quiet;
                          setDragValue(v);
                          set(d, h, v);
                        }}
                        onMouseEnter={() => {
                          if (dragValue !== null) set(d, h, dragValue);
                        }}
                        className={`h-4 w-5 rounded-sm transition ${
                          quiet
                            ? "bg-violet-500 hover:bg-violet-600"
                            : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                        }`}
                        aria-label={`${DAYS[d]} ${h}:00 ${quiet ? "quiet" : "notify"}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-xs text-violet-900 dark:border-violet-700 dark:bg-violet-500/10 dark:text-violet-200">
        Next quiet window starts in <span className="font-mono">~2h 14m</span> ·{" "}
        <span className="text-violet-700 dark:text-violet-300">tomorrow 7:00 PM → 8:00 AM</span>
      </div>
    </div>
  );
}
