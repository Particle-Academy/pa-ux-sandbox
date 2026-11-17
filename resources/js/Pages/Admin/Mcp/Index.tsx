import { Head, Link } from "@inertiajs/react";
import { Badge, Table } from "@particle-academy/react-fancy";
import { adminLayout } from "../AdminLayout";
import { EmptyRow, PageHeader, StatCard } from "../ui";
import {
    clientHref,
    DailyChart,
    McpTabs,
    Mono,
    ms,
    n,
    pct,
    RangePicker,
    RankChart,
    Section,
    SessionsTable,
    toolHref,
    when,
    type Range,
    type SessionRow,
} from "./parts";

type ToolRow = { tool: string; calls: number; errors: number; errorRate: number; empty: number; avgLatency: number | null; p95: number | null };
type ClientRow = { name: string; key: string; version: string; sessions: number; requests: number; errors: number };

type Props = {
    range: Range;
    totals: { requests: number; errors: number; errorRate: number; sessions: number; clients: number; toolCalls: number; p50: number | null; p95: number | null };
    series: { date: string; requests: number; errors: number; errorRate: number; sessions: number; clients: number }[];
    topTools: ToolRow[];
    topClients: ClientRow[];
    methods: { method: string; requests: number }[];
    recentSessions: SessionRow[];
    rolledAt: string | null;
};

/** /admin/mcp — how agents use the hosted MCP server. */
function McpOverview({ range, totals, series, topTools, topClients, methods, recentSessions, rolledAt }: Props) {
    return (
        <>
            <Head title="MCP usage · Admin" />
            <PageHeader
                title="MCP usage"
                sub={`How agents use the hosted fancy-ui MCP server · ${range.from} to ${range.to}${rolledAt ? ` · rolled up ${when(rolledAt)}` : ""}`}
                actions={<RangePicker range={range} />}
            />
            <div style={{ marginBottom: 16 }}>
                <McpTabs range={range} />
            </div>

            {totals.requests === 0 ? (
                <Section title="No traffic" icon="plug" handle="empty">
                    <EmptyRow>No MCP requests were recorded in this range. Rollups run every few minutes, so new traffic can take a moment to appear.</EmptyRow>
                </Section>
            ) : (
                <>
                    <div className="admin-grid-stats" data-mcp-totals>
                        <StatCard label="Requests" value={n(totals.requests)} icon="activity" sub={`${n(totals.toolCalls)} tool calls`} />
                        <StatCard label="Sessions" value={n(totals.sessions)} icon="plug" sub={`${n(totals.clients)} distinct clients`} />
                        <StatCard label="Error rate" value={pct(totals.errorRate)} icon="circle-alert" sub={`${n(totals.errors)} errors`} />
                    </div>
                    <div className="admin-grid-stats" style={{ marginTop: 14 }}>
                        <StatCard label="Latency p50" value={ms(totals.p50)} icon="timer" sub="estimated from histograms" />
                        <StatCard label="Latency p95" value={ms(totals.p95)} icon="gauge" sub="estimated from histograms" />
                        <StatCard label="Clients" value={n(totals.clients)} icon="bot" sub="by clientInfo name" />
                    </div>

                    <div className="admin-grid-2" style={{ marginTop: 16 }}>
                        <Section title="Requests and errors" icon="trending-up" handle="requests-series">
                            <div style={{ padding: "8px 16px 12px" }}>
                                <DailyChart
                                    rows={series}
                                    percentAxis
                                    series={[
                                        { name: "Requests", key: "requests", color: "#8b5cf6" },
                                        { name: "Errors", key: "errors", color: "#ef4444" },
                                        { name: "Error rate", key: "errorRate", color: "#f59e0b", axis: 1 },
                                    ]}
                                />
                            </div>
                        </Section>
                        <Section title="Sessions and clients" icon="users" handle="sessions-series">
                            <div style={{ padding: "8px 16px 12px" }}>
                                <DailyChart
                                    rows={series}
                                    series={[
                                        { name: "Sessions", key: "sessions", color: "#0ea5e9", type: "bar" },
                                        { name: "Distinct clients", key: "clients", color: "#10b981" },
                                    ]}
                                />
                            </div>
                        </Section>
                    </div>

                    <div className="admin-grid-2" style={{ marginTop: 16, gridTemplateColumns: "1.5fr 1fr" }}>
                        <Section title="Top tools" icon="wrench" handle="top-tools" aside={<Badge size="sm" color="violet">{topTools.length}</Badge>}>
                            {topTools.length === 0 ? (
                                <EmptyRow>No tool calls in this range.</EmptyRow>
                            ) : (
                                <div className="admin-table-wrap">
                                    <Table>
                                        <Table.Head>
                                            <Table.Row>
                                                <Table.Cell header>Tool</Table.Cell>
                                                <Table.Cell header>Calls</Table.Cell>
                                                <Table.Cell header>Errors</Table.Cell>
                                                <Table.Cell header>Empty</Table.Cell>
                                                <Table.Cell header>Avg</Table.Cell>
                                                <Table.Cell header>p95</Table.Cell>
                                            </Table.Row>
                                        </Table.Head>
                                        <Table.Body>
                                            {topTools.map((t) => (
                                                <Table.Row key={t.tool} data-mcp-tool={t.tool}>
                                                    <Table.Cell><Link href={toolHref(t.tool, range)}><Mono>{t.tool}</Mono></Link></Table.Cell>
                                                    <Table.Cell><strong>{n(t.calls)}</strong></Table.Cell>
                                                    <Table.Cell>{t.errors > 0 ? <Badge size="sm" color="red">{`${n(t.errors)} · ${pct(t.errorRate)}`}</Badge> : "0"}</Table.Cell>
                                                    <Table.Cell>{t.empty > 0 ? <Badge size="sm" color="amber">{n(t.empty)}</Badge> : "0"}</Table.Cell>
                                                    <Table.Cell>{ms(t.avgLatency)}</Table.Cell>
                                                    <Table.Cell>{ms(t.p95)}</Table.Cell>
                                                </Table.Row>
                                            ))}
                                        </Table.Body>
                                    </Table>
                                </div>
                            )}
                        </Section>
                        <Section title="Tool mix" icon="chart-bar" handle="tool-mix">
                            <div style={{ padding: "8px 12px" }}>
                                <RankChart rows={topTools.slice(0, 10).map((t) => ({ label: t.tool, value: t.calls }))} />
                            </div>
                        </Section>
                    </div>

                    <div className="admin-grid-2" style={{ marginTop: 16, gridTemplateColumns: "1.5fr 1fr" }}>
                        <Section title="Top clients" icon="bot" handle="top-clients">
                            <div className="admin-table-wrap">
                                <Table>
                                    <Table.Head>
                                        <Table.Row>
                                            <Table.Cell header>Client</Table.Cell>
                                            <Table.Cell header>Version</Table.Cell>
                                            <Table.Cell header>Sessions</Table.Cell>
                                            <Table.Cell header>Requests</Table.Cell>
                                            <Table.Cell header>Errors</Table.Cell>
                                        </Table.Row>
                                    </Table.Head>
                                    <Table.Body>
                                        {topClients.map((c) => (
                                            <Table.Row key={`${c.key}@${c.version}`} data-mcp-client={c.key} data-mcp-client-version={c.version}>
                                                <Table.Cell><Link href={clientHref(c.key, null, range)}>{c.name}</Link></Table.Cell>
                                                <Table.Cell>
                                                    {c.version ? <Link href={clientHref(c.key, c.version, range)}><Mono>{c.version}</Mono></Link> : "—"}
                                                </Table.Cell>
                                                <Table.Cell>{n(c.sessions)}</Table.Cell>
                                                <Table.Cell><strong>{n(c.requests)}</strong></Table.Cell>
                                                <Table.Cell>{c.errors > 0 ? <Badge size="sm" color="red">{n(c.errors)}</Badge> : "0"}</Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table>
                            </div>
                        </Section>
                        <Section title="Methods" icon="list" handle="methods">
                            <div style={{ padding: "8px 12px" }}>
                                <RankChart rows={methods.map((m) => ({ label: m.method, value: m.requests }))} color="#0ea5e9" />
                            </div>
                        </Section>
                    </div>

                    <div className="admin-stack" style={{ marginTop: 16 }}>
                        <Section title="Recent sessions" icon="history" handle="recent-sessions">
                            {recentSessions.length === 0 ? <EmptyRow>No sessions in this range.</EmptyRow> : <SessionsTable rows={recentSessions} range={range} />}
                        </Section>
                    </div>
                </>
            )}
        </>
    );
}

McpOverview.layout = adminLayout;
export default McpOverview;
