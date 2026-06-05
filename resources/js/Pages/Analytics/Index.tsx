import { Head, router } from "@inertiajs/react";
import { Badge, Card, Heading, Table, Text } from "@particle-academy/react-fancy";
import { EChart } from "@particle-academy/fancy-echarts";
import { Layout } from "../Layout";

type Site = { site_key: string; url: string | null; visible: boolean };

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

type TopPath = {
    path: string;
    events: number;
    pageviews: number;
    clicks: number;
    sessions: number;
};

type HeatCell = { x: number; y: number; count: number; weight: number };

type Heatmap = {
    site_key: string;
    path: string;
    grid_size: number;
    sample_count: number;
    max: number;
    cells: HeatCell[];
} | null;

type RecentSession = {
    session_id: string;
    actor: string;
    events: number;
    last_path: string;
    last_seen: string;
};

type DayBucket = { date: string; human: number; agent: number };

type Props = {
    pro: boolean;
    proSource: "subscription" | "prize" | null;
    sites: Site[];
    site: string | null;
    kpis: Kpis | null;
    topPaths: TopPath[];
    heatmap: Heatmap;
    recentSessions: RecentSession[];
    eventsOverTime: DayBucket[];
};

export default function AnalyticsIndex(props: Props) {
    if (!props.pro) {
        return (
            <Layout>
                <Head title="Analytics · Fancy UI" />
                <Upsell />
            </Layout>
        );
    }

    const { sites, site, kpis, topPaths, heatmap, recentSessions, eventsOverTime } = props;
    const hasData = (kpis?.totalEvents ?? 0) > 0;

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
                        Live behavioural analytics from the Fancy Heuristics pixel — pageviews,
                        sessions, attention heatmaps, and the human-vs-agent split, straight
                        off the wire.
                    </Text>
                </div>
                <SitePicker sites={sites} site={site} />
            </div>

            {!hasData ? (
                <EmptyState site={site} />
            ) : (
                <>
                    <KpiTiles kpis={kpis!} />

                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
                        <div className="lg:col-span-3">
                            <FocusHeatmap heatmap={heatmap} />
                        </div>
                        <div className="lg:col-span-2">
                            <EventsOverTime data={eventsOverTime} />
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
                        <div className="lg:col-span-3">
                            <TopPathsTable rows={topPaths} />
                        </div>
                        <div className="lg:col-span-2">
                            <RecentSessions rows={recentSessions} />
                        </div>
                    </div>
                </>
            )}
        </Layout>
    );
}

// ─── Site picker ────────────────────────────────────────────────────────────

function SitePicker({ sites, site }: { sites: Site[]; site: string | null }) {
    return (
        <label className="inline-flex items-center gap-2 text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Site</span>
            <select
                data-analytics-site-picker
                value={site ?? ""}
                onChange={(e) =>
                    router.get(
                        "/analytics",
                        { site: e.target.value },
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

// ─── KPI tiles ──────────────────────────────────────────────────────────────

function KpiTiles({ kpis }: { kpis: Kpis }) {
    const tiles: Array<{ label: string; value: string; hint?: string }> = [
        { label: "Pageviews", value: kpis.pageviews.toLocaleString() },
        { label: "Unique sessions", value: kpis.sessions.toLocaleString() },
        {
            label: "Avg time on page",
            value: formatDuration(kpis.avgTimeOnPageMs),
            hint: "from dwell events",
        },
        {
            label: "Clickthrough",
            value: `${(kpis.clickthrough * 100).toFixed(1)}%`,
            hint: `${kpis.clicks.toLocaleString()} clicks`,
        },
        {
            label: "Human : Agent",
            value: `${kpis.human.toLocaleString()} : ${kpis.agent.toLocaleString()}`,
            hint: humanAgentSplit(kpis.human, kpis.agent),
        },
    ];

    return (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {tiles.map((t) => (
                <Card key={t.label} className="p-4" data-kpi={t.label}>
                    <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        {t.label}
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                        {t.value}
                    </div>
                    {t.hint && (
                        <div className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{t.hint}</div>
                    )}
                </Card>
            ))}
        </div>
    );
}

// ─── Focus heatmap ──────────────────────────────────────────────────────────
//
// The real heatmap() grid is a list of cells, each carrying integer grid
// coordinates (x = column 0..grid_size-1, y = row 0..grid_size-1) and a
// normalised `weight` in 0..1 (count / max). We map each cell to a percentage
// position on a page wireframe — left = (x + 0.5) / grid_size, top likewise —
// and paint a warm radial blob whose radius and opacity scale with the weight.
// Heavier cells = bigger, hotter blobs, exactly like a classic attention overlay.

function FocusHeatmap({ heatmap }: { heatmap: Heatmap }) {
    return (
        <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800">
                <div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Focus heatmap
                    </div>
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
                    {/* Page wireframe behind the heat overlay */}
                    <Wireframe />

                    {/* Real heat blobs positioned by the grid weights */}
                    {heatmap?.cells.map((cell) => {
                        const left = ((cell.x + 0.5) / heatmap.grid_size) * 100;
                        const top = ((cell.y + 0.5) / heatmap.grid_size) * 100;
                        // Blob diameter scales with weight; keep a visible floor so
                        // light cells still register. Sized relative to one grid cell.
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
                                    background: `radial-gradient(circle, ${blobColor(cell.weight)} 0%, ${blobColor(
                                        cell.weight,
                                    )}00 70%)`,
                                    mixBlendMode: "multiply",
                                }}
                            />
                        );
                    })}
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

/** A faint page wireframe so the heat overlay reads as "on a page". */
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

/** Cool→hot gradient stop for a given normalised weight. */
function blobColor(weight: number): string {
    if (weight >= 0.66) return "#f43f5e"; // rose-500 (hot)
    if (weight >= 0.33) return "#f59e0b"; // amber-500 (warm)
    return "#38bdf8"; // sky-400 (cool)
}

// ─── Events over time (fancy-echarts) ───────────────────────────────────────

function EventsOverTime({ data }: { data: DayBucket[] }) {
    const dates = data.map((d) => d.date.slice(5)); // MM-DD
    const human = data.map((d) => d.human);
    const agent = data.map((d) => d.agent);

    return (
        <Card className="overflow-hidden">
            <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Events over time
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Daily volume · human vs agent (last {data.length} days)
                </div>
            </div>
            <div className="p-4">
                <EChart
                    style={{ width: "100%", height: 240 }}
                    option={{
                        grid: { left: 36, right: 12, top: 28, bottom: 28 },
                        tooltip: { trigger: "axis" },
                        legend: { data: ["Human", "Agent"], right: 0, top: 0, itemHeight: 8 },
                        xAxis: { type: "category", data: dates, boundaryGap: false },
                        yAxis: { type: "value", minInterval: 1 },
                        series: [
                            {
                                name: "Human",
                                type: "line",
                                smooth: true,
                                showSymbol: false,
                                areaStyle: { opacity: 0.12 },
                                lineStyle: { width: 2 },
                                itemStyle: { color: "#8b5cf6" },
                                data: human,
                            },
                            {
                                name: "Agent",
                                type: "line",
                                smooth: true,
                                showSymbol: false,
                                areaStyle: { opacity: 0.12 },
                                lineStyle: { width: 2 },
                                itemStyle: { color: "#f59e0b" },
                                data: agent,
                            },
                        ],
                    }}
                />
            </div>
        </Card>
    );
}

// ─── Top paths table ────────────────────────────────────────────────────────

function TopPathsTable({ rows }: { rows: TopPath[] }) {
    return (
        <Card className="overflow-hidden">
            <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Top paths</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">By total events</div>
            </div>
            {rows.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-500">No path data yet.</div>
            ) : (
                <Table>
                    <Table.Head>
                        <Table.Row>
                            <Table.Column label="Path" />
                            <Table.Column label="Events" className="!text-right" />
                            <Table.Column label="Views" className="!text-right" />
                            <Table.Column label="Clicks" className="!text-right" />
                            <Table.Column label="Sessions" className="!text-right" />
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {rows.map((r) => (
                            <Table.Row key={r.path} data-path={r.path}>
                                <Table.Cell>
                                    <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                                        {r.path}
                                    </span>
                                </Table.Cell>
                                <Table.Cell className="!text-right tabular-nums">
                                    {r.events.toLocaleString()}
                                </Table.Cell>
                                <Table.Cell className="!text-right tabular-nums">
                                    {r.pageviews.toLocaleString()}
                                </Table.Cell>
                                <Table.Cell className="!text-right tabular-nums">
                                    {r.clicks.toLocaleString()}
                                </Table.Cell>
                                <Table.Cell className="!text-right tabular-nums">
                                    {r.sessions.toLocaleString()}
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            )}
        </Card>
    );
}

// ─── Recent sessions ────────────────────────────────────────────────────────

function RecentSessions({ rows }: { rows: RecentSession[] }) {
    return (
        <Card className="overflow-hidden">
            <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Recent sessions
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Latest activity · tagged human / agent
                </div>
            </div>
            {rows.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-500">No sessions yet.</div>
            ) : (
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {rows.map((s) => (
                        <li
                            key={s.session_id}
                            data-session={s.session_id}
                            className="flex items-center justify-between gap-3 px-4 py-3"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        color={s.actor === "agent" ? "amber" : "violet"}
                                        variant="soft"
                                        size="sm"
                                    >
                                        {s.actor}
                                    </Badge>
                                    <span className="truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
                                        {s.session_id}
                                    </span>
                                </div>
                                <div className="mt-1 truncate font-mono text-xs text-zinc-700 dark:text-zinc-300">
                                    {s.last_path}
                                </div>
                            </div>
                            <div className="shrink-0 text-right">
                                <div className="text-sm font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
                                    {s.events.toLocaleString()}
                                </div>
                                <div className="text-[11px] text-zinc-400">{relativeTime(s.last_seen)}</div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ site }: { site: string | null }) {
    return (
        <Card className="mt-6">
            <div className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-2xl dark:bg-violet-900/30">
                    📊
                </div>
                <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    No data for {site ?? "this site"} yet
                </div>
                <Text className="mx-auto mt-2 max-w-md">
                    The Fancy Pixel hasn't collected any events for this site. Once visitors (or
                    agents) start interacting, pageviews, heatmaps, and session activity will
                    appear here automatically.
                </Text>
            </div>
        </Card>
    );
}

// ─── Upsell (non-Pro) ───────────────────────────────────────────────────────

function Upsell() {
    const features = [
        ["Live focus heatmaps", "See exactly where attention lands, drawn from real pointer and click samples."],
        ["Human + Agent split", "Track how humans and agents share each surface — the Human+ UX signal."],
        ["Session-level detail", "Every recent session, its path, and its event volume — tagged by actor."],
        ["Top paths & trends", "Pageviews, clickthrough, and dwell-derived time-on-page over time."],
    ];

    return (
        <div className="mx-auto max-w-3xl py-6">
            <div className="text-center">
                <Badge color="violet" variant="soft" size="md">Pro feature</Badge>
                <Heading level={1} size="xl" className="mt-4">
                    Analytics is a Pro feature
                </Heading>
                <Text className="mx-auto mt-3 max-w-xl">
                    Unlock the Pro Analytics Suite — live behavioural analytics powered by the
                    Fancy Heuristics pixel. Go Pro by subscribing, or earn the{" "}
                    <span className="font-semibold">sandbox-pro</span> prize by reaching the
                    Ambassador tier of overall engagement.
                </Text>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {features.map(([title, body]) => (
                    <Card key={title} className="p-5">
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
                        <Text className="mt-1 text-sm">{body}</Text>
                    </Card>
                ))}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
                <a
                    href="/subscriptions"
                    className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                    Go Pro
                </a>
                <a
                    href="/leaderboard"
                    className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-violet-400 dark:border-zinc-700 dark:text-zinc-200"
                >
                    Earn it — see the leaderboard
                </a>
            </div>
        </div>
    );
}

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
    if (!ms || ms <= 0) return "—";
    const s = ms / 1000;
    if (s < 60) return `${s.toFixed(s < 10 ? 1 : 0)}s`;
    const m = Math.floor(s / 60);
    const rem = Math.round(s % 60);
    return `${m}m ${rem}s`;
}

function humanAgentSplit(human: number, agent: number): string {
    const total = human + agent;
    if (total === 0) return "no activity";
    const agentPct = Math.round((agent / total) * 100);
    return `${agentPct}% agent`;
}

function relativeTime(iso: string): string {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "";
    const diff = Date.now() - then;
    const s = Math.round(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.round(h / 24)}d ago`;
}
