import type { ComponentDoc } from "./types";
import { EChart, EChartGraphic } from "@particle-academy/fancy-echarts";

const baseOption = {
    xAxis: { type: "category", data: ["Q1", "Q2", "Q3", "Q4"] },
    yAxis: { type: "value", max: 60 },
    series: [{ type: "bar", data: [24, 38, 31, 47], itemStyle: { color: "#8b5cf6" } }],
};

export const echartGraphicDoc: ComponentDoc = {
    intro: (
        <p>
            Imperative graphic layer for <code>EChart</code>. Render annotation marks
            (text, arrows, target lines, callouts) at <em>chart-space</em> coordinates by
            handing graphic elements to ECharts via this small mounting helper.
        </p>
    ),
    examples: [
        {
            name: "Pin a callout",
            description: "Bind to a mounted chart's ref and call `setGraphic(...)` to place annotations.",
            render: () => (
                <div className="h-64 w-full">
                    <EChart
                        option={baseOption}
                        onChartReady={(chart) =>
                            EChartGraphic({
                                chart,
                                elements: [
                                    {
                                        type: "text",
                                        x: "50%",
                                        y: 20,
                                        style: { text: "Best quarter!", fill: "#a855f7", fontSize: 14, fontWeight: "bold" },
                                    },
                                ],
                            })
                        }
                    />
                </div>
            ),
            code: `import { EChart, EChartGraphic } from "@particle-academy/fancy-echarts";

<EChart
    option={option}
    onChartReady={(chart) => {
        EChartGraphic({
            chart,
            elements: [
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
            ],
        });
    }}
/>`,
        },
    ],
    props: [
        { name: "chart", type: `ECharts`, default: "—", description: "Mounted chart instance — typically captured via `onChartReady`." },
        { name: "elements", type: `GraphicElement[]`, default: "—", description: "Array of ECharts graphic elements (`text`, `rect`, `polyline`, `image`, …)." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Coordinates:</strong> ECharts graphic elements support
            <code>x</code> / <code>y</code> in pixels, percentages, or chart-space via
            <code>position: chart.convertToPixel(...)</code>. Recompute on resize if needed.
        </p>
    ),
};
