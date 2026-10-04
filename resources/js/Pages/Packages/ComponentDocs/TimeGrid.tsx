import { useState } from "react";
import type { ComponentDoc } from "./types";
import { TimeGrid } from "@particle-academy/react-fancy";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, h) => String(h));

function empty(rows: number, cols: number): boolean[][] {
    return Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));
}

/** Office hours, so the examples show a real pattern rather than noise. */
function officeHours(): boolean[][] {
    return DAYS.map((_, day) =>
        HOURS.map((_, hour) => day >= 1 && day <= 5 && hour >= 9 && hour < 18),
    );
}

export const timeGridDoc: ComponentDoc = {
    intro: (
        <p>
            The availability matrix — days down, hours across, drag to paint. State is a
            plain <code>boolean[][]</code>, fully controlled, and the component{" "}
            <strong>never mutates it</strong>: every change produces a new array. That is
            what makes a schedule something an agent can read, diff and write back through a
            bridge rather than having to simulate drags.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description:
                "Seven rows, twenty-four columns. Click a cell to toggle it, or drag to paint a run.",
            render: () => {
                function Basic() {
                    const [value, setValue] = useState(() => officeHours());

                    return (
                        <div className="w-full overflow-x-auto">
                            <TimeGrid rows={DAYS} cols={HOURS} value={value} onChange={setValue} />
                        </div>
                    );
                }

                return <Basic />;
            },
            code: `const [value, setValue] = useState(() =>
    days.map(() => hours.map(() => false)),
);

<TimeGrid rows={days} cols={hours} value={value} onChange={setValue} />`,
        },
        {
            name: "Tones",
            description:
                "toneOn sets the on-cell colour. The list is deliberately short — eight palette entries rather than the whole scale — so the compiled CSS stays tight.",
            render: () => {
                function Tones() {
                    const [value, setValue] = useState(() => officeHours());

                    return (
                        <div className="w-full space-y-4">
                            {(["violet", "emerald", "rose"] as const).map((tone) => (
                                <div key={tone}>
                                    <p className="mb-1 text-xs font-medium text-zinc-500">
                                        toneOn="{tone}"
                                    </p>
                                    <div className="overflow-x-auto">
                                        <TimeGrid
                                            rows={DAYS}
                                            cols={HOURS}
                                            value={value}
                                            onChange={setValue}
                                            toneOn={tone}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                }

                return <Tones />;
            },
            code: `<TimeGrid rows={days} cols={hours} value={value} onChange={setValue} toneOn="emerald" />`,
        },
        {
            name: "Cell size",
            description:
                "cellWidth and cellHeight in px. Smaller for a dense week in a sidebar, larger where the grid is the page's subject and has to be hittable on a touchscreen.",
            render: () => {
                function Sizes() {
                    const [small, setSmall] = useState(() => officeHours());
                    const [large, setLarge] = useState(() => officeHours());

                    return (
                        <div className="w-full space-y-4">
                            <div>
                                <p className="mb-1 text-xs font-medium text-zinc-500">
                                    12 × 10 — dense
                                </p>
                                <div className="overflow-x-auto">
                                    <TimeGrid
                                        rows={DAYS}
                                        cols={HOURS}
                                        value={small}
                                        onChange={setSmall}
                                        cellWidth={12}
                                        cellHeight={10}
                                    />
                                </div>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-medium text-zinc-500">
                                    28 × 22 — touch-friendly
                                </p>
                                <div className="overflow-x-auto">
                                    <TimeGrid
                                        rows={DAYS}
                                        cols={HOURS}
                                        value={large}
                                        onChange={setLarge}
                                        cellWidth={28}
                                        cellHeight={22}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                }

                return <Sizes />;
            },
            code: `<TimeGrid … cellWidth={12} cellHeight={10} />
<TimeGrid … cellWidth={28} cellHeight={22} />`,
        },
        {
            name: "Column labels",
            description:
                "sparseColLabels is on by default — only every Nth label is drawn, because twenty-four labels over 20px cells collide into a grey smear. Turn it off when the cells are wide enough to carry them all.",
            render: () => {
                function Labels() {
                    const [value, setValue] = useState(() => empty(DAYS.length, HOURS.length));

                    return (
                        <div className="w-full space-y-4">
                            <div>
                                <p className="mb-1 text-xs font-medium text-zinc-500">
                                    sparseColLabels (default)
                                </p>
                                <div className="overflow-x-auto">
                                    <TimeGrid rows={DAYS} cols={HOURS} value={value} onChange={setValue} />
                                </div>
                            </div>
                            <div>
                                <p className="mb-1 text-xs font-medium text-zinc-500">
                                    all labels, with wider cells to fit them
                                </p>
                                <div className="overflow-x-auto">
                                    <TimeGrid
                                        rows={DAYS}
                                        cols={HOURS}
                                        value={value}
                                        onChange={setValue}
                                        sparseColLabels={false}
                                        cellWidth={28}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                }

                return <Labels />;
            },
            code: `<TimeGrid … sparseColLabels={false} cellWidth={28} />`,
        },
        {
            name: "Header clicks",
            description:
                "Clicking a row or column header toggles that whole strip — the fastest way to say \"all day Tuesday\" or \"nobody at 3am\". Turn it off where a stray header click would be expensive.",
            render: () => {
                function Strips() {
                    const [value, setValue] = useState(() => empty(DAYS.length, HOURS.length));

                    return (
                        <div className="w-full space-y-2">
                            <p className="text-xs text-zinc-500">
                                Click <strong>Mon</strong>, or the <strong>9</strong> column.
                            </p>
                            <div className="overflow-x-auto">
                                <TimeGrid
                                    rows={DAYS}
                                    cols={HOURS}
                                    value={value}
                                    onChange={setValue}
                                    toneOn="sky"
                                />
                            </div>
                        </div>
                    );
                }

                return <Strips />;
            },
            code: `{/* On by default. */}
<TimeGrid … toggleStripsOnHeaderClick={false} />`,
        },
        {
            name: "Accessible cell labels",
            description:
                "ariaCell overrides the default \"Mon 9 on\" announcement. Worth doing whenever the column label is a bare number — \"Mon 9:00 available\" is a sentence, \"Mon 9 on\" is a crossword clue.",
            render: () => {
                function Labelled() {
                    const [value, setValue] = useState(() => officeHours());

                    return (
                        <div className="w-full overflow-x-auto">
                            <TimeGrid
                                rows={DAYS}
                                cols={HOURS}
                                value={value}
                                onChange={setValue}
                                ariaCell={(r, c, on) =>
                                    `${DAYS[r]} ${HOURS[c]}:00 — ${on ? "available" : "unavailable"}`
                                }
                            />
                        </div>
                    );
                }

                return <Labelled />;
            },
            code: `<TimeGrid
    …
    ariaCell={(r, c, on) =>
        \`\${days[r]} \${hours[c]}:00 — \${on ? "available" : "unavailable"}\`
    }
/>`,
        },
        {
            name: "Stable cell ids",
            description:
                "cellId is emitted as data-react-fancy-timegrid-cell on each button, so a bridge can address one cell from a tool call without walking the DOM. It defaults to row:col; override it when your domain has real ids.",
            render: () => {
                function Ids() {
                    const [value, setValue] = useState(() => empty(DAYS.length, HOURS.length));

                    return (
                        <div className="w-full space-y-2">
                            <p className="text-xs text-zinc-500">
                                Inspect a cell — the handle reads{" "}
                                <code>slot-mon-09</code> rather than <code>1:9</code>.
                            </p>
                            <div className="overflow-x-auto">
                                <TimeGrid
                                    rows={DAYS}
                                    cols={HOURS}
                                    value={value}
                                    onChange={setValue}
                                    cellId={(r, c) =>
                                        `slot-${DAYS[r].toLowerCase()}-${String(c).padStart(2, "0")}`
                                    }
                                />
                            </div>
                        </div>
                    );
                }

                return <Ids />;
            },
            code: `<TimeGrid
    …
    cellId={(r, c) => \`slot-\${days[r].toLowerCase()}-\${String(c).padStart(2, "0")}\`}
/>`,
        },
        {
            name: "A different axis entirely",
            description:
                "Nothing here is hard-coded to days and hours — rows and cols are just labels. Five machines against eight shifts works exactly the same way.",
            render: () => {
                const machines = ["Press A", "Press B", "Cutter", "Folder"];
                const shifts = ["06", "09", "12", "15", "18", "21"];

                function Other() {
                    const [value, setValue] = useState(() =>
                        empty(machines.length, shifts.length),
                    );

                    return (
                        <div className="w-full overflow-x-auto">
                            <TimeGrid
                                rows={machines}
                                cols={shifts}
                                value={value}
                                onChange={setValue}
                                cellWidth={44}
                                cellHeight={24}
                                sparseColLabels={false}
                                toneOn="amber"
                            />
                        </div>
                    );
                }

                return <Other />;
            },
            code: `<TimeGrid
    rows={["Press A", "Press B", "Cutter"]}
    cols={["06", "09", "12", "15", "18", "21"]}
    value={value}
    onChange={setValue}
    sparseColLabels={false}
/>`,
        },
    ],
    props: [
        { name: "rows", type: `string[]`, default: "—", description: "Row labels, one per row in `value`.", required: true },
        { name: "cols", type: `string[]`, default: "—", description: "Column labels, one per column in `value`.", required: true },
        { name: "value", type: `boolean[][]`, default: "—", description: "Controlled cell state — a rectangular rows × cols matrix. Never mutated.", required: true },
        { name: "onChange", type: `(next: boolean[][]) => void`, default: "—", description: "Called with the next matrix whenever a cell, row or column toggles.", required: true },
        { name: "toneOn", type: `TimeGridTone`, default: `"violet"`, description: "Cell-on colour. Eight palette entries." },
        { name: "cellWidth", type: `number`, default: `20`, description: "Cell width in px." },
        { name: "cellHeight", type: `number`, default: `16`, description: "Cell height in px." },
        { name: "sparseColLabels", type: `boolean`, default: `true`, description: "Draw only every Nth column label, to keep the top axis legible." },
        { name: "toggleStripsOnHeaderClick", type: `boolean`, default: `true`, description: "Clicking a row/column header toggles that whole strip." },
        { name: "ariaCell", type: `(r: number, c: number, on: boolean) => string`, default: "`rows[r] cols[c] on|off`", description: "Accessible label per cell." },
        { name: "cellId", type: `(r: number, c: number) => string`, default: "`` `${row}:${col}` ``", description: "Stable per-cell handle, emitted as `data-react-fancy-timegrid-cell`." },
        { name: "className", type: `string`, default: "—", description: "Classes on the outer scroll container." },
    ],
    notes: (
        <ul>
            <li>
                <strong><code>value</code> must be rectangular</strong> —{" "}
                <code>rows.length</code> × <code>cols.length</code>. A ragged matrix is the
                one input shape this component cannot render sensibly, and building it from{" "}
                <code>rows.map(() =&gt; cols.map(…))</code> makes that impossible by
                construction.
            </li>
            <li>
                Fully controlled and immutable: the component produces a new array on every
                change and never writes into the one you passed. So{" "}
                <code>value</code> can be compared by reference, held in a store, or
                serialised straight to the server.
            </li>
            <li>
                The grid is wider than most columns at 24 hours. Wrap it in an{" "}
                <code>overflow-x-auto</code> container — every example here does.
            </li>
        </ul>
    ),
};
