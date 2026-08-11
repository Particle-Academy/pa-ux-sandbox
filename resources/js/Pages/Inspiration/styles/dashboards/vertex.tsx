import "./vertex.css";
import { Link } from "@inertiajs/react";
import { useMemo, useState } from "react";
import {
    Avatar,
    Badge,
    Button,
    Card,
    Heading,
    Navbar,
    Table,
    Tabs,
    Text,
} from "@particle-academy/react-fancy";
import { type EChartsOption, EChart, registerAll } from "@particle-academy/fancy-echarts";
import type { Style } from "../../types";

/**
 * Dashboards · Style 11 — Vertex (Crypto & trading, dark).
 *
 * A centered single-column trading console: a slim top bar (gradient "V"
 * wordmark + inline nav + green TX monogram), then two stacked responsive
 * grids — a portfolio-value + area-chart card beside an allocation-donut card,
 * then a Holdings list beside a sparkline Watchlist. Ink-black canvas (#08090C),
 * surface cards (#101319 / #1C2129 hairlines), one green up / red down accent,
 * 11px mono numerics throughout.
 *
 * Built from restyled Fancy primitives: Navbar (brand + nav), Avatar (TX
 * monogram), Card (every panel), Tabs (the 1H..1Y range switcher — controlled,
 * drives the area series live), Table (Holdings + Watchlist), Badge (24h change
 * chips), Button (Deposit CTA), Heading/Text. Every chart surface is a
 * fancy-echarts <EChart>: the portfolio area line (green stroke + vertical
 * gradient fill), the allocation donut (pie w/ inner radius, coin-brand slices),
 * and one minimal sparkline per watchlist row (no axes) — replacing the mockup's
 * raw SVG polylines and its conic-gradient / imperative paint() donut.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "vertex"`. SSR-safe: no
 * browser APIs during render; all series are precomputed deterministically
 * (Math.sin, no Math.random/Date.now); <EChart> mounts a container and inits in
 * an effect. Page is full-bleed under the neutral GalleryFrame (z-index < 30).
 */

/* ── Coin brand palette (glyph + brand color + dark tint) ───────────────── */
const COIN: Record<string, { brand: string; tint: string; glyph: string }> = {
    BTC: { brand: "#F7931A", tint: "#3A2A12", glyph: "₿" },
    ETH: { brand: "#627EEA", tint: "#22283A", glyph: "Ξ" },
    SOL: { brand: "#14F195", tint: "#0F3A2A", glyph: "◎" },
    USDC: { brand: "#2775CA", tint: "#12263A", glyph: "$" },
};

const UP = "#22C55E";
const DOWN = "#EF4444";
const SURFACE = "#101319";

/* ── Mock data (the mockup's DCLogic.renderVals(), verbatim) ────────────── */

const ALLOC = [
    { k: "Bitcoin", v: 48, col: COIN.BTC.brand },
    { k: "Ethereum", v: 28, col: COIN.ETH.brand },
    { k: "Solana", v: 14, col: COIN.SOL.brand },
    { k: "USDC", v: 10, col: COIN.USDC.brand },
];

type Dir = "up" | "down" | "flat";

const HOLDINGS: { sym: keyof typeof COIN; name: string; amt: string; val: string; chg: string; dir: Dir }[] = [
    { sym: "BTC", name: "Bitcoin", amt: "0.62 BTC", val: "$40,422", chg: "+3.1%", dir: "up" },
    { sym: "ETH", name: "Ethereum", amt: "7.4 ETH", val: "$23,580", chg: "+1.8%", dir: "up" },
    { sym: "SOL", name: "Solana", amt: "84 SOL", val: "$11,790", chg: "−2.2%", dir: "down" },
    { sym: "USDC", name: "USD Coin", amt: "8,421 USDC", val: "$8,421", chg: "0.0%", dir: "flat" },
];

/** Deterministic sparkline generator — the mockup's spark(seed, up), inverted
 *  from SVG-y (down-positive) to chart-value (up-positive) so gainers rise. */
function sparkSeries(seed: number, up: boolean): number[] {
    const pts: number[] = [];
    for (let i = 0; i <= 9; i++) {
        const y = 20 - (Math.sin(i * 0.8 + seed) * 6 + 6) + (up ? -i * 0.6 : i * 0.6);
        pts.push(Number((24 - y).toFixed(2)));
    }
    return pts;
}

const WATCH: { tick: string; chg: string; dir: Dir; spark: number[] }[] = [
    { tick: "AVAX", chg: "+5.2%", dir: "up", spark: sparkSeries(1, true) },
    { tick: "MATIC", chg: "+2.1%", dir: "up", spark: sparkSeries(2, true) },
    { tick: "DOGE", chg: "−3.4%", dir: "down", spark: sparkSeries(3, false) },
    { tick: "LINK", chg: "+0.9%", dir: "up", spark: sparkSeries(4, true) },
    { tick: "ADA", chg: "−1.1%", dir: "down", spark: sparkSeries(5, false) },
];

/* ── Range switcher data — 1D is the mockup's exact area path; the others are
 *   deterministic upward walks so switching the range animates the chart. ── */
const RANGES = ["1H", "1D", "1W", "1M", "1Y"] as const;
type Range = (typeof RANGES)[number];

/** 170 − svgY of the mockup's area path (11 points), so higher = higher. */
const DAY_SERIES = [40, 50, 32, 74, 62, 100, 82, 118, 106, 136, 124];

function walk(n: number, seed: number, amp: number, drift: number): number[] {
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
        out.push(Number((60 + Math.sin(i * 0.7 + seed) * amp + i * drift).toFixed(1)));
    }
    return out;
}

const RANGE_SERIES: Record<Range, number[]> = {
    "1H": walk(12, 3, 8, 1.2),
    "1D": DAY_SERIES,
    "1W": walk(7, 1, 14, 6),
    "1M": walk(10, 5, 18, 5),
    "1Y": walk(12, 2, 22, 8),
};

const RANGE_DELTA: Record<Range, { amt: string; pct: string; span: string }> = {
    "1H": { amt: "$312", pct: "0.37%", span: "past hour" },
    "1D": { amt: "$2,104", pct: "2.56%", span: "today" },
    "1W": { amt: "$5,980", pct: "7.64%", span: "this week" },
    "1M": { amt: "$9,140", pct: "12.2%", span: "this month" },
    "1Y": { amt: "$41,650", pct: "97.9%", span: "this year" },
};

/* ── ECharts option builders ────────────────────────────────────────────── */

function areaOption(values: number[]): EChartsOption {
    return {
        grid: { left: 0, right: 0, top: 12, bottom: 0 },
        tooltip: {
            trigger: "axis",
            backgroundColor: "#0B0F14",
            borderColor: "#1C2129",
            borderWidth: 1,
            padding: [6, 9],
            textStyle: { color: "#D8DCE4", fontSize: 11 },
            axisPointer: { lineStyle: { color: "#2A313B" } },
        },
        xAxis: { type: "category", boundaryGap: false, show: false, data: values.map((_, i) => i) },
        yAxis: { type: "value", show: false, scale: true },
        series: [
            {
                type: "line",
                data: values,
                smooth: true,
                showSymbol: false,
                lineStyle: { color: UP, width: 2.5 },
                itemStyle: { color: UP },
                areaStyle: {
                    color: {
                        type: "linear",
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: "rgba(34,197,94,0.30)" },
                            { offset: 1, color: "rgba(34,197,94,0)" },
                        ],
                    },
                },
            },
        ],
    };
}

const donutOption: EChartsOption = {
    tooltip: {
        trigger: "item",
        backgroundColor: "#0B0F14",
        borderColor: "#1C2129",
        borderWidth: 1,
        padding: [6, 9],
        textStyle: { color: "#D8DCE4", fontSize: 11 },
        formatter: "{b} {d}%",
    },
    series: [
        {
            type: "pie",
            radius: ["62%", "100%"],
            center: ["50%", "50%"],
            avoidLabelOverlap: false,
            label: { show: false },
            labelLine: { show: false },
            emphasis: { scale: false },
            itemStyle: { borderColor: SURFACE, borderWidth: 2 },
            data: ALLOC.map((a) => ({ name: a.k, value: a.v, itemStyle: { color: a.col } })),
        },
    ],
};

function sparkOption(values: number[], color: string): EChartsOption {
    return {
        grid: { left: 1, right: 1, top: 3, bottom: 3 },
        xAxis: { type: "category", show: false, boundaryGap: false, data: values.map((_, i) => i) },
        yAxis: { type: "value", show: false, scale: true },
        series: [
            {
                type: "line",
                data: values,
                smooth: true,
                showSymbol: false,
                lineStyle: { color, width: 1.8 },
            },
        ],
    };
}

/* Register every ECharts module once for this bundle entry. */
registerAll();

/* ── 24h change chip — a restyled Badge keyed green / red / grey ─────────── */
function ChgChip({ dir, chg }: { dir: Dir; chg: string }) {
    const color = dir === "up" ? "emerald" : dir === "down" ? "rose" : "zinc";
    return (
        <Badge variant="soft" size="sm" color={color as never} className={`dbvertex-chg dbvertex-chg--${dir}`}>
            {chg}
        </Badge>
    );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function Vertex({ style }: { style: Style }) {
    const [range, setRange] = useState<Range>("1D");

    const chartOption = useMemo<EChartsOption>(() => areaOption(RANGE_SERIES[range]), [range]);
    const delta = RANGE_DELTA[range];

    return (
        <div className="dbvertex-root">
            <div className="dbvertex-shell">
                {/* ── Top bar — restyled Navbar ───────────────────────────── */}
                <Navbar className="dbvertex-nav">
                    <Navbar.Brand className="dbvertex-brandwrap">
                        <Link href="/inspiration/dashboards" className="dbvertex-brand">
                            <span className="dbvertex-mark" aria-hidden>
                                V
                            </span>
                            <span className="dbvertex-brand__name">Vertex</span>
                        </Link>
                    </Navbar.Brand>
                    <Navbar.Items className="dbvertex-navitems">
                        <span className="dbvertex-navlink dbvertex-navlink--active">Portfolio</span>
                        <span className="dbvertex-navlink">Markets</span>
                        <span className="dbvertex-navlink">Trade</span>
                        <span className="dbvertex-navlink">Earn</span>
                        <Button size="sm" className="dbvertex-deposit">
                            Deposit
                        </Button>
                        <Avatar fallback="TX" size="sm" className="dbvertex-avatar" />
                    </Navbar.Items>
                </Navbar>

                {/* ── Row 1 — portfolio value + allocation ─────────────────── */}
                <div className="dbvertex-grid dbvertex-grid--top">
                    {/* Portfolio value + area chart */}
                    <Card variant="outlined" padding="none" className="dbvertex-card dbvertex-portfolio">
                        <Card.Header className="dbvertex-phead">
                            <div className="dbvertex-value">
                                <span className="dbvertex-value__label">Portfolio value</span>
                                <span className="dbvertex-value__num">$84,213.40</span>
                                <span className="dbvertex-value__delta">
                                    <span className="dbvertex-tri" aria-hidden>
                                        {"▲"}
                                    </span>
                                    {delta.amt} ({delta.pct}) {delta.span}
                                </span>
                            </div>
                            {/* Range switcher — controlled Tabs drives the series */}
                            <Tabs
                                activeTab={range}
                                onTabChange={(t) => setRange(t as Range)}
                                className="dbvertex-ranges"
                            >
                                <Tabs.List className="dbvertex-ranges__list">
                                    {RANGES.map((r) => (
                                        <Tabs.Tab key={r} value={r}>
                                            {r}
                                        </Tabs.Tab>
                                    ))}
                                </Tabs.List>
                            </Tabs>
                        </Card.Header>
                        <Card.Body className="dbvertex-pbody">
                            <EChart option={chartOption} style={{ width: "100%", height: 176 }} />
                        </Card.Body>
                    </Card>

                    {/* Allocation donut + legend */}
                    <Card variant="outlined" padding="none" className="dbvertex-card dbvertex-alloc">
                        <Card.Header className="dbvertex-chead">
                            <Heading as="h2" size="sm" weight="semibold" className="dbvertex-ctitle">
                                Allocation
                            </Heading>
                        </Card.Header>
                        <Card.Body className="dbvertex-abody">
                            <div className="dbvertex-donut">
                                <EChart option={donutOption} style={{ width: 116, height: 116 }} />
                            </div>
                            <ul className="dbvertex-legend">
                                {ALLOC.map((a) => (
                                    <li key={a.k} className="dbvertex-legend__row">
                                        <span
                                            className="dbvertex-legend__dot"
                                            style={{ background: a.col }}
                                            aria-hidden
                                        />
                                        <span className="dbvertex-legend__name">{a.k}</span>
                                        <span className="dbvertex-legend__pct">{a.v}%</span>
                                    </li>
                                ))}
                            </ul>
                        </Card.Body>
                    </Card>
                </div>

                {/* ── Row 2 — holdings + watchlist ─────────────────────────── */}
                <div className="dbvertex-grid dbvertex-grid--bottom">
                    {/* Holdings */}
                    <Card variant="outlined" padding="none" className="dbvertex-card dbvertex-list">
                        <Card.Header className="dbvertex-chead">
                            <Heading as="h2" size="sm" weight="semibold" className="dbvertex-ctitle">
                                Holdings
                            </Heading>
                        </Card.Header>
                        <Card.Body className="dbvertex-listbody">
                            <Table className="dbvertex-table">
                                <Table.Head>
                                    <Table.Column label="Asset" />
                                    <Table.Column label="Value" />
                                    <Table.Column label="24h" />
                                </Table.Head>
                                <Table.Body>
                                    {HOLDINGS.map((h) => {
                                        const c = COIN[h.sym];
                                        return (
                                            <Table.Row key={h.sym} className="dbvertex-row">
                                                <Table.Cell className="dbvertex-asset">
                                                    <span
                                                        className="dbvertex-coin"
                                                        style={{ background: c.tint, color: c.brand }}
                                                        aria-hidden
                                                    >
                                                        {c.glyph}
                                                    </span>
                                                    <span className="dbvertex-asset__meta">
                                                        <span className="dbvertex-asset__name">{h.name}</span>
                                                        <span className="dbvertex-asset__amt">{h.amt}</span>
                                                    </span>
                                                </Table.Cell>
                                                <Table.Cell className="dbvertex-cell-val">{h.val}</Table.Cell>
                                                <Table.Cell className="dbvertex-cell-chg">
                                                    <ChgChip dir={h.dir} chg={h.chg} />
                                                </Table.Cell>
                                            </Table.Row>
                                        );
                                    })}
                                </Table.Body>
                            </Table>
                        </Card.Body>
                    </Card>

                    {/* Watchlist */}
                    <Card variant="outlined" padding="none" className="dbvertex-card dbvertex-list">
                        <Card.Header className="dbvertex-chead">
                            <Heading as="h2" size="sm" weight="semibold" className="dbvertex-ctitle">
                                Watchlist
                            </Heading>
                        </Card.Header>
                        <Card.Body className="dbvertex-listbody">
                            <Table className="dbvertex-table dbvertex-table--watch">
                                <Table.Head>
                                    <Table.Column label="Ticker" />
                                    <Table.Column label="Trend" />
                                    <Table.Column label="24h" />
                                </Table.Head>
                                <Table.Body>
                                    {WATCH.map((w) => (
                                        <Table.Row key={w.tick} className="dbvertex-row">
                                            <Table.Cell className="dbvertex-ticker">{w.tick}</Table.Cell>
                                            <Table.Cell className="dbvertex-cell-spark">
                                                <div className="dbvertex-spark">
                                                    <EChart
                                                        option={sparkOption(w.spark, w.dir === "down" ? DOWN : UP)}
                                                        style={{ width: 80, height: 22 }}
                                                    />
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell className="dbvertex-cell-chg">
                                                <ChgChip dir={w.dir} chg={w.chg} />
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </Card.Body>
                    </Card>
                </div>

                {/* ── Colophon ─────────────────────────────────────────────── */}
                <footer className="dbvertex-foot">
                    <Text as="span" size="xs" className="dbvertex-foot__note">
                        Vertex — a fictional trading dashboard, for demonstration · App {style.num} / {style.name} ·
                        every surface is a restyled Fancy UI primitive
                    </Text>
                    <Link href="/inspiration/dashboards" className="dbvertex-foot__back">
                        Back to the gallery
                    </Link>
                </footer>
            </div>
        </div>
    );
}
