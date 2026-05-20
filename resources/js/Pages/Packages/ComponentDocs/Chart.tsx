import type { ComponentDoc } from "./types";
import { Chart } from "@particle-academy/react-fancy";

const sparkData = [12, 15, 14, 18, 22, 19, 25, 28, 32, 30, 35, 40];
const barData = [
    { label: "Q1", value: 24 },
    { label: "Q2", value: 38 },
    { label: "Q3", value: 31 },
    { label: "Q4", value: 47 },
];
const donutData = [
    { label: "Active", value: 62, color: "#8b5cf6" },
    { label: "Draft", value: 24, color: "#f59e0b" },
    { label: "Archived", value: 14, color: "#71717a" },
];

export const chartDoc: ComponentDoc = {
    intro: (
        <p>
            Light SVG charts — no dependency on Apache ECharts. <code>Chart</code> is a
            namespace exposing <code>Bar</code>, <code>HorizontalBar</code>,
            <code>StackedBar</code>, <code>Line</code>, <code>Area</code>, <code>Pie</code>,
            <code>Donut</code>, <code>Sparkline</code>. For full ECharts power, use
            <code>fancy-echarts</code> instead.
        </p>
    ),
    examples: [
        {
            name: "Sparkline",
            description: "Tiny inline trend — perfect for table cells or KPI tiles.",
            render: () => (
                <div className="flex items-center gap-3">
                    <Chart.Sparkline data={sparkData} width={120} height={32} />
                    <Chart.Sparkline data={[40, 38, 41, 32, 28, 22, 20, 15]} width={120} height={32} color="#ef4444" />
                    <Chart.Sparkline data={[10, 12, 18, 22, 30, 28, 35, 42]} width={120} height={32} color="#22c55e" />
                </div>
            ),
            code: `<Chart.Sparkline data={[12, 15, 14, 18, 22, 19, 25, 28, 32]} width={120} height={32} />
<Chart.Sparkline data={[40, 38, 41, 32, 28, 22, 20, 15]} color="#ef4444" />
<Chart.Sparkline data={[10, 12, 18, 22, 30, 28, 35, 42]} color="#22c55e" />`,
        },
        {
            name: "Bar",
            description: "Categorical bars. Pass `data` as `{ label, value, color? }[]`.",
            render: () => (
                <Chart.Bar data={barData} height={180} showValues />
            ),
            code: `<Chart.Bar
    data={[
        { label: "Q1", value: 24 },
        { label: "Q2", value: 38 },
        { label: "Q3", value: 31 },
        { label: "Q4", value: 47 },
    ]}
    height={180}
    showValues
/>`,
        },
        {
            name: "Donut",
            description: "Categorical share. `data` is the same shape as `Chart.Bar`.",
            render: () => (
                <Chart.Donut data={donutData} size={160} showLegend />
            ),
            code: `<Chart.Donut
    data={[
        { label: "Active", value: 62, color: "#8b5cf6" },
        { label: "Draft", value: 24, color: "#f59e0b" },
        { label: "Archived", value: 14, color: "#71717a" },
    ]}
    size={160}
    showLegend
/>`,
        },
        {
            name: "Line",
            description: "Multi-series time series. `labels` are x-axis values; `series` is an array of `{ label, data[], color? }`.",
            render: () => (
                <Chart.Line
                    labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
                    series={[
                        { label: "Free", data: [12, 18, 22, 28, 35, 42], color: "#8b5cf6" },
                        { label: "Pro", data: [4, 6, 10, 16, 24, 30], color: "#22c55e" },
                    ]}
                    height={180}
                    showDots
                />
            ),
            code: `<Chart.Line
    labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun"]}
    series={[
        { label: "Free", data: [12, 18, 22, 28, 35, 42], color: "#8b5cf6" },
        { label: "Pro", data: [4, 6, 10, 16, 24, 30], color: "#22c55e" },
    ]}
    height={180}
    showDots
/>`,
        },
        {
            name: "Area",
            description: "Same shape as Line, filled under the curve.",
            render: () => (
                <Chart.Area
                    labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
                    series={[{ label: "Visits", data: [120, 180, 240, 200, 260, 320, 380], color: "#8b5cf6" }]}
                    height={180}
                    fillOpacity={0.25}
                />
            ),
            code: `<Chart.Area
    labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
    series={[{ label: "Visits", data: [120, 180, 240, 200, 260, 320, 380], color: "#8b5cf6" }]}
    height={180}
    fillOpacity={0.25}
/>`,
        },
    ],
    props: [
        { name: "Chart.Sparkline", type: "—", default: "—", description: "Tiny inline chart. Props: `data: number[]`, `width`, `height`, `color`." },
        { name: "Chart.Bar", type: "—", default: "—", description: "Categorical bars. Props: `data: { label, value, color? }[]`, `height`, `showValues`." },
        { name: "Chart.HorizontalBar", type: "—", default: "—", description: "Same data shape as `Chart.Bar`, rotated 90°." },
        { name: "Chart.StackedBar", type: "—", default: "—", description: "Multi-series bars. Props: `labels`, `series`, plus common chart options." },
        { name: "Chart.Line", type: "—", default: "—", description: "Multi-series time series. Props: `labels`, `series`, `curve`, `showDots`, `fill`, `fillOpacity`." },
        { name: "Chart.Area", type: "—", default: "—", description: "Filled line chart. Same props as `Chart.Line` minus `fill`." },
        { name: "Chart.Pie", type: "—", default: "—", description: "Categorical share. Props: `data: { label, value, color? }[]`, `size`, `showLabels`, `tooltip`." },
        { name: "Chart.Donut", type: "—", default: "—", description: "Pie with a hole. Props: `data`, `size`, `strokeWidth`, `showLegend`." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Common props:</strong> <code>height</code>, <code>xAxis</code>, <code>yAxis</code>,
            <code>grid</code>, <code>tooltip</code>, <code>animate</code>, <code>responsive</code>.
            For richer charts (3D, geo, large datasets), use <code>@particle-academy/fancy-echarts</code>.
        </p>
    ),
};
