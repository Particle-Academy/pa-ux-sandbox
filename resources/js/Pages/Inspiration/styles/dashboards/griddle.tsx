import "./griddle.css";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
    Badge,
    Card,
    Heading,
    Navbar,
    Progress,
    Sidebar,
    Table,
    Text,
} from "@particle-academy/react-fancy";
import { EChart, registerAll } from "@particle-academy/fancy-echarts";
import type { EChartsOption } from "@particle-academy/fancy-echarts";
import { BarChart3, LayoutDashboard, Receipt, Users, Utensils } from "lucide-react";
import type { Style } from "../../types";

/**
 * Dashboards · Style 10 — Griddle (restaurant back-office).
 *
 * A warm-dark dinner-service console for the fictional "Copper Fork": a fixed
 * two-column app shell (a restyled react-fancy <Sidebar> beside a <Navbar>
 * topbar) over three stacked grids — a 4-up KPI row of restyled <Card>s, a
 * 1.5fr/1fr split (a fancy-echarts <EChart> BAR of sales-by-hour + an <EChart>
 * GAUGE of labor cost vs target with a <Progress> covers-on-books meter), then
 * a 1fr/1fr split (a <Card>+<Table> top-sellers list + a hand-rolled floor-tile
 * grid whose square tiles are restyled <Badge>s driven by a controlled state
 * array — click a tile to cycle its state, so an agent bridge could repaint the
 * floor).
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "griddle"`. SSR-safe: no
 * browser APIs during render, deterministic first paint (the "7:48 PM" clock and
 * "42 covers seated" are static, never Date.now()); both ECharts mount behind a
 * client-only flag so the server renders a stable placeholder and no hydration
 * mismatch occurs. Every restyle is scoped under `.dbgriddle-root` with
 * `dbgriddle-` classes; page sticky sits at z-index 5/10, under the gallery
 * frame's 30.
 */

/* ── ECharts modules — register once at module load ─────────────────────── */
registerAll();

/* ── Data (the mockup's DCLogic.renderVals(), recreated verbatim) ───────── */

type NavItem = { id: string; label: string; icon: ReactNode };

const NAV: NavItem[] = [
    { id: "tonight", label: "Tonight", icon: <LayoutDashboard size={16} /> },
    { id: "orders", label: "Orders", icon: <Receipt size={16} /> },
    { id: "menu", label: "Menu", icon: <Utensils size={16} /> },
    { id: "staff", label: "Staff", icon: <Users size={16} /> },
    { id: "reports", label: "Reports", icon: <BarChart3 size={16} /> },
];

type Kpi = { k: string; v: string; sub: string; col: string };

const KPIS: Kpi[] = [
    { k: "Sales tonight", v: "$8.4k", sub: "▲ 14% vs Fri avg", col: "#4ADE80" },
    { k: "Covers", v: "128", sub: "42 seated now", col: "#8A7E6C" },
    { k: "Avg check", v: "$66", sub: "▲ $4", col: "#4ADE80" },
    { k: "Void %", v: "1.2%", sub: "2 comps", col: "#8A7E6C" },
];

type Hour = { t: string; v: number; c: string };

const HOURS: Hour[] = [
    { t: "5p", v: 30, c: "#7C3A12" },
    { t: "6p", v: 58, c: "#9A3412" },
    { t: "7p", v: 88, c: "#F97316" },
    { t: "8p", v: 100, c: "#F97316" },
    { t: "9p", v: 70, c: "#9A3412" },
    { t: "10p", v: 44, c: "#7C3A12" },
    { t: "11p", v: 22, c: "#5C2E10" },
];

type Dish = { name: string; count: string; rev: string };

const DISHES: Dish[] = [
    { name: "Dry-aged Ribeye", count: "38", rev: "$1,710" },
    { name: "Roast Chicken", count: "52", rev: "$1,196" },
    { name: "Cacio e Pepe", count: "44", rev: "$836" },
    { name: "Beet Salad", count: "29", rev: "$406" },
    { name: "Chocolate Tart", count: "41", rev: "$451" },
];

type TableState = "seated" | "open" | "reserved";

/** Floor-tile paint map — [background, foreground], mirrors the mockup. */
const STATE_COLORS: Record<TableState, [string, string]> = {
    seated: ["#F97316", "#ffffff"],
    open: ["#3F5C3A", "#CDE0C8"],
    reserved: ["#5C4A3A", "#E0CDB8"],
};

const STATE_LABEL: Record<TableState, string> = {
    seated: "seated",
    open: "open",
    reserved: "reserved",
};

const STATE_CYCLE: TableState[] = ["seated", "open", "reserved"];

const INITIAL_TABLES: TableState[] = [
    "seated", "open", "seated", "reserved",
    "seated", "seated", "open", "seated",
    "reserved", "seated", "open", "seated",
];

/* ── ECharts options ────────────────────────────────────────────────────── */

const salesOption: EChartsOption = {
    grid: { left: 2, right: 2, top: 10, bottom: 22, containLabel: true },
    tooltip: {
        trigger: "axis",
        backgroundColor: "#1F1B16",
        borderColor: "#2E2820",
        borderWidth: 1,
        textStyle: { color: "#EBE3D8", fontSize: 12 },
        axisPointer: { type: "shadow", shadowStyle: { color: "rgba(249,115,22,0.08)" } },
    },
    xAxis: {
        type: "category",
        data: HOURS.map((h) => h.t),
        axisLabel: { color: "#6E6252", fontSize: 10 },
        axisLine: { lineStyle: { color: "#2E2820" } },
        axisTick: { show: false },
    },
    yAxis: {
        type: "value",
        max: 108,
        show: false,
        splitLine: { show: false },
    },
    series: [
        {
            type: "bar",
            barWidth: "56%",
            data: HOURS.map((h) => ({
                value: h.v,
                itemStyle: { color: h.c, borderRadius: [5, 5, 0, 0] },
            })),
        },
    ],
};

const laborOption: EChartsOption = {
    series: [
        // Orange progress ring, dark track, center read-out.
        {
            type: "gauge",
            startAngle: 90,
            endAngle: -270,
            radius: "94%",
            min: 0,
            max: 100,
            splitNumber: 1,
            progress: {
                show: true,
                width: 9,
                roundCap: true,
                itemStyle: { color: "#F97316" },
            },
            pointer: { show: false },
            axisLine: { lineStyle: { width: 9, color: [[1, "#2E2820"]] } },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            anchor: { show: false },
            title: { show: false },
            detail: {
                offsetCenter: [0, 0],
                formatter: "{value}%",
                color: "#F97316",
                fontSize: 20,
                fontWeight: 800,
                fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, monospace",
            },
            data: [{ value: 26 }],
        },
        // A slim light tick at the 30% target on the same ring.
        {
            type: "gauge",
            startAngle: 90,
            endAngle: -270,
            radius: "94%",
            min: 0,
            max: 100,
            progress: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            anchor: { show: false },
            title: { show: false },
            detail: { show: false },
            pointer: {
                show: true,
                icon: "rect",
                length: "13%",
                width: 3,
                offsetCenter: [0, "-87%"],
                itemStyle: { color: "#EBE3D8" },
            },
            data: [{ value: 30 }],
        },
    ],
};

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function Griddle({ style }: { style: Style }) {
    /** Active nav item (controlled — Tonight active by default). */
    const [activeNav, setActiveNav] = useState("tonight");
    /** Floor tiles as a controlled array so a bridge could repaint them. */
    const [tables, setTables] = useState<TableState[]>(INITIAL_TABLES);
    /** Client-only mount flag: gates the ECharts canvases so SSR emits a
     *  stable placeholder and no hydration mismatch occurs. */
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const cycleTable = (i: number) => {
        setTables((prev) => {
            const next = [...prev];
            const idx = STATE_CYCLE.indexOf(prev[i]);
            next[i] = STATE_CYCLE[(idx + 1) % STATE_CYCLE.length];
            return next;
        });
    };

    return (
        <div className="dbgriddle-root">
            {/* ── Left column: brand + restyled Sidebar + service footer ──── */}
            <Sidebar className="dbgriddle-sidebar">
                <div className="dbgriddle-brand">
                    <span className="dbgriddle-brand__mark" aria-hidden>G</span>
                    <span className="dbgriddle-brand__word">Griddle</span>
                </div>

                <Sidebar.Group className="dbgriddle-navgroup">
                    {NAV.map((n) => (
                        <Sidebar.Item
                            key={n.id}
                            icon={n.icon}
                            active={activeNav === n.id}
                            onClick={() => setActiveNav(n.id)}
                            className="dbgriddle-navitem"
                        >
                            {n.label}
                        </Sidebar.Item>
                    ))}
                </Sidebar.Group>

                <div className="dbgriddle-sidefoot">
                    The Copper Fork
                    <br />
                    Fri · dinner service
                </div>
            </Sidebar>

            {/* ── Right column: topbar + scrollable body ──────────────────── */}
            <div className="dbgriddle-main">
                <Navbar className="dbgriddle-topbar">
                    <Navbar.Brand className="dbgriddle-topbar__title">
                        Tonight at a glance
                    </Navbar.Brand>
                    <Navbar.Items className="dbgriddle-topbar__right">
                        <Badge className="dbgriddle-live" variant="soft">
                            <span className="dbgriddle-live__dot" aria-hidden />
                            42 covers seated
                        </Badge>
                        <span className="dbgriddle-clock">7:48 PM</span>
                    </Navbar.Items>
                </Navbar>

                <div className="dbgriddle-body">
                    {/* KPI row */}
                    <div className="dbgriddle-kpis">
                        {KPIS.map((k) => (
                            <Card
                                key={k.k}
                                variant="outlined"
                                padding="none"
                                className="dbgriddle-kpi"
                            >
                                <Card.Body className="dbgriddle-kpi__body">
                                    <div className="dbgriddle-kpi__label">{k.k}</div>
                                    <div className="dbgriddle-kpi__value">{k.v}</div>
                                    <div
                                        className="dbgriddle-kpi__sub"
                                        style={{ color: k.col }}
                                    >
                                        {k.sub}
                                    </div>
                                </Card.Body>
                            </Card>
                        ))}
                    </div>

                    {/* Sales-by-hour bar + labor gauge */}
                    <div className="dbgriddle-grid dbgriddle-grid--wide">
                        <Card variant="outlined" padding="none" className="dbgriddle-panel">
                            <Card.Header className="dbgriddle-panel__head">
                                <span className="dbgriddle-panel__title">Sales by hour</span>
                                <span className="dbgriddle-panel__total">$8,420</span>
                            </Card.Header>
                            <Card.Body className="dbgriddle-panel__body">
                                <div className="dbgriddle-chart" style={{ height: 168 }}>
                                    {mounted ? (
                                        <EChart
                                            option={salesOption}
                                            style={{ height: "100%", width: "100%" }}
                                        />
                                    ) : null}
                                </div>
                            </Card.Body>
                        </Card>

                        <Card variant="outlined" padding="none" className="dbgriddle-panel">
                            <Card.Header className="dbgriddle-panel__head">
                                <span className="dbgriddle-panel__title">Labor vs sales</span>
                            </Card.Header>
                            <Card.Body className="dbgriddle-panel__body">
                                <div className="dbgriddle-labor">
                                    <div
                                        className="dbgriddle-gauge"
                                        style={{ height: 118, width: 118 }}
                                    >
                                        {mounted ? (
                                            <EChart
                                                option={laborOption}
                                                style={{ height: "100%", width: "100%" }}
                                            />
                                        ) : null}
                                    </div>
                                    <div className="dbgriddle-labor__meta">
                                        <div className="dbgriddle-labor__big">26%</div>
                                        <div className="dbgriddle-labor__cap">
                                            labor cost · target 30%
                                        </div>
                                    </div>
                                </div>

                                <div className="dbgriddle-kv">
                                    <div className="dbgriddle-kv__row">
                                        <span className="dbgriddle-kv__k">Avg table turn</span>
                                        <span className="dbgriddle-kv__v">62 min</span>
                                    </div>
                                    <div className="dbgriddle-kv__row">
                                        <span className="dbgriddle-kv__k">Covers on books</span>
                                        <span className="dbgriddle-kv__v">88 / 120</span>
                                    </div>
                                    <Progress
                                        value={88}
                                        max={120}
                                        variant="bar"
                                        size="sm"
                                        color="orange"
                                        className="dbgriddle-booksbar"
                                    />
                                </div>
                            </Card.Body>
                        </Card>
                    </div>

                    {/* Top sellers + floor status */}
                    <div className="dbgriddle-grid dbgriddle-grid--even">
                        <Card variant="outlined" padding="none" className="dbgriddle-panel">
                            <Card.Header className="dbgriddle-panel__head">
                                <span className="dbgriddle-panel__title">Top sellers tonight</span>
                            </Card.Header>
                            <Card.Body className="dbgriddle-panel__body dbgriddle-panel__body--flush">
                                <Table className="dbgriddle-sellers">
                                    <Table.Head>
                                        <Table.Column label="Dish" />
                                        <Table.Column label="Count" />
                                        <Table.Column label="Revenue" />
                                    </Table.Head>
                                    <Table.Body>
                                        {DISHES.map((d) => (
                                            <Table.Row key={d.name}>
                                                <Table.Cell className="dbgriddle-sellers__name">
                                                    {d.name}
                                                </Table.Cell>
                                                <Table.Cell className="dbgriddle-sellers__count">
                                                    {d.count}×
                                                </Table.Cell>
                                                <Table.Cell className="dbgriddle-sellers__rev">
                                                    {d.rev}
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table>
                            </Card.Body>
                        </Card>

                        <Card variant="outlined" padding="none" className="dbgriddle-panel">
                            <Card.Header className="dbgriddle-panel__head">
                                <span className="dbgriddle-panel__title">Floor status</span>
                            </Card.Header>
                            <Card.Body className="dbgriddle-panel__body">
                                <div className="dbgriddle-floor">
                                    {tables.map((state, i) => {
                                        const [bg, fg] = STATE_COLORS[state];
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                className="dbgriddle-tile"
                                                onClick={() => cycleTable(i)}
                                                aria-label={`Table ${i + 1} — ${STATE_LABEL[state]}; click to change`}
                                                style={
                                                    { "--tile-bg": bg, "--tile-fg": fg } as CSSProperties
                                                }
                                            >
                                                <span className="dbgriddle-tile__n">{i + 1}</span>
                                                <Badge
                                                    variant="soft"
                                                    className="dbgriddle-tile__badge"
                                                >
                                                    {STATE_LABEL[state]}
                                                </Badge>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="dbgriddle-legend">
                                    {(Object.keys(STATE_COLORS) as TableState[]).map((s) => (
                                        <span key={s} className="dbgriddle-legend__item">
                                            <span
                                                className="dbgriddle-legend__swatch"
                                                style={{ background: STATE_COLORS[s][0] }}
                                                aria-hidden
                                            />
                                            {STATE_LABEL[s]}
                                        </span>
                                    ))}
                                </div>
                            </Card.Body>
                        </Card>
                    </div>

                    <div className="dbgriddle-colophon">
                        <Heading
                            as="h2"
                            size="xs"
                            weight="semibold"
                            className="dbgriddle-colophon__h"
                        >
                            The Copper Fork · back-office
                        </Heading>
                        <Text as="p" size="xs" className="dbgriddle-colophon__note">
                            Dashboards — a fictional app, for demonstration · App {style.num} /{" "}
                            {style.name} · every surface is a restyled Fancy UI primitive (Sidebar ·
                            Navbar · Card · EChart · Table · Badge · Progress)
                        </Text>
                    </div>
                </div>
            </div>
        </div>
    );
}
