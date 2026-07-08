import "./amplify.css";
import { Link } from "@inertiajs/react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
import { EChart, registerAll } from "@particle-academy/fancy-echarts";
import type { EChartsOption } from "@particle-academy/fancy-echarts";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Style } from "../../types";

/**
 * Dashboards · Style 20 — Amplify (social-media manager, light).
 *
 * A near-white lavender content-scheduling console for a fictional social team:
 * a slim 52px <Navbar> (gradient "A" mark + a controlled <Tabs> view switcher +
 * channel <Avatar> chips + a magenta Compose <Button>) over a 1fr / 320px body.
 * The centerpiece is a week-at-a-glance content calendar — a hand-rolled
 * 7-column grid shell whose every post is a restyled <Card> (channel-colored 3px
 * left border via a `--chan` CSS var, a channel <Avatar>, a mono timestamp, and
 * a "Published" <Badge>). The right rail stacks a 2x2 grid of KPI <Card>s (green
 * delta <Badge>s), a fancy-echarts <EChart> follower-growth area sparkline, and
 * a Top-post <Card> with metric <Badge> chips.
 *
 * The <Tabs> switcher drives a controlled `view` state: Calendar (the week
 * grid), Queue (a flattened <Table> of every scheduled post), and Analytics
 * (an <EChart> area + an <EChart> horizontal bar + a top-posts <Table>). Three
 * <EChart>s total, each mounted client-only behind a `mounted` flag so ECharts
 * never touches the SSR pass and no hydration mismatch occurs.
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "amplify"`. SSR-safe: no
 * browser APIs during render, the "today" flag + week range are static data (no
 * Date.now()/Math.random() in render), all series are precomputed
 * deterministically. Every restyle is scoped under `.dbamplify-root` with
 * `dbamplify-` classes; the sticky header sits at z-index 10, under the gallery
 * frame's 30.
 */

/* ── ECharts modules — register once at module load ─────────────────────── */
registerAll();

/* ── Channel brand palette (chip label + background + card-accent) ───────── */
type ChanKey = "ig" | "x" | "tt" | "yt";

const CHAN: Record<ChanKey, { label: string; name: string; color: string; border: string }> = {
    ig: { label: "IG", name: "Instagram", color: "#E1306C", border: "#E1306C" },
    x: { label: "X", name: "X", color: "#111111", border: "#333333" },
    tt: { label: "TT", name: "TikTok", color: "#000000", border: "#000000" },
    yt: { label: "YT", name: "YouTube", color: "#FF0000", border: "#FF0000" },
};

const CHANNELS: ChanKey[] = ["ig", "x", "tt", "yt"];

/* ── View switcher ──────────────────────────────────────────────────────── */
const VIEWS = ["Calendar", "Queue", "Analytics"] as const;
type View = (typeof VIEWS)[number];

/* ── Mock data (the mockup's DCLogic.renderVals(), recreated verbatim) ───── */

type Kpi = { k: string; v: string; delta: string };

const KPIS: Kpi[] = [
    { k: "Followers", v: "284k", delta: "▲ 12.4k" },
    { k: "Engagement", v: "6.8%", delta: "▲ 0.9%" },
    { k: "Impressions", v: "4.2M", delta: "▲ 18%" },
    { k: "Posts", v: "48", delta: "12 queued" },
];

type Post = { chan: ChanKey; time: string; text: string; live: boolean };
type Day = { dow: string; date: string; today: boolean; posts: Post[] };

const DAYS: Day[] = [
    {
        dow: "Mon",
        date: "7",
        today: true,
        posts: [
            { chan: "ig", time: "9:00a", text: "Monday moodboard", live: true },
            { chan: "x", time: "2:00p", text: "Restock this week", live: false },
        ],
    },
    {
        dow: "Tue",
        date: "8",
        today: false,
        posts: [{ chan: "tt", time: "12:00p", text: "3 ways to style linen", live: false }],
    },
    {
        dow: "Wed",
        date: "9",
        today: false,
        posts: [
            { chan: "ig", time: "5:00p", text: "BTS: summer shoot", live: false },
            { chan: "yt", time: "6:00p", text: "Studio tour", live: false },
        ],
    },
    {
        dow: "Thu",
        date: "10",
        today: false,
        posts: [{ chan: "x", time: "10:00a", text: "Founder Q&A thread", live: false }],
    },
    {
        dow: "Fri",
        date: "11",
        today: false,
        posts: [
            { chan: "ig", time: "11:00a", text: "New drop teaser", live: false },
            { chan: "tt", time: "4:00p", text: "Unboxing reel", live: false },
        ],
    },
    {
        dow: "Sat",
        date: "12",
        today: false,
        posts: [{ chan: "ig", time: "1:00p", text: "Customer feature", live: false }],
    },
    { dow: "Sun", date: "13", today: false, posts: [] },
];

/** Flattened schedule for the Queue view — every post, in week order. */
const QUEUE: (Post & { day: string })[] = DAYS.flatMap((d) =>
    d.posts.map((p) => ({ ...p, day: `${d.dow} ${d.date}` })),
);

/** Follower-growth curve — the mockup's 7-point SVG path, inverted so it rises
 *  (value = 80 − svgY of each vertex). Sparkline-style, no axes. */
const FOLLOWERS = [16, 22, 20, 36, 32, 54, 64];

/** A deterministic 28-day audience-growth walk for the Analytics area chart —
 *  Math.sin only (no random), climbing from ~271k to ~284k. */
const GROWTH_28: number[] = (() => {
    const out: number[] = [];
    let base = 270.5;
    for (let i = 0; i < 28; i++) {
        base += 0.34 + Math.sin(i * 0.55) * 0.16 + i * 0.006;
        out.push(Number(base.toFixed(1)));
    }
    return out;
})();

/** Reach by channel (thousands) — sums to the 4.2M impressions KPI. */
const REACH: { chan: ChanKey; v: number }[] = [
    { chan: "ig", v: 1800 },
    { chan: "tt", v: 1200 },
    { chan: "x", v: 640 },
    { chan: "yt", v: 560 },
];

/** Top posts this week (Analytics table) — the rail's hero plus runners-up. */
const TOP_POSTS: { chan: ChanKey; when: string; text: string; likes: string; shares: string; rate: string }[] = [
    { chan: "tt", when: "Tue", text: "POV: linen season", likes: "88k", shares: "6.2k", rate: "14%" },
    { chan: "ig", when: "Mon", text: "Monday moodboard", likes: "41k", shares: "2.1k", rate: "9.4%" },
    { chan: "ig", when: "Fri", text: "New drop teaser", likes: "33k", shares: "1.8k", rate: "8.1%" },
    { chan: "yt", when: "Wed", text: "Studio tour", likes: "27k", shares: "1.2k", rate: "6.7%" },
];

/* ── ECharts option builders ────────────────────────────────────────────── */

const TIP = {
    backgroundColor: "#FFFFFF",
    borderColor: "#ECE8F2",
    borderWidth: 1,
    padding: [6, 9] as [number, number],
    textStyle: { color: "#1E1B2E", fontSize: 11 },
};

/** Rail sparkline (h80) or Analytics hero (h220): magenta stroke + vertical
 *  fuchsia gradient fill, axes hidden. */
function followerArea(values: number[], big: boolean): EChartsOption {
    return {
        grid: { left: big ? 6 : 0, right: big ? 6 : 0, top: 8, bottom: big ? 4 : 0 },
        tooltip: { trigger: "axis", ...TIP, axisPointer: { lineStyle: { color: "#ECE8F2" } } },
        xAxis: { type: "category", boundaryGap: false, show: false, data: values.map((_, i) => i) },
        yAxis: { type: "value", show: false, scale: true },
        series: [
            {
                type: "line",
                data: values,
                smooth: true,
                showSymbol: false,
                lineStyle: { color: "#C026D3", width: 2 },
                itemStyle: { color: "#C026D3" },
                areaStyle: {
                    color: {
                        type: "linear",
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: "rgba(192,38,211,0.24)" },
                            { offset: 1, color: "rgba(192,38,211,0)" },
                        ],
                    },
                },
            },
        ],
    };
}

/** Reach-by-channel horizontal bar — brand-colored, rounded caps. */
const reachOption: EChartsOption = {
    grid: { left: 4, right: 12, top: 6, bottom: 2, containLabel: true },
    tooltip: {
        trigger: "axis",
        ...TIP,
        axisPointer: { type: "shadow", shadowStyle: { color: "rgba(192,38,211,0.06)" } },
    },
    xAxis: { type: "value", show: false, max: 2000 },
    yAxis: {
        type: "category",
        inverse: true,
        data: REACH.map((r) => CHAN[r.chan].name),
        axisLabel: { color: "#5B5470", fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
    },
    series: [
        {
            type: "bar",
            barWidth: "52%",
            data: REACH.map((r) => ({
                value: r.v,
                itemStyle: { color: CHAN[r.chan].color, borderRadius: [0, 5, 5, 0] },
            })),
            label: {
                show: true,
                position: "right",
                formatter: (p) => `${((p.value as number) / 1000).toFixed(1)}M`,
                color: "#9089A6",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
            },
        },
    ],
};

/* ── Small building blocks (all restyled Fancy primitives) ──────────────── */

/** Channel chip — a restyled <Avatar>; brand background + label via scoped CSS. */
function ChanChip({ chan, kind }: { chan: ChanKey; kind: "hdr" | "post" | "top" }) {
    return (
        <Avatar
            fallback={CHAN[chan].label}
            size="sm"
            className={`dbamplify-chip dbamplify-chip--${chan} dbamplify-chip--${kind}`}
        />
    );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function Amplify({ style }: { style: Style }) {
    /** Controlled view (Calendar active by default, per the mockup). */
    const [view, setView] = useState<View>("Calendar");
    /** Client-only mount flag — gates every <EChart> so SSR emits a stable
     *  placeholder and no hydration mismatch occurs. */
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const railChart = useMemo(() => followerArea(FOLLOWERS, false), []);
    const growthChart = useMemo(() => followerArea(GROWTH_28, true), []);

    return (
        <div className="dbamplify-root">
            {/* ── Top header — restyled Navbar ─────────────────────────────── */}
            <Navbar className="dbamplify-topbar">
                <Navbar.Brand className="dbamplify-leftzone">
                    <Link href="/inspiration/dashboards" className="dbamplify-brand">
                        <span className="dbamplify-mark" aria-hidden>
                            A
                        </span>
                        <span className="dbamplify-brand__word">Amplify</span>
                    </Link>
                    <Tabs
                        activeTab={view}
                        onTabChange={(t) => setView(t as View)}
                        className="dbamplify-switch"
                    >
                        <Tabs.List className="dbamplify-switch__list">
                            {VIEWS.map((v) => (
                                <Tabs.Tab key={v} value={v} className="dbamplify-switch__tab">
                                    {v}
                                </Tabs.Tab>
                            ))}
                        </Tabs.List>
                    </Tabs>
                </Navbar.Brand>

                <Navbar.Items className="dbamplify-rightzone">
                    <div className="dbamplify-chans">
                        {CHANNELS.map((c) => (
                            <ChanChip key={c} chan={c} kind="hdr" />
                        ))}
                    </div>
                    <Button className="dbamplify-compose">
                        <Plus size={15} aria-hidden />
                        Compose
                    </Button>
                </Navbar.Items>
            </Navbar>

            {/* ── Body: 1fr centerpiece + 320px right rail ─────────────────── */}
            <div className="dbamplify-body">
                <main className="dbamplify-main">
                    {view === "Calendar" && <CalendarView />}
                    {view === "Queue" && <QueueView />}
                    {view === "Analytics" && (
                        <AnalyticsView mounted={mounted} growthChart={growthChart} />
                    )}
                </main>

                {/* Right rail — quick stats + follower growth + top post */}
                <aside className="dbamplify-rail">
                    <div className="dbamplify-railcap">Last 28 days</div>
                    <div className="dbamplify-kpis">
                        {KPIS.map((k) => (
                            <Card
                                key={k.k}
                                variant="outlined"
                                padding="none"
                                className="dbamplify-kpi"
                            >
                                <Card.Body className="dbamplify-kpi__body">
                                    <div className="dbamplify-kpi__value">{k.v}</div>
                                    <div className="dbamplify-kpi__label">{k.k}</div>
                                    <Badge
                                        variant="soft"
                                        size="sm"
                                        color="green"
                                        className="dbamplify-delta"
                                    >
                                        {k.delta}
                                    </Badge>
                                </Card.Body>
                            </Card>
                        ))}
                    </div>

                    <div className="dbamplify-railcap">Follower growth</div>
                    <div className="dbamplify-spark">
                        {mounted ? (
                            <EChart option={railChart} style={{ width: "100%", height: 80 }} />
                        ) : (
                            <div style={{ height: 80 }} />
                        )}
                    </div>

                    <div className="dbamplify-railcap">Top post this week</div>
                    <Card variant="outlined" padding="none" className="dbamplify-toppost">
                        <Card.Body className="dbamplify-toppost__body">
                            <div className="dbamplify-toppost__head">
                                <ChanChip chan="tt" kind="top" />
                                <span className="dbamplify-toppost__meta">TikTok · Tue</span>
                            </div>
                            <div className="dbamplify-toppost__title">POV: linen season</div>
                            <div className="dbamplify-metrics">
                                <Badge variant="soft" size="sm" className="dbamplify-metric dbamplify-metric--like">
                                    ♥ 88k
                                </Badge>
                                <Badge variant="soft" size="sm" className="dbamplify-metric dbamplify-metric--share">
                                    ↻ 6.2k
                                </Badge>
                                <Badge variant="soft" size="sm" className="dbamplify-metric dbamplify-metric--rate">
                                    14%
                                </Badge>
                            </div>
                        </Card.Body>
                    </Card>

                    <footer className="dbamplify-foot">
                        <Text as="p" size="xs" className="dbamplify-foot__note">
                            Amplify — a fictional social-media console, for demonstration · App{" "}
                            {style.num} / {style.name} · every surface is a restyled Fancy UI
                            primitive (Navbar · Tabs · Card · Avatar · Badge · Table · EChart)
                        </Text>
                        <Link href="/inspiration/dashboards" className="dbamplify-foot__back">
                            Back to the gallery
                        </Link>
                    </footer>
                </aside>
            </div>
        </div>
    );
}

/* ── Calendar view — the week-at-a-glance centerpiece ───────────────────── */
function CalendarView() {
    return (
        <>
            <div className="dbamplify-calhead">
                <Heading as="h1" size="lg" weight="bold" className="dbamplify-caltitle">
                    Content calendar
                </Heading>
                <span className="dbamplify-calrange">Jul 7 – 13</span>
                <div className="dbamplify-calnav">
                    <button type="button" className="dbamplify-chev" aria-label="Previous week">
                        <ChevronLeft size={16} aria-hidden />
                    </button>
                    <button type="button" className="dbamplify-chev" aria-label="Next week">
                        <ChevronRight size={16} aria-hidden />
                    </button>
                </div>
            </div>

            <div className="dbamplify-week">
                {DAYS.map((d) => (
                    <div key={d.dow} className="dbamplify-col">
                        <div className="dbamplify-dayhead">
                            <div className="dbamplify-dow">{d.dow}</div>
                            <div
                                className={`dbamplify-date${d.today ? " dbamplify-date--today" : ""}`}
                            >
                                {d.date}
                            </div>
                        </div>

                        {d.posts.map((p, i) => (
                            <Card
                                key={i}
                                variant="outlined"
                                padding="none"
                                className="dbamplify-post"
                                style={{ "--chan": CHAN[p.chan].border } as CSSProperties}
                            >
                                <Card.Body className="dbamplify-post__body">
                                    <div className="dbamplify-post__top">
                                        <ChanChip chan={p.chan} kind="post" />
                                        <span className="dbamplify-post__time">{p.time}</span>
                                    </div>
                                    <div className="dbamplify-post__text">{p.text}</div>
                                    {p.live && (
                                        <div className="dbamplify-post__live">● Published</div>
                                    )}
                                </Card.Body>
                            </Card>
                        ))}
                    </div>
                ))}
            </div>
        </>
    );
}

/* ── Queue view — every scheduled post flattened into a restyled Table ───── */
function QueueView() {
    return (
        <>
            <div className="dbamplify-calhead">
                <Heading as="h1" size="lg" weight="bold" className="dbamplify-caltitle">
                    Publishing queue
                </Heading>
                <span className="dbamplify-calrange">{QUEUE.length} scheduled · Jul 7 – 13</span>
            </div>

            <Card variant="outlined" padding="none" className="dbamplify-panel">
                <Table className="dbamplify-qtable">
                    <Table.Head>
                        <Table.Column label="" />
                        <Table.Column label="When" />
                        <Table.Column label="Time" />
                        <Table.Column label="Post" />
                        <Table.Column label="Status" />
                    </Table.Head>
                    <Table.Body>
                        {QUEUE.map((p, i) => (
                            <Table.Row key={i}>
                                <Table.Cell className="dbamplify-qcell-chan">
                                    <ChanChip chan={p.chan} kind="post" />
                                </Table.Cell>
                                <Table.Cell className="dbamplify-qcell-day">{p.day}</Table.Cell>
                                <Table.Cell className="dbamplify-qcell-time">{p.time}</Table.Cell>
                                <Table.Cell className="dbamplify-qcell-text">{p.text}</Table.Cell>
                                <Table.Cell className="dbamplify-qcell-status">
                                    <Badge
                                        variant="soft"
                                        size="sm"
                                        color={p.live ? "green" : "purple"}
                                        className={`dbamplify-status dbamplify-status--${p.live ? "live" : "sched"}`}
                                    >
                                        {p.live ? "Published" : "Scheduled"}
                                    </Badge>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </Card>
        </>
    );
}

/* ── Analytics view — area + horizontal bar + top-posts table ───────────── */
function AnalyticsView({
    mounted,
    growthChart,
}: {
    mounted: boolean;
    growthChart: EChartsOption;
}) {
    return (
        <>
            <div className="dbamplify-calhead">
                <Heading as="h1" size="lg" weight="bold" className="dbamplify-caltitle">
                    Analytics
                </Heading>
                <span className="dbamplify-calrange">Last 28 days</span>
            </div>

            <div className="dbamplify-agrid">
                <Card variant="outlined" padding="none" className="dbamplify-panel">
                    <Card.Header className="dbamplify-panel__head">
                        <span className="dbamplify-panel__title">Audience growth</span>
                        <span className="dbamplify-panel__accent">+12.4k</span>
                    </Card.Header>
                    <Card.Body className="dbamplify-panel__body">
                        {mounted ? (
                            <EChart option={growthChart} style={{ width: "100%", height: 220 }} />
                        ) : (
                            <div style={{ height: 220 }} />
                        )}
                    </Card.Body>
                </Card>

                <Card variant="outlined" padding="none" className="dbamplify-panel">
                    <Card.Header className="dbamplify-panel__head">
                        <span className="dbamplify-panel__title">Reach by channel</span>
                        <span className="dbamplify-panel__accent">4.2M</span>
                    </Card.Header>
                    <Card.Body className="dbamplify-panel__body">
                        {mounted ? (
                            <EChart option={reachOption} style={{ width: "100%", height: 220 }} />
                        ) : (
                            <div style={{ height: 220 }} />
                        )}
                    </Card.Body>
                </Card>
            </div>

            <Card variant="outlined" padding="none" className="dbamplify-panel">
                <Card.Header className="dbamplify-panel__head">
                    <span className="dbamplify-panel__title">Top posts this week</span>
                </Card.Header>
                <Table className="dbamplify-qtable dbamplify-qtable--top">
                    <Table.Head>
                        <Table.Column label="" />
                        <Table.Column label="Post" />
                        <Table.Column label="When" />
                        <Table.Column label="Likes" />
                        <Table.Column label="Shares" />
                        <Table.Column label="Rate" />
                    </Table.Head>
                    <Table.Body>
                        {TOP_POSTS.map((p, i) => (
                            <Table.Row key={i}>
                                <Table.Cell className="dbamplify-qcell-chan">
                                    <ChanChip chan={p.chan} kind="post" />
                                </Table.Cell>
                                <Table.Cell className="dbamplify-qcell-text">{p.text}</Table.Cell>
                                <Table.Cell className="dbamplify-qcell-day">{p.when}</Table.Cell>
                                <Table.Cell className="dbamplify-qcell-num dbamplify-qcell-num--like">
                                    {p.likes}
                                </Table.Cell>
                                <Table.Cell className="dbamplify-qcell-num dbamplify-qcell-num--share">
                                    {p.shares}
                                </Table.Cell>
                                <Table.Cell className="dbamplify-qcell-num dbamplify-qcell-num--rate">
                                    {p.rate}
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </Card>
        </>
    );
}
