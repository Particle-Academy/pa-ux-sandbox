import type { ComponentDoc } from "./types";
import { Stat } from "@particle-academy/react-fancy";

export const statDoc: ComponentDoc = {
    intro: (
        <p>
            A single figure and the caption under it — the editorial &ldquo;2016 /
            founded&rdquo; pairing, not a dashboard metric card.{" "}
            <code>Stat.Band</code> arranges several into an evenly divided row, which is
            where the component is usually seen: a strip of four numbers under a hero.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "A value and its label.",
            render: () => <Stat value="2016" label="Founded" />,
            code: `<Stat value="2016" label="Founded" />`,
        },
        {
            name: "Sizes",
            description:
                "sm sits inside a card, md is the default, lg is hero type — a number meant to be read from across the room.",
            render: () => (
                <div className="flex flex-wrap items-end gap-10">
                    <Stat size="sm" value="120+" label="Components" />
                    <Stat size="md" value="120+" label="Components" />
                    <Stat size="lg" value="120+" label="Components" />
                </div>
            ),
            code: `<Stat size="sm" value="120+" label="Components" />
<Stat size="md" value="120+" label="Components" />
<Stat size="lg" value="120+" label="Components" />`,
        },
        {
            name: "A band",
            description:
                "Stat.Band divides the row evenly, so the figures align regardless of how wide each one is. Four columns by default.",
            render: () => (
                <Stat.Band className="w-full">
                    <Stat value="111" label="Packages" />
                    <Stat value="326" label="Installable" />
                    <Stat value="0.5" label="Kit version" />
                    <Stat value="21" label="MCP bridges" />
                </Stat.Band>
            ),
            code: `<Stat.Band>
    <Stat value="111" label="Packages" />
    <Stat value="326" label="Installable" />
    <Stat value="0.5" label="Kit version" />
    <Stat value="21" label="MCP bridges" />
</Stat.Band>`,
        },
        {
            name: "Band columns",
            description:
                "columns sets how many the band divides into — two for a pair, three for an odd set. The default of four is the common editorial strip.",
            render: () => (
                <div className="w-full space-y-8">
                    <Stat.Band columns={2}>
                        <Stat size="sm" value="69" label="TypeScript" />
                        <Stat size="sm" value="30" label="PHP" />
                    </Stat.Band>
                    <Stat.Band columns={3}>
                        <Stat size="sm" value="6mo" label="Bug fixes" />
                        <Stat size="sm" value="12mo" label="Security" />
                        <Stat size="sm" value="0.4" label="Oldest line" />
                    </Stat.Band>
                </div>
            ),
            code: `<Stat.Band columns={2}>…</Stat.Band>
<Stat.Band columns={3}>…</Stat.Band>`,
        },
        {
            name: "Rich values",
            description:
                "value and label are nodes, not strings — so a unit, a superscript or a coloured delta goes in without a second prop for it.",
            render: () => (
                <Stat.Band columns={3} className="w-full">
                    <Stat
                        value={
                            <>
                                98<span className="text-base align-super">%</span>
                            </>
                        }
                        label="Coverage"
                    />
                    <Stat
                        value={
                            <>
                                1.4<span className="text-base">s</span>
                            </>
                        }
                        label="Build"
                    />
                    <Stat
                        value={<span className="text-green-600">+12</span>}
                        label="This week"
                    />
                </Stat.Band>
            ),
            code: `<Stat
    value={<>98<span className="align-super text-base">%</span></>}
    label="Coverage"
/>
<Stat value={<span className="text-green-600">+12</span>} label="This week" />`,
        },
    ],
    props: [
        { name: "value", type: `ReactNode`, default: "—", description: "The figure itself — `\"2016\"`, `\"120+\"`. A node, so units and deltas compose." },
        { name: "label", type: `ReactNode`, default: "—", description: "The caption under it." },
        { name: "size", type: `"sm" | "md" | "lg"`, default: `"md"`, description: "Figure size. `lg` is hero type." },
        { name: "...rest", type: `HTMLAttributes<HTMLDivElement>`, default: "—", description: "All standard div attributes." },
        { name: "Stat.Band — columns", type: `number`, default: `4`, description: "Columns the band divides into." },
        { name: "Stat.Band — ...rest", type: `HTMLAttributes<HTMLDivElement>`, default: "—", description: "All standard div attributes." },
    ],
    notes: (
        <ul>
            <li>
                This is an <em>editorial</em> figure. For a dashboard metric with a trend, a
                sparkline and a comparison period, reach for a <code>Card</code> plus{" "}
                <code>EChart</code> instead — <code>Stat</code> deliberately has no slot for
                any of that.
            </li>
            <li>
                For a right-aligned stack of figures rather than an even row, see{" "}
                <code>StatList</code>, which takes its items as data and carries a stable key
                per row.
            </li>
        </ul>
    ),
};
