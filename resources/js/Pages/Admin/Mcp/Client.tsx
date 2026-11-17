import { Head, Link } from "@inertiajs/react";
import { Badge, Button, Table } from "@particle-academy/react-fancy";
import { adminLayout } from "../AdminLayout";
import { EmptyRow, PageHeader, StatCard } from "../ui";
import {
    clientHref,
    DailyChart,
    ErrorGroupsTable,
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
    withRange,
    type ErrorGroup,
    type Range,
    type SessionRow,
} from "./parts";

type Props = {
    range: Range;
    client: { name: string; key: string; version: string | null };
    totals: { requests: number; errors: number; errorRate: number; sessions: number; toolCalls: number };
    versions: { version: string; sessions: number; requests: number; errors: number }[];
    series: { date: string; requests: number; errors: number }[];
    toolMix: { tool: string; calls: number; errors: number; errorRate: number; empty: number; avgLatency: number | null; p95: number | null }[];
    errors: ErrorGroup[];
    sessions: SessionRow[];
};

/** /admin/mcp/clients/{client}?version= — one client's sessions, tool mix and errors. */
function McpClient({ range, client, totals, versions, series, toolMix, errors, sessions }: Props) {
    const title = client.version ? `${client.name} ${client.version}` : client.name;

    return (
        <>
            <Head title={`${title} · MCP usage · Admin`} />
            <PageHeader
                title={title}
                sub={`MCP client${client.version ? "" : " · all versions"} · ${range.from} to ${range.to}`}
                actions={
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <RangePicker range={range} />
                        {client.version && (
                            <Button as={Link} variant="ghost" size="sm" icon="layers" href={clientHref(client.key, null, range)}>All versions</Button>
                        )}
                        <Button as={Link} variant="ghost" size="sm" icon="arrow-left" href={withRange("/admin/mcp", range)}>Overview</Button>
                    </div>
                }
            />
            <div style={{ marginBottom: 16 }}>
                <McpTabs range={range} />
            </div>

            <div className="admin-grid-stats" data-mcp-client-totals={client.key}>
                <StatCard label="Requests" value={n(totals.requests)} icon="activity" sub={`${n(totals.toolCalls)} tool calls`} />
                <StatCard label="Sessions" value={n(totals.sessions)} icon="plug" />
                <StatCard label="Error rate" value={pct(totals.errorRate)} icon="circle-alert" sub={`${n(totals.errors)} errors`} />
            </div>

            <div className="admin-grid-2" style={{ marginTop: 16 }}>
                <Section title="Requests over time" icon="trending-up" handle="client-series">
                    <div style={{ padding: "8px 16px 12px" }}>
                        <DailyChart
                            rows={series}
                            series={[
                                { name: "Requests", key: "requests", color: "#8b5cf6" },
                                { name: "Errors", key: "errors", color: "#ef4444" },
                            ]}
                        />
                    </div>
                </Section>
                <Section title="Tool mix" icon="chart-bar" handle="client-tool-mix">
                    {toolMix.length === 0 ? (
                        <EmptyRow>No tool calls in this range.</EmptyRow>
                    ) : (
                        <div style={{ padding: "8px 12px" }}>
                            <RankChart rows={toolMix.slice(0, 12).map((t) => ({ label: t.tool, value: t.calls }))} />
                        </div>
                    )}
                </Section>
            </div>

            <div className="admin-grid-2" style={{ marginTop: 16, gridTemplateColumns: "1.4fr 1fr" }}>
                <Section title="Tools" icon="wrench" handle="client-tools">
                    {toolMix.length === 0 ? (
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
                                        <Table.Cell header>p95</Table.Cell>
                                    </Table.Row>
                                </Table.Head>
                                <Table.Body>
                                    {toolMix.map((t) => (
                                        <Table.Row key={t.tool} data-mcp-tool={t.tool}>
                                            <Table.Cell><Link href={toolHref(t.tool, range)}><Mono>{t.tool}</Mono></Link></Table.Cell>
                                            <Table.Cell><strong>{n(t.calls)}</strong></Table.Cell>
                                            <Table.Cell>{t.errors > 0 ? <Badge size="sm" color="red">{n(t.errors)}</Badge> : "0"}</Table.Cell>
                                            <Table.Cell>{t.empty > 0 ? <Badge size="sm" color="amber">{n(t.empty)}</Badge> : "0"}</Table.Cell>
                                            <Table.Cell>{ms(t.p95)}</Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </div>
                    )}
                </Section>
                <Section title="Versions" icon="tag" handle="client-versions">
                    {versions.length === 0 ? (
                        <EmptyRow>No versions recorded.</EmptyRow>
                    ) : (
                        <div className="admin-table-wrap">
                            <Table>
                                <Table.Head>
                                    <Table.Row>
                                        <Table.Cell header>Version</Table.Cell>
                                        <Table.Cell header>Sessions</Table.Cell>
                                        <Table.Cell header>Requests</Table.Cell>
                                        <Table.Cell header>Errors</Table.Cell>
                                    </Table.Row>
                                </Table.Head>
                                <Table.Body>
                                    {versions.map((v) => (
                                        <Table.Row key={v.version} data-mcp-client-version={v.version}>
                                            <Table.Cell>
                                                <Link href={clientHref(client.key, v.version || null, range)}><Mono>{v.version || "(none)"}</Mono></Link>
                                            </Table.Cell>
                                            <Table.Cell>{n(v.sessions)}</Table.Cell>
                                            <Table.Cell><strong>{n(v.requests)}</strong></Table.Cell>
                                            <Table.Cell>{v.errors > 0 ? <Badge size="sm" color="red">{n(v.errors)}</Badge> : "0"}</Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </div>
                    )}
                </Section>
            </div>

            <div className="admin-stack" style={{ marginTop: 16 }}>
                <Section title="Errors" icon="circle-alert" handle="client-errors">
                    {errors.length === 0 ? <EmptyRow>No errors in this range.</EmptyRow> : <ErrorGroupsTable rows={errors} range={range} />}
                </Section>
                <Section title="Sessions" icon="history" handle="client-sessions">
                    {sessions.length === 0 ? <EmptyRow>No sessions in this range.</EmptyRow> : <SessionsTable rows={sessions} range={range} />}
                </Section>
            </div>
        </>
    );
}

McpClient.layout = adminLayout;
export default McpClient;
