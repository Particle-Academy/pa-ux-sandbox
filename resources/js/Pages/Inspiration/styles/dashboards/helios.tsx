import "./helios.css";
import { Link } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Badge, Card, Heading, Navbar, Text } from "@particle-academy/react-fancy";
import { EChart, registerAll } from "@particle-academy/fancy-echarts";
import { BatteryCharging, Home, Sun, Zap } from "lucide-react";
import type { Style } from "../../types";

/**
 * Dashboards · Style 15 — Helios (Solar & energy, front-of-house, dark).
 *
 * A homeowner-facing solar surface for the fictional "Helios" system at 32 Maple
 * St: NOT an operator console — no <Sidebar> app-shell chrome. A centered
 * 1080px column over a near-black olive canvas (#0F1408) with warm off-white
 * text, a slim <Navbar> header (gradient "H" lockup + a sun-icon "Peak sun"
 * <Badge> + address), a single hero KPI ("6.4 kW — covering 118% of your use"),
 * a full-width energy-flow <Card> (4 tinted lucide icon tiles), a 1.5fr/1fr grid
 * (today's production combo chart · a battery-ring gauge + a gradient savings
 * card), then a full-width monthly production-vs-consumption bar card.
 *
 * Built from restyled Fancy primitives: Navbar (header), Card (every panel +
 * the hero and gradient savings variants), Badge (peak-sun chip), Heading / Text
 * (hero KPI + titles), lucide Icon tiles (flow nodes). All three data graphics
 * are fancy-echarts <EChart>: (1) the production curve — a two-series line, solar
 * as a yellow #FACC15 areaStyle line over a vertical gradient fill, home usage as
 * a dashed lime #65A30D line; (2) the Powerwall state-of-charge as a round-cap
 * gauge (value 82) with an "82%" overlay; (3) the monthly grouped bar (production
 * yellow vs consumption lime). The mockup's hand-rolled SVG path / div bars / raw
 * ring SVG are replaced by real charts.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "helios"`. SSR-safe: no
 * browser APIs during render; every value (curve points, bar heights, the 82%
 * ring, "Peak sun · 2:10p") is static — no Math.random / Date.now. Each <EChart>
 * mounts behind a client-only `mounted` flag so the server emits a stable
 * placeholder and no hydration mismatch occurs. Full-bleed under the neutral
 * GalleryFrame; every rule is scoped under `.dbhelios-root` (z-index < 30).
 */

/* ── ECharts modules — register once at module load ─────────────────────── */
registerAll();

/* ── Data (the mockup's DCLogic.renderVals() + static markup, verbatim) ─── */

type FlowNode = {
    key: string;
    value: string;
    icon: typeof Sun;
    iconColor: string;
    tile: string;
    valColor: string;
};

/** Energy-flow nodes — icon color + tinted tile bg + value hex from the mock's
 *  fc lookup / per-node f.hex (note Home's icon is deep lime, its value bright). */
const FLOW: FlowNode[] = [
    { key: "Solar", value: "6.4 kW", icon: Sun, iconColor: "#FACC15", tile: "rgba(250,204,21,0.16)", valColor: "#FACC15" },
    { key: "Home use", value: "5.4 kW", icon: Home, iconColor: "#65A30D", tile: "rgba(101,163,13,0.16)", valColor: "#84CC16" },
    { key: "Battery", value: "+1.0 kW", icon: BatteryCharging, iconColor: "#22D3EE", tile: "rgba(34,211,238,0.16)", valColor: "#22D3EE" },
    { key: "Grid", value: "0.0 kW", icon: Zap, iconColor: "#94A3B8", tile: "rgba(148,163,184,0.16)", valColor: "#94A3B8" },
];

/** Intraday production curve — the mock's fixed 10-point SVG path, converted to
 *  chart values (150 − svgY so higher = more power). Blanks between labels keep
 *  the visible ticks at 6a / 9a / 12p / 3p / 6p / 9p. */
const CURVE_X = ["6a", "", "9a", "", "12p", "", "3p", "", "6p", "9p"];
const SOLAR = [2, 5, 30, 74, 110, 120, 102, 58, 18, 4];
const USED = [10, 14, 22, 32, 40, 38, 42, 34, 22, 12];

/** Monthly production % vs consumption % (percent-of-peak, from the mock). */
const MONTHS = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];
const PRODUCTION = [50, 66, 82, 92, 100, 96];
const CONSUMPTION = [64, 60, 56, 58, 62, 66];

/* ── ECharts options ────────────────────────────────────────────────────── */

/** Today's production — solar area line + dashed lime usage line. */
const productionOption = {
    grid: { left: 4, right: 6, top: 12, bottom: 20, containLabel: true },
    tooltip: {
        trigger: "axis",
        backgroundColor: "#171E0C",
        borderColor: "#2A3416",
        borderWidth: 1,
        padding: [6, 9],
        textStyle: { color: "#E8EFD8", fontSize: 12 },
        axisPointer: { lineStyle: { color: "#2A3416" } },
    },
    xAxis: {
        type: "category",
        boundaryGap: false,
        data: CURVE_X,
        axisLabel: {
            color: "#5E6B44",
            fontSize: 10,
            fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, monospace",
            interval: 0,
        },
        axisLine: { lineStyle: { color: "#2A3416" } },
        axisTick: { show: false },
    },
    yAxis: { type: "value", show: false, min: 0, max: 132 },
    series: [
        {
            name: "solar",
            type: "line",
            data: SOLAR,
            smooth: true,
            showSymbol: false,
            lineStyle: { color: "#FACC15", width: 2.5 },
            itemStyle: { color: "#FACC15" },
            areaStyle: {
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: "rgba(250,204,21,0.4)" },
                        { offset: 1, color: "rgba(250,204,21,0)" },
                    ],
                },
            },
        },
        {
            name: "used",
            type: "line",
            data: USED,
            smooth: true,
            showSymbol: false,
            lineStyle: { color: "#65A30D", width: 2, type: "dashed" },
            itemStyle: { color: "#65A30D" },
        },
    ],
};

/** Powerwall state-of-charge — a single round-cap gauge (value 82) on a dark
 *  #2A3416 track; ticks/labels/pointer hidden, the "82%" drawn as an overlay. */
const batteryOption = {
    series: [
        {
            type: "gauge",
            startAngle: 90,
            endAngle: -270,
            radius: "100%",
            min: 0,
            max: 100,
            progress: {
                show: true,
                width: 8,
                roundCap: true,
                itemStyle: { color: "#FACC15" },
            },
            pointer: { show: false },
            axisLine: { lineStyle: { width: 8, color: [[1, "#2A3416"]] } },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            anchor: { show: false },
            title: { show: false },
            detail: { show: false },
            data: [{ value: 82 }],
        },
    ],
};

/** Monthly production vs consumption — thin top-rounded paired columns. */
const monthlyOption = {
    grid: { left: 2, right: 2, top: 14, bottom: 20, containLabel: true },
    tooltip: {
        trigger: "axis",
        backgroundColor: "#171E0C",
        borderColor: "#2A3416",
        borderWidth: 1,
        padding: [6, 9],
        textStyle: { color: "#E8EFD8", fontSize: 12 },
        axisPointer: { type: "shadow", shadowStyle: { color: "rgba(250,204,21,0.06)" } },
    },
    xAxis: {
        type: "category",
        data: MONTHS,
        axisLabel: { color: "#7E8B5E", fontSize: 10 },
        axisLine: { lineStyle: { color: "#2A3416" } },
        axisTick: { show: false },
    },
    yAxis: { type: "value", show: false, max: 108, splitLine: { show: false } },
    series: [
        {
            name: "Production",
            type: "bar",
            barWidth: 12,
            barGap: "24%",
            data: PRODUCTION,
            itemStyle: { color: "#FACC15", borderRadius: [4, 4, 0, 0] },
        },
        {
            name: "Consumption",
            type: "bar",
            barWidth: 12,
            data: CONSUMPTION,
            itemStyle: { color: "#4D7C0F", borderRadius: [4, 4, 0, 0] },
        },
    ],
};

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function Helios({ style }: { style: Style }) {
    /** Client-only mount flag: gates the ECharts canvases so SSR emits stable
     *  placeholders and no hydration mismatch occurs (ECharts touches canvas). */
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <div className="dbhelios-root">
            <div className="dbhelios-shell">
                {/* ── Header — restyled Navbar (brand + status cluster) ────── */}
                <Navbar className="dbhelios-nav">
                    <Navbar.Brand className="dbhelios-brandwrap">
                        <Link href="/inspiration/dashboards" className="dbhelios-brand">
                            <span className="dbhelios-mark" aria-hidden>
                                H
                            </span>
                            Helios
                        </Link>
                    </Navbar.Brand>
                    <Navbar.Items className="dbhelios-navitems">
                        <Badge variant="soft" className="dbhelios-peak">
                            <Sun size={16} className="dbhelios-peak__icon" aria-hidden />
                            Peak sun · 2:10p
                        </Badge>
                        <span className="dbhelios-addr">32 Maple St</span>
                    </Navbar.Items>
                </Navbar>

                {/* ── Hero KPI — a single producing-now stat ───────────────── */}
                <div className="dbhelios-hero">
                    <Text as="div" size="sm" className="dbhelios-hero__eyebrow">
                        Producing now
                    </Text>
                    <Heading as="h1" size="2xl" weight="bold" className="dbhelios-hero__h">
                        6.4 kW{" "}
                        <span className="dbhelios-hero__cap">— covering 118% of your use</span>
                    </Heading>
                </div>

                {/* ── Energy-flow diagram — full-width Card, 4 icon tiles ──── */}
                <Card variant="outlined" padding="none" className="dbhelios-card dbhelios-flowcard">
                    <Card.Body className="dbhelios-flowcard__body">
                        <div className="dbhelios-flow">
                            {FLOW.map((f) => {
                                const IconCmp = f.icon;
                                return (
                                    <div key={f.key} className="dbhelios-fnode">
                                        <div
                                            className="dbhelios-ftile"
                                            style={{ background: f.tile, color: f.iconColor }}
                                        >
                                            <IconCmp size={26} aria-hidden />
                                        </div>
                                        <div
                                            className="dbhelios-fval"
                                            style={{ color: f.valColor }}
                                        >
                                            {f.value}
                                        </div>
                                        <div className="dbhelios-flabel">{f.key}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card.Body>
                </Card>

                {/* ── Production curve (1.5fr) · battery + savings (1fr) ────── */}
                <div className="dbhelios-grid">
                    {/* Today's production — area + line combo */}
                    <Card variant="outlined" padding="none" className="dbhelios-card dbhelios-panel">
                        <Card.Header className="dbhelios-phead">
                            <div className="dbhelios-phead__meta">
                                <Heading
                                    as="h2"
                                    size="sm"
                                    weight="semibold"
                                    className="dbhelios-ptitle"
                                >
                                    Today's production
                                </Heading>
                                <div className="dbhelios-psub">42.8 kWh generated</div>
                            </div>
                            <div className="dbhelios-legend">
                                <span className="dbhelios-legend__item dbhelios-legend__item--solar">
                                    <span className="dbhelios-legend__sq" aria-hidden />
                                    solar
                                </span>
                                <span className="dbhelios-legend__item dbhelios-legend__item--used">
                                    <span className="dbhelios-legend__sq" aria-hidden />
                                    used
                                </span>
                            </div>
                        </Card.Header>
                        <Card.Body className="dbhelios-panel__body">
                            <div className="dbhelios-chart" style={{ height: 156 }}>
                                {mounted ? (
                                    <EChart
                                        option={productionOption}
                                        style={{ height: "100%", width: "100%" }}
                                    />
                                ) : null}
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Right column — battery ring + savings */}
                    <div className="dbhelios-rightcol">
                        {/* Powerwall state-of-charge — gauge + overlay */}
                        <Card variant="outlined" padding="none" className="dbhelios-card dbhelios-battcard">
                            <Card.Body className="dbhelios-battcard__body">
                                <div className="dbhelios-batt">
                                    <div className="dbhelios-ring">
                                        {mounted ? (
                                            <EChart
                                                option={batteryOption}
                                                style={{ height: 90, width: 90 }}
                                            />
                                        ) : null}
                                        <div className="dbhelios-ring__val">82%</div>
                                    </div>
                                    <div className="dbhelios-batt__meta">
                                        <div className="dbhelios-batt__title">Powerwall</div>
                                        <div className="dbhelios-batt__line">
                                            Charging · full by 3p
                                        </div>
                                        <div className="dbhelios-batt__line">
                                            ≈ 11.2 kWh stored
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Saved this month — gradient stat card */}
                        <Card variant="flat" padding="none" className="dbhelios-card dbhelios-savings">
                            <Card.Body className="dbhelios-savings__body">
                                <div className="dbhelios-savings__eyebrow">Saved this month</div>
                                <div className="dbhelios-savings__num">$184</div>
                                <div className="dbhelios-savings__cap">
                                    1.2 tons CO₂ avoided · 4,210 mi equiv
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                </div>

                {/* ── Monthly production vs consumption — grouped bars ─────── */}
                <Card variant="outlined" padding="none" className="dbhelios-card dbhelios-panel">
                    <Card.Header className="dbhelios-phead">
                        <Heading as="h2" size="sm" weight="semibold" className="dbhelios-ptitle">
                            Production vs consumption
                        </Heading>
                        <div className="dbhelios-psub">Last 6 months</div>
                    </Card.Header>
                    <Card.Body className="dbhelios-panel__body">
                        <div className="dbhelios-chart" style={{ height: 140 }}>
                            {mounted ? (
                                <EChart
                                    option={monthlyOption}
                                    style={{ height: "100%", width: "100%" }}
                                />
                            ) : null}
                        </div>
                    </Card.Body>
                </Card>

                {/* ── Colophon ─────────────────────────────────────────────── */}
                <footer className="dbhelios-foot">
                    <Text as="span" size="xs" className="dbhelios-foot__note">
                        Helios — a fictional home-solar dashboard, for demonstration · App{" "}
                        {style.num} / {style.name} · every surface is a restyled Fancy UI primitive
                        (Navbar · Card · EChart · Badge · Heading · Text)
                    </Text>
                    <Link href="/inspiration/dashboards" className="dbhelios-foot__back">
                        Back to the gallery
                    </Link>
                </footer>
            </div>
        </div>
    );
}
