import type { ComponentDoc } from "./types";
import { StatList } from "@particle-academy/react-fancy";

export const statListDoc: ComponentDoc = {
    intro: (
        <p>
            A stack of figures, taken as <strong>data rather than children</strong> — the
            repeated thing is a shape, so an agent can emit the whole list as JSON without
            composing React. Each row carries a stable <code>key</code>, which is the
            handle an agent reads a figure back from. Compare <code>Stat.Band</code>, which
            is an evenly divided row of composed children.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description:
                "items is an array of value/label pairs. Right-aligned, which is the default because the stack usually sits against the end of a column.",
            render: () => (
                <StatList
                    className="w-full"
                    items={[
                        { value: "111", label: "Packages" },
                        { value: "326", label: "Installable components" },
                        { value: "21", label: "MCP bridges" },
                    ]}
                />
            ),
            code: `<StatList
    items={[
        { value: "111", label: "Packages" },
        { value: "326", label: "Installable components" },
        { value: "21", label: "MCP bridges" },
    ]}
/>`,
        },
        {
            name: "Alignment",
            description:
                "align flips which edge the stack reads from. Left when the list opens a column, right when it closes one.",
            render: () => (
                <div className="grid w-full gap-8 sm:grid-cols-2">
                    <StatList
                        align="left"
                        items={[
                            { value: "69", label: "TypeScript" },
                            { value: "30", label: "PHP" },
                            { value: "10", label: "Python" },
                        ]}
                    />
                    <StatList
                        align="right"
                        items={[
                            { value: "69", label: "TypeScript" },
                            { value: "30", label: "PHP" },
                            { value: "10", label: "Python" },
                        ]}
                    />
                </div>
            ),
            code: `<StatList align="left" items={items} />
<StatList align="right" items={items} />`,
        },
        {
            name: "Explicit keys",
            description:
                "key defaults to the label when that is a plain string, which covers most lists without asking you to repeat yourself. Pass it explicitly when the label is a node, when two rows share a label, or when an agent needs a handle that survives the label being reworded.",
            render: () => (
                <StatList
                    className="w-full"
                    items={[
                        { key: "bugfix-window", value: "6mo", label: "Bug fixes" },
                        { key: "security-window", value: "12mo", label: "Security fixes" },
                        {
                            key: "oldest-line",
                            value: "0.4",
                            label: (
                                <>
                                    Oldest supported <em>line</em>
                                </>
                            ),
                        },
                    ]}
                />
            ),
            code: `<StatList
    items={[
        { key: "bugfix-window", value: "6mo", label: "Bug fixes" },
        { key: "security-window", value: "12mo", label: "Security fixes" },
        { key: "oldest-line", value: "0.4", label: <>Oldest supported <em>line</em></> },
    ]}
/>`,
        },
        {
            name: "Rich values",
            description:
                "Both value and label are nodes, so units, deltas and emphasis go in without extra props.",
            render: () => (
                <StatList
                    className="w-full"
                    align="left"
                    items={[
                        {
                            value: (
                                <>
                                    98<span className="align-super text-base">%</span>
                                </>
                            ),
                            label: "Statements covered",
                        },
                        {
                            value: <span className="text-green-600">+12</span>,
                            label: "Components this quarter",
                        },
                        {
                            value: <span className="text-zinc-400">0</span>,
                            label: "Open security advisories",
                        },
                    ]}
                />
            ),
            code: `<StatList
    items={[
        { value: <>98<span className="align-super text-base">%</span></>, label: "Statements covered" },
        { value: <span className="text-green-600">+12</span>, label: "Components this quarter" },
    ]}
/>`,
        },
        {
            name: "From server data",
            description:
                "The shape the prop was designed for: a plain array straight off an endpoint, mapped into items with no JSX per row.",
            render: () => {
                const metrics = [
                    { name: "Requests", total: "1.2M" },
                    { name: "Errors", total: "318" },
                    { name: "p95 latency", total: "84ms" },
                ];

                return (
                    <StatList
                        className="w-full"
                        items={metrics.map((m) => ({
                            key: m.name,
                            value: m.total,
                            label: m.name,
                        }))}
                    />
                );
            },
            code: `<StatList
    items={metrics.map((m) => ({ key: m.name, value: m.total, label: m.name }))}
/>`,
        },
    ],
    props: [
        { name: "items", type: `StatListItem[]`, default: "—", description: "The figures. `{ value, label, key? }` — data rather than children.", required: true },
        { name: "align", type: `"left" | "right"`, default: `"right"`, description: "Which edge the stack aligns to." },
        { name: "...rest", type: `HTMLAttributes<HTMLDivElement>`, default: "—", description: "All standard div attributes." },
    ],
    notes: (
        <ul>
            <li>
                <code>StatListItem.key</code> is the agent-facing handle. It falls back to{" "}
                <code>label</code> only when that is a plain string — a node label with no
                explicit key leaves the row without a stable identity.
            </li>
            <li>
                Taking <code>items</code> as data rather than children is what makes this
                JSON-emittable, which is constraint 3 of the component contract. A list that
                required one child element per row could not be produced by an agent without
                composing React.
            </li>
            <li>
                For an evenly divided horizontal strip, use <code>Stat.Band</code> instead.
            </li>
        </ul>
    ),
};
