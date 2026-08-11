import type { ComponentDoc } from "./types";
import { type EChartsOption, EChartGraphic } from "@particle-academy/fancy-echarts";

/**
 * This page documented an API that does not exist.
 *
 * It showed `EChartGraphic` as an imperative helper called from an
 * `onChartReady` prop — `<EChart onChartReady={(chart) => EChartGraphic({ chart,
 * elements })} />`. `EChart` has no `onChartReady` prop, so the callback never
 * ran and the live example rendered a plain bar chart with no annotation on it;
 * and the `code:` block handed consumers the same non-working snippet to copy.
 *
 * `EChartGraphic` is a COMPONENT — `elements` is a prop, `option` is optional
 * and merges over the base. Rewritten against the real signature.
 */
const baseOption: Partial<EChartsOption> = {
    xAxis: { type: "category", data: ["Q1", "Q2", "Q3", "Q4"] },
    yAxis: { type: "value", max: 60 },
    series: [{ type: "bar", data: [24, 38, 31, 47], itemStyle: { color: "#8b5cf6" } }],
};

export const echartGraphicDoc: ComponentDoc = {
    intro: (
        <p>
            Annotation layer for <code>EChart</code>. Draw marks — text, arrows, target
            lines, callouts — over a chart by handing ECharts graphic elements to the{" "}
            <code>elements</code> prop. Everything <code>EChart</code> accepts, this
            accepts too; <code>option</code> is optional and merges over the base.
        </p>
    ),
    examples: [
        {
            name: "Pin a callout",
            description: "Graphic elements are a prop — no chart instance to capture, nothing imperative to wire.",
            render: () => (
                <div className="h-64 w-full">
                    <EChartGraphic
                        option={baseOption}
                        elements={[
                            {
                                type: "text",
                                x: "50%",
                                y: 20,
                                style: { text: "Best quarter!", fill: "#a855f7", fontSize: 14, fontWeight: "bold" },
                            },
                        ]}
                        style={{ height: "100%", width: "100%" }}
                    />
                </div>
            ),
            code: `import { EChartGraphic } from "@particle-academy/fancy-echarts";

<EChartGraphic
    option={option}
    elements={[
        {
            type: "text",
            x: "50%",
            y: 20,
            style: {
                text: "Best quarter!",
                fill: "#a855f7",
                fontSize: 14,
                fontWeight: "bold",
            },
        },
    ]}
/>`,
        },
    ],
    props: [
        { name: "elements", type: `GraphicElement[]`, default: "—", description: "ECharts graphic elements (`text`, `rect`, `circle`, `ring`, `arc`, `polygon`, `polyline`, `path`, `image`, `group`)." },
        { name: "option", type: `Partial<EChartsOption>`, default: "—", description: "The chart underneath. Optional, and merged over the component's own base." },
        { name: "theme", type: `string | object`, default: "—", description: "Same theme prop as `EChart`." },
        { name: "renderer", type: `"canvas" | "svg"`, default: `"canvas"`, description: "Use `svg` when annotations must stay crisp at any zoom." },
        { name: "onEvents", type: `Record<string, (params) => void>`, default: "—", description: "ECharts event handlers, keyed by event name." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Coordinates:</strong> graphic elements take <code>x</code> /{" "}
            <code>y</code> in pixels or percentages. Individual elements also accept{" "}
            <code>onclick</code> / <code>onmouseover</code> / <code>onmouseout</code>,
            so an annotation can be interactive without reaching for the chart instance.
        </p>
    ),
};
