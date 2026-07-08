import "./pulse.css";

import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "@inertiajs/react";
import {
    Avatar,
    Badge,
    Button,
    Card,
    Heading,
    Progress,
    Table,
    Tabs,
    Text,
    Tooltip,
} from "@particle-academy/react-fancy";
import { EChart, registerAll } from "@particle-academy/fancy-echarts";
import { Activity, Bike, Dumbbell, Flame, Footprints, Heart, Waves } from "lucide-react";
import type { Style } from "../../types";

/**
 * Dashboards · Style 01 — Pulse (Fitness & training).
 *
 * A consumer-facing training dashboard: a single centered 1080px column on a
 * near-black canvas, big numerals, one rose / one orange accent. It shows a
 * single athlete's day — activity rings, streak + steps, an all-day heart-rate
 * curve, a weekly move-minutes chart, and a recent-workouts list.
 *
 * THE POINT of this page is to demonstrate the Fancy UI kit, so every surface
 * is a restyled Fancy primitive wearing the Pulse look via scoped `dbpulse-`
 * CSS — no bespoke chart divs:
 *   • the three charts are fancy-echarts <EChart> (a nested-ring gauge, a
 *     gradient area line, a per-bar-colored bar) — registerAll() once, below;
 *   • the ring readout is three <Progress> rails fed from the SAME rings[].pct
 *     data as the gauge (the mockup hardcoded the ring fractions separately —
 *     a drift bug fixed here);
 *   • KPI tiles + every panel are restyled <Card>s;
 *   • the period switch is a controlled <Tabs>; the athlete is an <Avatar>;
 *   • recent workouts are a <Table>; metrics ride <Badge>/<Text>; the "See
 *     all" affordance is a <Button>; headings are <Heading>/<Text>.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "pulse"`. SSR-safe: no
 * browser APIs during render, all values are static literals ("Today · 6:40 AM"
 * and "resting 58 bpm" are DATA, never the wall clock), each <EChart> is gated
 * behind a client-only mount so it never mismatches on hydration, and the only
 * animation is a CSS pulse on the live heart dot. No page-level z-index reaches
 * the gallery frame's 30.
 */

registerAll();

/* ── Data (the mockup's DCLogic.renderVals(), verbatim) ─────────────────── */

type Ring = { label: string; val: string; pct: number; color: string };

const RINGS: Ring[] = [
    { label: "Move", val: "420 / 500 kcal", pct: 82, color: "#F43F5E" },
    { label: "Exercise", val: "32 / 45 min", pct: 71, color: "#FB923C" },
    { label: "Stand", val: "11 / 12 hr", pct: 90, color: "#22D3EE" },
];

/** Designed aggregate shown in the ring center. */
const GOAL_PCT = 78;

type WeekDay = { d: string; h: number; bg: string };

const WEEK: WeekDay[] = [
    { d: "M", h: 60, bg: "#F43F5E" },
    { d: "T", h: 80, bg: "#F43F5E" },
    { d: "W", h: 45, bg: "#FB923C" },
    { d: "T", h: 95, bg: "#F43F5E" },
    { d: "F", h: 70, bg: "#FB923C" },
    { d: "S", h: 100, bg: "#F43F5E" },
    { d: "S", h: 55, bg: "#FB923C" },
];

/** All-day resting→peak bpm curve (14 samples, 6a→now), derived from the mockup path. */
const HR = [93, 101, 86, 127, 136, 108, 153, 162, 120, 105, 131, 115, 145, 124];
const HR_TIMES = ["6a", "7a", "8a", "9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p", "now"];
const HR_TICKS = [0, 4, 8, 12, 13];

type Workout = { slug: string; icon: typeof Activity; name: string; when: string; dur: string; kcal: string };

const WORKOUTS: Workout[] = [
    { slug: "run", icon: Activity, name: "Morning Run", when: "Today · 6:40 AM", dur: "38:12", kcal: "412 kcal" },
    { slug: "upper", icon: Dumbbell, name: "Upper Body", when: "Yesterday · 7:10 PM", dur: "52:04", kcal: "388 kcal" },
    { slug: "cycle", icon: Bike, name: "Cycle Class", when: "Mon · 6:00 PM", dur: "45:00", kcal: "506 kcal" },
    { slug: "swim", icon: Waves, name: "Lap Swim", when: "Sun · 9:20 AM", dur: "30:41", kcal: "274 kcal" },
];

/* ── ECharts option builders ────────────────────────────────────────────── */

const ringSeries = (radius: string, color: string, pct: number) => ({
    type: "gauge" as const,
    radius,
    center: ["50%", "50%"],
    startAngle: 90,
    endAngle: -270,
    min: 0,
    max: 100,
    silent: true,
    progress: { show: true, roundCap: true, width: 12, itemStyle: { color } },
    axisLine: { roundCap: true, lineStyle: { width: 12, color: [[1, "#24242C"]] as [number, string][] } },
    pointer: { show: false },
    anchor: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: { show: false },
    title: { show: false },
    detail: { show: false },
    data: [{ value: pct }],
});

const RINGS_OPTION = {
    animationDuration: 1100,
    animationEasing: "cubicOut" as const,
    series: [
        ringSeries("100%", RINGS[0].color, RINGS[0].pct),
        ringSeries("74%", RINGS[1].color, RINGS[1].pct),
        ringSeries("48%", RINGS[2].color, RINGS[2].pct),
    ],
};

const HR_OPTION = {
    animationDuration: 1000,
    animationEasing: "cubicOut" as const,
    grid: { left: 2, right: 4, top: 12, bottom: 22 },
    tooltip: {
        trigger: "axis" as const,
        backgroundColor: "#141419",
        borderColor: "#24242C",
        borderWidth: 1,
        padding: [6, 10],
        textStyle: { color: "#E8E8EC", fontSize: 11 },
        valueFormatter: (v: number) => `${v} bpm`,
    },
    xAxis: {
        type: "category" as const,
        data: HR_TIMES,
        boundaryGap: false,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
            color: "#5A5A64",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            interval: (i: number) => HR_TICKS.includes(i),
        },
    },
    yAxis: { type: "value" as const, min: 40, max: 175, show: false },
    series: [
        {
            type: "line" as const,
            data: HR,
            smooth: true,
            symbol: "none" as const,
            lineStyle: { color: "#F43F5E", width: 2.5 },
            areaStyle: {
                color: {
                    type: "linear" as const,
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: "rgba(244,63,94,0.35)" },
                        { offset: 1, color: "rgba(244,63,94,0)" },
                    ],
                },
            },
        },
    ],
};

const MOVE_OPTION = {
    animationDuration: 900,
    animationEasing: "cubicOut" as const,
    animationDelay: (i: number) => i * 60,
    grid: { left: 4, right: 4, top: 14, bottom: 22 },
    tooltip: {
        trigger: "axis" as const,
        backgroundColor: "#141419",
        borderColor: "#24242C",
        borderWidth: 1,
        padding: [6, 10],
        textStyle: { color: "#E8E8EC", fontSize: 11 },
        valueFormatter: (v: number) => `${v} min`,
    },
    xAxis: {
        type: "category" as const,
        data: WEEK.map((d) => d.d),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#5A5A64", fontSize: 10 },
    },
    yAxis: { type: "value" as const, max: 110, show: false },
    series: [
        {
            type: "bar" as const,
            barWidth: "56%",
            data: WEEK.map((d) => ({ value: d.h, itemStyle: { color: d.bg, borderRadius: [5, 5, 0, 0] as [number, number, number, number] } })),
        },
    ],
};

/* ── Client-only chart mount (SSR-safe — fixed-height box, no layout jump) ── */

function ChartBox({ option, height, className }: { option: object; height: number; className?: string }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return (
        <div className={"dbpulse-chartbox" + (className ? " " + className : "")} style={{ height }}>
            {mounted ? <EChart option={option as never} style={{ width: "100%", height: "100%" }} /> : null}
        </div>
    );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function Pulse({ style }: { style: Style }) {
    /** Controlled period switch (Today / Week / Month) — a real Fancy Tabs state. */
    const [period, setPeriod] = useState("today");
    /** Click a workout to spotlight its row (others dim). */
    const [openWorkout, setOpenWorkout] = useState<string | null>(null);

    return (
        <div className="dbpulse-root">
            <div className="dbpulse-shell">
                {/* ── Top bar ────────────────────────────────────────────────── */}
                <header className="dbpulse-top">
                    <Link href="/inspiration/dashboards" className="dbpulse-brand" aria-label="Pulse — back to Dashboards">
                        <span className="dbpulse-brand__mark" aria-hidden>
                            P
                        </span>
                        <span className="dbpulse-brand__word">Pulse</span>
                    </Link>

                    <Tabs activeTab={period} onTabChange={setPeriod} className="dbpulse-period">
                        <Tabs.List>
                            <Tabs.Tab value="today">Today</Tabs.Tab>
                            <Tabs.Tab value="week">Week</Tabs.Tab>
                            <Tabs.Tab value="month">Month</Tabs.Tab>
                        </Tabs.List>
                    </Tabs>

                    <Avatar fallback="JR" size="md" className="dbpulse-avatar" />
                </header>

                {/* ── Greeting hero ──────────────────────────────────────────── */}
                <section className="dbpulse-hero" aria-labelledby="dbpulse-hero-h">
                    <Text as="div" className="dbpulse-hero__eyebrow">
                        Good evening, Jordan
                    </Text>
                    <Heading as="h1" className="dbpulse-hero__h1" id="dbpulse-hero-h">
                        You&apos;re closing in on your rings.
                    </Heading>
                </section>

                {/* ── Rings + KPI stack ──────────────────────────────────────── */}
                <div className="dbpulse-grid dbpulse-grid--rings">
                    <Card className="dbpulse-card dbpulse-rings" variant="flat" padding="none">
                        <div className="dbpulse-rings__gauge">
                            <ChartBox option={RINGS_OPTION} height={168} className="dbpulse-rings__chart" />
                            <div className="dbpulse-rings__center" aria-hidden>
                                <div className="dbpulse-rings__pct">{GOAL_PCT}%</div>
                                <div className="dbpulse-rings__cap">of goals</div>
                            </div>
                        </div>
                        <div className="dbpulse-rings__list">
                            {RINGS.map((r) => (
                                <div key={r.label} className="dbpulse-metric" style={{ "--dbpulse-mcol": r.color } as CSSProperties}>
                                    <div className="dbpulse-metric__row">
                                        <span className="dbpulse-metric__name">
                                            <span className="dbpulse-dot" aria-hidden />
                                            {r.label}
                                        </span>
                                        <span className="dbpulse-metric__val">{r.val}</span>
                                    </div>
                                    <Progress className="dbpulse-mbar" value={r.pct} max={100} size="sm" />
                                </div>
                            ))}
                        </div>
                    </Card>

                    <div className="dbpulse-kpis">
                        <Card className="dbpulse-card dbpulse-kpi" variant="flat" padding="none">
                            <span className="dbpulse-kpi__chip dbpulse-kpi__chip--rose" aria-hidden>
                                <Flame size={22} />
                            </span>
                            <div>
                                <div className="dbpulse-kpi__num">
                                    32 <span className="dbpulse-kpi__unit">day streak</span>
                                </div>
                                <div className="dbpulse-kpi__sub">Personal best — keep it alive</div>
                            </div>
                        </Card>
                        <Card className="dbpulse-card dbpulse-kpi" variant="flat" padding="none">
                            <span className="dbpulse-kpi__chip dbpulse-kpi__chip--orange" aria-hidden>
                                <Footprints size={22} />
                            </span>
                            <div>
                                <div className="dbpulse-kpi__num">
                                    9,240 <span className="dbpulse-kpi__unit">steps</span>
                                </div>
                                <div className="dbpulse-kpi__sub">760 to your daily goal</div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* ── Heart rate + weekly move ───────────────────────────────── */}
                <div className="dbpulse-grid dbpulse-grid--charts">
                    <Card className="dbpulse-card dbpulse-panel" variant="flat" padding="none">
                        <div className="dbpulse-panel__head">
                            <div>
                                <div className="dbpulse-panel__title">
                                    <Heart size={14} className="dbpulse-livepin" aria-hidden />
                                    Heart rate
                                </div>
                                <div className="dbpulse-panel__sub">Today · resting 58 bpm</div>
                            </div>
                            <Tooltip content="Highest reading logged today">
                                <Badge className="dbpulse-peak" size="sm" variant="soft">
                                    peak 162
                                </Badge>
                            </Tooltip>
                        </div>
                        <ChartBox option={HR_OPTION} height={168} />
                    </Card>

                    <Card className="dbpulse-card dbpulse-panel" variant="flat" padding="none">
                        <div className="dbpulse-panel__head">
                            <div>
                                <div className="dbpulse-panel__title">Move minutes</div>
                                <div className="dbpulse-panel__sub">This week</div>
                            </div>
                        </div>
                        <ChartBox option={MOVE_OPTION} height={168} />
                    </Card>
                </div>

                {/* ── Recent workouts ────────────────────────────────────────── */}
                <Card className="dbpulse-card dbpulse-workouts" variant="flat" padding="none">
                    <div className="dbpulse-workouts__head">
                        <span className="dbpulse-workouts__title">Recent workouts</span>
                        <Button className="dbpulse-seeall" variant="ghost" iconTrailing="chevron-right">
                            See all
                        </Button>
                    </div>
                    <Table className="dbpulse-wtable">
                        <Table.Body>
                            {WORKOUTS.map((w) => {
                                const Icon = w.icon;
                                return (
                                    <Table.Row
                                        key={w.slug}
                                        className={"dbpulse-wrow" + (openWorkout === w.slug ? " is-open" : "")}
                                        onClick={() => setOpenWorkout((c) => (c === w.slug ? null : w.slug))}
                                    >
                                        <Table.Cell className="dbpulse-wcell dbpulse-wcell--icon">
                                            <span className="dbpulse-wicon" aria-hidden>
                                                <Icon size={17} />
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell className="dbpulse-wcell dbpulse-wcell--name">
                                            <span className="dbpulse-wname">{w.name}</span>
                                            <span className="dbpulse-wwhen">{w.when}</span>
                                        </Table.Cell>
                                        <Table.Cell className="dbpulse-wcell dbpulse-wdur">{w.dur}</Table.Cell>
                                        <Table.Cell className="dbpulse-wcell dbpulse-wkcal">{w.kcal}</Table.Cell>
                                    </Table.Row>
                                );
                            })}
                        </Table.Body>
                    </Table>
                </Card>

                {/* ── Colophon (gallery framing) ─────────────────────────────── */}
                <div className="dbpulse-colophon">
                    Pulse — a fictional training dashboard, for demonstration · App {style.num} / {style.name} · every
                    surface is a restyled Fancy UI primitive
                </div>
            </div>
        </div>
    );
}
