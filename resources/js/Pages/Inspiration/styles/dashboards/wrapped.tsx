import "./wrapped.css";
import { Link } from "@inertiajs/react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
    Tabs,
    Text,
    Tooltip,
} from "@particle-academy/react-fancy";
import { EChart, registerAll, type EChartsOption } from "@particle-academy/fancy-echarts";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import type { Style } from "../../types";

/**
 * Dashboards · Style 05 — Wrapped (music streaming recap).
 *
 * A Spotify-Wrapped-style *personal listening recap* rendered entirely from
 * restyled Fancy primitives, not bespoke <div> markup: a <Navbar> topbar with a
 * gradient wordmark + a controlled <Tabs> period switcher + an <Avatar> user
 * bubble; a violet→pink gradient <Card> hero with two oversized KPIs (the recap
 * rank wears a <Badge>); a two-up grid — a <Card>+<Table> ranked-artists board
 * (each row an <Avatar> + a violet-pink <Progress> plays bar) beside a <Card>
 * holding a fancy-echarts donut <EChart> + a color-keyed legend of <Badge> %s;
 * a full-width "when you listen" <Card> with a 24-bar histogram <EChart>; and a
 * fixed frosted now-playing <Card> — art tile, three <Button> transport
 * controls, and a white <Progress> scrubber between two mono timecodes.
 *
 * The mockup's DCLogic had no user-driven state; here the whole recap is
 * genuinely controlled — the Tabs swap the full dataset (This month / All time /
 * Discover) and the player actually plays: a useEffect timer advances the
 * scrubber and auto-skips at track end (cleaned up on unmount).
 *
 * Mounted by Inspiration/Show.tsx for `style.id === "wrapped"`. SSR-safe: no
 * window/document/Math.random/Date.now during render; first paint is fully
 * deterministic (elapsed seeded from static data; the timer only runs after
 * mount inside an effect). Both charts are fancy-echarts <EChart> — SSR-safe
 * containers that init client-side. Static imports only; z-index stays < 30
 * (the neutral GalleryFrame owns 30).
 */

registerAll();

type PeriodKey = "month" | "alltime" | "discover";

type Artist = {
    rank: string;
    name: string;
    stat: string;
    unit: string;
    pct: number;
    emoji: string;
    bg: string;
};

type Genre = { label: string; pct: number; col: string };

type PeriodData = {
    eyebrow: string;
    periodLabel: string;
    kpi1: { value: string; label: string };
    kpi2: { value: string; label: string };
    artists: Artist[];
    genres: Genre[];
    hours: number[];
};

/* ── The three recaps — "This month" is the mockup verbatim ─────────────── */

const PERIODS: Record<PeriodKey, PeriodData> = {
    month: {
        eyebrow: "Your July, so far",
        periodLabel: "this month",
        kpi1: { value: "14,208", label: "minutes listened" },
        kpi2: { value: "Top 2%", label: "of Phoebe Bridgers fans" },
        artists: [
            { rank: "1", name: "Phoebe Bridgers", stat: "312", unit: "plays", pct: 100, emoji: "🎸", bg: "#3B2A52" },
            { rank: "2", name: "Bon Iver", stat: "241", unit: "plays", pct: 77, emoji: "🌲", bg: "#2A3A52" },
            { rank: "3", name: "Sufjan Stevens", stat: "198", unit: "plays", pct: 63, emoji: "🕊️", bg: "#523A2A" },
            { rank: "4", name: "Big Thief", stat: "154", unit: "plays", pct: 49, emoji: "🌊", bg: "#2A5248" },
            { rank: "5", name: "Fleet Foxes", stat: "121", unit: "plays", pct: 39, emoji: "🍂", bg: "#4A2A52" },
        ],
        genres: [
            { label: "Indie folk", pct: 42, col: "#a855f7" },
            { label: "Dream pop", pct: 26, col: "#ec4899" },
            { label: "Ambient", pct: 18, col: "#f59e0b" },
            { label: "Classical", pct: 14, col: "#38bdf8" },
        ],
        hours: [8, 5, 3, 2, 2, 4, 10, 22, 38, 52, 60, 55, 48, 44, 50, 58, 66, 78, 88, 100, 92, 74, 50, 28],
    },
    alltime: {
        eyebrow: "Your all-time recap",
        periodLabel: "all time",
        kpi1: { value: "486,930", label: "minutes, all time" },
        kpi2: { value: "Top 0.5%", label: "of Phoebe Bridgers fans" },
        artists: [
            { rank: "1", name: "Phoebe Bridgers", stat: "4,820", unit: "plays", pct: 100, emoji: "🎸", bg: "#3B2A52" },
            { rank: "2", name: "Sufjan Stevens", stat: "3,910", unit: "plays", pct: 81, emoji: "🕊️", bg: "#523A2A" },
            { rank: "3", name: "Bon Iver", stat: "3,640", unit: "plays", pct: 76, emoji: "🌲", bg: "#2A3A52" },
            { rank: "4", name: "The National", stat: "2,980", unit: "plays", pct: 62, emoji: "🎹", bg: "#2A5248" },
            { rank: "5", name: "Big Thief", stat: "2,510", unit: "plays", pct: 52, emoji: "🌊", bg: "#4A2A52" },
        ],
        genres: [
            { label: "Indie folk", pct: 38, col: "#a855f7" },
            { label: "Dream pop", pct: 24, col: "#ec4899" },
            { label: "Ambient", pct: 20, col: "#f59e0b" },
            { label: "Classical", pct: 18, col: "#38bdf8" },
        ],
        hours: [12, 8, 5, 3, 3, 6, 14, 26, 40, 54, 58, 60, 56, 50, 54, 60, 68, 74, 82, 90, 96, 88, 60, 34],
    },
    discover: {
        eyebrow: "Discover, tuned for you",
        periodLabel: "this week",
        kpi1: { value: "214", label: "new artists surfaced" },
        kpi2: { value: "38 added", label: "to your rotation" },
        artists: [
            { rank: "1", name: "Adrianne Lenker", stat: "96%", unit: "match", pct: 100, emoji: "🍂", bg: "#4A2A52" },
            { rank: "2", name: "MJ Lenderman", stat: "92%", unit: "match", pct: 96, emoji: "🎸", bg: "#523A2A" },
            { rank: "3", name: "Julia Jacklin", stat: "88%", unit: "match", pct: 92, emoji: "🌙", bg: "#2A3A52" },
            { rank: "4", name: "Indigo De Souza", stat: "85%", unit: "match", pct: 89, emoji: "✨", bg: "#2A5248" },
            { rank: "5", name: "Wednesday", stat: "81%", unit: "match", pct: 84, emoji: "🌧️", bg: "#3B2A52" },
        ],
        genres: [
            { label: "Slowcore", pct: 34, col: "#a855f7" },
            { label: "Indie rock", pct: 28, col: "#ec4899" },
            { label: "Folk punk", pct: 22, col: "#f59e0b" },
            { label: "Chamber pop", pct: 16, col: "#38bdf8" },
        ],
        hours: [4, 2, 1, 1, 2, 3, 6, 12, 20, 28, 34, 30, 26, 24, 30, 36, 44, 52, 60, 72, 80, 66, 40, 18],
    },
};

const PERIOD_TABS: { value: PeriodKey; label: string }[] = [
    { value: "month", label: "This month" },
    { value: "alltime", label: "All time" },
    { value: "discover", label: "Discover" },
];

const HOUR_LABELS = [
    "12a", "1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a",
    "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "10p", "11p",
];
const HOUR_TICKS = [0, 6, 12, 18, 23];

/* ── The now-playing queue — the player actually plays ──────────────────── */

type Track = {
    title: string;
    artist: string;
    emoji: string;
    bg: string;
    duration: number; // seconds
    start: number; // seed elapsed on select
};

const TRACKS: Track[] = [
    { title: "Motion Sickness", artist: "Phoebe Bridgers", emoji: "🎵", bg: "linear-gradient(135deg,#ec4899,#f59e0b)", duration: 232, start: 84 },
    { title: "Holocene", artist: "Bon Iver", emoji: "🌲", bg: "linear-gradient(135deg,#2A3A52,#38bdf8)", duration: 337, start: 0 },
    { title: "Mystery of Love", artist: "Sufjan Stevens", emoji: "🕊️", bg: "linear-gradient(135deg,#523A2A,#f59e0b)", duration: 249, start: 0 },
    { title: "Not", artist: "Big Thief", emoji: "🌊", bg: "linear-gradient(135deg,#2A5248,#a855f7)", duration: 227, start: 0 },
];

const fmt = (s: number): string => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/* ── Chart option builders (pure — SSR-safe plain objects) ──────────────── */

function donutOption(genres: Genre[]): EChartsOption {
    return {
        tooltip: {
            trigger: "item",
            formatter: "{b} · {c}%",
            backgroundColor: "#1b1430",
            borderColor: "#2e2444",
            borderWidth: 1,
            textStyle: { color: "#EFEAF6", fontSize: 12 },
        },
        series: [
            {
                type: "pie",
                radius: ["57%", "100%"],
                center: ["50%", "50%"],
                avoidLabelOverlap: false,
                label: { show: false },
                labelLine: { show: false },
                emphasis: { scale: true, scaleSize: 4 },
                data: genres.map((g) => ({
                    name: g.label,
                    value: g.pct,
                    itemStyle: { color: g.col, borderColor: "#151020", borderWidth: 2 },
                })),
            },
        ],
    };
}

function hoursOption(hours: number[]): EChartsOption {
    return {
        grid: { left: 2, right: 6, top: 10, bottom: 18, containLabel: true },
        tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            backgroundColor: "#1b1430",
            borderColor: "#2e2444",
            borderWidth: 1,
            textStyle: { color: "#EFEAF6", fontSize: 12 },
            formatter: (params: unknown) => {
                const p = (params as { name: string; value: number }[])[0];
                return `${p.name} · ${p.value} plays`;
            },
        },
        xAxis: {
            type: "category",
            data: HOUR_LABELS,
            axisTick: { show: false },
            axisLine: { lineStyle: { color: "#2a2038" } },
            axisLabel: {
                color: "#5A4F70",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                interval: (index: number) => HOUR_TICKS.includes(index),
            },
        },
        yAxis: { type: "value", show: false },
        series: [
            {
                type: "bar",
                data: hours,
                barWidth: "62%",
                itemStyle: {
                    borderRadius: [3, 3, 0, 0],
                    color: {
                        type: "linear",
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: "#a855f7" },
                            { offset: 1, color: "#7c3aed" },
                        ],
                    },
                },
            },
        ],
    };
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function Wrapped({ style }: { style: Style }) {
    const [period, setPeriod] = useState<PeriodKey>("month");
    const [trackIndex, setTrackIndex] = useState(0);
    const [playing, setPlaying] = useState(true);
    const [elapsed, setElapsed] = useState(TRACKS[0].start);

    const data = PERIODS[period];
    const track = TRACKS[trackIndex];

    const donutOpt = useMemo(() => donutOption(data.genres), [data.genres]);
    const hoursOpt = useMemo(() => hoursOption(data.hours), [data.hours]);

    /** Tick the scrubber forward once a second while playing. */
    useEffect(() => {
        if (!playing) return;
        const id = window.setInterval(() => {
            setElapsed((prev) => Math.min(prev + 1, TRACKS[trackIndex].duration));
        }, 1000);
        return () => window.clearInterval(id);
    }, [playing, trackIndex]);

    /** Auto-advance to the next track when one finishes. */
    useEffect(() => {
        if (playing && elapsed >= TRACKS[trackIndex].duration) {
            const next = (trackIndex + 1) % TRACKS.length;
            setTrackIndex(next);
            setElapsed(TRACKS[next].start);
        }
    }, [playing, elapsed, trackIndex]);

    const jump = (next: number) => {
        setTrackIndex(next);
        setElapsed(TRACKS[next].start);
    };
    const prev = () => jump((trackIndex - 1 + TRACKS.length) % TRACKS.length);
    const skip = () => jump((trackIndex + 1) % TRACKS.length);

    return (
        <div className="dbwrapped-root">
            <div className="dbwrapped-shell">
                {/* ── Topbar ─────────────────────────────────────────────── */}
                <Navbar className="dbwrapped-nav">
                    <Navbar.Brand className="dbwrapped-brandwrap">
                        <Link href="/inspiration/dashboards" className="dbwrapped-brand">
                            <span className="dbwrapped-logo" aria-hidden>W</span>
                            <span className="dbwrapped-brand-word">Wrapped</span>
                        </Link>
                    </Navbar.Brand>
                    <div className="dbwrapped-navright">
                        <Tabs
                            activeTab={period}
                            onTabChange={(t) => setPeriod(t as PeriodKey)}
                            variant="pills"
                            className="dbwrapped-periods"
                        >
                            <Tabs.List className="dbwrapped-periodlist">
                                {PERIOD_TABS.map((t) => (
                                    <Tabs.Tab key={t.value} value={t.value}>
                                        {t.label}
                                    </Tabs.Tab>
                                ))}
                            </Tabs.List>
                        </Tabs>
                        <Avatar fallback="SL" size="sm" className="dbwrapped-userav" />
                    </div>
                </Navbar>

                {/* ── Recap hero banner ──────────────────────────────────── */}
                <Card variant="flat" padding="none" className="dbwrapped-hero">
                    <Card.Body className="dbwrapped-hero-body">
                        <div className="dbwrapped-hero-eyebrow">{data.eyebrow}</div>
                        <div className="dbwrapped-hero-kpis">
                            <div className="dbwrapped-kpi">
                                <div className="dbwrapped-kpi-num">{data.kpi1.value}</div>
                                <div className="dbwrapped-kpi-label">{data.kpi1.label}</div>
                            </div>
                            <div className="dbwrapped-kpi">
                                <Badge className="dbwrapped-kpi-badge" size="lg">
                                    {data.kpi2.value}
                                </Badge>
                                <div className="dbwrapped-kpi-label">{data.kpi2.label}</div>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                {/* ── Top artists | Genres ───────────────────────────────── */}
                <div className="dbwrapped-grid2">
                    <Card variant="flat" padding="none" className="dbwrapped-panel">
                        <Card.Header className="dbwrapped-panel-head">
                            <Heading as="h2" size="md" weight="semibold" className="dbwrapped-panel-title">
                                Top artists
                            </Heading>
                        </Card.Header>
                        <Card.Body className="dbwrapped-panel-body">
                            <Table className="dbwrapped-artists">
                                <Table.Head>
                                    <Table.Column label="#" />
                                    <Table.Column label="Artist" />
                                    <Table.Column label="Plays" />
                                </Table.Head>
                                <Table.Body>
                                    {data.artists.map((a) => (
                                        <Table.Row key={a.name} className="dbwrapped-art-row">
                                            <Table.Cell className="dbwrapped-art-rank">{a.rank}</Table.Cell>
                                            <Table.Cell
                                                className="dbwrapped-art-id"
                                                style={{ "--dbw-art-bg": a.bg } as CSSProperties}
                                            >
                                                <Avatar
                                                    fallback={a.emoji}
                                                    size="sm"
                                                    className="dbwrapped-art-av"
                                                />
                                                <span className="dbwrapped-art-meta">
                                                    <span className="dbwrapped-art-name">{a.name}</span>
                                                    <span className="dbwrapped-art-plays">
                                                        {a.stat} {a.unit}
                                                    </span>
                                                </span>
                                            </Table.Cell>
                                            <Table.Cell className="dbwrapped-art-barcell">
                                                <Progress
                                                    className="dbwrapped-plays-bar"
                                                    value={a.pct}
                                                    max={100}
                                                    size="sm"
                                                />
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </Card.Body>
                    </Card>

                    <Card variant="flat" padding="none" className="dbwrapped-panel">
                        <Card.Header className="dbwrapped-panel-head">
                            <Heading as="h2" size="md" weight="semibold" className="dbwrapped-panel-title">
                                Genres
                            </Heading>
                        </Card.Header>
                        <Card.Body className="dbwrapped-panel-body dbwrapped-genres">
                            <div className="dbwrapped-donut">
                                <EChart option={donutOpt} style={{ height: 150, width: 150 }} />
                            </div>
                            <ul className="dbwrapped-legend">
                                {data.genres.map((g) => (
                                    <li key={g.label} className="dbwrapped-legend-row">
                                        <span
                                            className="dbwrapped-swatch"
                                            style={{ background: g.col }}
                                            aria-hidden
                                        />
                                        <span className="dbwrapped-legend-label">{g.label}</span>
                                        <Badge className="dbwrapped-legend-pct" size="sm">
                                            {g.pct}%
                                        </Badge>
                                    </li>
                                ))}
                            </ul>
                        </Card.Body>
                    </Card>
                </div>

                {/* ── When you listen ────────────────────────────────────── */}
                <Card variant="flat" padding="none" className="dbwrapped-panel dbwrapped-clock">
                    <Card.Header className="dbwrapped-panel-head dbwrapped-clock-head">
                        <Heading as="h2" size="md" weight="semibold" className="dbwrapped-panel-title">
                            When you listen
                        </Heading>
                        <Text as="p" size="sm" className="dbwrapped-clock-sub">
                            Plays by hour · {data.periodLabel}
                        </Text>
                    </Card.Header>
                    <Card.Body className="dbwrapped-panel-body">
                        <EChart option={hoursOpt} style={{ height: 190, width: "100%" }} />
                    </Card.Body>
                </Card>

                {/* ── Colophon ───────────────────────────────────────────── */}
                <Separator className="dbwrapped-rule" />
                <div className="dbwrapped-colophon">
                    Wrapped — a fictional listening recap, for demonstration · Dashboard {style.num} / {style.name} ·
                    every surface is a restyled Fancy UI primitive
                </div>
            </div>

            {/* ── Fixed now-playing player ───────────────────────────────── */}
            <div className="dbwrapped-player">
                <Card variant="flat" padding="none" className="dbwrapped-player-card">
                    <div className="dbwrapped-player-in">
                        <span className="dbwrapped-art-tile" style={{ background: track.bg }} aria-hidden>
                            {track.emoji}
                        </span>
                        <div className="dbwrapped-nowmeta">
                            <div className="dbwrapped-now-title">{track.title}</div>
                            <Text as="div" size="xs" className="dbwrapped-now-artist">
                                {track.artist}
                            </Text>
                        </div>
                        <div className="dbwrapped-transport">
                            <Button
                                variant="ghost"
                                className="dbwrapped-tbtn"
                                aria-label="Previous track"
                                onClick={prev}
                            >
                                <SkipBack size={18} />
                            </Button>
                            <Tooltip content={playing ? "Pause" : "Play"}>
                                <Button
                                    className="dbwrapped-tbtn dbwrapped-tbtn--play"
                                    aria-label={playing ? "Pause" : "Play"}
                                    onClick={() => setPlaying((p) => !p)}
                                >
                                    {playing ? <Pause size={18} /> : <Play size={18} />}
                                </Button>
                            </Tooltip>
                            <Button
                                variant="ghost"
                                className="dbwrapped-tbtn"
                                aria-label="Next track"
                                onClick={skip}
                            >
                                <SkipForward size={18} />
                            </Button>
                        </div>
                        <div className="dbwrapped-scrub">
                            <span className="dbwrapped-time">{fmt(elapsed)}</span>
                            <Progress
                                className="dbwrapped-scrub-bar"
                                value={elapsed}
                                max={track.duration}
                                size="sm"
                            />
                            <span className="dbwrapped-time">{fmt(track.duration)}</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
