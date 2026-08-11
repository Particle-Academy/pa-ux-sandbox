import "./scholar.css";
import { Link } from "@inertiajs/react";
import { useEffect, useState } from "react";
import {
    Avatar,
    Badge,
    Button,
    Card,
    Heading,
    Navbar,
    Progress,
    Table,
    Text,
} from "@particle-academy/react-fancy";
import { type EChartsOption, EChart, registerAll } from "@particle-academy/fancy-echarts";
import { Check, Flame, HelpCircle, MessagesSquare, Play } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Style } from "../../types";

/**
 * Dashboards · Style 09 — Scholar (light).
 *
 * A consumer language-learning home rebuilt from restyled Fancy primitives: a
 * centered 1080px column under a slim <Navbar> (gradient "S" mark + Learn /
 * Practice / Community + an "EM" <Avatar>), then a 1.5fr/1fr feature row — a
 * gradient "Continue learning" hero <Card> (<Heading> + a white <Progress> at
 * 38% + a "Resume" <Button>) beside a stacked daily-streak <Card> and a
 * "This week" XP tile whose 7-bar activity chart is a real fancy-echarts
 * <EChart>. Below: a "Your skills" <Card> of four per-skill <Progress> meters
 * with mono "Lv N" <Badge>s, and an "Up next" <Card> whose lesson queue is a
 * <Table> with state-colored icon tiles.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "scholar"`. SSR-safe: no
 * browser APIs during render, deterministic first paint (all values are
 * literals — the mockup's imperative paint() becomes declarative props). The
 * only motion is a mount-time width fill on the meters (value 0 → real) plus a
 * gentle flame flicker; the page is full-bleed and adds no fixed chrome that
 * fights the gallery frame's z-index 30.
 */

// Register every ECharts module once so the weekly-XP bar renders anywhere.
registerAll();

/* ── Data (the mockup's DCLogic.renderVals(), verbatim) ─────────────────── */

type Day = { d: string; h: number; high: boolean };

const WEEK: Day[] = [
    { d: "M", h: 60, high: true },
    { d: "T", h: 80, high: true },
    { d: "W", h: 50, high: false },
    { d: "T", h: 100, high: true },
    { d: "F", h: 72, high: true },
    { d: "S", h: 40, high: false },
    { d: "S", h: 88, high: true },
];

type Skill = { key: string; label: string; lv: number; pct: number };

const SKILLS: Skill[] = [
    { key: "vocab", label: "Vocabulary", lv: 12, pct: 78 },
    { key: "grammar", label: "Grammar", lv: 8, pct: 54 },
    { key: "listening", label: "Listening", lv: 10, pct: 66 },
    { key: "speaking", label: "Speaking", lv: 6, pct: 40 },
];

type LessonState = "active" | "locked" | "done";
type Lesson = { name: string; meta: string; icon: LucideIcon; state: LessonState; xp: string };

const LESSONS: Lesson[] = [
    { name: "Past tense verbs", meta: "Lesson 3 · 5 min", icon: Play, state: "active", xp: "+20 XP" },
    { name: "Practice: at the market", meta: "Conversation drill", icon: MessagesSquare, state: "locked", xp: "+30 XP" },
    { name: "Unit 4 quiz", meta: "8 questions", icon: HelpCircle, state: "locked", xp: "+50 XP" },
    { name: "Unit 3 review", meta: "Completed yesterday", icon: Check, state: "done", xp: "✓ 60 XP" },
];

const HERO_PCT = 38;

/* The weekly-XP spark bar — 7 day buckets, per-bar color, no axes/grid. */
const weekOption: EChartsOption = {
    animationDuration: 720,
    grid: { top: 6, right: 2, bottom: 20, left: 2 },
    xAxis: {
        type: "category",
        data: WEEK.map((d) => d.d),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#A6AEC0", fontSize: 9 },
    },
    yAxis: { type: "value", max: 100, show: false },
    tooltip: { show: false },
    series: [
        {
            type: "bar",
            barWidth: "56%",
            data: WEEK.map((d) => ({
                value: d.h,
                itemStyle: { color: d.high ? "#2563EB" : "#93C5FD", borderRadius: [4, 4, 0, 0] },
            })),
        },
    ],
};

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function Scholar({ style }: { style: Style }) {
    /** Mount flag drives the meter fill-in (value 0 → real) via Progress's
     *  built-in width transition — deterministic first paint, then animates. */
    const [lit, setLit] = useState(false);
    /** Click a lesson row to spotlight it (controlled, no DOM scraping). */
    const [selected, setSelected] = useState<string | null>("Past tense verbs");

    useEffect(() => {
        const t = window.setTimeout(() => setLit(true), 70);
        return () => window.clearTimeout(t);
    }, []);

    return (
        <div className="dbscholar-root">
            <div className="dbscholar-shell">
                {/* ── Top header / nav ─────────────────────────────────────── */}
                <Navbar className="dbscholar-nav">
                    <Navbar.Brand className="dbscholar-brand">
                        <Link href="/inspiration/dashboards" className="dbscholar-brandlink">
                            <span className="dbscholar-logo" aria-hidden>
                                S
                            </span>
                            Scholar
                        </Link>
                    </Navbar.Brand>
                    <Navbar.Items className="dbscholar-navlinks">
                        <Navbar.Item active className="dbscholar-navitem is-active">
                            Learn
                        </Navbar.Item>
                        <Navbar.Item className="dbscholar-navitem">Practice</Navbar.Item>
                        <Navbar.Item className="dbscholar-navitem">Community</Navbar.Item>
                    </Navbar.Items>
                    <Avatar fallback="EM" className="dbscholar-avatar" />
                </Navbar>

                {/* ── Feature row: hero + (streak / weekly-XP) ─────────────── */}
                <div className="dbscholar-feature">
                    {/* Continue-learning hero */}
                    <Card variant="flat" padding="none" className="dbscholar-hero">
                        <div>
                            <div className="dbscholar-hero__eyebrow">Continue learning</div>
                            <Heading as="h1" className="dbscholar-hero__title">
                                Spanish · Unit 4
                            </Heading>
                            <div className="dbscholar-hero__sub">Lesson 3 of 8 — Past tense verbs</div>
                        </div>
                        <div className="dbscholar-hero__foot">
                            <Progress
                                className="dbscholar-herobar"
                                value={lit ? HERO_PCT : 0}
                                max={100}
                                size="sm"
                            />
                            <div className="dbscholar-hero__row">
                                <span className="dbscholar-hero__pct">{HERO_PCT}% through the unit</span>
                                <Button className="dbscholar-resume" iconTrailing="arrow-right">
                                    Resume
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Streak + weekly-XP stack */}
                    <div className="dbscholar-side">
                        <Card variant="flat" padding="none" className="dbscholar-streak">
                            <span className="dbscholar-streak__tile" aria-hidden>
                                <Flame size={24} className="dbscholar-flame" />
                            </span>
                            <div>
                                <div className="dbscholar-streak__num">
                                    47 <span className="dbscholar-streak__unit">days</span>
                                </div>
                                <div className="dbscholar-streak__cap">Daily streak</div>
                            </div>
                        </Card>

                        <Card variant="flat" padding="none" className="dbscholar-xp">
                            <div className="dbscholar-xp__head">
                                <span className="dbscholar-xp__label">This week</span>
                                <span className="dbscholar-xp__val">1,240 XP</span>
                            </div>
                            <EChart
                                option={weekOption}
                                className="dbscholar-xp__chart"
                                style={{ height: 92, width: "100%" }}
                                aria-label="Weekly XP by day"
                            />
                        </Card>
                    </div>
                </div>

                {/* ── Your skills ──────────────────────────────────────────── */}
                <Card variant="flat" padding="none" className="dbscholar-skills">
                    <div className="dbscholar-skills__title">Your skills</div>
                    <div className="dbscholar-skills__grid">
                        {SKILLS.map((s) => (
                            <div key={s.key} className="dbscholar-skill">
                                <div className="dbscholar-skill__top">
                                    <span className="dbscholar-skill__label">{s.label}</span>
                                    <Badge className="dbscholar-lv" color="zinc" variant="soft" size="sm">
                                        Lv {s.lv}
                                    </Badge>
                                </div>
                                <Progress
                                    className={`dbscholar-skillbar dbscholar-skillbar--${s.key}`}
                                    value={lit ? s.pct : 0}
                                    max={100}
                                    size="sm"
                                />
                            </div>
                        ))}
                    </div>
                </Card>

                {/* ── Up next (lesson queue) ───────────────────────────────── */}
                <Card variant="flat" padding="none" className="dbscholar-up">
                    <Card.Header className="dbscholar-up__head">Up next</Card.Header>
                    <Card.Body className="dbscholar-up__body">
                        <Table className="dbscholar-uptable">
                            <Table.Head>
                                <Table.Column label="" />
                                <Table.Column label="" />
                                <Table.Column label="" />
                            </Table.Head>
                            <Table.Body>
                                {LESSONS.map((l) => {
                                    const LIcon = l.icon;
                                    return (
                                        <Table.Row
                                            key={l.name}
                                            className={
                                                "dbscholar-lesson" + (selected === l.name ? " is-selected" : "")
                                            }
                                            onClick={() =>
                                                setSelected((c) => (c === l.name ? null : l.name))
                                            }
                                        >
                                            <Table.Cell className="dbscholar-lesson__iconcell">
                                                <span className={`dbscholar-tile dbscholar-tile--${l.state}`} aria-hidden>
                                                    <LIcon size={18} />
                                                </span>
                                            </Table.Cell>
                                            <Table.Cell className="dbscholar-lesson__namecell">
                                                <span className="dbscholar-lesson__name">{l.name}</span>
                                                <span className="dbscholar-lesson__meta">{l.meta}</span>
                                            </Table.Cell>
                                            <Table.Cell className="dbscholar-lesson__xp">{l.xp}</Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                        </Table>
                    </Card.Body>
                </Card>

                {/* ── Colophon ─────────────────────────────────────────────── */}
                <div className="dbscholar-colophon">
                    <Text as="span" className="dbscholar-colophon__note">
                        Scholar — a fictional learning platform, for demonstration · Dashboard {style.num} /{" "}
                        {style.name} · every surface is a restyled Fancy UI primitive
                    </Text>
                    <Link href="/inspiration/dashboards" className="dbscholar-back">
                        Back to the gallery
                    </Link>
                </div>
            </div>
        </div>
    );
}
