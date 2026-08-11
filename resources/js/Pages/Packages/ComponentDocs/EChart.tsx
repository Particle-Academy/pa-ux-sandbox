import type { ComponentDoc } from "./types";
import { type EChartsOption, EChart } from "@particle-academy/fancy-echarts";

const lineOption: EChartsOption = {
    tooltip: { trigger: "axis" },
    legend: { data: ["Free", "Pro"], textStyle: { color: "#a1a1aa" } },
    xAxis: { type: "category", data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], axisLabel: { color: "#a1a1aa" } },
    yAxis: { type: "value", axisLabel: { color: "#a1a1aa" } },
    series: [
        { name: "Free", type: "line", data: [12, 18, 22, 28, 35, 42], smooth: true, lineStyle: { color: "#8b5cf6" } },
        { name: "Pro", type: "line", data: [4, 6, 10, 16, 24, 30], smooth: true, lineStyle: { color: "#22c55e" } },
    ],
};

const pieOption: EChartsOption = {
    tooltip: { trigger: "item" },
    series: [
        {
            type: "pie",
            radius: ["45%", "70%"],
            label: { show: true, color: "#a1a1aa" },
            data: [
                { name: "Active", value: 62, itemStyle: { color: "#8b5cf6" } },
                { name: "Draft", value: 24, itemStyle: { color: "#f59e0b" } },
                { name: "Archived", value: 14, itemStyle: { color: "#71717a" } },
            ],
        },
    ],
};

export const echartDoc: ComponentDoc = {
    intro: (
        <p>
            Typed React wrapper around Apache ECharts. Pass any ECharts <code>option</code>{" "}
            object — the wrapper handles ResizeObserver-based responsiveness, lazy module
            registration, theme switching, and SSR-safe rendering. Every chart type ECharts
            supports works from this single component.
        </p>
    ),
    examples: [
        {
            name: "Line chart",
            description: "Pass `option` exactly as you would to ECharts directly.",
            render: () => (
                <div className="h-64 w-full">
                    <EChart option={lineOption} />
                </div>
            ),
            code: `import { EChart } from "@particle-academy/fancy-echarts";

const option = {
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: ["Jan", "Feb", "Mar"] },
    yAxis: { type: "value" },
    series: [{ type: "line", data: [12, 18, 22], smooth: true }],
};

<EChart option={option} />`,
        },
        {
            name: "Donut chart",
            description: "Any ECharts series type works — just change `series.type`.",
            render: () => (
                <div className="h-64 w-full">
                    <EChart option={pieOption} />
                </div>
            ),
            code: `<EChart
    option={{
        tooltip: { trigger: "item" },
        series: [{
            type: "pie",
            radius: ["45%", "70%"],
            data: [
                { name: "Active", value: 62 },
                { name: "Draft", value: 24 },
                { name: "Archived", value: 14 },
            ],
        }],
    }}
/>`,
        },
        {
            name: "Theme",
            description: "Four built-in themes ship with the package — `\"light\"`, `\"dark\"`, `\"vivid\"`, `\"muted\"`.",
            render: () => (
                <div className="h-56 w-full">
                    <EChart option={lineOption} theme="dark" />
                </div>
            ),
            code: `<EChart option={option} theme="dark" />`,
        },
    ],
    props: [
        { name: "option", type: `EChartsOption`, default: "—", description: "Standard ECharts option object. Required." },
        { name: "theme", type: `string | object`, default: "—", description: "Theme name (`\"light\"`, `\"dark\"`, `\"vivid\"`, `\"muted\"`) or a theme object." },
        { name: "onChartReady", type: `(chart: ECharts) => void`, default: "—", description: "Called once the chart is mounted — useful for binding `chart.on(...)` events." },
        { name: "notMerge", type: `boolean`, default: `false`, description: "Pass-through to `setOption` — discard the previous option entirely." },
        { name: "lazyUpdate", type: `boolean`, default: `false`, description: "Pass-through to `setOption` — batch updates on next animation frame." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root div." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles. Set width/height here." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Lazy modules:</strong> ECharts is heavyweight. The wrapper lazily registers
            only the modules used by the current option (lines + pies + tooltips + …) so the
            initial bundle stays small.
        </p>
    ),
};
