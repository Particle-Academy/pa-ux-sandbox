import "./ledger.css";
import { useEffect, useState, type CSSProperties } from "react";
import {
    Avatar,
    Badge,
    Card,
    Heading,
    Navbar,
    Progress,
    Table,
    Text,
    Tooltip,
} from "@particle-academy/react-fancy";
import { type EChartsOption, EChart, registerAll } from "@particle-academy/fancy-echarts";
import { Car, Home, ShoppingCart, Sparkles, Target, Utensils, type LucideIcon } from "lucide-react";
import type { Style } from "../../types";

/**
 * Dashboards · Style 03 — Ledger (personal budgeting, light / front-of-house).
 *
 * A friendly consumer finance dashboard: no sidebar, a single centered 1080px
 * column on a warm off-white (#F6F7F5) page under a slim Navbar (gradient "L"
 * mark + horizontal nav + emerald AM avatar), a plain-language budget hero, then
 * two stacked 2-column grid rows — a budget-used ring beside a spending-by-
 * category list, then a cash-flow chart beside an emergency-fund goal over a
 * recent-transactions list. Every panel is a RESTYLED Fancy primitive, not a
 * bespoke div: Navbar/Avatar (chrome), Card (every panel), the budget ring +
 * cash-flow columns are fancy-echarts <EChart> (a gauge + a grouped bar), the
 * spending bars + emergency-fund meter are restyled <Progress>, the recent list
 * is a restyled <Table>, plus Heading/Text/Badge/Tooltip.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "ledger"`. SSR-safe: the
 * data model is static + deterministic (no Date.now/Math.random/window at render
 * — "18 days left", 57%, 64% are passed-in constants), and the two EСharts mount
 * client-only behind a `mounted` gate (same-size placeholder on the server) so
 * there is no hydration mismatch or layout shift. Only controlled React state is
 * `focusCat` (click a category to spotlight it). Page owns no fixed/high z-index
 * — it renders below the gallery frame's sticky z-index 30.
 */

/* ── ECharts module registration — ONCE at module top ───────────────────────── */
registerAll();

/* ── Data (the mockup's DCLogic.renderVals(), verbatim) ─────────────────────── */

type Cat = { slug: string; label: string; amt: string; pct: number; Icon: LucideIcon; col: string; bg: string };

const BUDGET = {
    month: "July 2026",
    daysLeft: 18,
    spent: "$1,840",
    budget: "$3,200",
    pct: 57,
    left: "$1,360",
    perDay: "$75",
} as const;

const CATS: Cat[] = [
    { slug: "housing", label: "Housing", amt: "$980", pct: 100, Icon: Home, col: "#059669", bg: "#E3F3EC" },
    { slug: "groceries", label: "Groceries", amt: "$412", pct: 62, Icon: ShoppingCart, col: "#0891B2", bg: "#E0F2F6" },
    { slug: "dining", label: "Dining", amt: "$248", pct: 38, Icon: Utensils, col: "#F59E0B", bg: "#FDF0DC" },
    { slug: "transport", label: "Transport", amt: "$126", pct: 22, Icon: Car, col: "#8B5CF6", bg: "#EFE9FB" },
    { slug: "fun", label: "Fun", amt: "$74", pct: 14, Icon: Sparkles, col: "#EC4899", bg: "#FBE4F0" },
];

const CASH_MONTHS = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];
const CASH_IN = [100, 96, 104, 98, 110, 88];
const CASH_OUT = [78, 88, 70, 92, 64, 58];

const EMERGENCY = { have: "$6,400", goal: "$10,000", pct: 64 } as const;

type Txn = { emoji: string; name: string; cat: string; amt: string; income: boolean };
const TXNS: Txn[] = [
    { emoji: "☕", name: "Blue Bottle", cat: "Dining", amt: "−$6.50", income: false },
    { emoji: "💰", name: "Paycheck", cat: "Income", amt: "+$2,400", income: true },
    { emoji: "🛒", name: "Whole Foods", cat: "Groceries", amt: "−$84.20", income: false },
    { emoji: "🎬", name: "Netflix", cat: "Fun", amt: "−$15.49", income: false },
];

/* ── EChart options — static, so defined once at module scope ────────────────── */

/** Budget-used ring: a 57% emerald gauge on a light track, rounded cap, arc
 *  starting at 12 o'clock going clockwise. The center label is an HTML overlay
 *  (crisper type + exact match to the mockup) so the gauge draws only the arc. */
const gaugeOption: EChartsOption = {
    series: [
        {
            type: "gauge",
            startAngle: 90,
            endAngle: -270,
            radius: "100%",
            center: ["50%", "50%"],
            min: 0,
            max: 100,
            pointer: { show: false },
            progress: { show: true, width: 12, roundCap: true, itemStyle: { color: "#059669" } },
            axisLine: { lineStyle: { width: 12, color: [[1, "#EEF1EF"]] } },
            splitLine: { show: false },
            axisTick: { show: false },
            axisLabel: { show: false },
            anchor: { show: false },
            title: { show: false },
            detail: { show: false },
            data: [{ value: BUDGET.pct }],
        },
    ],
};

/** Cash flow: grouped vertical bars over the last 6 months, a green "in" column
 *  and a red "out" column per month, thin with 4px rounded tops. */
const cashflowOption: EChartsOption = {
    grid: { top: 12, right: 6, bottom: 22, left: 6 },
    tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: "#0F3D2E",
        borderWidth: 0,
        padding: [6, 10],
        textStyle: { color: "#D7F0E5", fontSize: 11 },
    },
    xAxis: {
        type: "category",
        data: CASH_MONTHS,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#E4E8E5" } },
        axisLabel: { color: "#8A968F", fontSize: 10 },
    },
    yAxis: { type: "value", show: false, max: 120 },
    series: [
        {
            name: "in",
            type: "bar",
            data: CASH_IN,
            barWidth: 11,
            barGap: "35%",
            itemStyle: { color: "#059669", borderRadius: [4, 4, 0, 0] },
        },
        {
            name: "out",
            type: "bar",
            data: CASH_OUT,
            barWidth: 11,
            itemStyle: { color: "#E4674A", borderRadius: [4, 4, 0, 0] },
        },
    ],
};

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function Ledger({ style }: { style: Style }) {
    /** Charts mount client-only (same-size placeholder on the server). */
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    /** Click a category row to spotlight it; others dim. The only wired state. */
    const [focusCat, setFocusCat] = useState<string | null>(null);

    return (
        <div className="dbledger-root">
            <div className="dbledger-shell">
                {/* ── Header — brand + horizontal nav + user avatar (Navbar) ─── */}
                <Navbar className="dbledger-nav">
                    <Navbar.Brand className="dbledger-brand">
                        <span className="dbledger-mark" aria-hidden>
                            L
                        </span>
                        <span className="dbledger-wordmark">Ledger</span>
                    </Navbar.Brand>
                    <Navbar.Items className="dbledger-navitems">
                        <Navbar.Item active className="dbledger-navlink dbledger-navlink--active">
                            Overview
                        </Navbar.Item>
                        <Navbar.Item className="dbledger-navlink">Transactions</Navbar.Item>
                        <Navbar.Item className="dbledger-navlink">Goals</Navbar.Item>
                        <Navbar.Item className="dbledger-navlink">Cards</Navbar.Item>
                    </Navbar.Items>
                    <Avatar fallback="AM" size="sm" className="dbledger-avatar" />
                </Navbar>

                {/* ── Budget hero headline ─────────────────────────────────── */}
                <div className="dbledger-hero">
                    <div className="dbledger-hero__eyebrow">
                        <Text as="span" size="sm" className="dbledger-muted">
                            {BUDGET.month}
                        </Text>
                        <span className="dbledger-hero__dot" aria-hidden />
                        <Badge color="emerald" variant="soft" size="sm" className="dbledger-daychip">
                            {BUDGET.daysLeft} days left
                        </Badge>
                    </div>
                    <Heading as="h1" size="2xl" weight="bold" className="dbledger-hero__title">
                        You&apos;ve spent <span className="dbledger-hero__accent">{BUDGET.spent}</span> of your{" "}
                        {BUDGET.budget} budget.
                    </Heading>
                </div>

                {/* ── Row 1 — budget ring · spending by category (1fr / 1.3fr) ─ */}
                <div className="dbledger-grid dbledger-grid--top">
                    {/* Budget-used ring (EChart gauge + HTML center label) */}
                    <Card variant="outlined" padding="none" className="dbledger-card dbledger-ringcard">
                        <Card.Body className="dbledger-ringcard__body">
                            <div className="dbledger-ring">
                                {mounted ? (
                                    <EChart option={gaugeOption} style={{ width: 130, height: 130 }} />
                                ) : (
                                    <div className="dbledger-ring__ph" aria-hidden />
                                )}
                                <div className="dbledger-ring__label">
                                    <div className="dbledger-ring__pct">{BUDGET.pct}%</div>
                                    <div className="dbledger-ring__cap">of budget</div>
                                </div>
                            </div>
                            <div className="dbledger-ringcard__stat">
                                <Text as="div" size="sm" className="dbledger-faint">
                                    Left to spend
                                </Text>
                                <div className="dbledger-ringcard__left">{BUDGET.left}</div>
                                <Text as="div" size="sm" className="dbledger-ringcard__hint">
                                    ≈ {BUDGET.perDay} / day to stay on track
                                </Text>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Spending by category — one restyled Progress per row */}
                    <Card variant="outlined" padding="none" className="dbledger-card dbledger-catcard">
                        <Card.Header className="dbledger-card__head">
                            <span className="dbledger-card__title">Spending by category</span>
                        </Card.Header>
                        <Card.Body className="dbledger-catcard__body">
                            {CATS.map((c) => {
                                const dim = focusCat !== null && focusCat !== c.slug;
                                return (
                                    <button
                                        key={c.slug}
                                        type="button"
                                        className={
                                            "dbledger-catrow" +
                                            (dim ? " is-dim" : "") +
                                            (focusCat === c.slug ? " is-focus" : "")
                                        }
                                        onClick={() => setFocusCat((f) => (f === c.slug ? null : c.slug))}
                                        aria-pressed={focusCat === c.slug}
                                        style={
                                            {
                                                "--dbledger-catcol": c.col,
                                                "--dbledger-catbg": c.bg,
                                            } as CSSProperties
                                        }
                                    >
                                        <span className="dbledger-catrow__top">
                                            <span className="dbledger-catrow__label">
                                                <span className="dbledger-chip" aria-hidden>
                                                    <c.Icon size={13} />
                                                </span>
                                                {c.label}
                                            </span>
                                            <span className="dbledger-catrow__amt">{c.amt}</span>
                                        </span>
                                        <Progress value={c.pct} max={100} size="sm" className="dbledger-catbar" />
                                    </button>
                                );
                            })}
                        </Card.Body>
                    </Card>
                </div>

                {/* ── Row 2 — cash flow · (goal over recent) (1.4fr / 1fr) ────── */}
                <div className="dbledger-grid dbledger-grid--bottom">
                    {/* Cash flow — the one true chart (EChart grouped bar) */}
                    <Card variant="outlined" padding="none" className="dbledger-card dbledger-cashcard">
                        <Card.Header className="dbledger-card__head dbledger-cashcard__head">
                            <span className="dbledger-card__title">Cash flow</span>
                            <span className="dbledger-legend">
                                <span className="dbledger-legend__item dbledger-legend__item--in">■ in</span>
                                <span className="dbledger-legend__item dbledger-legend__item--out">■ out</span>
                            </span>
                        </Card.Header>
                        <Card.Body className="dbledger-cashcard__body">
                            <Text as="div" size="sm" className="dbledger-faint dbledger-cashcard__sub">
                                Last 6 months
                            </Text>
                            <div className="dbledger-chart">
                                {mounted ? (
                                    <EChart option={cashflowOption} style={{ height: 150 }} />
                                ) : (
                                    <div className="dbledger-chart__ph" aria-hidden />
                                )}
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Right stack — emergency-fund goal over recent transactions */}
                    <div className="dbledger-stack">
                        {/* Emergency fund — dark accent card + restyled Progress */}
                        <Card variant="flat" padding="none" className="dbledger-card dbledger-goalcard">
                            <Card.Body className="dbledger-goalcard__body">
                                <div className="dbledger-goalcard__head">
                                    <span className="dbledger-goalcard__label">Emergency fund</span>
                                    <Tooltip content="On track to fully fund by Feb 2027 at this pace.">
                                        <span className="dbledger-goalcard__icon" aria-label="Goal status">
                                            <Target size={16} />
                                        </span>
                                    </Tooltip>
                                </div>
                                <div className="dbledger-goalcard__fig">
                                    {EMERGENCY.have}{" "}
                                    <span className="dbledger-goalcard__of">/ {EMERGENCY.goal}</span>
                                </div>
                                <Progress
                                    value={EMERGENCY.pct}
                                    max={100}
                                    size="sm"
                                    className="dbledger-goalbar"
                                />
                            </Card.Body>
                        </Card>

                        {/* Recent transactions — a compact restyled Table */}
                        <Card variant="outlined" padding="none" className="dbledger-card dbledger-recentcard">
                            <Card.Header className="dbledger-card__head dbledger-recentcard__head">
                                <span className="dbledger-card__title">Recent</span>
                            </Card.Header>
                            <Table className="dbledger-txntable">
                                <Table.Head>
                                    <Table.Column label="Merchant" />
                                    <Table.Column label="Amount" />
                                </Table.Head>
                                <Table.Body>
                                    {TXNS.map((t) => (
                                        <Table.Row key={t.name} className="dbledger-txn">
                                            <Table.Cell className="dbledger-txn__cell">
                                                <span className="dbledger-txn__main">
                                                    <span className="dbledger-txn__tile" aria-hidden>
                                                        {t.emoji}
                                                    </span>
                                                    <span className="dbledger-txn__meta">
                                                        <span className="dbledger-txn__name">{t.name}</span>
                                                        <span className="dbledger-txn__cat">{t.cat}</span>
                                                    </span>
                                                </span>
                                            </Table.Cell>
                                            <Table.Cell className="dbledger-txn__amtcell">
                                                <span
                                                    className={
                                                        "dbledger-txn__amt" + (t.income ? " is-income" : "")
                                                    }
                                                >
                                                    {t.amt}
                                                </span>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </Card>
                    </div>
                </div>

                {/* ── Colophon ─────────────────────────────────────────────── */}
                <div className="dbledger-foot">
                    <Text as="span" size="xs" className="dbledger-faint">
                        Ledger — a fictional budgeting app, for demonstration · Dashboard {style.num} / {style.name}{" "}
                        · every panel is a restyled Fancy UI primitive
                    </Text>
                </div>
            </div>
        </div>
    );
}
