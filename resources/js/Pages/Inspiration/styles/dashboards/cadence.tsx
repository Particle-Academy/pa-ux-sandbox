import "./cadence.css";
import { Link } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import {
    Avatar,
    Badge,
    Button,
    Card,
    Heading,
    Input,
    Progress,
    Separator,
    Sidebar,
    Text,
    Tooltip,
} from "@particle-academy/react-fancy";
import { type EChartsOption, EChart, registerAll } from "@particle-academy/fancy-echarts";
import { CalendarClock, PenLine, Search, Send } from "lucide-react";
import type { Style } from "../../types";

// registerAll() wires every ECharts chart + component module once at module
// load so <EChart> can render any series type. Safe to call repeatedly.
registerAll();

/**
 * Dashboards · Style 08 — Cadence (email marketing admin, light).
 *
 * An email campaign console rendered as a master–detail app shell built almost
 * entirely from restyled Fancy primitives: a fixed 300px <Sidebar> master
 * (gradient <Avatar> brand mark + a controlled search <Input> + selectable
 * <Sidebar.Item> campaign rows with a status dot and an expand-on-select
 * open/click readout) beside a scrolling detail column — a sticky topbar
 * carrying a <Tooltip>+<Badge> send-status pill, a 4-up KPI row of <Card>s, an
 * "Opens since send" fancy-echarts <EChart> area chart beside a ranked
 * <Progress>-bar link list, and a full-width deliverability <Card> of mini
 * <Card> stat tiles. Scheduled/draft campaigns swap the detail for a pending
 * panel (<Card> + <Button>s).
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "cadence"`. SSR-safe: no
 * browser APIs during render, all data static (the "48 hours since send" window
 * is fixed mock data, never the wall clock), the <EChart> is gated to a
 * client-only mount to avoid a canvas hydration mismatch, and every timer lives
 * in a cleaned-up effect. Page sticky sits at z-index 2, under the gallery
 * frame's 30.
 */

/* ── Palette (the mockup's exact colors) ────────────────────────────────── */

const VIOLET = "#7C3AED";
const SKY = "#38BDF8";
const GREEN = "#0F9D58";
const INK = "#1F1B2E";
const AMBER = "#F59E0B";
const RED = "#EF4444";

/** Campaign status → dot color (the mockup's {data-cst} lookup). */
const DOT: Record<Stat, string> = {
    sent: GREEN,
    scheduled: VIOLET,
    draft: "#C4BCD6",
};

/* ── Types ──────────────────────────────────────────────────────────────── */

type Stat = "sent" | "scheduled" | "draft";

type Campaign = { id: string; name: string; meta: string; stat: Stat };

type Kpi = { k: string; v: string; sub: string; col: string };
type LinkRow = { url: string; clicks: string; pct: number };
type Deliv = { k: string; v: string; col: string };

type SentDetail = {
    kind: "sent";
    statusLabel: string;
    topMeta: string;
    inlineOpen: string;
    inlineClick: string;
    tip: string;
    kpis: Kpi[];
    /** [hour-since-send, opens-in-that-hour] over the first 48h. */
    opens: [number, number][];
    links: LinkRow[];
    deliv: Deliv[];
};

type PendingDetail = {
    kind: "scheduled" | "draft";
    statusLabel: string;
    topMeta: string;
    tip: string;
    headline: string;
    body: string;
    subject: string;
    primary: string;
    secondary: string;
    icon: "clock" | "pen";
};

type Detail = SentDetail | PendingDetail;

/* ── Data (the mockup's renderVals(), preserved verbatim for Summer Sale) ── */

const CAMPAIGNS: Campaign[] = [
    { id: "summer-sale", name: "Summer Sale — 30% off", meta: "Sent Jul 3 · 46.9k", stat: "sent" },
    { id: "july-newsletter", name: "July Newsletter", meta: "Sent Jul 1 · 48.1k", stat: "sent" },
    { id: "product-launch", name: "Product launch teaser", meta: "Scheduled Jul 9", stat: "scheduled" },
    { id: "win-back", name: "Win-back series", meta: "Sent Jun 28 · 12.4k", stat: "sent" },
    { id: "august-preview", name: "August preview", meta: "Draft", stat: "draft" },
    { id: "vip-early", name: "VIP early access", meta: "Draft", stat: "draft" },
];

const DETAILS: Record<string, Detail> = {
    "summer-sale": {
        kind: "sent",
        statusLabel: "Sent",
        topMeta: "Jul 3 · 46,880 recipients",
        inlineOpen: "51%",
        inlineClick: "11%",
        tip: "Delivered Jul 3 · 9:02 AM CT",
        kpis: [
            { k: "Open rate", v: "51%", sub: "23,908 opens", col: VIOLET },
            { k: "Click rate", v: "11%", sub: "5,157 clicks", col: SKY },
            { k: "Revenue", v: "$18.4k", sub: "attributed", col: GREEN },
            { k: "Unsubs", v: "0.2%", sub: "94 total", col: INK },
        ],
        opens: [
            [0, 40], [2, 1800], [4, 2600], [6, 2200], [8, 1650], [10, 1250],
            [12, 980], [16, 640], [20, 440], [24, 320], [30, 220], [36, 150], [42, 110], [48, 85],
        ],
        links: [
            { url: "/sale/overshirt", clicks: "2,104", pct: 100 },
            { url: "/sale/trousers", clicks: "1,388", pct: 66 },
            { url: "/new-arrivals", clicks: "842", pct: 40 },
            { url: "/gift-cards", clicks: "410", pct: 20 },
        ],
        deliv: [
            { k: "Delivered", v: "96%", col: GREEN },
            { k: "Bounced", v: "2.8%", col: SKY },
            { k: "Spam", v: "0.9%", col: AMBER },
            { k: "Failed", v: "0.3%", col: RED },
        ],
    },
    "july-newsletter": {
        kind: "sent",
        statusLabel: "Sent",
        topMeta: "Jul 1 · 48,120 recipients",
        inlineOpen: "44%",
        inlineClick: "8%",
        tip: "Delivered Jul 1 · 7:30 AM CT",
        kpis: [
            { k: "Open rate", v: "44%", sub: "21,173 opens", col: VIOLET },
            { k: "Click rate", v: "8%", sub: "3,850 clicks", col: SKY },
            { k: "Revenue", v: "$9.2k", sub: "attributed", col: GREEN },
            { k: "Unsubs", v: "0.3%", sub: "144 total", col: INK },
        ],
        opens: [
            [0, 30], [2, 1500], [4, 2200], [6, 1850], [8, 1400], [10, 1050],
            [12, 820], [16, 540], [20, 380], [24, 270], [30, 180], [36, 130], [42, 95], [48, 70],
        ],
        links: [
            { url: "/blog/summer-styling", clicks: "1,902", pct: 100 },
            { url: "/new-arrivals", clicks: "1,204", pct: 63 },
            { url: "/account", clicks: "631", pct: 33 },
            { url: "/lookbook", clicks: "208", pct: 11 },
        ],
        deliv: [
            { k: "Delivered", v: "97%", col: GREEN },
            { k: "Bounced", v: "2.1%", col: SKY },
            { k: "Spam", v: "0.6%", col: AMBER },
            { k: "Failed", v: "0.3%", col: RED },
        ],
    },
    "win-back": {
        kind: "sent",
        statusLabel: "Sent",
        topMeta: "Jun 28 · 12,380 recipients",
        inlineOpen: "38%",
        inlineClick: "14%",
        tip: "Delivered Jun 28 · 11:00 AM CT",
        kpis: [
            { k: "Open rate", v: "38%", sub: "4,704 opens", col: VIOLET },
            { k: "Click rate", v: "14%", sub: "1,733 clicks", col: SKY },
            { k: "Revenue", v: "$6.1k", sub: "attributed", col: GREEN },
            { k: "Unsubs", v: "0.9%", sub: "111 total", col: INK },
        ],
        opens: [
            [0, 12], [2, 520], [4, 760], [6, 650], [8, 480], [10, 360],
            [12, 280], [16, 180], [20, 120], [24, 90], [30, 60], [36, 44], [42, 32], [48, 24],
        ],
        links: [
            { url: "/comeback-15", clicks: "980", pct: 100 },
            { url: "/best-sellers", clicks: "517", pct: 53 },
            { url: "/account/reactivate", clicks: "286", pct: 29 },
            { url: "/help/center", clicks: "94", pct: 10 },
        ],
        deliv: [
            { k: "Delivered", v: "94%", col: GREEN },
            { k: "Bounced", v: "3.8%", col: SKY },
            { k: "Spam", v: "1.5%", col: AMBER },
            { k: "Failed", v: "0.7%", col: RED },
        ],
    },
    "product-launch": {
        kind: "scheduled",
        statusLabel: "Scheduled",
        topMeta: "Sends Jul 9 · 51,200 recipients",
        tip: "Queued to send Jul 9 · 8:00 AM CT",
        headline: "Scheduled to send in 2 days",
        body: "The teaser is built and queued. Metrics unlock the moment it leaves the outbox — open and click tracking start on delivery.",
        subject: "Something new is coming ↝",
        primary: "Send now",
        secondary: "Edit campaign",
        icon: "clock",
    },
    "august-preview": {
        kind: "draft",
        statusLabel: "Draft",
        topMeta: "Not scheduled",
        tip: "Last edited Jul 5 · autosaved",
        headline: "This campaign is still a draft",
        body: "Nothing has been sent yet, so there are no opens, clicks, or revenue to report. Pick up where you left off, then schedule a send.",
        subject: "A first look at August",
        primary: "Continue editing",
        secondary: "Schedule send",
        icon: "pen",
    },
    "vip-early": {
        kind: "draft",
        statusLabel: "Draft",
        topMeta: "Not scheduled",
        tip: "Last edited Jul 4 · autosaved",
        headline: "This campaign is still a draft",
        body: "An early-access invite for VIP subscribers. Finish the copy and choose a segment, then schedule it to unlock live performance.",
        subject: "You're on the list — early access inside",
        primary: "Continue editing",
        secondary: "Schedule send",
        icon: "pen",
    },
};

const AXIS = ["0h", "12h", "24h", "48h"];
const CHART_H = 168;

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function Cadence({ style }: { style: Style }) {
    /** Master–detail selection (the mockup's {data-sel} / {c.on}). */
    const [selectedId, setSelectedId] = useState("summer-sale");
    /** Controlled campaign search (functional filter over the master list). */
    const [query, setQuery] = useState("");
    /** Gate the canvas chart to the client so SSR + hydrate agree. */
    const [mounted, setMounted] = useState(false);
    /** Drives the Progress bars filling in from 0 on select (the {data-bar} paint). */
    const [filled, setFilled] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Re-run the bar fill-in whenever the selected campaign changes.
    useEffect(() => {
        setFilled(false);
        const t = window.setTimeout(() => setFilled(true), 80);
        return () => window.clearTimeout(t);
    }, [selectedId]);

    const detail = DETAILS[selectedId] ?? DETAILS["summer-sale"];
    const selected = CAMPAIGNS.find((c) => c.id === selectedId) ?? CAMPAIGNS[0];

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return CAMPAIGNS;
        return CAMPAIGNS.filter((c) => c.name.toLowerCase().includes(q));
    }, [query]);

    const opensOption = useMemo<EChartsOption | null>(
        () =>
            detail.kind === "sent"
                ? {
                      animationDuration: 700,
                      grid: { left: 0, right: 0, top: 8, bottom: 6 },
                      tooltip: {
                          trigger: "axis",
                          backgroundColor: "#fff",
                          borderColor: "#ECE9F5",
                          borderWidth: 1,
                          padding: [6, 10],
                          textStyle: { color: INK, fontSize: 11 },
                          formatter: (p: unknown) => {
                              const arr = p as Array<{ value: [number, number] }>;
                              const [h, v] = arr[0].value;
                              return `${h}h since send<br/><b>${v.toLocaleString()}</b> opens`;
                          },
                      },
                      xAxis: { type: "value", min: 0, max: 48, show: false },
                      yAxis: { type: "value", show: false },
                      series: [
                          {
                              type: "line",
                              smooth: true,
                              showSymbol: false,
                              data: detail.opens,
                              lineStyle: { color: VIOLET, width: 2.5 },
                              itemStyle: { color: VIOLET },
                              areaStyle: {
                                  color: {
                                      type: "linear",
                                      x: 0,
                                      y: 0,
                                      x2: 0,
                                      y2: 1,
                                      colorStops: [
                                          { offset: 0, color: "rgba(124,58,237,0.26)" },
                                          { offset: 1, color: "rgba(124,58,237,0)" },
                                      ],
                                  },
                              },
                          },
                      ],
                  }
                : null,
        [detail],
    );

    return (
        <div className="dbcadence-root">
            <div className="dbcadence-app">
                {/* ── MASTER — campaign list ──────────────────────────────── */}
                <Sidebar className="dbcadence-master">
                    <div className="dbcadence-brand">
                        <Link href="/inspiration/dashboards" className="dbcadence-brand__link" aria-label="Cadence — back to dashboards">
                            <Avatar fallback="C" size="sm" className="dbcadence-mark" />
                            <span className="dbcadence-brand__name">Cadence</span>
                        </Link>
                    </div>

                    <div className="dbcadence-search">
                        <Input
                            type="search"
                            value={query}
                            onValueChange={setQuery}
                            placeholder="Search campaigns"
                            leading={<Search size={14} />}
                            aria-label="Search campaigns"
                            className="dbcadence-search__input"
                        />
                    </div>

                    <div className="dbcadence-clist">
                        {visible.map((c) => {
                            const on = c.id === selectedId;
                            const d = DETAILS[c.id];
                            return (
                                <Sidebar.Item
                                    key={c.id}
                                    active={on}
                                    onClick={() => setSelectedId(c.id)}
                                    className={"dbcadence-crow" + (on ? " is-sel" : "")}
                                >
                                    <span className="dbcadence-crow__top">
                                        <span className="dbcadence-crow__name">{c.name}</span>
                                        <span className="dbcadence-crow__dot" style={{ background: DOT[c.stat] }} aria-hidden />
                                    </span>
                                    <span className="dbcadence-crow__meta">{c.meta}</span>
                                    {on && d && d.kind === "sent" && (
                                        <span className="dbcadence-crow__stats">
                                            <span className="dbcadence-crow__open">{d.inlineOpen} open</span>
                                            <span className="dbcadence-crow__click">{d.inlineClick} click</span>
                                        </span>
                                    )}
                                    {on && d && d.kind !== "sent" && (
                                        <span className="dbcadence-crow__stats">
                                            <span className="dbcadence-crow__pending">{d.statusLabel}</span>
                                        </span>
                                    )}
                                </Sidebar.Item>
                            );
                        })}
                        {visible.length === 0 && (
                            <div className="dbcadence-empty">No campaigns match “{query}”.</div>
                        )}
                    </div>
                </Sidebar>

                {/* ── DETAIL — selected campaign ──────────────────────────── */}
                <div className="dbcadence-detail">
                    <header className="dbcadence-topbar">
                        <span className="dbcadence-topbar__title">{selected.name}</span>
                        <Tooltip content={detail.tip}>
                            <Badge
                                size="sm"
                                variant="soft"
                                className={"dbcadence-status dbcadence-status--" + detail.kind}
                            >
                                {detail.statusLabel}
                            </Badge>
                        </Tooltip>
                        <span className="dbcadence-topbar__meta">{detail.topMeta}</span>
                    </header>

                    {detail.kind === "sent" ? (
                        <div className="dbcadence-body">
                            {/* KPI row */}
                            <div className="dbcadence-kpis">
                                {detail.kpis.map((k) => (
                                    <Card key={k.k} variant="outlined" padding="none" className="dbcadence-kpi">
                                        <Card.Body className="dbcadence-kpi__body">
                                            <span className="dbcadence-kpi__k">{k.k}</span>
                                            <span className="dbcadence-kpi__v" style={{ color: k.col }}>{k.v}</span>
                                            <span className="dbcadence-kpi__sub">{k.sub}</span>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </div>

                            {/* Chart + ranked links */}
                            <div className="dbcadence-two">
                                <Card variant="outlined" padding="none" className="dbcadence-panel">
                                    <Card.Body className="dbcadence-panel__body">
                                        <div className="dbcadence-panel__title">Opens since send</div>
                                        <div className="dbcadence-panel__sub">First 48 hours</div>
                                        <div className="dbcadence-chart" style={{ height: CHART_H }}>
                                            {mounted && opensOption ? (
                                                <EChart option={opensOption} style={{ height: CHART_H, width: "100%" }} />
                                            ) : (
                                                <div className="dbcadence-chart__ph" style={{ height: CHART_H }} aria-hidden />
                                            )}
                                        </div>
                                        <div className="dbcadence-axis">
                                            {AXIS.map((h) => (
                                                <span key={h}>{h}</span>
                                            ))}
                                        </div>
                                    </Card.Body>
                                </Card>

                                <Card variant="outlined" padding="none" className="dbcadence-panel">
                                    <Card.Body className="dbcadence-panel__body">
                                        <div className="dbcadence-panel__title">Top clicked links</div>
                                        <div className="dbcadence-links">
                                            {detail.links.map((l) => (
                                                <div key={l.url} className="dbcadence-link">
                                                    <div className="dbcadence-link__row">
                                                        <span className="dbcadence-link__url">{l.url}</span>
                                                        <span className="dbcadence-link__n">{l.clicks}</span>
                                                    </div>
                                                    <Progress
                                                        value={filled ? l.pct : 0}
                                                        max={100}
                                                        size="sm"
                                                        color="blue"
                                                        className="dbcadence-linkbar"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </div>

                            {/* Deliverability */}
                            <Card variant="outlined" padding="none" className="dbcadence-panel">
                                <Card.Body className="dbcadence-panel__body">
                                    <div className="dbcadence-panel__title">Deliverability</div>
                                    <div className="dbcadence-deliv">
                                        {detail.deliv.map((d) => (
                                            <Card key={d.k} variant="flat" padding="none" className="dbcadence-mini">
                                                <span className="dbcadence-mini__v" style={{ color: d.col }}>{d.v}</span>
                                                <span className="dbcadence-mini__k">{d.k}</span>
                                            </Card>
                                        ))}
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    ) : (
                        <div className="dbcadence-body">
                            <Card variant="outlined" padding="none" className="dbcadence-panel dbcadence-pending">
                                <Card.Body className="dbcadence-pending__body">
                                    <span className={"dbcadence-pending__icon dbcadence-pending__icon--" + detail.kind}>
                                        {detail.icon === "clock" ? <CalendarClock size={22} /> : <PenLine size={22} />}
                                    </span>
                                    <Heading as="h2" size="lg" weight="semibold" className="dbcadence-pending__h">
                                        {detail.headline}
                                    </Heading>
                                    <Text as="p" className="dbcadence-pending__p">
                                        {detail.body}
                                    </Text>
                                    <div className="dbcadence-pending__subject">
                                        <span className="dbcadence-pending__label">Subject</span>
                                        <span className="dbcadence-pending__value">{detail.subject}</span>
                                    </div>
                                    <Separator className="dbcadence-pending__sep" />
                                    <div className="dbcadence-pending__actions">
                                        <Button size="sm" className="dbcadence-btn dbcadence-btn--primary">
                                            <span className="dbcadence-btn__ico">
                                                {detail.icon === "clock" ? <Send size={14} /> : <PenLine size={14} />}
                                            </span>
                                            {detail.primary}
                                        </Button>
                                        <Button size="sm" variant="ghost" className="dbcadence-btn dbcadence-btn--ghost">
                                            {detail.secondary}
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            <div className="dbcadence-foot">
                Cadence — a fictional email marketing console, for demonstration · Dashboard {style.num} /{" "}
                {style.name} · every surface is a restyled Fancy UI primitive
            </div>
        </div>
    );
}
