import { useMemo, useState } from "react";
import { Button, Card, Heading, Text } from "@particle-academy/react-fancy";

type Row = [string, number, number, number, number]; // label, Q1..Q4
const ROWS_INIT: Row[] = [
    ["Subscriptions", 12000, 18500, 22000, 26500],
    ["Services", 4200, 5100, 5800, 6400],
    ["Setup fees", 1500, 1400, 1700, 2100],
];

const COLS = ["", "Q1", "Q2", "Q3", "Q4", "Total"];

export function SpreadsheetStudioKit() {
    const [rows, setRows] = useState<Row[]>(ROWS_INIT);
    const [active, setActive] = useState<{ r: number; c: number } | null>({ r: 0, c: 1 });

    const totals = useMemo(() => rows.map(([, ...vals]) => vals.reduce((s, v) => s + v, 0)), [rows]);
    const colTotals = useMemo(() => {
        return [0, 0, 0, 0].map((_, c) => rows.reduce((s, r) => s + (r[c + 1] as number), 0));
    }, [rows]);
    const grandTotal = colTotals.reduce((s, v) => s + v, 0);

    const setCell = (r: number, c: number, v: number) => {
        setRows((arr) => {
            const next = arr.map((row) => [...row]) as Row[];
            (next[r] as any)[c] = v;
            return next;
        });
    };

    const cellRef = (r: number, c: number) => String.fromCharCode(65 + c) + (r + 1);

    return (
        <div className="space-y-3">
            <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <Heading level={3} size="sm">Revenue · FY26</Heading>
                        <Text size="xs" className="!text-zinc-500 font-mono">
                            {active ? cellRef(active.r, active.c) : "—"}
                        </Text>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setRows(ROWS_INIT)}>Reset</Button>
                        <Button variant="ghost" size="sm">Export CSV</Button>
                    </div>
                </div>

                <table className="w-full font-mono text-sm">
                    <thead className="bg-zinc-50 text-[11px] uppercase text-zinc-500 dark:bg-zinc-900">
                        <tr>
                            {COLS.map((c, i) => (
                                <th key={i} className="border-b border-r border-zinc-200 px-3 py-1.5 text-right last:border-r-0 dark:border-zinc-800">
                                    {c}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, r) => (
                            <tr key={r}>
                                <td className="border-b border-r border-zinc-200 bg-zinc-50 px-3 py-1.5 text-left text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                                    {row[0]}
                                </td>
                                {[1, 2, 3, 4].map((c) => {
                                    const isActive = active?.r === r && active?.c === c;
                                    return (
                                        <td
                                            key={c}
                                            onClick={() => setActive({ r, c })}
                                            className={`border-b border-r border-zinc-200 px-3 py-1.5 text-right dark:border-zinc-800 ${
                                                isActive ? "ring-2 ring-inset ring-violet-500" : ""
                                            }`}
                                        >
                                            <input
                                                type="number"
                                                value={row[c] as number}
                                                onChange={(e) => setCell(r, c, parseInt(e.target.value, 10) || 0)}
                                                className="w-full bg-transparent text-right outline-none"
                                            />
                                        </td>
                                    );
                                })}
                                <td className="border-b border-zinc-200 bg-violet-50 px-3 py-1.5 text-right font-semibold text-violet-900 dark:border-zinc-800 dark:bg-violet-500/15 dark:text-violet-200">
                                    {totals[r].toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        <tr className="bg-zinc-100 dark:bg-zinc-800">
                            <td className="border-r border-zinc-200 px-3 py-1.5 text-left text-xs uppercase tracking-wider text-zinc-500 dark:border-zinc-700">
                                Quarter total
                            </td>
                            {colTotals.map((v, i) => (
                                <td key={i} className="border-r border-zinc-200 px-3 py-1.5 text-right font-semibold dark:border-zinc-700">
                                    {v.toLocaleString()}
                                </td>
                            ))}
                            <td className="bg-violet-100 px-3 py-1.5 text-right text-lg font-bold text-violet-900 dark:bg-violet-500/30 dark:text-violet-100">
                                {grandTotal.toLocaleString()}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </Card>

            <Text size="xs" className="!text-zinc-500">
                Demonstration of <code className="font-mono">@particle-academy/fancy-sheets</code>'s controlled-cell editing model with live formulas in the totals column.
            </Text>
        </div>
    );
}
