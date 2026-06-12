import { Head, router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { Badge, Card, Heading, Table, Text } from "@particle-academy/react-fancy";
import { EChart } from "@particle-academy/fancy-echarts";
import { Layout } from "../Layout";
import { currentTheme } from "../../showcase-theme";

// ─── Types ──────────────────────────────────────────────────────────────────

type Site = { site_key: string; url: string | null; visible: boolean };

type Filters = { range: number; actor: "all" | "human" | "agent"; compare: boolean };

type Kpis = {
    pageviews: number;
    sessions: number;
    avgTimeOnPageMs: number;
    clickthrough: number;
    clicks: number;
    human: number;
    agent: number;
    totalEvents: number;
};

type TopPath = { path: string; events: number; pageviews: number; clicks: number; sessions: number };

type HeatCell = { x: number; y: number; count: number; weight: number };
type Heatmap = {
    site_key: string;
    path: string;
    grid_size: number;
    sample_count: number;
    max: number;
    cells: HeatCell[];
} | null;
type Shot = { url: string; vw: number; vh: number; capturedAt: string | null };

type Metric = { value: number; deltaPct: number | null; format: "int" | "decimal" | "percent" | "duration" };
type SplitRow = {
    sessions: number;
    pageviews: number;
    avgEngagementMs: number;
    bounceRate: number;
    pagesPerSession: number;
};
type Overview = {
    range: number;
    actor: string;
    metrics: Record<string, Metric>;
    split: { human: SplitRow; agent: SplitRow };
    total: number;
} | null;

type SeriesPoint = {
    bucket: string;
    sessions: number;
    pageviews: number;
    human_sessions: number;
    agent_sessions: number;
};
type OverviewSeries = { buckets: string[]; current: SeriesPoint[]; previous: number[] } | null;

type Breakdown = { value?: string; host?: string; sessions: number };
type Acquisition = {
    referrer_hosts: Breakdown[];
    utm_sources: Breakdown[];
    utm_mediums: Breakdown[];
    utm_campaigns: Breakdown[];
    direct: number;
    referral: number;
    total: number;
} | null;

type Audience = {
    devices: Breakdown[];
    browsers: Breakdown[];
    os: Breakdown[];
    languages: Breakdown[];
    total: number;
} | null;

type Element = { target_id: string; label: string | null; clicks: number };
type PageRow = { path: string; pageviews: number; sessions: number };
type Behavior = {
    topPages: PageRow[];
    entryPages: { path: string; sessions: number }[];
    exitPages: { path: string; sessions: number }[];
    topElements: Element[];
} | null;

type RealtimeSession = { session_id: string; actor: string; path: string | null; last_event_at: string | null };
type Realtime = { active: number; window_seconds: number; sessions: RealtimeSession[] } | null;

type AgentAnalytics = {
    totals: { human: number; agent: number; agentPct: number };
    metrics: { human: SplitRow; agent: SplitRow };
    humanElements: Element[];
    agentElements: Element[];
    humanPages: PageRow[];
    agentPages: PageRow[];
} | null;

type Props = {
    pro: boolean;
    proSource: "subscription" | "prize" | null;
    sites: Site[];
    site: string | null;
    filters: Filters;
    kpis: Kpis | null;
    topPaths: TopPath[];
    heatmap: Heatmap;
    heatmapShot: Shot | null;
    overview: Overview;
    overviewSeries: OverviewSeries;
    acquisition: Acquisition;
    audience: Audience;
    behavior: Behavior;
    realtime: Realtime;
    agent: AgentAnalytics;
};

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AnalyticsIndex(props: Props) {
    if (!props.pro) {
        return (
            <Layout>
                <Head title="Analytics · Fancy UI" />
                <Upsell />
            </Layout>
        );
    }

    const { sites, site, filters, overview, overviewSeries, acquisition, audience, behavior, realtime, agent, heatmap, heatmapShot } = props;

    // "Has data" is now keyed off the session rollup (the GA-parity source),
    // not the raw event count — a site can have events but no rolled sessions
    // until the backfill runs.
    const hasData = (overview?.total ?? 0) > 0;

    return (
        <Layout>
            <Head title="Analytics · Fancy UI" />

            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <Heading level={1} size="xl">Analytics</Heading>
                        <Badge color="violet" variant="soft" size="sm">Pro</Badge>
                    </div>
                    <Text className="mt-2 max-w-3xl">
                        GA-parity behavioural analytics from the Fancy Heuristics pixel — acquisition,
                        audience, behavior, and attention — plus the one dimension Google Analytics
                        structurally can't have: the human-vs-agent split.
                    </Text>
                </div>
                <SitePicker sites={sites} site={site} filters={filters} />
            </div>

            <ControlsBar filters={filters} site={site} />

            {!hasData ? (
                <NoSessions site={site} filters={filters} />
            ) : (
                <div className="mt-6 space-y-8">
                    <OverviewSection overview={overview!} series={overviewSeries!} filters={filters} />
                    <AcquisitionSection data={acquisition!} />
                    <AudienceSection data={audience!} />
                    <BehaviorSection data={behavior!} />
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                        <div className="lg:col-span-2">
                            <RealtimeSection data={realtime!} />
                        </div>
                        <div className="lg:col-span-3">
                            <AttentionSection heatmap={heatmap} shot={heatmapShot} />
                        </div>
                    </div>
                    <AgentSection data={agent!} filters={filters} />
                </div>
            )}
        </Layout>
    );
}

// ─── Controls ───────────────────────────────────────────────────────────────

function reload(patch: Record<string, string | number | boolean>, extra: Record<string, unknown> = {}) {
    router.get("/analytics", patch, { preserveState: true, preserveScroll: true, replace: true, ...extra });
}

function SitePicker({ sites, site, filters }: { sites: Site[]; site: string | null; filters: Filters }) {
    return (
        <label className="inline-flex items-center gap-2 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Site</span>
            <select
                data-analytics-site-picker
                value={site ?? ""}
                onChange={(e) =>
                    router.get(
                        "/analytics",
                        { site: e.target.value, range: filters.range, actor: filters.actor, compare: filters.compare ? 1 : 0 },
                        { preserveState: false, preserveScroll: true },
                    )
                }
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 shadow-sm focus:border-violet-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
                {sites.map((s) => (
                    <option key={s.site_key} value={s.site_key}>
                        {s.site_key}
                    </option>
                ))}
            </select>
        </label>
    );
}

const RANGES = [7, 28, 90] as const;
const ACTORS: Array<{ key: Filters["actor"]; label: string }> = [
    { key: "all", label: "All" },
    { key: "human", label: "Human" },
    { key: "agent", label: "Agent" },
];

function ControlsBar({ filters, site }: { filters: Filters; site: string | null }) {
    const base = (k: keyof Filters, v: string | number | boolean) => ({
        site: site ?? "",
        range: filters.range,
        actor: filters.actor,
        compare: filters.compare ? 1 : 0,
        [k]: typeof v === "boolean" ? (v ? 1 : 0) : v,
    });

    return (
        <div className="mt-5 flex flex-wrap items-center gap-3" data-analytics-controls>
            {/* Date range */}
            <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900" role="group" aria-label="Date range">
                {RANGES.map((r) => (
                    <button
                        key={r}
                        type="button"
                        data-range={r}
                        aria-pressed={filters.range === r}
                        onClick={() => reload(base("range", r))}
                        className={segBtn(filters.range === r)}
                    >
                        {r}d
                    </button>
                ))}
            </div>

            {/* Actor toggle */}
            <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900" role="group" aria-label="Actor">
                {ACTORS.map((a) => (
                    <button
                        key={a.key}
                        type="button"
                        data-actor={a.key}
                        aria-pressed={filters.actor === a.key}
                        onClick={() => reload(base("actor", a.key))}
                        className={segBtn(filters.actor === a.key, a.key === "agent" ? "agent" : a.key === "human" ? "human" : "all")}
                    >
                        {a.label}
                    </button>
                ))}
            </div>

            {/* Compare toggle */}
            <button
                type="button"
                data-compare-toggle
                aria-pressed={filters.compare}
                onClick={() => reload(base("compare", !filters.compare))}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium shadow-sm transition ${
                    filters.compare
                        ? "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-200"
                        : "border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                }`}
            >
                <span className={`h-2 w-2 rounded-full ${filters.compare ? "bg-violet-500" : "bg-zinc-400"}`} />
                vs previous period
            </button>
        </div>
    );
}

function segBtn(active: boolean, tone: "all" | "human" | "agent" = "all"): string {
    if (!active) {
        return "rounded-md px-3 py-1 text-sm font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100";
    }
    const toneCls =
        tone === "agent"
            ? "bg-amber-500 text-white"
            : tone === "human"
              ? "bg-violet-600 text-white"
              : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900";
    return `rounded-md px-3 py-1 text-sm font-semibold shadow-sm ${toneCls}`;
}

// ─── Section shell ──────────────────────────────────────────────────────────

function Section({ title, subtitle, children, accent }: { title: string; subtitle?: string; children: React.ReactNode; accent?: boolean }) {
    return (
        <section>
            <div className="mb-3 flex items-baseline gap-3">
                <h2 className={`text-sm font-semibold uppercase tracking-wide ${accent ? "text-amber-600 dark:text-amber-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                    {title}
                </h2>
                {subtitle && <span className="text-xs text-zinc-400 dark:text-zinc-500">{subtitle}</span>}
            </div>
            {children}
        </section>
    );
}

// ─── 1. Overview ────────────────────────────────────────────────────────────

function OverviewSection({ overview, series, filters }: { overview: Overview; series: OverviewSeries; filters: Filters }) {
    const m = overview!.metrics;
    const tiles: Array<{ key: string; label: string }> = [
        { key: "sessions", label: "Sessions" },
        { key: "pageviews", label: "Pageviews" },
        { key: "avgEngagementMs", label: "Avg engagement" },
        { key: "bounceRate", label: "Bounce rate" },
        { key: "pagesPerSession", label: "Pages / session" },
    ];

    return (
        <Section title="Overview" subtitle={`Last ${filters.range} days${filters.actor !== "all" ? ` · ${filters.actor}` : ""}`}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {tiles.map((t) => (
                    <KpiTile key={t.key} label={t.label} metric={m[t.key]} split={overview!.split} field={t.key} showCompare={filters.compare} />
                ))}
            </div>
            <div className="mt-4">
                <OverviewChart series={series!} compare={filters.compare} />
            </div>
        </Section>
    );
}

function KpiTile({ label, metric, split, field, showCompare }: { label: string; metric: Metric; split: { human: SplitRow; agent: SplitRow }; field: string; showCompare: boolean }) {
    const human = (split.human as Record<string, number>)[field] ?? 0;
    const agent = (split.agent as Record<string, number>)[field] ?? 0;

    return (
        <Card padding="none" className="p-4" data-kpi={label}>
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</div>
            <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{fmt(metric.value, metric.format)}</span>
                {showCompare && <Delta metric={metric} />}
            </div>
            {/* Human vs agent micro-split */}
            <div className="mt-3" data-kpi-split>
                <div className="flex h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <span className="bg-violet-500" style={{ width: `${pct(human, human + agent)}%` }} />
                    <span className="bg-amber-500" style={{ width: `${pct(agent, human + agent)}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-[10px] tabular-nums text-zinc-400">
                    <span className="text-violet-500 dark:text-violet-400">H {fmt(human, metric.format)}</span>
                    <span className="text-amber-500 dark:text-amber-400">A {fmt(agent, metric.format)}</span>
                </div>
            </div>
        </Card>
    );
}

function Delta({ metric }: { metric: Metric }) {
    if (metric.deltaPct === null) {
        return <span className="text-[11px] text-zinc-400">—</span>;
    }
    // For bounce rate, down is good — but we keep the raw sign and let color
    // read literally (green up / red down) to stay unambiguous across metrics.
    const up = metric.deltaPct >= 0;
    const cls = up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";
    return (
        <span className={`text-xs font-medium tabular-nums ${cls}`} data-delta>
            {up ? "▲" : "▼"} {Math.abs(metric.deltaPct).toFixed(1)}%
        </span>
    );
}

function OverviewChart({ series, compare }: { series: OverviewSeries; compare: boolean }) {
    const dates = series!.buckets.map((b) => b.slice(5));
    const current = series!.current.map((p) => p.sessions);
    const previous = series!.previous;

    const seriesDefs: Record<string, unknown>[] = [
        {
            name: "Sessions",
            type: "line",
            smooth: true,
            showSymbol: false,
            areaStyle: { opacity: 0.14 },
            lineStyle: { width: 2 },
            itemStyle: { color: "#8b5cf6" },
            data: current,
        },
    ];
    if (compare && previous.length > 0) {
        seriesDefs.push({
            name: "Previous",
            type: "line",
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 1.5, type: "dashed", opacity: 0.7 },
            itemStyle: { color: "#a1a1aa" },
            data: previous,
        });
    }

    return (
        <Card padding="none" className="overflow-hidden">
            <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Sessions over time</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Daily sessions{compare ? " · current vs previous period" : ""}
                </div>
            </div>
            <div className="p-4">
                <EChart
                    style={{ width: "100%", height: 260 }}
                    option={{
                        grid: { left: 36, right: 12, top: 28, bottom: 28 },
                        tooltip: { trigger: "axis" },
                        legend: { right: 0, top: 0, itemHeight: 8 },
                        xAxis: { type: "category", data: dates, boundaryGap: false },
                        yAxis: { type: "value", minInterval: 1 },
                        series: seriesDefs,
                    }}
                />
            </div>
        </Card>
    );
}

// ─── 2. Acquisition ─────────────────────────────────────────────────────────

function AcquisitionSection({ data }: { data: Acquisition }) {
    const d = data!;
    return (
        <Section title="Acquisition" subtitle="How sessions arrived">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card padding="none" className="overflow-hidden lg:col-span-1">
                    <CardHeader title="Direct vs referral" />
                    <div className="p-4">
                        {d.total === 0 ? (
                            <Empty label="No sessions yet" />
                        ) : (
                            <DonutChart
                                data={[
                                    { name: "Direct", value: d.direct, color: "#8b5cf6" },
                                    { name: "Referral", value: d.referral, color: "#f59e0b" },
                                ]}
                            />
                        )}
                    </div>
                </Card>
                <div className="lg:col-span-2">
                    <BreakdownCard title="Top referrer hosts" rows={d.referrer_hosts} labelKey="host" />
                </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                <BreakdownCard title="UTM source" rows={d.utm_sources} labelKey="value" compact />
                <BreakdownCard title="UTM medium" rows={d.utm_mediums} labelKey="value" compact />
                <BreakdownCard title="UTM campaign" rows={d.utm_campaigns} labelKey="value" compact />
            </div>
        </Section>
    );
}

// ─── 3. Audience / Tech ─────────────────────────────────────────────────────

function AudienceSection({ data }: { data: Audience }) {
    const d = data!;
    return (
        <Section title="Audience · Tech" subtitle="Who's visiting">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card padding="none" className="overflow-hidden">
                    <CardHeader title="Device" />
                    <div className="p-4">
                        {d.devices.length === 0 ? <Empty label="No data" /> : <DonutChart data={d.devices.map((r, i) => ({ name: r.value!, value: r.sessions, color: PALETTE[i % PALETTE.length] }))} />}
                    </div>
                </Card>
                <BreakdownCard title="Browser" rows={d.browsers} labelKey="value" compact />
                <BreakdownCard title="OS" rows={d.os} labelKey="value" compact />
                <BreakdownCard title="Language" rows={d.languages} labelKey="value" compact />
            </div>
        </Section>
    );
}

// ─── 4. Behavior ────────────────────────────────────────────────────────────

function BehaviorSection({ data }: { data: Behavior }) {
    const d = data!;
    return (
        <Section title="Behavior" subtitle="What they did">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card padding="none" className="overflow-hidden">
                    <CardHeader title="Top pages" subtitle="By pageviews" />
                    {d.topPages.length === 0 ? (
                        <Empty label="No pageviews yet" pad />
                    ) : (
                        <Table>
                            <Table.Head>
                                <Table.Row>
                                    <Table.Column label="Path" />
                                    <Table.Column label="Views" className="!text-right" />
                                    <Table.Column label="Sessions" className="!text-right" />
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {d.topPages.map((r) => (
                                    <Table.Row key={r.path} data-page={r.path}>
                                        <Table.Cell><Mono>{r.path}</Mono></Table.Cell>
                                        <Table.Cell className="!text-right tabular-nums">{r.pageviews.toLocaleString()}</Table.Cell>
                                        <Table.Cell className="!text-right tabular-nums">{r.sessions.toLocaleString()}</Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    )}
                </Card>

                <Card padding="none" className="overflow-hidden">
                    <CardHeader title="Top clicked elements" subtitle="By click count" />
                    {d.topElements.length === 0 ? (
                        <Empty label="No tracked clicks yet" pad />
                    ) : (
                        <Table>
                            <Table.Head>
                                <Table.Row>
                                    <Table.Column label="Element" />
                                    <Table.Column label="ID" />
                                    <Table.Column label="Clicks" className="!text-right" />
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {d.topElements.map((r) => (
                                    <Table.Row key={r.target_id} data-element={r.target_id}>
                                        <Table.Cell>{r.label ?? <span className="text-zinc-400">—</span>}</Table.Cell>
                                        <Table.Cell><Mono>{r.target_id}</Mono></Table.Cell>
                                        <Table.Cell className="!text-right tabular-nums">{r.clicks.toLocaleString()}</Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    )}
                </Card>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <BreakdownCard title="Entry pages" rows={d.entryPages.map((r) => ({ value: r.path, sessions: r.sessions }))} labelKey="value" mono />
                <BreakdownCard title="Exit pages" rows={d.exitPages.map((r) => ({ value: r.path, sessions: r.sessions }))} labelKey="value" mono />
            </div>
        </Section>
    );
}

// ─── 5. Real-time ───────────────────────────────────────────────────────────

function RealtimeSection({ data }: { data: Realtime }) {
    const d = data!;
    return (
        <Section title="Real-time" subtitle="Last 5 minutes">
            <Card padding="none" className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800">
                    <div>
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Active now</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">Live sessions</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${d.active > 0 ? "animate-pulse bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                        <span className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{d.active}</span>
                    </div>
                </div>
                {d.sessions.length === 0 ? (
                    <Empty label="No active sessions right now" pad />
                ) : (
                    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {d.sessions.map((s) => (
                            <li key={s.session_id} data-rt-session={s.session_id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                                <div className="flex min-w-0 items-center gap-2">
                                    <Badge color={s.actor === "agent" ? "amber" : "violet"} variant="soft" size="sm">{s.actor}</Badge>
                                    <Mono className="truncate">{s.path ?? "/"}</Mono>
                                </div>
                                <span className="shrink-0 text-[11px] text-zinc-400">{relativeTime(s.last_event_at)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </Section>
    );
}

// ─── 6. Attention (screenshot heatmap) ──────────────────────────────────────

function AttentionSection({ heatmap, shot }: { heatmap: Heatmap; shot: Shot | null }) {
    return (
        <Section title="Attention" subtitle="Focus heatmap · busiest path">
            <FocusHeatmap heatmap={heatmap} shot={shot} />
        </Section>
    );
}

/** Track the live showcase theme so the heat overlay can pick the right blend. */
function useTheme(): "light" | "dark" {
    const [theme, setTheme] = useState<"light" | "dark">(() => (typeof window === "undefined" ? "dark" : currentTheme()));
    useEffect(() => {
        const onChange = (e: Event) => setTheme((e as CustomEvent<"light" | "dark">).detail);
        window.addEventListener("fancy-theme-change", onChange as EventListener);
        return () => window.removeEventListener("fancy-theme-change", onChange as EventListener);
    }, []);
    return theme;
}

function FocusHeatmap({ heatmap, shot }: { heatmap: Heatmap; shot: Shot | null }) {
    const isDark = useTheme() === "dark";
    const blendMode = shot || isDark ? "screen" : "multiply";
    return (
        <Card padding="none" className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800">
                <div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Focus heatmap</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {heatmap
                            ? `Busiest path · ${heatmap.path} · ${heatmap.sample_count.toLocaleString()} pointer/click samples`
                            : "No pointer activity yet"}
                    </div>
                </div>
                {heatmap && (
                    <Badge color="amber" variant="soft" size="sm">
                        {heatmap.grid_size}×{heatmap.grid_size} grid
                    </Badge>
                )}
            </div>

            <div className="p-4">
                <div
                    className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-zinc-200 bg-gradient-to-b from-zinc-50 to-white dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950"
                    data-heatmap-canvas
                >
                    {shot ? (
                        <>
                            <img src={shot.url} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
                            <div className="absolute inset-0 bg-zinc-950/30" />
                        </>
                    ) : (
                        <Wireframe />
                    )}

                    {heatmap?.cells.map((cell) => {
                        const left = ((cell.x + 0.5) / heatmap.grid_size) * 100;
                        const top = ((cell.y + 0.5) / heatmap.grid_size) * 100;
                        const cellPct = 100 / heatmap.grid_size;
                        const size = cellPct * (1.6 + cell.weight * 2.4);
                        const opacity = 0.18 + cell.weight * 0.62;
                        return (
                            <span
                                key={`${cell.x}-${cell.y}`}
                                data-heat-cell={`${cell.x},${cell.y}`}
                                title={`(${cell.x}, ${cell.y}) · ${cell.count} hits`}
                                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                                style={{
                                    left: `${left}%`,
                                    top: `${top}%`,
                                    width: `${size}%`,
                                    height: `${size}%`,
                                    opacity,
                                    background: `radial-gradient(circle, ${blobColor(cell.weight)} 0%, ${blobColor(cell.weight)}00 70%)`,
                                    mixBlendMode: blendMode,
                                }}
                            />
                        );
                    })}

                    {!heatmap && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="rounded-md bg-white/80 px-3 py-1.5 text-xs text-zinc-500 dark:bg-zinc-900/80 dark:text-zinc-400">
                                No pointer activity captured yet
                            </span>
                        </div>
                    )}
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>cool</span>
                    <span className="h-2 flex-1 rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500" />
                    <span>hot</span>
                </div>
            </div>
        </Card>
    );
}

function Wireframe() {
    return (
        <div className="absolute inset-0 p-[6%] opacity-40">
            <div className="h-[8%] w-full rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-[4%] h-[22%] w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-[3%] h-[6%] w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-[6%] grid grid-cols-3 gap-[3%]">
                <div className="h-16 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-16 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-16 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="mt-[5%] h-[10%] w-2/5 rounded bg-zinc-300 dark:bg-zinc-700" />
        </div>
    );
}

function blobColor(weight: number): string {
    if (weight >= 0.66) return "#f43f5e";
    if (weight >= 0.33) return "#f59e0b";
    return "#38bdf8";
}

// ─── 7. ★ Agent analytics (the moat) ────────────────────────────────────────

function AgentSection({ data, filters }: { data: AgentAnalytics; filters: Filters }) {
    const d = data!;
    const fields: Array<{ key: keyof SplitRow; label: string; format: Metric["format"] }> = [
        { key: "sessions", label: "Sessions", format: "int" },
        { key: "pageviews", label: "Pageviews", format: "int" },
        { key: "avgEngagementMs", label: "Avg engagement", format: "duration" },
        { key: "bounceRate", label: "Bounce rate", format: "percent" },
        { key: "pagesPerSession", label: "Pages / session", format: "decimal" },
    ];

    return (
        <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/60 to-white p-5 dark:border-amber-900/50 dark:from-amber-950/20 dark:to-zinc-950">
            <div className="mb-1 flex items-center gap-2">
                <span className="text-base">★</span>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">Agent analytics</h2>
                <Badge color="amber" variant="soft" size="sm">the moat</Badge>
            </div>
            <Text className="mb-4 max-w-2xl text-sm">
                The dimension Google Analytics structurally can't have: which traffic is human and which
                is an AI agent inhabiting the same surface — across every headline metric, page, and element.
            </Text>

            {/* Agent share */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <Card padding="none" className="p-5">
                    <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Agent share of sessions</div>
                    <div className="mt-2 text-4xl font-bold text-amber-600 dark:text-amber-400" data-agent-pct>{d.totals.agentPct.toFixed(1)}%</div>
                    <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <span className="bg-violet-500" style={{ width: `${pct(d.totals.human, d.totals.human + d.totals.agent)}%` }} />
                        <span className="bg-amber-500" style={{ width: `${pct(d.totals.agent, d.totals.human + d.totals.agent)}%` }} />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[11px] tabular-nums">
                        <span className="text-violet-500 dark:text-violet-400">{d.totals.human.toLocaleString()} human</span>
                        <span className="text-amber-500 dark:text-amber-400">{d.totals.agent.toLocaleString()} agent</span>
                    </div>
                </Card>

                {/* Metric-by-metric H vs A */}
                <Card padding="none" className="overflow-hidden lg:col-span-2">
                    <CardHeader title="Human vs agent" subtitle={`Across the headline metrics · last ${filters.range}d`} />
                    <Table>
                        <Table.Head>
                            <Table.Row>
                                <Table.Column label="Metric" />
                                <Table.Column label="Human" className="!text-right" />
                                <Table.Column label="Agent" className="!text-right" />
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {fields.map((f) => (
                                <Table.Row key={f.key} data-agent-metric={f.key}>
                                    <Table.Cell>{f.label}</Table.Cell>
                                    <Table.Cell className="!text-right tabular-nums text-violet-600 dark:text-violet-400">{fmt(d.metrics.human[f.key], f.format)}</Table.Cell>
                                    <Table.Cell className="!text-right tabular-nums text-amber-600 dark:text-amber-400">{fmt(d.metrics.agent[f.key], f.format)}</Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </Card>
            </div>

            {/* Which surfaces / elements each actor drove */}
            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
                <ActorActivity title="Agent-driven elements" tone="agent" elements={d.agentElements} pages={d.agentPages} />
                <ActorActivity title="Human-driven elements" tone="human" elements={d.humanElements} pages={d.humanPages} />
            </div>
        </section>
    );
}

function ActorActivity({ title, tone, elements, pages }: { title: string; tone: "agent" | "human"; elements: Element[]; pages: PageRow[] }) {
    const accent = tone === "agent" ? "text-amber-600 dark:text-amber-400" : "text-violet-600 dark:text-violet-400";
    return (
        <Card padding="none" className="overflow-hidden">
            <CardHeader title={title} />
            <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:divide-x sm:divide-zinc-100 dark:sm:divide-zinc-800">
                <div className="p-4">
                    <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">Elements</div>
                    {elements.length === 0 ? (
                        <Empty label="No clicks" />
                    ) : (
                        <ul className="space-y-1.5">
                            {elements.map((e) => (
                                <li key={e.target_id} className="flex items-center justify-between gap-2 text-sm">
                                    <span className="truncate text-zinc-700 dark:text-zinc-300">{e.label ?? e.target_id}</span>
                                    <span className={`tabular-nums font-semibold ${accent}`}>{e.clicks}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="p-4">
                    <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">Pages</div>
                    {pages.length === 0 ? (
                        <Empty label="No pageviews" />
                    ) : (
                        <ul className="space-y-1.5">
                            {pages.map((p) => (
                                <li key={p.path} className="flex items-center justify-between gap-2 text-sm">
                                    <Mono className="truncate">{p.path}</Mono>
                                    <span className={`tabular-nums font-semibold ${accent}`}>{p.pageviews}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </Card>
    );
}

// ─── Shared building blocks ─────────────────────────────────────────────────

const PALETTE = ["#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6", "#a3a3a3"];

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
            {subtitle && <div className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</div>}
        </div>
    );
}

function BreakdownCard({ title, rows, labelKey, compact, mono }: { title: string; rows: Breakdown[]; labelKey: "host" | "value"; compact?: boolean; mono?: boolean }) {
    const max = Math.max(1, ...rows.map((r) => r.sessions));
    return (
        <Card padding="none" className="overflow-hidden">
            <CardHeader title={title} />
            <div className="p-4">
                {rows.length === 0 ? (
                    <Empty label="No data yet" />
                ) : (
                    <ul className={compact ? "space-y-2" : "space-y-2.5"}>
                        {rows.slice(0, compact ? 6 : 10).map((r) => {
                            const label = (r[labelKey] ?? "—") as string;
                            return (
                                <li key={label} data-breakdown={label}>
                                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                                        <span className={`truncate ${mono ? "font-mono text-xs" : ""} text-zinc-700 dark:text-zinc-300`}>{label}</span>
                                        <span className="shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400">{r.sessions.toLocaleString()}</span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                        <span className="block h-full rounded-full bg-violet-500" style={{ width: `${(r.sessions / max) * 100}%` }} />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </Card>
    );
}

function DonutChart({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return <Empty label="No data" />;
    return (
        <EChart
            style={{ width: "100%", height: 200 }}
            option={{
                tooltip: { trigger: "item" },
                legend: { bottom: 0, itemHeight: 8, itemWidth: 8 },
                series: [
                    {
                        type: "pie",
                        radius: ["52%", "74%"],
                        center: ["50%", "44%"],
                        avoidLabelOverlap: false,
                        label: { show: false },
                        data: data.map((d) => ({ name: d.name, value: d.value, itemStyle: { color: d.color } })),
                    },
                ],
            }}
        />
    );
}

function Mono({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <span className={`font-mono text-xs text-zinc-700 dark:text-zinc-300 ${className}`}>{children}</span>;
}

function Empty({ label, pad }: { label: string; pad?: boolean }) {
    return <div className={`text-center text-sm text-zinc-400 dark:text-zinc-500 ${pad ? "p-8" : "py-4"}`}>{label}</div>;
}

// ─── Empty / no-sessions state ──────────────────────────────────────────────

function NoSessions({ site, filters }: { site: string | null; filters: Filters }) {
    const filtered = filters.actor !== "all";
    return (
        <Card padding="none" className="mt-6">
            <div className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-2xl dark:bg-violet-900/30">📊</div>
                <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {filtered ? `No ${filters.actor} sessions in this window` : `No session data for ${site ?? "this site"} yet`}
                </div>
                <Text className="mx-auto mt-2 max-w-md">
                    {filtered ? (
                        <>
                            Nothing matched the <span className="font-semibold">{filters.actor}</span> filter for the last {filters.range} days.
                            Try switching back to <span className="font-semibold">All</span> or widening the date range.
                        </>
                    ) : (
                        <>
                            The dashboard reads from the per-session rollup. Once the Fancy Pixel collects
                            sessions — or you run <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800">php artisan heuristics:backfill-sessions</code> over
                            historical events — acquisition, audience, and the agent split appear here.
                        </>
                    )}
                </Text>
            </div>
        </Card>
    );
}

// ─── Upsell (non-Pro) ───────────────────────────────────────────────────────

function Upsell() {
    const features = [
        ["GA-parity acquisition", "Referrers, UTM source/medium/campaign, direct vs referral — the full acquisition picture."],
        ["Audience & tech", "Device, browser, OS, and language breakdowns drawn from real session context."],
        ["Human + Agent split", "The dimension GA can't have — separate every metric, page, and element by actor."],
        ["Attention heatmaps", "Real pointer + click samples painted over a screenshot of the busiest page."],
    ];

    return (
        <div className="mx-auto max-w-3xl py-6">
            <div className="text-center">
                <Badge color="violet" variant="soft" size="md">Pro feature</Badge>
                <Heading level={1} size="xl" className="mt-4">Analytics is a Pro feature</Heading>
                <Text className="mx-auto mt-3 max-w-xl">
                    Unlock the Pro Analytics Suite — GA-parity behavioural analytics powered by the
                    Fancy Heuristics pixel, plus the human-vs-agent moat. Go Pro by subscribing, or earn
                    the <span className="font-semibold">sandbox-pro</span> prize by reaching the Ambassador tier.
                </Text>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {features.map(([title, body]) => (
                    <Card padding="none" key={title} className="p-5">
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
                        <Text className="mt-1 text-sm">{body}</Text>
                    </Card>
                ))}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
                <a href="/subscriptions" className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">Go Pro</a>
                <a href="/leaderboard" className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-violet-400 dark:border-zinc-700 dark:text-zinc-200">Earn it — see the leaderboard</a>
            </div>
        </div>
    );
}

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(value: number, format: Metric["format"]): string {
    switch (format) {
        case "duration":
            return formatDuration(value);
        case "percent":
            return `${(value * 100).toFixed(1)}%`;
        case "decimal":
            return value.toFixed(2);
        default:
            return Math.round(value).toLocaleString();
    }
}

function formatDuration(ms: number): string {
    if (!ms || ms <= 0) return "—";
    const s = ms / 1000;
    if (s < 60) return `${s.toFixed(s < 10 ? 1 : 0)}s`;
    const m = Math.floor(s / 60);
    const rem = Math.round(s % 60);
    return `${m}m ${rem}s`;
}

function pct(part: number, total: number): number {
    if (total <= 0) return 0;
    return (part / total) * 100;
}

function relativeTime(iso: string | null): string {
    if (!iso) return "";
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "";
    const diff = Date.now() - then;
    const s = Math.max(0, Math.round(diff / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.round(h / 24)}d ago`;
}
