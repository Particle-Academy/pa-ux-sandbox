import "./vitals.css";
import { Link } from "@inertiajs/react";
import { useEffect, useState, type CSSProperties } from "react";
import {
    Badge,
    Card,
    Heading,
    Navbar,
    Progress,
    Table,
    Text,
} from "@particle-academy/react-fancy";
import { EChart, registerAll } from "@particle-academy/fancy-echarts";
import type { EChartsOption } from "@particle-academy/fancy-echarts";
import { Siren } from "lucide-react";
import type { Style } from "../../types";

/**
 * Dashboards · Style 18 — Vitals (Hospital operations, dark).
 *
 * A wall-mounted bed-command board for a fictional hospital: no sidebar, no
 * ticking clock — a static, glanceable status wall tuned for read-at-distance
 * monitoring. A slim restyled <Navbar> header (rose "V" mark + "Bed Command ·
 * Day shift" mono sublabel, a glowing "ER 92% capacity" <Badge>, and a big mono
 * 14:06 clock) sits over a 1.7fr/1fr body: a Ward bed map <Card> on the left, a
 * right rail stacking a 2x2 grid of KPI <Card>s above an ER-triage <Card>.
 *
 * Every visualization is a fancy-echarts <EChart>: the ward bed map is FOUR
 * heatmaps (one per ward — ICU / ER / Medical-Surgical / Maternity — a 12-col
 * grid of status cells coloured by a piecewise visualMap: occupied #EF4444 /
 * open #22C55E / cleaning #F59E0B), and the "Total occupancy" KPI is promoted to
 * a radial gauge (87%, amber). Each ward header also carries a restyled
 * <Progress> occupancy meter, and the ER triage queue is a restyled <Table> with
 * a <Badge> triage level + a colour-mapped severity label — the mockup's
 * data-bed / data-tri / data-triL DOM painting rebuilt as props→style in render.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "vitals"`. SSR-safe: no
 * browser APIs during render; the clock, capacity %, and wait times are static
 * (no Date.now / Math.random); every <EChart> mounts behind a client-only flag
 * so the server emits a stable placeholder and no hydration mismatch occurs.
 * Full-bleed under the neutral GalleryFrame; page z-index stays < 30.
 */

/* ── ECharts modules — register once at module load ─────────────────────── */
registerAll();

/* ── Status colour map (mockup's paint() bc{}) ──────────────────────────── */
const OCCUPIED = "#EF4444";
const OPEN = "#22C55E";
const CLEANING = "#F59E0B";

type Bed = "o" | "e" | "c";
const STATUS_VALUE: Record<Bed, number> = { o: 1, e: 2, c: 3 };

/** beds(o,total) — the mockup's helper: first `o` occupied, then one cleaning,
 *  then the remainder open. */
function beds(o: number, total: number): Bed[] {
    const a: Bed[] = [];
    for (let i = 0; i < total; i++) {
        a.push(i < o ? "o" : i === o ? "c" : "e");
    }
    return a;
}

/* ── Data (the mockup's DCLogic.renderVals(), recreated verbatim) ───────── */

type Ward = {
    name: string;
    occ: number;
    cap: number;
    label: string;
    tone: "hot" | "warm" | "ok";
    cells: Bed[];
};

function wardTone(occ: number, cap: number): Ward["tone"] {
    const r = occ / cap;
    return r >= 0.9 ? "hot" : r >= 0.75 ? "warm" : "ok";
}

const WARDS: Ward[] = [
    { name: "ICU", occ: 22, cap: 24, label: "22 / 24", tone: wardTone(22, 24), cells: beds(22, 24) },
    { name: "ER", occ: 33, cap: 36, label: "33 / 36", tone: wardTone(33, 36), cells: beds(33, 36) },
    {
        name: "Medical / Surgical",
        occ: 128,
        cap: 160,
        label: "128 / 160 · showing 24",
        tone: wardTone(128, 160),
        cells: beds(20, 24),
    },
    {
        name: "Maternity",
        occ: 18,
        cap: 30,
        label: "18 / 30 · showing 24",
        tone: wardTone(18, 30),
        cells: beds(14, 24),
    },
];

const LEGEND: { key: string; label: string; color: string }[] = [
    { key: "occupied", label: "occupied", color: OCCUPIED },
    { key: "open", label: "open", color: OPEN },
    { key: "cleaning", label: "cleaning", color: CLEANING },
];

type Kpi = { k: string; v: string; col: string; gauge?: number };

const KPIS: Kpi[] = [
    { k: "Total occupancy", v: "87%", col: CLEANING, gauge: 87 },
    { k: "ER avg wait", v: "38m", col: "#FB7185" },
    { k: "Discharges today", v: "42", col: OPEN },
    { k: "Nurse ratio", v: "1:4", col: "#38BDF8" },
];

type Triage = "1" | "2" | "3";
type Patient = { tri: Triage; complaint: string; id: string; wait: string; label: string };

const QUEUE: Patient[] = [
    { tri: "1", complaint: "Chest pain", id: "ER-204", wait: "6m", label: "Critical" },
    { tri: "2", complaint: "Fracture, wrist", id: "ER-205", wait: "22m", label: "Urgent" },
    { tri: "2", complaint: "High fever", id: "ER-206", wait: "31m", label: "Urgent" },
    { tri: "1", complaint: "Difficulty breathing", id: "ER-207", wait: "3m", label: "Critical" },
    { tri: "3", complaint: "Laceration", id: "ER-208", wait: "48m", label: "Minor" },
    { tri: "3", complaint: "Sprained ankle", id: "ER-209", wait: "54m", label: "Minor" },
];

/** paint() tc{} / tl{} — triage-level badge bg + severity-label colour. */
const TRIAGE_BADGE: Record<Triage, string> = { "1": "#DC2626", "2": "#F59E0B", "3": "#0EA5A0" };
const TRIAGE_LABEL: Record<Triage, string> = { "1": "#FB7185", "2": "#F59E0B", "3": "#0EA5A0" };

/* ── ECharts option builders ────────────────────────────────────────────── */

const COLS = 12;

/** One ward's beds as a 12-col heatmap; a piecewise visualMap maps the status
 *  dimension to the fixed clinical colours. */
function bedHeatmap(cells: Bed[]): EChartsOption {
    const rows = Math.ceil(cells.length / COLS);
    const xs = Array.from({ length: COLS }, (_, i) => i);
    const ys = Array.from({ length: rows }, (_, i) => i);
    const data = cells.map((s, i) => [i % COLS, Math.floor(i / COLS), STATUS_VALUE[s]]);
    return {
        animation: false,
        grid: { left: 1, right: 1, top: 1, bottom: 1 },
        xAxis: {
            type: "category",
            data: xs,
            show: false,
            splitArea: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
        },
        yAxis: {
            type: "category",
            data: ys,
            show: false,
            inverse: true,
            splitArea: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
        },
        visualMap: {
            type: "piecewise",
            show: false,
            dimension: 2,
            pieces: [
                { value: 1, color: OCCUPIED },
                { value: 2, color: OPEN },
                { value: 3, color: CLEANING },
            ],
        },
        series: [
            {
                type: "heatmap",
                data,
                itemStyle: { borderColor: "#101A2C", borderWidth: 3, borderRadius: 5 },
                label: { show: false },
                emphasis: { disabled: true },
            },
        ],
    };
}

/** "Total occupancy" gauge — single amber progress arc, mono centre read-out. */
const occupancyGauge: EChartsOption = {
    animation: false,
    series: [
        {
            type: "gauge",
            startAngle: 90,
            endAngle: -270,
            radius: "90%",
            min: 0,
            max: 100,
            splitNumber: 1,
            progress: { show: true, width: 7, roundCap: true, itemStyle: { color: CLEANING } },
            pointer: { show: false },
            axisLine: { lineStyle: { width: 7, color: [[1, "#1C2942"]] } },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            anchor: { show: false },
            title: { show: false },
            detail: {
                offsetCenter: [0, 0],
                formatter: "{value}%",
                color: CLEANING,
                fontSize: 20,
                fontWeight: 800,
                fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, monospace",
            },
            data: [{ value: 87 }],
        },
    ],
};

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function Vitals({ style }: { style: Style }) {
    /** Client-only mount flag: gates every <EChart> so SSR emits a stable
     *  placeholder and no hydration mismatch occurs. */
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <div className="dbvitals-root">
            <div className="dbvitals-shell">
                {/* ── Command header — restyled Navbar ────────────────────── */}
                <Navbar className="dbvitals-header">
                    <Navbar.Brand className="dbvitals-brandwrap">
                        <Link href="/inspiration/dashboards" className="dbvitals-brand">
                            <span className="dbvitals-mark" aria-hidden>
                                V
                            </span>
                            <span className="dbvitals-brand__name">Vitals</span>
                            <span className="dbvitals-brand__sub">/ Bed Command · Day shift</span>
                        </Link>
                    </Navbar.Brand>
                    <Navbar.Items className="dbvitals-headright">
                        <Badge variant="soft" className="dbvitals-capacity">
                            <span className="dbvitals-capacity__dot" aria-hidden />
                            ER 92% capacity
                        </Badge>
                        <span className="dbvitals-clock">14:06</span>
                    </Navbar.Items>
                </Navbar>

                {/* ── Body — bed map + right rail ─────────────────────────── */}
                <div className="dbvitals-body">
                    {/* Ward bed map */}
                    <Card variant="outlined" padding="none" className="dbvitals-wardcard">
                        <Card.Header className="dbvitals-wardhead">
                            <Heading
                                as="h2"
                                size="sm"
                                weight="semibold"
                                className="dbvitals-panel__title"
                            >
                                Ward bed map
                            </Heading>
                            <div className="dbvitals-legend">
                                {LEGEND.map((l) => (
                                    <Badge
                                        key={l.key}
                                        variant="soft"
                                        className="dbvitals-legend__chip"
                                        style={{ "--dbv-swatch": l.color } as CSSProperties}
                                    >
                                        {l.label}
                                    </Badge>
                                ))}
                            </div>
                        </Card.Header>
                        <Card.Body className="dbvitals-wardbody">
                            {WARDS.map((w) => {
                                const rows = Math.ceil(w.cells.length / COLS);
                                return (
                                    <div key={w.name} className="dbvitals-ward">
                                        <div className="dbvitals-ward__head">
                                            <span className="dbvitals-ward__name">{w.name}</span>
                                            <span className="dbvitals-ward__occ">{w.label}</span>
                                        </div>
                                        <Progress
                                            value={w.occ}
                                            max={w.cap}
                                            variant="bar"
                                            size="sm"
                                            className={`dbvitals-wardbar dbvitals-wardbar--${w.tone}`}
                                        />
                                        <div
                                            className="dbvitals-bedgrid"
                                            style={{ aspectRatio: `${COLS} / ${rows}` }}
                                        >
                                            {mounted ? (
                                                <EChart
                                                    option={bedHeatmap(w.cells)}
                                                    style={{ width: "100%", height: "100%" }}
                                                />
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </Card.Body>
                    </Card>

                    {/* Right rail — KPIs + triage queue */}
                    <div className="dbvitals-rail">
                        <div className="dbvitals-kpis">
                            {KPIS.map((k) =>
                                k.gauge != null ? (
                                    <Card
                                        key={k.k}
                                        variant="outlined"
                                        padding="none"
                                        className="dbvitals-kpi dbvitals-kpi--gauge"
                                    >
                                        <Card.Body className="dbvitals-kpi__body">
                                            <div className="dbvitals-kpi__gauge">
                                                {mounted ? (
                                                    <EChart
                                                        option={occupancyGauge}
                                                        style={{ width: "100%", height: "100%" }}
                                                    />
                                                ) : (
                                                    <span
                                                        className="dbvitals-kpi__value"
                                                        style={{ color: k.col }}
                                                    >
                                                        {k.v}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="dbvitals-kpi__label">{k.k}</div>
                                        </Card.Body>
                                    </Card>
                                ) : (
                                    <Card
                                        key={k.k}
                                        variant="outlined"
                                        padding="none"
                                        className="dbvitals-kpi"
                                    >
                                        <Card.Body className="dbvitals-kpi__body">
                                            <div
                                                className="dbvitals-kpi__value"
                                                style={{ color: k.col }}
                                            >
                                                {k.v}
                                            </div>
                                            <div className="dbvitals-kpi__label">{k.k}</div>
                                        </Card.Body>
                                    </Card>
                                )
                            )}
                        </div>

                        <Card variant="outlined" padding="none" className="dbvitals-triage">
                            <Card.Header className="dbvitals-triage__head">
                                <Siren size={15} className="dbvitals-triage__icon" aria-hidden />
                                <span className="dbvitals-triage__title">ER triage queue</span>
                                <span className="dbvitals-triage__count">14 waiting</span>
                            </Card.Header>
                            <Card.Body className="dbvitals-triage__body">
                                <Table className="dbvitals-triage-table">
                                    <Table.Head>
                                        <Table.Column label="Lvl" />
                                        <Table.Column label="Complaint" />
                                        <Table.Column label="Severity" />
                                    </Table.Head>
                                    <Table.Body>
                                        {QUEUE.map((q) => (
                                            <Table.Row key={q.id} className="dbvitals-tri__row">
                                                <Table.Cell className="dbvitals-tri__lvlcell">
                                                    <Badge
                                                        variant="solid"
                                                        className="dbvitals-tri__lvl"
                                                        style={
                                                            {
                                                                background: TRIAGE_BADGE[q.tri],
                                                                color: "#fff",
                                                            } as CSSProperties
                                                        }
                                                    >
                                                        {q.tri}
                                                    </Badge>
                                                </Table.Cell>
                                                <Table.Cell className="dbvitals-tri__main">
                                                    <span className="dbvitals-tri__complaint">
                                                        {q.complaint}
                                                    </span>
                                                    <span className="dbvitals-tri__meta">
                                                        {q.id} · waiting {q.wait}
                                                    </span>
                                                </Table.Cell>
                                                <Table.Cell className="dbvitals-tri__sevcell">
                                                    <span
                                                        className="dbvitals-tri__sev"
                                                        style={{ color: TRIAGE_LABEL[q.tri] }}
                                                    >
                                                        {q.label}
                                                    </span>
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table>
                            </Card.Body>
                        </Card>
                    </div>
                </div>

                {/* ── Colophon ─────────────────────────────────────────────── */}
                <footer className="dbvitals-foot">
                    <Text as="span" size="xs" className="dbvitals-foot__note">
                        Vitals — a fictional hospital command board, for demonstration · App{" "}
                        {style.num} / {style.name} · every surface is a restyled Fancy UI primitive
                        (Navbar · Card · EChart · Table · Progress · Badge)
                    </Text>
                    <Link href="/inspiration/dashboards" className="dbvitals-foot__back">
                        Back to the gallery
                    </Link>
                </footer>
            </div>
        </div>
    );
}
