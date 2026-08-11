import { Head, Link, router } from "@inertiajs/react";
import { Badge, Button, Card, Icon, Table } from "@particle-academy/react-fancy";
import { EChart } from "@particle-academy/fancy-echarts";
import { adminLayout } from "../AdminLayout";
import { PageHeader, StatCard, StatusDot, EmptyRow } from "../ui";

type Site = {
    site_key: string;
    url: string | null;
    visible: boolean;
    pixel_status: string | null;
    last_verified_at: string | null;
    last_verified_human: string | null;
};

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

type RecentSession = { session_id: string; actor: string; events: number; last_path: string; last_seen: string };
type DayBucket = { date: string; human: number; agent: number };
type PixelPing = { style: string; mode: string; visible: boolean; path: string; pinged_at: string | null };

type Props = {
    site: Site;
    kpis: Kpis;
    topPaths: TopPath[];
    heatmap: Heatmap;
    recentSessions: RecentSession[];
    eventsOverTime: DayBucket[];
    pixelPings: PixelPing[];
    pending: number;
};

const n = (v: number) => v.toLocaleString();

function HeuristicsShow({ site, kpis, topPaths, heatmap, recentSessions, eventsOverTime, pixelPings }: Props) {
    const hasData = kpis.totalEvents > 0;

    return (
        <>
            <Head title={`${site.site_key} · Heuristics · Admin`} />
            <PageHeader
                title={site.site_key}
                sub={site.url ?? "no URL on record"}
                actions={
                    <div style={{ display: "flex", gap: 8 }}>
                        <Button
                            color="violet"
                            size="sm"
                            icon="refresh-cw"
                            onClick={() => router.post(`/admin/heuristics/${site.site_key}/verify`, {}, { preserveScroll: true })}
                        >
                            Verify now
                        </Button>
                        <Button as={Link} variant="ghost" size="sm" icon="arrow-left" href="/admin/heuristics">
                            All sites
                        </Button>
                    </div>
                }
            />

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <StatusDot ok={site.visible} on="Visible" off="Hidden" />
                {site.pixel_status && (
                    <Badge color={site.pixel_status === "passed" ? "emerald" : site.pixel_status === "failed" ? "red" : "zinc"}>
                        pixel {site.pixel_status}
                    </Badge>
                )}
                {site.last_verified_human && (
                    <span style={{ fontSize: 12, color: "var(--fg-3)" }}>verified {site.last_verified_human}</span>
                )}
            </div>

            {!hasData ? (
                <Card>
                    <EmptyRow>
                        The Fancy Pixel hasn't collected any events for <strong>{site.site_key}</strong> yet. Once visitors
                        or agents interact, KPIs, heatmaps, and sessions appear here automatically.
                    </EmptyRow>
                </Card>
            ) : (
                <>
                    <div className="admin-grid-stats">
                        <StatCard label="Pageviews" value={n(kpis.pageviews)} icon="eye" sub={`${n(kpis.totalEvents)} total events`} />
                        <StatCard label="Unique sessions" value={n(kpis.sessions)} icon="users" />
                        <StatCard label="Avg time on page" value={formatDuration(kpis.avgTimeOnPageMs)} icon="clock" sub="from dwell events" />
                    </div>
                    <div className="admin-grid-stats" style={{ marginTop: 14 }}>
                        <StatCard label="Clickthrough" value={`${(kpis.clickthrough * 100).toFixed(1)}%`} icon="mouse-pointer-click" sub={`${n(kpis.clicks)} clicks`} />
                        <StatCard label="Human events" value={n(kpis.human)} icon="user" />
                        <StatCard label="Agent events" value={n(kpis.agent)} icon="bot" sub={humanAgentSplit(kpis.human, kpis.agent)} />
                    </div>

                    <div className="admin-grid-2" style={{ marginTop: 16, gridTemplateColumns: "1.6fr 1fr" }}>
                        <FocusHeatmap heatmap={heatmap} />
                        <EventsOverTime data={eventsOverTime} />
                    </div>

                    <div className="admin-grid-2" style={{ marginTop: 16, gridTemplateColumns: "1.6fr 1fr" }}>
                        <TopPathsTable rows={topPaths} />
                        <RecentSessions rows={recentSessions} />
                    </div>

                    <div className="admin-stack" style={{ marginTop: 16 }}>
                        <PixelPings rows={pixelPings} />
                    </div>
                </>
            )}
        </>
    );
}

// ─── Focus heatmap ──────────────────────────────────────────────────────────
//
// The real heatmap() grid is a list of cells, each carrying integer grid
// coordinates and a normalised `weight` in 0..1 (count / max). Each cell maps to
// a percentage position on a page wireframe and paints a warm radial blob whose
// radius + opacity scale with the weight — the same genuine overlay the Pro
// dashboard renders, restyled with the admin sb-* palette.

function FocusHeatmap({ heatmap }: { heatmap: Heatmap }) {
    return (
        <Card style={{ overflow: "hidden" }}>
            <Card.Header>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", gap: 12 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <Icon name="flame" size="sm" style={{ color: "var(--fg-3)" }} /> Focus heatmap
                    </span>
                    {heatmap && <Badge color="amber">{heatmap.grid_size}×{heatmap.grid_size} grid</Badge>}
                </div>
            </Card.Header>
            <Card.Body>
                <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 12 }}>
                    {heatmap
                        ? `Busiest path · ${heatmap.path} · ${n(heatmap.sample_count)} pointer/click samples`
                        : "No pointer activity yet"}
                </div>
                <div
                    data-heatmap-canvas
                    style={{
                        position: "relative",
                        aspectRatio: "16 / 10",
                        width: "100%",
                        overflow: "hidden",
                        borderRadius: 10,
                        border: "1px solid var(--border-1)",
                        background: "var(--bg-2)",
                    }}
                >
                    <Wireframe />
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
                                style={{
                                    position: "absolute",
                                    pointerEvents: "none",
                                    transform: "translate(-50%, -50%)",
                                    borderRadius: "999px",
                                    left: `${left}%`,
                                    top: `${top}%`,
                                    width: `${size}%`,
                                    height: `${size}%`,
                                    opacity,
                                    background: `radial-gradient(circle, ${blobColor(cell.weight)} 0%, ${blobColor(cell.weight)}00 70%)`,
                                    mixBlendMode: "multiply",
                                }}
                            />
                        );
                    })}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--fg-3)", marginTop: 12 }}>
                    <span>cool</span>
                    <span style={{ height: 8, flex: 1, borderRadius: 999, background: "linear-gradient(to right, #38bdf8, #f59e0b, #f43f5e)" }} />
                    <span>hot</span>
                </div>
            </Card.Body>
        </Card>
    );
}

function Wireframe() {
    const block = (style: React.CSSProperties): React.CSSProperties => ({
        borderRadius: 4,
        background: "var(--fg-4)",
        ...style,
    });
    return (
        <div style={{ position: "absolute", inset: 0, padding: "6%", opacity: 0.3 }}>
            <div style={block({ height: "8%", width: "100%" })} />
            <div style={block({ height: "22%", width: "75%", marginTop: "4%" })} />
            <div style={block({ height: "6%", width: "50%", marginTop: "3%" })} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "3%", marginTop: "6%" }}>
                <div style={block({ height: 64 })} />
                <div style={block({ height: 64 })} />
                <div style={block({ height: 64 })} />
            </div>
            <div style={block({ height: "10%", width: "40%", marginTop: "5%" })} />
        </div>
    );
}

function blobColor(weight: number): string {
    if (weight >= 0.66) return "#f43f5e";
    if (weight >= 0.33) return "#f59e0b";
    return "#38bdf8";
}

// ─── Events over time (fancy-echarts) ───────────────────────────────────────

function EventsOverTime({ data }: { data: DayBucket[] }) {
    const dates = data.map((d) => d.date.slice(5));
    const human = data.map((d) => d.human);
    const agent = data.map((d) => d.agent);

    return (
        <Card style={{ overflow: "hidden" }}>
            <Card.Header>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Icon name="trending-up" size="sm" style={{ color: "var(--fg-3)" }} /> Events over time
                </span>
            </Card.Header>
            <Card.Body>
                <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 8 }}>
                    Daily volume · human vs agent (last {data.length} days)
                </div>
                <EChart
                    style={{ width: "100%", height: 230 }}
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
            </Card.Body>
        </Card>
    );
}

// ─── Top paths ──────────────────────────────────────────────────────────────

function TopPathsTable({ rows }: { rows: TopPath[] }) {
    return (
        <Card style={{ overflow: "hidden" }}>
            <Card.Header>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Icon name="list" size="sm" style={{ color: "var(--fg-3)" }} /> Top paths
                </span>
            </Card.Header>
            {rows.length === 0 ? (
                <EmptyRow>No path data yet.</EmptyRow>
            ) : (
                <div className="admin-table-wrap">
                    <Table>
                        <Table.Head>
                            <Table.Row>
                                <Table.Cell header>Path</Table.Cell>
                                <Table.Cell header>Events</Table.Cell>
                                <Table.Cell header>Views</Table.Cell>
                                <Table.Cell header>Clicks</Table.Cell>
                                <Table.Cell header>Sessions</Table.Cell>
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {rows.map((r) => (
                                <Table.Row key={r.path} data-path={r.path}>
                                    <Table.Cell>
                                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--fg-2)" }}>{r.path}</span>
                                    </Table.Cell>
                                    <Table.Cell><Num v={r.events} /></Table.Cell>
                                    <Table.Cell><Num v={r.pageviews} /></Table.Cell>
                                    <Table.Cell><Num v={r.clicks} /></Table.Cell>
                                    <Table.Cell><Num v={r.sessions} /></Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </div>
            )}
        </Card>
    );
}

function Num({ v }: { v: number }) {
    return <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{n(v)}</span>;
}

// ─── Recent sessions ────────────────────────────────────────────────────────

function RecentSessions({ rows }: { rows: RecentSession[] }) {
    return (
        <Card style={{ overflow: "hidden" }}>
            <Card.Header>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Icon name="history" size="sm" style={{ color: "var(--fg-3)" }} /> Recent sessions
                </span>
            </Card.Header>
            {rows.length === 0 ? (
                <EmptyRow>No sessions yet.</EmptyRow>
            ) : (
                <div>
                    {rows.map((s, i) => (
                        <div
                            key={s.session_id}
                            data-session={s.session_id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 12,
                                padding: "11px 16px",
                                borderBottom: i === rows.length - 1 ? "none" : "1px solid var(--border-1)",
                            }}
                        >
                            <div style={{ minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <Badge color={s.actor === "agent" ? "amber" : "violet"}>{s.actor}</Badge>
                                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.session_id}</span>
                                </div>
                                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-2)", marginTop: 4 }}>{s.last_path}</div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)" }}>{n(s.events)}</div>
                                <div style={{ fontSize: 11, color: "var(--fg-4)" }}>{relativeTime(s.last_seen)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

// ─── Pixel pings ────────────────────────────────────────────────────────────

function PixelPings({ rows }: { rows: PixelPing[] }) {
    return (
        <Card>
            <Card.Header>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Icon name="radio" size="sm" style={{ color: "var(--fg-3)" }} /> Recent pixel pings
                </span>
            </Card.Header>
            {rows.length === 0 ? (
                <EmptyRow>No pixel pings recorded for this site yet.</EmptyRow>
            ) : (
                <div className="admin-table-wrap">
                    <Table>
                        <Table.Head>
                            <Table.Row>
                                <Table.Cell header>Style</Table.Cell>
                                <Table.Cell header>Mode</Table.Cell>
                                <Table.Cell header>Visible</Table.Cell>
                                <Table.Cell header>Path</Table.Cell>
                                <Table.Cell header>Pinged</Table.Cell>
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {rows.map((p, i) => (
                                <Table.Row key={i}>
                                    <Table.Cell><Badge color="sky">{p.style}</Badge></Table.Cell>
                                    <Table.Cell><span style={{ fontSize: 13, color: "var(--fg-2)" }}>{p.mode}</span></Table.Cell>
                                    <Table.Cell><StatusDot ok={p.visible} on="yes" off="no" /></Table.Cell>
                                    <Table.Cell><span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--fg-2)" }}>{p.path}</span></Table.Cell>
                                    <Table.Cell><span style={{ fontSize: 13, color: "var(--fg-3)" }}>{p.pinged_at ?? "—"}</span></Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                </div>
            )}
        </Card>
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
    return `${Math.round((agent / total) * 100)}% agent`;
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

HeuristicsShow.layout = adminLayout;
export default HeuristicsShow;
