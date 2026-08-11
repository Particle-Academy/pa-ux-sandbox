import "./northstar.css";
import { Link } from "@inertiajs/react";
import { useEffect, useState } from "react";
import {
    Badge,
    Card,
    Heading,
    Navbar,
    Progress,
    Tabs,
    Text,
} from "@particle-academy/react-fancy";
import { EChart, registerAll } from "@particle-academy/fancy-echarts";
import type { EChartsOption } from "@particle-academy/fancy-echarts";
import type { Style } from "../../types";

/**
 * Dashboards · Style 16 — Northstar (SaaS product-analytics back-office, dark).
 *
 * A chromeless growth console for the fictional "Northstar": a slim restyled
 * <Navbar> topbar (violet-gradient "N" lockup at left, a controlled <Tabs>
 * date-range switcher 7d/30d/90d pushed right) over a single full-width
 * scrollable content column — no sidebar. The body is a vertical stack:
 *
 *   1. a 4-up KPI band of restyled <Card>s, each carrying an uppercase label,
 *      a colored delta <Badge>, a 30px figure, and a per-metric fancy-echarts
 *      <EChart> sparkline (axis-less line, deterministic sine series);
 *   2. a full-width hero retention-cohort <EChart> heatmap (cohort × week
 *      matrix, per-cell violet tint computed exactly like the mock, "—" plates
 *      for weeks not yet elapsed, cohort size folded into the y-axis labels);
 *   3. a 1fr/1fr lower row — an activation funnel of four restyled <Progress>
 *      bars (violet-gradient fills on a dark track) beside an MRR-movement
 *      <EChart> floating waterfall (a transparent base series stacks each delta
 *      segment; Start $381k → +New → +Expand → −Churn → End $412k, net +$31k).
 *
 * Six <EChart>s in total (4 sparklines + heatmap + waterfall). Mounted by
 * Inspiration/Show.tsx for `style.id === "northstar"`. SSR-safe: no browser
 * APIs during render; every series is deterministic (Math.sin, never
 * Math.random / Date.now); each <EChart> is gated behind a client-only
 * `mounted` flag over a fixed-height container so the server emits a stable
 * placeholder and no hydration mismatch occurs. Every restyle is scoped under
 * `.dbnorthstar-root` with `dbnorthstar-` classes; the sticky topbar sits at
 * z-index 10, under the gallery frame's 30.
 */

/* ── ECharts modules — register once at module load ─────────────────────── */
registerAll();

/* ── Palette (carried over from the mock exactly) ───────────────────────── */
const ACCENT = "#8B5CF6"; // violet
const SKY = "#38BDF8"; // sky
const POS = "#34D399"; // positive green
const CHURN = "#F472B6"; // churn / negative pink
const SURFACE = "#130F1F"; // card surface
const MONO = "Geist Mono, ui-monospace, SFMono-Regular, monospace";

/* ── Deterministic sparkline generator — the mock's spark(seed) ──────────── */
/** 12 points from a seeded sine wave (higher = up). No randomness, no clock. */
function spark(seed: number): number[] {
    const pts: number[] = [];
    for (let i = 0; i <= 11; i++) {
        pts.push(Number((Math.sin(i * 0.7 + seed) * 7 + 8).toFixed(2)));
    }
    return pts;
}

/* ── Data (the mock's DCLogic.renderVals(), recreated verbatim) ──────────── */

const RANGES = ["7d", "30d", "90d"] as const;
type Range = (typeof RANGES)[number];

type Kpi = { k: string; v: string; delta: string; dcol: string; scol: string; seed: number };

const KPIS: Kpi[] = [
    { k: "MRR", v: "$412k", delta: "▲ 8.1%", dcol: POS, scol: ACCENT, seed: 0 },
    { k: "MAU", v: "84.2k", delta: "▲ 6.4%", dcol: POS, scol: SKY, seed: 1 },
    { k: "Net revenue retention", v: "118%", delta: "▲ 3pts", dcol: POS, scol: POS, seed: 2 },
    { k: "Churn", v: "2.4%", delta: "▼ 0.3%", dcol: POS, scol: CHURN, seed: 3 },
];

const WEEKS = ["W0", "W1", "W2", "W3", "W4", "W6", "W8", "W12"];

type Cohort = { label: string; size: string; cells: (number | null)[] };

/** Triangular cohort matrix — recent cohorts have `null` for weeks not elapsed. */
const COHORTS: Cohort[] = [
    { label: "Jan", size: "1,820", cells: [100, 68, 54, 47, 43, 39, 37, 35] },
    { label: "Feb", size: "2,010", cells: [100, 70, 56, 49, 45, 41, 38, 36] },
    { label: "Mar", size: "2,240", cells: [100, 72, 58, 51, 47, 43, 40, null] },
    { label: "Apr", size: "2,480", cells: [100, 74, 61, 54, 49, 45, null, null] },
    { label: "May", size: "2,710", cells: [100, 76, 63, 56, 52, null, null, null] },
    { label: "Jun", size: "3,020", cells: [100, 78, 66, 59, null, null, null, null] },
    { label: "Jul", size: "3,310", cells: [100, 81, 69, null, null, null, null, null] },
];

type FunnelStage = { k: string; v: string; rate: string; pct: number };

const FUNNEL: FunnelStage[] = [
    { k: "Signed up", v: "12,400", rate: "100%", pct: 100 },
    { k: "Activated", v: "5,704", rate: "46%", pct: 52 },
    { k: "Habit (wk2)", v: "3,472", rate: "28%", pct: 34 },
    { k: "Converted to paid", v: "1,116", rate: "9%", pct: 16 },
];

/* ── ECharts option builders ────────────────────────────────────────────── */

/** Axis-less KPI sparkline — one seeded sine series, per-metric stroke. */
function sparkOption(values: number[], color: string): EChartsOption {
    return {
        grid: { left: 0, right: 0, top: 2, bottom: 2 },
        xAxis: { type: "category", show: false, boundaryGap: false, data: values.map((_, i) => i) },
        yAxis: { type: "value", show: false, scale: true },
        series: [
            {
                type: "line",
                data: values,
                smooth: true,
                showSymbol: false,
                lineStyle: { color, width: 2 },
                areaStyle: {
                    color: {
                        type: "linear",
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: color + "40" },
                            { offset: 1, color: color + "00" },
                        ],
                    },
                },
            },
        ],
    };
}

/** Retention heatmap — cohort (y, Jan→Jul top→bottom) × week (x).
 *  Per-cell violet tint computed exactly like the mock; "—" plates for nulls;
 *  each cohort's size is folded into the y-axis label. */
const heatmapOption: EChartsOption = (() => {
    // ECharts category index 0 sits at the BOTTOM, so reverse so Jan is on top.
    const rows = [...COHORTS].reverse();
    const yLabels = rows.map((c) => `${c.label}   ${c.size}`);
    const data: {
        value: [number, number, number | string];
        itemStyle: { color: string };
        label: { color: string };
    }[] = [];
    rows.forEach((c, y) => {
        c.cells.forEach((v, x) => {
            const isNull = v === null;
            data.push({
                value: [x, y, isNull ? "-" : (v as number)],
                itemStyle: {
                    color: isNull
                        ? "#15111F"
                        : `rgba(139,92,246,${(0.14 + ((v as number) / 100) * 0.78).toFixed(3)})`,
                },
                label: { color: isNull ? "#3A3450" : "#EDEAF6" },
            });
        });
    });
    return {
        grid: { left: 8, right: 14, top: 26, bottom: 8, containLabel: true },
        tooltip: {
            backgroundColor: "#100E1A",
            borderColor: "#221D33",
            borderWidth: 1,
            padding: [7, 10],
            textStyle: { color: "#EDEAF6", fontSize: 12 },
            formatter: (raw) => {
                const p = (Array.isArray(raw) ? raw[0] : raw) as unknown as { value: [number, number, number | string] };
                const [x, y, val] = p.value;
                const cohort = rows[y as number];
                const wk = WEEKS[x as number];
                if (val === "-") return `${cohort.label} · ${wk}<br/>not yet elapsed`;
                return `${cohort.label} cohort · ${wk}<br/><b>${val}%</b> still active`;
            },
        },
        xAxis: {
            type: "category",
            position: "top",
            data: WEEKS,
            splitArea: { show: false },
            splitLine: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: "#7A719A", fontSize: 11, fontFamily: MONO },
        },
        yAxis: {
            type: "category",
            data: yLabels,
            splitArea: { show: false },
            splitLine: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: "#9A92B8", fontSize: 11, fontFamily: MONO },
        },
        series: [
            {
                type: "heatmap",
                data,
                label: {
                    show: true,
                    fontSize: 11,
                    fontFamily: MONO,
                    formatter: (p) => {
                        // Heatmap cells carry [x, y, value]; ECharts types the
                        // label callback's params wider than that.
                        const v = (p.value as [number, number, number | string])[2];
                        return v === "-" ? "—" : String(v);
                    },
                },
                itemStyle: { borderColor: SURFACE, borderWidth: 3, borderRadius: 5 },
                emphasis: { itemStyle: { borderColor: "#EDEAF6", borderWidth: 1 } },
            },
        ],
    };
})();

/** MRR-movement floating waterfall — a transparent base series stacks each
 *  delta segment. Start $381k → +New $28k → +Expand $14k → −Churn $11k →
 *  End $412k (net +$31k, and End matches the MRR KPI). */
const WF_LABELS = ["Start", "New", "Expand", "Churn", "End"];
const WF_TAGS = ["$381k", "+$28k", "+$14k", "−$11k", "$412k"];
const WF_BASE = [0, 381, 409, 412, 0];
const WF_VALS = [
    { value: 381, itemStyle: { color: "#4C4470" } },
    { value: 28, itemStyle: { color: POS } },
    { value: 14, itemStyle: { color: SKY } },
    { value: 11, itemStyle: { color: CHURN } },
    { value: 412, itemStyle: { color: ACCENT } },
];

const waterfallOption: EChartsOption = {
    grid: { left: 6, right: 6, top: 26, bottom: 6, containLabel: true },
    tooltip: {
        trigger: "item",
        backgroundColor: "#100E1A",
        borderColor: "#221D33",
        borderWidth: 1,
        padding: [7, 10],
        textStyle: { color: "#EDEAF6", fontSize: 12 },
        formatter: (raw) => {
            const p = (Array.isArray(raw) ? raw[0] : raw) as unknown as { dataIndex: number };
            return `${WF_LABELS[p.dataIndex]}<br/><b>${WF_TAGS[p.dataIndex]}</b>`;
        },
    },
    xAxis: {
        type: "category",
        data: WF_LABELS,
        axisLabel: { color: "#7A719A", fontSize: 11 },
        axisLine: { lineStyle: { color: "#221D33" } },
        axisTick: { show: false },
    },
    yAxis: { type: "value", show: false, max: 470, splitLine: { show: false } },
    series: [
        {
            name: "base",
            type: "bar",
            stack: "wf",
            silent: true,
            itemStyle: { color: "transparent" },
            emphasis: { disabled: true },
            data: WF_BASE,
            barWidth: "46%",
        },
        {
            name: "value",
            type: "bar",
            stack: "wf",
            data: WF_VALS,
            barWidth: "46%",
            itemStyle: { borderRadius: 4 },
            label: {
                show: true,
                position: "top",
                color: "#9A92B8",
                fontSize: 10,
                fontFamily: MONO,
                formatter: (p: { dataIndex: number }) => WF_TAGS[p.dataIndex],
            },
        },
    ],
};

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function Northstar({ style }: { style: Style }) {
    /** Active date range (controlled — 30d by default, matching the mock). */
    const [range, setRange] = useState<Range>("30d");
    /** Client-only mount flag: gates every <EChart> so SSR emits a stable
     *  placeholder and no hydration mismatch occurs. */
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <div className="dbnorthstar-root">
            {/* ── Topbar — restyled Navbar (brand lockup + range switcher) ─── */}
            <Navbar className="dbnorthstar-topbar">
                <Navbar.Brand className="dbnorthstar-brandwrap">
                    <Link href="/inspiration/dashboards" className="dbnorthstar-brand">
                        <span className="dbnorthstar-brand__mark" aria-hidden>
                            N
                        </span>
                        <span className="dbnorthstar-brand__word">Northstar</span>
                        <span className="dbnorthstar-brand__sub">/ Growth</span>
                    </Link>
                </Navbar.Brand>
                <Navbar.Items className="dbnorthstar-topbar__right">
                    <Tabs
                        activeTab={range}
                        onTabChange={(t) => setRange(t as Range)}
                        className="dbnorthstar-ranges"
                    >
                        <Tabs.List className="dbnorthstar-ranges__list">
                            {RANGES.map((r) => (
                                <Tabs.Tab key={r} value={r}>
                                    {r}
                                </Tabs.Tab>
                            ))}
                        </Tabs.List>
                    </Tabs>
                </Navbar.Items>
            </Navbar>

            <div className="dbnorthstar-body">
                {/* ── KPI metric band — restyled Cards w/ EChart sparklines ── */}
                <div className="dbnorthstar-kpis">
                    {KPIS.map((m) => (
                        <Card
                            key={m.k}
                            variant="outlined"
                            padding="none"
                            className="dbnorthstar-kpi"
                        >
                            <Card.Body className="dbnorthstar-kpi__body">
                                <div className="dbnorthstar-kpi__top">
                                    <span className="dbnorthstar-kpi__label">{m.k}</span>
                                    <Badge
                                        variant="soft"
                                        className="dbnorthstar-delta"
                                        style={{ color: m.dcol }}
                                    >
                                        {m.delta}
                                    </Badge>
                                </div>
                                <div className="dbnorthstar-kpi__value">{m.v}</div>
                                <div className="dbnorthstar-kpi__spark">
                                    {mounted ? (
                                        <EChart
                                            option={sparkOption(spark(m.seed), m.scol)}
                                            style={{ width: "100%", height: "100%" }}
                                        />
                                    ) : null}
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                </div>

                {/* ── Retention cohorts (hero) — EChart heatmap ─────────────── */}
                <Card variant="outlined" padding="none" className="dbnorthstar-hero">
                    <Card.Header className="dbnorthstar-hero__head">
                        <div className="dbnorthstar-hero__titles">
                            <Heading
                                as="h2"
                                size="sm"
                                weight="semibold"
                                className="dbnorthstar-hero__title"
                            >
                                Retention cohorts
                            </Heading>
                            <Text as="p" size="xs" className="dbnorthstar-hero__sub">
                                % of signups still active, by weeks since join
                            </Text>
                        </div>
                        <div className="dbnorthstar-hero__legend" aria-hidden>
                            low
                            <span className="dbnorthstar-hero__legend-bar" />
                            high
                        </div>
                    </Card.Header>
                    <Card.Body className="dbnorthstar-hero__body">
                        <div className="dbnorthstar-heatmap" style={{ height: 296 }}>
                            {mounted ? (
                                <EChart
                                    option={heatmapOption}
                                    style={{ width: "100%", height: "100%" }}
                                />
                            ) : null}
                        </div>
                    </Card.Body>
                </Card>

                {/* ── Lower row — activation funnel + MRR waterfall ─────────── */}
                <div className="dbnorthstar-lower">
                    {/* Activation funnel — restyled Progress bars */}
                    <Card variant="outlined" padding="none" className="dbnorthstar-panel">
                        <Card.Header className="dbnorthstar-panel__head">
                            <Heading
                                as="h2"
                                size="sm"
                                weight="semibold"
                                className="dbnorthstar-panel__title"
                            >
                                Activation funnel
                            </Heading>
                        </Card.Header>
                        <Card.Body className="dbnorthstar-panel__body">
                            <div className="dbnorthstar-funnel">
                                {FUNNEL.map((f) => (
                                    <div key={f.k} className="dbnorthstar-funnel__row">
                                        <div className="dbnorthstar-funnel__top">
                                            <span className="dbnorthstar-funnel__k">{f.k}</span>
                                            <span className="dbnorthstar-funnel__v">
                                                {f.v} · {f.rate}
                                            </span>
                                        </div>
                                        <Progress
                                            value={f.pct}
                                            max={100}
                                            variant="bar"
                                            size="md"
                                            className="dbnorthstar-funnelbar"
                                        />
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>

                    {/* MRR movement — EChart floating waterfall */}
                    <Card variant="outlined" padding="none" className="dbnorthstar-panel">
                        <Card.Header className="dbnorthstar-panel__head dbnorthstar-panel__head--col">
                            <Heading
                                as="h2"
                                size="sm"
                                weight="semibold"
                                className="dbnorthstar-panel__title"
                            >
                                MRR movement
                            </Heading>
                            <Text as="p" size="xs" className="dbnorthstar-panel__sub">
                                This month · <span className="dbnorthstar-net">net +$31k</span>
                            </Text>
                        </Card.Header>
                        <Card.Body className="dbnorthstar-panel__body">
                            <div className="dbnorthstar-waterfall" style={{ height: 176 }}>
                                {mounted ? (
                                    <EChart
                                        option={waterfallOption}
                                        style={{ width: "100%", height: "100%" }}
                                    />
                                ) : null}
                            </div>
                        </Card.Body>
                    </Card>
                </div>

                {/* ── Colophon ──────────────────────────────────────────────── */}
                <div className="dbnorthstar-colophon">
                    <Heading
                        as="h2"
                        size="xs"
                        weight="semibold"
                        className="dbnorthstar-colophon__h"
                    >
                        Northstar · growth analytics
                    </Heading>
                    <Text as="p" size="xs" className="dbnorthstar-colophon__note">
                        Dashboards — a fictional app, for demonstration · App {style.num} / {style.name} ·
                        every surface is a restyled Fancy UI primitive (Navbar · Tabs · Card · Badge ·
                        EChart · Progress)
                    </Text>
                </div>
            </div>
        </div>
    );
}
