import "./still.css";
import { Link } from "@inertiajs/react";
import { useEffect, useState, type ComponentType } from "react";
import {
    Avatar,
    Badge,
    Button,
    Card,
    Heading,
    Navbar,
    Table,
    Text,
} from "@particle-academy/react-fancy";
import { EChart, registerAll } from "@particle-academy/fancy-echarts";
import type { EChartsOption } from "@particle-academy/fancy-echarts";
import { Clock, Flame, Moon, Pause, Play, PlayCircle } from "lucide-react";
import type { Style } from "../../types";

/**
 * Dashboards · Style 19 — Still (Meditation & habit, front-of-house, dark).
 *
 * A calm, consumer-grade "Today" view for the fictional meditation app "Still":
 * a centered single-column reading layout (max-w 1040px) on a near-black
 * deep-green canvas (#0E1512). A slim restyled <Navbar> (gradient "S" brand +
 * Today/Library/Progress links + an <Avatar> monogram) sits over a teal
 * gradient hero <Card> (eyebrow + <Heading> + a circular icon <Button> that
 * toggles play/pause), a 3-up KPI row of restyled <Card>s (lucide chip + number
 * + caption), an asymmetric 1.4fr/1fr grid — a fancy-echarts <EChart> HEATMAP of
 * minutes-meditated (a 15×2 month grid driven by a 4-bucket piecewise visualMap,
 * with a <Badge> "+18%" delta) beside an <EChart> BAR of 7-day mood check-ins
 * (top-gradient bars, per-point emoji rich-text labels) — and a full-width
 * "Recommended" <Card> wrapping a borderless <Table> of session rows.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "still"`. SSR-safe: no
 * browser APIs during render; the seeded heat[]/mood[]/sessions[] arrays are
 * static (no Math.random / Date.now / new Date), and both <EChart>s mount behind
 * a client-only flag so the server emits a stable placeholder and no hydration
 * mismatch occurs. Every restyle is scoped under `.dbstill-root` with `dbstill-`
 * classes; nothing reaches z-index 30 (the gallery frame owns 30+).
 */

/* ── ECharts modules — register once at module load ─────────────────────── */
registerAll();

/* ── Data (the mockup's DCLogic.renderVals(), recreated verbatim) ───────── */

type NavItem = { id: string; label: string };

const NAV: NavItem[] = [
    { id: "today", label: "Today" },
    { id: "library", label: "Library" },
    { id: "progress", label: "Progress" },
];

type Kpi = { icon: ComponentType<{ size?: number }>; v: string; cap: string };

const KPIS: Kpi[] = [
    { icon: Flame, v: "18", cap: "day streak" },
    { icon: Clock, v: "1,240", cap: "total minutes" },
    { icon: Moon, v: "7.2h", cap: "avg sleep" },
];

/** 30 daily minute totals — 15 cols × 2 rows; 0 marks a rest day. */
const HEAT: number[] = [
    80, 60, 0, 90, 40, 70, 100, 50, 0, 60, 85, 30, 0, 70, 90,
    40, 100, 60, 80, 0, 50, 70, 95, 40, 0, 60, 80, 100, 55, 70,
];

type Mood = { face: string; h: number; d: string };

const MOOD: Mood[] = [
    { face: "😌", h: 70, d: "M" },
    { face: "🙂", h: 55, d: "T" },
    { face: "😐", h: 40, d: "W" },
    { face: "😌", h: 75, d: "T" },
    { face: "😊", h: 90, d: "F" },
    { face: "😌", h: 80, d: "S" },
    { face: "😊", h: 100, d: "S" },
];

type Session = { icon: string; name: string; meta: string; len: string; bg: string };

const SESSIONS: Session[] = [
    { icon: "🌊", name: "Ocean Breath", meta: "Stress relief", len: "12 min", bg: "#134E48" },
    { icon: "🌙", name: "Deep Sleep", meta: "Wind down", len: "20 min", bg: "#1E3A52" },
    { icon: "🎯", name: "Focus Flow", meta: "Before work", len: "8 min", bg: "#3A3418" },
    { icon: "🌿", name: "Body Scan", meta: "Full relaxation", len: "15 min", bg: "#2A4A2E" },
];

/* ── ECharts options ────────────────────────────────────────────────────── */

/** Minutes-meditated month grid — a heatmap over a 15×2 lattice whose fill is
 *  quantized into the mockup's exact 4 buckets by a piecewise visualMap. */
const heatOption: EChartsOption = {
    grid: { left: 0, right: 0, top: 2, bottom: 2 },
    tooltip: {
        trigger: "item",
        backgroundColor: "#0B1512",
        borderColor: "#1F3329",
        borderWidth: 1,
        padding: [6, 9],
        textStyle: { color: "#DCE8E1", fontSize: 11 },
        formatter: (p: unknown) => {
            const v = (p as { value: number[] }).value[2];
            return v === 0 ? "rest day" : `${v} min`;
        },
    },
    xAxis: {
        type: "category",
        data: Array.from({ length: 15 }, (_, i) => String(i)),
        show: false,
        splitArea: { show: false },
    },
    yAxis: {
        type: "category",
        data: ["0", "1"],
        show: false,
        inverse: true,
        splitArea: { show: false },
    },
    visualMap: {
        type: "piecewise",
        show: false,
        dimension: 2,
        pieces: [
            { value: 0, color: "#1A2A22" },
            { min: 1, max: 39, color: "rgba(94,234,212,0.2)" },
            { min: 40, max: 69, color: "rgba(94,234,212,0.5)" },
            { min: 70, max: 100, color: "#5EEAD4" },
        ],
    },
    series: [
        {
            type: "heatmap",
            data: HEAT.map((v, i) => [i % 15, Math.floor(i / 15), v]),
            itemStyle: { borderColor: "#132019", borderWidth: 4, borderRadius: 4 },
            emphasis: { itemStyle: { borderColor: "#132019", shadowBlur: 0 } },
        },
    ],
};

/** Weekly mood — a vertical bar series, top-gradient fill, emoji rich-text label
 *  above each bar, weekday letters below. */
const moodOption: EChartsOption = {
    grid: { left: 2, right: 2, top: 28, bottom: 4, containLabel: true },
    tooltip: {
        trigger: "axis",
        backgroundColor: "#0B1512",
        borderColor: "#1F3329",
        borderWidth: 1,
        padding: [6, 9],
        textStyle: { color: "#DCE8E1", fontSize: 11 },
        axisPointer: { type: "shadow", shadowStyle: { color: "rgba(94,234,212,0.06)" } },
    },
    xAxis: {
        type: "category",
        data: MOOD.map((m) => m.d),
        axisLabel: { color: "#5E7A70", fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
    },
    yAxis: { type: "value", max: 112, show: false, splitLine: { show: false } },
    series: [
        {
            type: "bar",
            barWidth: "52%",
            data: MOOD.map((m) => ({
                value: m.h,
                label: {
                    show: true,
                    position: "top",
                    distance: 7,
                    formatter: m.face,
                    fontSize: 15,
                },
            })),
            itemStyle: {
                borderRadius: [5, 5, 0, 0],
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: "#5EEAD4" },
                        { offset: 1, color: "#0F766E" },
                    ],
                },
            },
        },
    ],
};

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function Still({ style }: { style: Style }) {
    /** Active top-nav item (controlled — Today active by default). */
    const [activeNav, setActiveNav] = useState("today");
    /** Hero play/pause toggle — flips the circular button's icon. */
    const [playing, setPlaying] = useState(false);
    /** Client-only mount flag: gates the ECharts canvases so SSR emits a
     *  stable placeholder and no hydration mismatch occurs. */
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <div className="dbstill-root">
            <div className="dbstill-shell">
                {/* ── Topbar — restyled Navbar + Avatar monogram ──────────── */}
                <Navbar className="dbstill-nav">
                    <Navbar.Brand className="dbstill-brandwrap">
                        <Link href="/inspiration/dashboards" className="dbstill-brand">
                            <span className="dbstill-mark" aria-hidden>
                                S
                            </span>
                            <span className="dbstill-brand__name">Still</span>
                        </Link>
                    </Navbar.Brand>
                    <Navbar.Items className="dbstill-navitems">
                        {NAV.map((n) => (
                            <button
                                key={n.id}
                                type="button"
                                onClick={() => setActiveNav(n.id)}
                                className={
                                    "dbstill-navlink" +
                                    (activeNav === n.id ? " dbstill-navlink--active" : "")
                                }
                            >
                                {n.label}
                            </button>
                        ))}
                        <Avatar fallback="NA" size="sm" className="dbstill-avatar" />
                    </Navbar.Items>
                </Navbar>

                {/* ── Today's practice hero ───────────────────────────────── */}
                <Card variant="flat" padding="none" className="dbstill-hero">
                    <Card.Body className="dbstill-hero__body">
                        <div className="dbstill-hero__text">
                            <div className="dbstill-hero__eyebrow">Today's practice</div>
                            <Heading
                                as="h1"
                                size="2xl"
                                weight="bold"
                                className="dbstill-hero__title"
                            >
                                Morning Calm
                            </Heading>
                            <div className="dbstill-hero__sub">10 min · breath focus</div>
                        </div>
                        <Button
                            variant="circle"
                            className="dbstill-hero__play"
                            onClick={() => setPlaying((p) => !p)}
                            aria-label={playing ? "Pause session" : "Start session"}
                        >
                            {playing ? <Pause size={26} /> : <Play size={26} />}
                        </Button>
                    </Card.Body>
                </Card>

                {/* ── KPI row ─────────────────────────────────────────────── */}
                <div className="dbstill-kpis">
                    {KPIS.map((k) => {
                        const Ic = k.icon;
                        return (
                            <Card
                                key={k.cap}
                                variant="outlined"
                                padding="none"
                                className="dbstill-kpi"
                            >
                                <Card.Body className="dbstill-kpi__body">
                                    <span className="dbstill-kpi__chip" aria-hidden>
                                        <Ic size={24} />
                                    </span>
                                    <div className="dbstill-kpi__meta">
                                        <div className="dbstill-kpi__num">{k.v}</div>
                                        <div className="dbstill-kpi__cap">{k.cap}</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        );
                    })}
                </div>

                {/* ── Minutes heatmap + mood bars ─────────────────────────── */}
                <div className="dbstill-grid dbstill-grid--split">
                    {/* Minutes meditated */}
                    <Card variant="outlined" padding="none" className="dbstill-panel">
                        <Card.Body className="dbstill-panel__body">
                            <div className="dbstill-panel__head">
                                <span className="dbstill-panel__title">Minutes meditated</span>
                                <span className="dbstill-panel__tag">this month</span>
                            </div>
                            <div className="dbstill-panel__delta">
                                <span className="dbstill-panel__deltaval">312 min</span>
                                <Badge variant="soft" color="teal" className="dbstill-delta">
                                    +18% vs last month
                                </Badge>
                            </div>
                            <div className="dbstill-heat">
                                {mounted ? (
                                    <EChart
                                        option={heatOption}
                                        style={{ width: "100%", height: "100%" }}
                                    />
                                ) : null}
                            </div>
                            <div className="dbstill-heatlegend">
                                <span className="dbstill-heatlegend__label">less</span>
                                <span
                                    className="dbstill-heatlegend__cell"
                                    style={{ background: "#1A2A22" }}
                                    aria-hidden
                                />
                                <span
                                    className="dbstill-heatlegend__cell"
                                    style={{ background: "rgba(94,234,212,0.2)" }}
                                    aria-hidden
                                />
                                <span
                                    className="dbstill-heatlegend__cell"
                                    style={{ background: "rgba(94,234,212,0.5)" }}
                                    aria-hidden
                                />
                                <span
                                    className="dbstill-heatlegend__cell"
                                    style={{ background: "#5EEAD4" }}
                                    aria-hidden
                                />
                                <span className="dbstill-heatlegend__label">more</span>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Mood check-ins */}
                    <Card variant="outlined" padding="none" className="dbstill-panel">
                        <Card.Body className="dbstill-panel__body">
                            <div className="dbstill-panel__head">
                                <span className="dbstill-panel__title">Mood check-ins</span>
                            </div>
                            <div className="dbstill-panel__delta">
                                <span className="dbstill-panel__caption">Last 7 days</span>
                            </div>
                            <div className="dbstill-mood">
                                {mounted ? (
                                    <EChart
                                        option={moodOption}
                                        style={{ width: "100%", height: "100%" }}
                                    />
                                ) : null}
                            </div>
                        </Card.Body>
                    </Card>
                </div>

                {/* ── Recommended for you ─────────────────────────────────── */}
                <Card variant="outlined" padding="none" className="dbstill-rec">
                    <Card.Header className="dbstill-rec__head">
                        <span className="dbstill-panel__title">Recommended for you</span>
                    </Card.Header>
                    <Card.Body className="dbstill-rec__body">
                        <Table className="dbstill-sess">
                            <Table.Head>
                                <Table.Column label="" />
                                <Table.Column label="Session" />
                                <Table.Column label="Length" />
                                <Table.Column label="" />
                            </Table.Head>
                            <Table.Body>
                                {SESSIONS.map((s) => (
                                    <Table.Row key={s.name} className="dbstill-sess__row">
                                        <Table.Cell className="dbstill-sess__iconcell">
                                            <span
                                                className="dbstill-sess__icon"
                                                style={{ background: s.bg }}
                                                aria-hidden
                                            >
                                                {s.icon}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell className="dbstill-sess__namecell">
                                            <span className="dbstill-sess__name">{s.name}</span>
                                            <span className="dbstill-sess__meta">{s.meta}</span>
                                        </Table.Cell>
                                        <Table.Cell className="dbstill-sess__len">
                                            {s.len}
                                        </Table.Cell>
                                        <Table.Cell className="dbstill-sess__playcell">
                                            <PlayCircle size={22} className="dbstill-sess__play" />
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </Card.Body>
                </Card>

                {/* ── Colophon ────────────────────────────────────────────── */}
                <footer className="dbstill-foot">
                    <Text as="span" size="xs" className="dbstill-foot__note">
                        Still — a fictional meditation dashboard, for demonstration · App{" "}
                        {style.num} / {style.name} · every surface is a restyled Fancy UI
                        primitive
                    </Text>
                    <Link href="/inspiration/dashboards" className="dbstill-foot__back">
                        Back to the gallery
                    </Link>
                </footer>
            </div>
        </div>
    );
}
