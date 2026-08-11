import "./voyage.css";
import { useState, type CSSProperties } from "react";
import {
    Avatar,
    Badge,
    Button,
    Card,
    Heading,
    Navbar,
    Progress,
    Separator,
    Table,
    Text,
} from "@particle-academy/react-fancy";
import { type EChartsOption, EChart, registerAll } from "@particle-academy/fancy-echarts";
import { ChevronRight, Plane } from "lucide-react";
import type { Style } from "../../types";

/**
 * Dashboards · Style 13 — Voyage (airline & travel, light).
 *
 * A single traveler's SkyMiles home screen rendered as a centered, airy consumer
 * app: a gradient boarding-pass hero, a miles-to-Platinum meter, a twelve-month
 * flight-activity bar chart, and an upcoming-trips list. Every surface is a
 * restyled Fancy primitive — a light <Navbar> topbar + <Avatar>, restyled
 * <Card>s for the hero + panels, a dashed <Separator> splitting the boarding
 * pass, a gradient-filled <Progress> for the miles meter, a fancy-echarts
 * <EChart> bar for the 2026 activity, a <Table> for the trips list, <Badge>
 * status pills, and a ghost <Button> — recolored via the co-located voyage.css
 * (every class prefixed dbvoyage-) to the sky-tinted Voyage palette.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "voyage"`. SSR-safe: no
 * browser APIs during render, all mock data is static + deterministic (no
 * Date.now / Math.random), and <EChart> mounts client-side (renders a container,
 * inits in an effect). The page sits below the sticky neutral GalleryFrame
 * (z-index 30) — nothing here climbs to that layer.
 */

/* ── ECharts modules: register once at module load ──────────────────────────── */
registerAll();

/* ── Palette constants shared with the chart ────────────────────────────────── */
const SKY_400 = "#38BDF8";
const SKY_700 = "#0369A1";

/* ── Mock data (the mockup's DCLogic.renderVals(), verbatim) ────────────────── */

type PassField = { k: string; v: string };
const PASS: PassField[] = [
    { k: "Flight", v: "DL 1428" },
    { k: "Gate", v: "C7" },
    { k: "Seat", v: "14A" },
    { k: "Boarding", v: "3:50p" },
];

type Month = { m: string; name: string; h: number; peak: boolean };
const MONTHS: Month[] = [
    { m: "J", name: "January", h: 40, peak: false },
    { m: "F", name: "February", h: 0, peak: false },
    { m: "M", name: "March", h: 70, peak: false },
    { m: "A", name: "April", h: 55, peak: true },
    { m: "M", name: "May", h: 88, peak: true },
    { m: "J", name: "June", h: 60, peak: false },
    { m: "J", name: "July", h: 100, peak: true },
    { m: "A", name: "August", h: 0, peak: false },
    { m: "S", name: "September", h: 45, peak: false },
    { m: "O", name: "October", h: 0, peak: false },
    { m: "N", name: "November", h: 0, peak: false },
    { m: "D", name: "December", h: 0, peak: false },
];

type TripStatus = "confirmed" | "booked" | "planning";
type Trip = {
    id: string;
    flag: string;
    city: string;
    dates: string;
    nights: string;
    status: TripStatus;
    statusLabel: string;
    tileBg: string;
};
const UPCOMING: Trip[] = [
    { id: "sfo", flag: "🌉", city: "San Francisco", dates: "Jul 7–11", nights: "4 nights", status: "confirmed", statusLabel: "Confirmed", tileBg: "#E0F0FA" },
    { id: "tyo", flag: "🗼", city: "Tokyo", dates: "Aug 14–24", nights: "10 nights", status: "booked", statusLabel: "Booked", tileBg: "#FBE8E8" },
    { id: "den", flag: "🏔️", city: "Denver", dates: "Sep 2–5", nights: "3 nights", status: "planning", statusLabel: "Planning", tileBg: "#EAF3E8" },
    { id: "lis", flag: "🌴", city: "Lisbon", dates: "Oct 18–27", nights: "9 nights", status: "planning", statusLabel: "Planning", tileBg: "#FBF0DC" },
];

const NAV = [
    { id: "trips", label: "Trips" },
    { id: "explore", label: "Explore" },
    { id: "miles", label: "Miles" },
] as const;

/* ── 2026 monthly flight-activity bar chart (the only real chart) ────────────── */
const travelOption: EChartsOption = {
    animationDuration: 650,
    grid: { left: 0, right: 0, top: 8, bottom: 20 },
    tooltip: {
        trigger: "item" as const,
        backgroundColor: "#0C4A6E",
        borderWidth: 0,
        padding: [6, 10] as [number, number],
        textStyle: { color: "#ffffff", fontSize: 12 },
        formatter: (p: { dataIndex: number }) => MONTHS[p.dataIndex]?.name ?? "",
    },
    xAxis: {
        type: "category" as const,
        data: MONTHS.map((m) => m.m),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#A6BACC", fontSize: 9, margin: 8 },
    },
    yAxis: {
        type: "value" as const,
        max: 100,
        show: false,
        splitLine: { show: false },
    },
    series: [
        {
            type: "bar" as const,
            barWidth: "58%",
            data: MONTHS.map((m) => ({
                value: m.h,
                itemStyle: { color: m.peak ? SKY_700 : SKY_400, borderRadius: [4, 4, 0, 0] as [number, number, number, number] },
            })),
        },
    ],
};

export default function Voyage({ style }: { style: Style }) {
    /** Controlled topbar nav (Trips / Explore / Miles) — purely cosmetic highlight. */
    const [activeNav, setActiveNav] = useState<string>("trips");
    /** Click an upcoming-trip row to spotlight it (others dim); click again clears. */
    const [selectedTrip, setSelectedTrip] = useState<string | null>(null);

    return (
        <div className="dbvoyage-root">
            <div className="dbvoyage-shell">
                {/* ── Topbar: brand + nav + avatar (restyled Navbar) ──────────── */}
                <Navbar className="dbvoyage-topbar">
                    <Navbar.Brand className="dbvoyage-brand">
                        <span className="dbvoyage-brand__chip" aria-hidden>V</span>
                        <span className="dbvoyage-brand__word">Voyage</span>
                    </Navbar.Brand>
                    <div className="dbvoyage-topbar__right">
                        <Navbar.Items className="dbvoyage-nav">
                            {NAV.map((n) => (
                                <button
                                    key={n.id}
                                    type="button"
                                    className={"dbvoyage-nav__link" + (activeNav === n.id ? " is-active" : "")}
                                    aria-current={activeNav === n.id ? "page" : undefined}
                                    onClick={() => setActiveNav(n.id)}
                                >
                                    {n.label}
                                </button>
                            ))}
                        </Navbar.Items>
                        <Avatar fallback="RW" size="md" className="dbvoyage-avatar" />
                    </div>
                </Navbar>

                {/* ── Boarding-pass hero (gradient Card + dashed Separator) ────── */}
                <Card variant="flat" padding="none" className="dbvoyage-hero">
                    <div className="dbvoyage-hero__eyebrow">Next flight · boards in 2h 40m</div>
                    <div className="dbvoyage-route">
                        <div className="dbvoyage-port">
                            <div className="dbvoyage-port__code">MKE</div>
                            <div className="dbvoyage-port__city">Milwaukee · 4:20p</div>
                        </div>
                        <div className="dbvoyage-route__line" aria-hidden>
                            <span className="dbvoyage-route__dash" />
                            <Plane size={20} className="dbvoyage-route__plane" />
                            <span className="dbvoyage-route__dash" />
                        </div>
                        <div className="dbvoyage-port dbvoyage-port--right">
                            <div className="dbvoyage-port__code">SFO</div>
                            <div className="dbvoyage-port__city">San Francisco · 6:55p</div>
                        </div>
                    </div>
                    <Separator className="dbvoyage-hero__sep" />
                    <div className="dbvoyage-pass">
                        {PASS.map((p) => (
                            <div key={p.k} className="dbvoyage-pass__item">
                                <div className="dbvoyage-pass__k">{p.k}</div>
                                <div className="dbvoyage-pass__v">{p.v}</div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* ── Two-up: SkyMiles meter + 2026 travel chart ──────────────── */}
                <div className="dbvoyage-grid">
                    <Card variant="outlined" padding="none" className="dbvoyage-card">
                        <Card.Body className="dbvoyage-card__body">
                            <div className="dbvoyage-miles__top">
                                <Text as="span" className="dbvoyage-card__title">SkyMiles</Text>
                                <span className="dbvoyage-miles__bal">84,210</span>
                            </div>
                            <div className="dbvoyage-miles__sub">15,790 miles to Platinum</div>
                            <Progress className="dbvoyage-miles__bar" value={84} max={100} size="sm" />
                            <div className="dbvoyage-miles__scale">
                                <span>Gold</span>
                                <span>Platinum · 100k</span>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card variant="outlined" padding="none" className="dbvoyage-card">
                        <Card.Body className="dbvoyage-card__body">
                            <Text as="span" className="dbvoyage-card__title">2026 travel</Text>
                            <div className="dbvoyage-card__sub">14 trips · 38,400 mi flown</div>
                            <EChart option={travelOption} className="dbvoyage-chart" style={{ height: 96, width: "100%" }} />
                        </Card.Body>
                    </Card>
                </div>

                {/* ── Upcoming trips (Card + Table + status Badges) ───────────── */}
                <Card variant="outlined" padding="none" className="dbvoyage-panel">
                    <Card.Header className="dbvoyage-panel__head">
                        <Heading as="h2" size="sm" weight="semibold" className="dbvoyage-panel__title">
                            Upcoming trips
                        </Heading>
                        <Button variant="ghost" size="sm" iconTrailing="plus" className="dbvoyage-addtrip">
                            Add trip
                        </Button>
                    </Card.Header>
                    <Card.Body className="dbvoyage-panel__body">
                        <Table className="dbvoyage-trips">
                            <Table.Head className="dbvoyage-sr">
                                <Table.Column label="" />
                                <Table.Column label="Destination" />
                                <Table.Column label="Status" />
                                <Table.Column label="" />
                            </Table.Head>
                            <Table.Body>
                                {UPCOMING.map((t) => (
                                    <Table.Row
                                        key={t.id}
                                        className={
                                            "dbvoyage-trip" +
                                            (selectedTrip === t.id ? " is-selected" : "") +
                                            (selectedTrip && selectedTrip !== t.id ? " is-dim" : "")
                                        }
                                        onClick={() => setSelectedTrip((c) => (c === t.id ? null : t.id))}
                                    >
                                        <Table.Cell className="dbvoyage-trip__tilecell">
                                            <span className="dbvoyage-trip__tile" style={{ background: t.tileBg } as CSSProperties} aria-hidden>
                                                {t.flag}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell className="dbvoyage-trip__info">
                                            <span className="dbvoyage-trip__city">{t.city}</span>
                                            <span className="dbvoyage-trip__meta">{t.dates} · {t.nights}</span>
                                        </Table.Cell>
                                        <Table.Cell className="dbvoyage-trip__statuscell">
                                            <Badge variant="soft" className={"dbvoyage-badge dbvoyage-badge--" + t.status}>
                                                {t.statusLabel}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell className="dbvoyage-trip__chev">
                                            <ChevronRight size={18} aria-hidden />
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </Card.Body>
                </Card>

                {/* ── Demo colophon ───────────────────────────────────────────── */}
                <div className="dbvoyage-foot">
                    Voyage — a fictional airline app, for demonstration · Dashboard {style.num} / {style.name} · every
                    surface is a restyled Fancy UI primitive
                </div>
            </div>
        </div>
    );
}
