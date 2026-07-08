import "./merchant.css";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
    Badge,
    Button,
    Card,
    Heading,
    Navbar,
    Progress,
    Table,
    Text,
    Timeline,
} from "@particle-academy/react-fancy";
import { EChart, registerAll } from "@particle-academy/fancy-echarts";
import { AlertTriangle, Pause, Play, TrendingUp } from "lucide-react";
import type { Style } from "../../types";

/**
 * Dashboards · Style 04 — Merchant (light).
 *
 * A back-of-house e-commerce seller console for the fictional apparel brand
 * "Threadline Co." — a slim 52px Navbar over a two-column app grid (1.15fr /
 * 1fr) split by a hairline. LEFT is the live-sales focus: an oversized $56px
 * revenue hero + delta, a full-width intraday revenue area chart, and a
 * streaming "Live orders" ticker. RIGHT stacks three panels: today's
 * conversion funnel, low-stock alerts, and a ranked top-sellers list.
 *
 * Built from restyled Fancy primitives (never bespoke divs): Navbar (shell),
 * Card (hero + the three right panels), EChart (intraday area + funnel bars),
 * Timeline (the streaming order feed), Table (low-stock + top-sellers),
 * Progress (stock-level bars), Badge (delta / "N left" / "Today"), Button
 * (pause/resume the stream), Heading + Text. Scoped entirely under
 * `.dbmerchant-root`, every class prefixed `dbmerchant-`.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "merchant"`. SSR-safe: no
 * browser APIs during render, deterministic first paint (the initial five
 * orders + their "just now / 1m / 2m…" ages are static data, never the wall
 * clock or Math.random). The only client-side motion is the order ticker,
 * driven by a setInterval inside useEffect with cleanup. EChart mounts
 * client-side (renders a container, inits in an effect). Page sticky/z-index
 * stays under the gallery frame's 30 (this page adds no sticky chrome).
 */

/* Register every ECharts chart + component module once, at module load. */
registerAll();

/* ── Types + mock data (the mockup's DCLogic.renderVals(), verbatim) ──────── */

type Order = { seq: number; item: string; cust: string; city: string; amt: string };

const ORDERS_INITIAL: Order[] = [
    { seq: 0, item: "Linen Overshirt ×1", cust: "M. Alvarez", city: "Austin, TX", amt: "$84" },
    { seq: 1, item: "Wide Trouser ×2", cust: "K. Tanaka", city: "Seattle, WA", amt: "$168" },
    { seq: 2, item: "Canvas Tote", cust: "R. Okafor", city: "Chicago, IL", amt: "$42" },
    { seq: 3, item: "Camp Collar Shirt", cust: "S. Nowak", city: "Denver, CO", amt: "$68" },
    { seq: 4, item: "Wool Beanie ×3", cust: "D. Klein", city: "Boston, MA", amt: "$54" },
];

/** Fixed pool the ticker cycles through — deterministic, no randomness. */
const ORDER_POOL: Omit<Order, "seq">[] = [
    { item: "Field Jacket", cust: "T. Reyes", city: "Portland, OR", amt: "$128" },
    { item: "Chore Pant ×2", cust: "L. Haas", city: "Austin, TX", amt: "$116" },
    { item: "Merino Crew", cust: "J. Park", city: "Brooklyn, NY", amt: "$72" },
    { item: "Waxed Cap", cust: "E. Moreau", city: "Denver, CO", amt: "$38" },
    { item: "Linen Overshirt ×1", cust: "A. Kowal", city: "Madison, WI", amt: "$84" },
    { item: "Canvas Tote ×2", cust: "P. Silva", city: "Miami, FL", amt: "$84" },
];

/** Relative ages by row index — newest first. Deterministic, index-driven. */
const AGE_LABELS = ["just now", "1m", "2m", "3m", "4m"];

type Stock = { name: string; pct: number; left: string };
const STOCK: Stock[] = [
    { name: "Linen Overshirt — M", pct: 12, left: "6" },
    { name: "Wide Trouser — 32", pct: 18, left: "9" },
    { name: "Wool Beanie", pct: 8, left: "4" },
];

type TopSeller = { rank: string; name: string; rev: string };
const TOP: TopSeller[] = [
    { rank: "01", name: "Linen Overshirt", rev: "$2,940" },
    { rank: "02", name: "Wide Trouser", rev: "$2,184" },
    { rank: "03", name: "Camp Collar Shirt", rev: "$1,428" },
    { rank: "04", name: "Canvas Tote", rev: "$924" },
];

/* ── EChart options (static — defined once, no browser refs) ──────────────── */

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/** Intraday cumulative revenue, 12a → now (10 sampled points, ends at hero). */
const REVENUE_SERIES = [210, 640, 980, 1520, 2180, 3120, 4360, 5580, 6980, 8412];
const REVENUE_HOURS = ["12a", "2a", "4a", "6a", "8a", "10a", "12p", "2p", "4p", "now"];

const revenueOption = {
    animationDuration: 700,
    grid: { left: 0, right: 2, top: 8, bottom: 22 },
    tooltip: {
        trigger: "axis",
        backgroundColor: "#1E2230",
        borderWidth: 0,
        padding: [6, 10],
        textStyle: { color: "#fff", fontSize: 12 },
        formatter: (params: unknown) => {
            const p = Array.isArray(params) ? params[0] : params;
            const v = Number((p as { data: number }).data);
            const label = (p as { axisValue: string }).axisValue;
            return `${label} · $${v.toLocaleString()}`;
        },
    },
    xAxis: {
        type: "category",
        boundaryGap: false,
        data: REVENUE_HOURS,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
            color: "#A0A6BC",
            fontFamily: MONO,
            fontSize: 10,
            interval: (index: number) => index === 0 || index === 3 || index === 6 || index === 9,
        },
    },
    yAxis: { type: "value", show: false, min: 0, max: 8800 },
    series: [
        {
            type: "line",
            smooth: true,
            symbol: "none",
            data: REVENUE_SERIES,
            lineStyle: { color: "#4F46E5", width: 2.5 },
            itemStyle: { color: "#4F46E5" },
            areaStyle: {
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: "rgba(79,70,229,0.26)" },
                        { offset: 1, color: "rgba(79,70,229,0)" },
                    ],
                },
            },
        },
    ],
};

/** Today's conversion funnel — bar heights [100,56,32,16], rates as labels. */
const funnelOption = {
    animationDuration: 700,
    grid: { left: 0, right: 0, top: 22, bottom: 22 },
    tooltip: {
        trigger: "item",
        backgroundColor: "#1E2230",
        borderWidth: 0,
        padding: [6, 10],
        textStyle: { color: "#fff", fontSize: 12 },
        formatter: (p: unknown) => {
            const d = p as { name: string; data: { rate: string } };
            return `${d.name} · ${d.data.rate}`;
        },
    },
    xAxis: {
        type: "category",
        data: ["Visits", "Product", "Cart", "Paid"],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#8890A8", fontSize: 10 },
    },
    yAxis: { type: "value", show: false, min: 0, max: 112 },
    series: [
        {
            type: "bar",
            barWidth: "56%",
            data: [
                { value: 100, rate: "100%" },
                { value: 56, rate: "45%" },
                { value: 32, rate: "12%" },
                { value: 16, rate: "3.1%" },
            ],
            itemStyle: {
                borderRadius: [7, 7, 0, 0],
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: "#818cf8" },
                        { offset: 1, color: "#4f46e5" },
                    ],
                },
            },
            label: {
                show: true,
                position: "insideTop",
                distance: 6,
                color: "#fff",
                fontFamily: MONO,
                fontSize: 10,
                formatter: (p: unknown) => (p as { data: { rate: string } }).data.rate,
            },
        },
    ],
};

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function Merchant({ style }: { style: Style }) {
    const [orders, setOrders] = useState<Order[]>(ORDERS_INITIAL);
    const [paused, setPaused] = useState(false);

    const seqRef = useRef(ORDERS_INITIAL.length);
    const poolRef = useRef(0);

    /** Deterministic streaming ticker: prepend the next pooled order every
     *  ~3.8s, keep the newest five. Client-only, cleaned up on unmount/pause. */
    useEffect(() => {
        if (paused) {
            return;
        }
        const timer = window.setInterval(() => {
            setOrders((prev) => {
                const next = ORDER_POOL[poolRef.current % ORDER_POOL.length];
                poolRef.current += 1;
                const entry: Order = { ...next, seq: seqRef.current };
                seqRef.current += 1;
                return [entry, ...prev].slice(0, 5);
            });
        }, 3800);
        return () => window.clearInterval(timer);
    }, [paused]);

    return (
        <div className="dbmerchant-root">
            {/* ── Topbar (Navbar) ─────────────────────────────────────────── */}
            <Navbar className="dbmerchant-topbar">
                <Navbar.Brand className="dbmerchant-brand">
                    <span className="dbmerchant-mark" aria-hidden>
                        M
                    </span>
                    <span className="dbmerchant-brand__name">Merchant</span>
                    <span className="dbmerchant-brand__biz">/ Threadline Co.</span>
                </Navbar.Brand>
                <div className="dbmerchant-topbar__right">
                    <span className="dbmerchant-live">
                        <span className="dbmerchant-live__dot" aria-hidden />
                        Live
                    </span>
                    <Badge color="zinc" variant="soft" size="sm" className="dbmerchant-today">
                        Today
                    </Badge>
                </div>
            </Navbar>

            {/* ── Two-column app body ─────────────────────────────────────── */}
            <div className="dbmerchant-body">
                {/* LEFT — live sales focus */}
                <div className="dbmerchant-left">
                    <Card variant="flat" padding="none" className="dbmerchant-hero">
                        <Card.Body className="dbmerchant-hero__body">
                            <Text as="div" className="dbmerchant-eyebrow">
                                Revenue today
                            </Text>
                            <div className="dbmerchant-hero__num">
                                $8,412<span className="dbmerchant-hero__cents">.50</span>
                            </div>
                            <div className="dbmerchant-hero__delta">
                                <Badge color="emerald" variant="soft" size="sm" className="dbmerchant-deltabadge">
                                    <TrendingUp size={12} aria-hidden />
                                    18%
                                </Badge>
                                <Text as="span" className="dbmerchant-hero__ctx">
                                    vs same time yesterday · 214 orders
                                </Text>
                            </div>
                        </Card.Body>
                    </Card>

                    <div className="dbmerchant-revchart">
                        <EChart option={revenueOption} style={{ height: 150, width: "100%" }} />
                    </div>

                    <div className="dbmerchant-feedhead">
                        <Heading as="h2" size="sm" weight="semibold" className="dbmerchant-feedhead__title">
                            Live orders
                        </Heading>
                        <div className="dbmerchant-feedhead__right">
                            <span className="dbmerchant-streaming">{paused ? "paused" : "streaming"}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="dbmerchant-pause"
                                onClick={() => setPaused((p) => !p)}
                                aria-label={paused ? "Resume the live order stream" : "Pause the live order stream"}
                            >
                                {paused ? <Play size={13} aria-hidden /> : <Pause size={13} aria-hidden />}
                                {paused ? "Resume" : "Pause"}
                            </Button>
                        </div>
                    </div>

                    <Timeline animated={false} className="dbmerchant-feed">
                        {orders.map((o, i) => (
                            <Timeline.Item key={o.seq} color="blue" className="dbmerchant-order">
                                <div className="dbmerchant-order__row">
                                    <div className="dbmerchant-order__main">
                                        <span className="dbmerchant-order__item">{o.item}</span>
                                        <span className="dbmerchant-order__sub">
                                            {o.cust} · {o.city}
                                        </span>
                                    </div>
                                    <span className="dbmerchant-order__ago">{AGE_LABELS[i]}</span>
                                    <span className="dbmerchant-order__amt">{o.amt}</span>
                                </div>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                </div>

                {/* RIGHT — funnel + inventory alerts + top sellers */}
                <div className="dbmerchant-right">
                    <Card variant="outlined" padding="none" className="dbmerchant-panel">
                        <Card.Header className="dbmerchant-panel__head">
                            <Heading as="h2" size="sm" weight="semibold" className="dbmerchant-panel__title">
                                Today's funnel
                            </Heading>
                        </Card.Header>
                        <Card.Body className="dbmerchant-panel__body">
                            <EChart option={funnelOption} style={{ height: 128, width: "100%" }} />
                        </Card.Body>
                    </Card>

                    <Card variant="outlined" padding="none" className="dbmerchant-panel">
                        <Card.Header className="dbmerchant-panel__head dbmerchant-panel__head--icon">
                            <AlertTriangle size={15} className="dbmerchant-warn" aria-hidden />
                            <Heading as="h2" size="sm" weight="semibold" className="dbmerchant-panel__title">
                                Low stock
                            </Heading>
                        </Card.Header>
                        <Card.Body className="dbmerchant-panel__body dbmerchant-panel__body--flush">
                            <Table className="dbmerchant-stock">
                                <Table.Body>
                                    {STOCK.map((s) => {
                                        const color = s.pct < 20 ? "#DC2626" : "#EA580C";
                                        return (
                                            <Table.Row key={s.name}>
                                                <Table.Cell className="dbmerchant-stock__name">{s.name}</Table.Cell>
                                                <Table.Cell
                                                    className="dbmerchant-stock__barcell"
                                                    style={{ "--dbm-sbc": color } as CSSProperties}
                                                >
                                                    <Progress value={s.pct} max={100} size="sm" className="dbmerchant-stockbar" />
                                                </Table.Cell>
                                                <Table.Cell className="dbmerchant-stock__left">{s.left} left</Table.Cell>
                                            </Table.Row>
                                        );
                                    })}
                                </Table.Body>
                            </Table>
                        </Card.Body>
                    </Card>

                    <Card variant="outlined" padding="none" className="dbmerchant-panel dbmerchant-panel--grow">
                        <Card.Header className="dbmerchant-panel__head">
                            <Heading as="h2" size="sm" weight="semibold" className="dbmerchant-panel__title">
                                Top sellers today
                            </Heading>
                        </Card.Header>
                        <Card.Body className="dbmerchant-panel__body dbmerchant-panel__body--flush">
                            <Table className="dbmerchant-top">
                                <Table.Body>
                                    {TOP.map((t) => (
                                        <Table.Row key={t.rank}>
                                            <Table.Cell className="dbmerchant-top__rank">{t.rank}</Table.Cell>
                                            <Table.Cell className="dbmerchant-top__name">{t.name}</Table.Cell>
                                            <Table.Cell className="dbmerchant-top__rev">{t.rev}</Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                            <div className="dbmerchant-top__foot">
                                Threadline Co. — a fictional apparel brand, for demonstration · Dashboard{" "}
                                {style.num} / {style.name}
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </div>
    );
}
