import { useState } from "react";
import { Button, Badge, Card, Tabs, Text } from "@particle-academy/react-fancy";
import { EChart, registerAll } from "@particle-academy/fancy-echarts";
import { Download, Maximize2 } from "lucide-react";

// ECharts registration is module-scoped per bundle entry: this file is also
// the standalone starter-kit zip's src/Kit.tsx, where no app shell has
// registered anything — without this, init() dies with "Renderer 'undefined'
// is not imported". Idempotent, so the showcase calling it again is free.
registerAll();

type View = "trends" | "composition" | "hierarchy" | "flow";

export function DiagramStudioKit() {
    const [view, setView] = useState<View>("trends");

    return (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <Card.Body className="!p-0">
                <Tabs activeTab={view} onTabChange={(v) => setView(v as View)}>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 pt-3 dark:border-zinc-800">
                        <Tabs.List>
                            <Tabs.Tab value="trends">Trends</Tabs.Tab>
                            <Tabs.Tab value="composition">Composition</Tabs.Tab>
                            <Tabs.Tab value="hierarchy">Hierarchy</Tabs.Tab>
                            <Tabs.Tab value="flow">Funnel flow</Tabs.Tab>
                        </Tabs.List>
                        <div className="flex items-center gap-2 pb-3">
                            <Badge color="violet" size="sm">{VIEWS[view].label}</Badge>
                            <Text size="xs" className="!font-mono !text-zinc-500">{VIEWS[view].series}</Text>
                            <Button variant="ghost" size="sm" aria-label="Fullscreen"><Maximize2 size={14} /></Button>
                            <Button variant="ghost" size="sm" aria-label="Download"><Download size={14} /></Button>
                        </div>
                    </div>

                    <Tabs.Panels>
                        <Tabs.Panel value="trends"><TrendsPanel /></Tabs.Panel>
                        <Tabs.Panel value="composition"><CompositionPanel /></Tabs.Panel>
                        <Tabs.Panel value="hierarchy"><HierarchyPanel /></Tabs.Panel>
                        <Tabs.Panel value="flow"><FlowPanel /></Tabs.Panel>
                    </Tabs.Panels>
                </Tabs>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 bg-zinc-50/60 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/40">
                    <Text size="xs" className="!text-zinc-500">{VIEWS[view].caption}</Text>
                    <Text size="xs" className="!font-mono !text-zinc-500">@particle-academy/fancy-echarts</Text>
                </div>
            </Card.Body>
        </div>
    );
}

const VIEWS: Record<View, { label: string; series: string; caption: string }> = {
    trends: {
        label: "Time series",
        series: "stacked area",
        caption: "Daily MRR over 30 days, stacked by region. Real ECharts series — hover for tooltips, click legend to toggle, smooth interpolation.",
    },
    composition: {
        label: "Composition",
        series: "donut + bar",
        caption: "Two cuts of the same dataset side by side. Donut for plan share; horizontal bar for top customers by MRR.",
    },
    hierarchy: {
        label: "Hierarchy",
        series: "sunburst",
        caption: "Multi-level breakdown of revenue: region → country → plan. Click any wedge to drill in; click center to zoom out.",
    },
    flow: {
        label: "Flow",
        series: "sankey",
        caption: "Sankey diagram of the customer funnel: signup → trial → paid → churned. Edge thickness shows volume.",
    },
};

// ─── Trends: stacked area over time ───────────────────────────────────────

const TREND_DATES = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
});
const TREND_NA = [62, 64, 66, 65, 68, 70, 72, 71, 73, 75, 74, 77, 78, 80, 79, 82, 83, 82, 85, 86, 85, 87, 86, 88, 89, 87, 88, 89, 90, 91];
const TREND_EU = [38, 40, 41, 41, 42, 44, 45, 45, 47, 48, 47, 49, 50, 51, 51, 52, 54, 53, 55, 56, 56, 57, 56, 58, 58, 58, 59, 60, 61, 62];
const TREND_APAC = [29, 30, 30, 31, 32, 33, 34, 35, 36, 36, 37, 38, 39, 40, 40, 41, 42, 42, 44, 44, 45, 46, 46, 47, 48, 48, 49, 50, 50, 51];
const TREND_LATAM = [9, 10, 11, 11, 12, 12, 13, 13, 14, 14, 14, 15, 15, 15, 16, 16, 17, 17, 17, 18, 18, 18, 19, 19, 19, 20, 20, 20, 21, 21];

function TrendsPanel() {
    return (
        <div className="mx-auto h-[480px] max-w-[1100px] p-4">
            <EChart
                style={{ width: "100%", height: "100%" }}
                option={{
                    color: ["#8b5cf6", "#10b981", "#0ea5e9", "#f59e0b"],
                    grid: { left: 56, right: 16, top: 36, bottom: 32 },
                    legend: { top: 4, textStyle: { color: "#a1a1aa", fontSize: 11 }, icon: "roundRect" },
                    tooltip: {
                        trigger: "axis",
                        backgroundColor: "rgba(24,24,27,0.96)",
                        borderColor: "rgba(255,255,255,0.08)",
                        textStyle: { color: "#fff", fontSize: 11 },
                        valueFormatter: (v: number) => "$" + v + "k",
                    },
                    xAxis: {
                        type: "category",
                        data: TREND_DATES,
                        boundaryGap: false,
                        axisLine: { show: false },
                        axisTick: { show: false },
                        axisLabel: { fontSize: 10, color: "#a1a1aa", interval: 4 },
                    },
                    yAxis: {
                        type: "value",
                        axisLine: { show: false },
                        axisTick: { show: false },
                        splitLine: { lineStyle: { color: "rgba(161,161,170,0.12)", type: "dashed" } },
                        axisLabel: { fontSize: 10, color: "#a1a1aa", formatter: (v: number) => "$" + v + "k" },
                    },
                    series: [
                        { name: "NA", type: "line", stack: "mrr", smooth: true, symbol: "none", data: TREND_NA, areaStyle: { opacity: 0.85 }, lineStyle: { width: 0 } },
                        { name: "EU", type: "line", stack: "mrr", smooth: true, symbol: "none", data: TREND_EU, areaStyle: { opacity: 0.85 }, lineStyle: { width: 0 } },
                        { name: "APAC", type: "line", stack: "mrr", smooth: true, symbol: "none", data: TREND_APAC, areaStyle: { opacity: 0.85 }, lineStyle: { width: 0 } },
                        { name: "LATAM", type: "line", stack: "mrr", smooth: true, symbol: "none", data: TREND_LATAM, areaStyle: { opacity: 0.85 }, lineStyle: { width: 0 } },
                    ],
                }}
            />
        </div>
    );
}

// ─── Composition: donut + bar side by side ────────────────────────────────

function CompositionPanel() {
    return (
        <div className="mx-auto grid h-[480px] max-w-[1100px] gap-4 p-4 lg:grid-cols-2">
            <EChart
                style={{ width: "100%", height: "100%" }}
                option={{
                    title: { text: "Plan share", left: "center", top: 8, textStyle: { color: "#a1a1aa", fontSize: 12, fontWeight: 600 } },
                    color: ["#8b5cf6", "#10b981", "#f59e0b", "#71717a"],
                    tooltip: { trigger: "item", formatter: "{b}: ${c}k ({d}%)" },
                    legend: { bottom: 8, textStyle: { color: "#a1a1aa", fontSize: 11 }, icon: "roundRect" },
                    series: [{
                        name: "Plan",
                        type: "pie",
                        radius: ["48%", "72%"],
                        center: ["50%", "52%"],
                        avoidLabelOverlap: true,
                        itemStyle: { borderRadius: 6, borderColor: "var(--ff-bg, #fff)", borderWidth: 2 },
                        label: { show: true, fontSize: 11, color: "#a1a1aa", formatter: "{b}\n{d}%" },
                        emphasis: { label: { show: true, fontSize: 13, fontWeight: 600, color: "#18181b" } },
                        data: [
                            { value: 142, name: "Scale" },
                            { value: 78, name: "Team" },
                            { value: 31, name: "Starter" },
                            { value: 14, name: "Trial" },
                        ],
                    }],
                }}
            />
            <EChart
                style={{ width: "100%", height: "100%" }}
                option={{
                    title: { text: "Top customers by MRR", left: "center", top: 8, textStyle: { color: "#a1a1aa", fontSize: 12, fontWeight: 600 } },
                    color: ["#8b5cf6"],
                    grid: { left: 110, right: 24, top: 36, bottom: 16 },
                    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: (v: number) => "$" + v.toLocaleString() },
                    xAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontSize: 10, color: "#a1a1aa", formatter: (v: number) => "$" + (v / 1000) + "k" }, splitLine: { lineStyle: { color: "rgba(161,161,170,0.12)", type: "dashed" } } },
                    yAxis: { type: "category", data: ["Cobalt Studio", "Boreal Press", "Vector Foods", "Helios Energy", "Acme Robotics", "Solstice Labs", "Northwind Air"], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontSize: 11, color: "#a1a1aa" } },
                    series: [{
                        type: "bar",
                        data: [990, 2490, 5800, 8400, 9990, 12900, 14900],
                        itemStyle: { color: "#8b5cf6", borderRadius: [0, 3, 3, 0] },
                        barWidth: "55%",
                        label: { show: true, position: "right", color: "#a1a1aa", fontSize: 10, formatter: (p: { value: number }) => "$" + p.value.toLocaleString() },
                    }],
                }}
            />
        </div>
    );
}

// ─── Hierarchy: sunburst (region → country → plan) ───────────────────────

function HierarchyPanel() {
    return (
        <div className="mx-auto h-[520px] max-w-[1100px] p-4">
            <EChart
                style={{ width: "100%", height: "100%" }}
                option={{
                    tooltip: { trigger: "item", backgroundColor: "rgba(24,24,27,0.96)", textStyle: { color: "#fff", fontSize: 11 }, formatter: (p: { name: string; value: number; treePathInfo: { name: string }[] }) => {
                        const path = p.treePathInfo.slice(1).map((n) => n.name).join(" › ");
                        return `${path}<br/><b>$${p.value.toLocaleString()}</b>`;
                    } },
                    series: [{
                        type: "sunburst",
                        radius: ["10%", "92%"],
                        sort: undefined,
                        itemStyle: { borderColor: "rgba(0,0,0,0.5)", borderWidth: 2 },
                        label: { color: "#fff", fontSize: 11, minAngle: 8 },
                        levels: [
                            {},
                            { itemStyle: { borderRadius: 4 } },
                            { itemStyle: { borderRadius: 3 } },
                            { itemStyle: { borderRadius: 2 }, label: { fontSize: 10 } },
                        ],
                        data: [
                            { name: "NA", itemStyle: { color: "#8b5cf6" }, children: [
                                { name: "United States", value: 56, children: [
                                    { name: "Scale", value: 34 },
                                    { name: "Team", value: 16 },
                                    { name: "Starter", value: 6 },
                                ]},
                                { name: "Canada", value: 24, children: [
                                    { name: "Scale", value: 12 },
                                    { name: "Team", value: 9 },
                                    { name: "Starter", value: 3 },
                                ]},
                            ]},
                            { name: "EU", itemStyle: { color: "#10b981" }, children: [
                                { name: "Germany", value: 22, children: [
                                    { name: "Scale", value: 12 },
                                    { name: "Team", value: 7 },
                                    { name: "Starter", value: 3 },
                                ]},
                                { name: "UK", value: 18, children: [
                                    { name: "Scale", value: 10 },
                                    { name: "Team", value: 6 },
                                    { name: "Starter", value: 2 },
                                ]},
                                { name: "France", value: 12, children: [
                                    { name: "Team", value: 8 },
                                    { name: "Starter", value: 4 },
                                ]},
                            ]},
                            { name: "APAC", itemStyle: { color: "#0ea5e9" }, children: [
                                { name: "Japan", value: 20, children: [
                                    { name: "Scale", value: 12 },
                                    { name: "Team", value: 8 },
                                ]},
                                { name: "Singapore", value: 16, children: [
                                    { name: "Scale", value: 10 },
                                    { name: "Team", value: 4 },
                                    { name: "Starter", value: 2 },
                                ]},
                                { name: "Australia", value: 14, children: [
                                    { name: "Team", value: 9 },
                                    { name: "Starter", value: 5 },
                                ]},
                            ]},
                            { name: "LATAM", itemStyle: { color: "#f59e0b" }, children: [
                                { name: "Brazil", value: 11, children: [
                                    { name: "Team", value: 7 },
                                    { name: "Starter", value: 4 },
                                ]},
                                { name: "Mexico", value: 10, children: [
                                    { name: "Team", value: 6 },
                                    { name: "Starter", value: 4 },
                                ]},
                            ]},
                        ],
                    }],
                }}
            />
        </div>
    );
}

// ─── Flow: customer funnel sankey ────────────────────────────────────────

function FlowPanel() {
    return (
        <div className="mx-auto h-[480px] max-w-[1100px] p-4">
            <EChart
                style={{ width: "100%", height: "100%" }}
                option={{
                    tooltip: {
                        trigger: "item",
                        backgroundColor: "rgba(24,24,27,0.96)",
                        textStyle: { color: "#fff", fontSize: 11 },
                    },
                    series: [{
                        type: "sankey",
                        left: 24,
                        right: 120,
                        top: 16,
                        bottom: 16,
                        nodeWidth: 14,
                        nodeGap: 12,
                        layoutIterations: 64,
                        label: { color: "#a1a1aa", fontSize: 11, fontWeight: 500 },
                        lineStyle: { color: "gradient", opacity: 0.45, curveness: 0.5 },
                        levels: [
                            { depth: 0, itemStyle: { color: "#71717a" } },
                            { depth: 1, itemStyle: { color: "#0ea5e9" } },
                            { depth: 2, itemStyle: { color: "#8b5cf6" } },
                            { depth: 3, itemStyle: { color: "#10b981" } },
                            { depth: 4, itemStyle: { color: "#f59e0b" } },
                        ],
                        emphasis: { focus: "adjacency" },
                        data: [
                            { name: "Signups" },
                            { name: "Trial · NA" },
                            { name: "Trial · EU" },
                            { name: "Trial · APAC" },
                            { name: "Paid" },
                            { name: "Active" },
                            { name: "Churned" },
                            { name: "Expansion" },
                        ],
                        links: [
                            { source: "Signups", target: "Trial · NA", value: 320 },
                            { source: "Signups", target: "Trial · EU", value: 210 },
                            { source: "Signups", target: "Trial · APAC", value: 140 },
                            { source: "Trial · NA", target: "Paid", value: 230 },
                            { source: "Trial · EU", target: "Paid", value: 140 },
                            { source: "Trial · APAC", target: "Paid", value: 100 },
                            { source: "Trial · NA", target: "Churned", value: 90 },
                            { source: "Trial · EU", target: "Churned", value: 70 },
                            { source: "Trial · APAC", target: "Churned", value: 40 },
                            { source: "Paid", target: "Active", value: 420 },
                            { source: "Paid", target: "Expansion", value: 50 },
                        ],
                    }],
                }}
            />
        </div>
    );
}
