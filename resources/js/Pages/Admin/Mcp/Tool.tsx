import { Head, Link } from "@inertiajs/react";
import { Badge, Button, Table } from "@particle-academy/react-fancy";
import { EChart } from "@particle-academy/fancy-echarts";
import { adminLayout } from "../AdminLayout";
import { EmptyRow, PageHeader, StatCard } from "../ui";
import {
    CallsTable,
    clientHref,
    DailyChart,
    ErrorGroupsTable,
    McpTabs,
    Mono,
    ms,
    n,
    pct,
    RangePicker,
    Section,
    withRange,
    type CallRow,
    type ErrorGroup,
    type Range,
} from "./parts";

type ArgValue = { value: string; calls: number; empty: number; errors: number; lastDay: string };

type Props = {
    range: Range;
    tool: string;
    totals: { calls: number; errors: number; errorRate: number; empty: number; avgLatency: number | null };
    series: { date: string; calls: number; errors: number; empty: number }[];
    latency: { p50: number | null; p95: number | null; p99: number | null; max: number | null; buckets: { label: string; count: number }[] };
    argValues: { key: string; calls: number; distinct: number; values: ArgValue[] }[];
    errorGroups: ErrorGroup[];
    recentErrors: CallRow[];
    clients: { name: string; key: string; version: string; calls: number; errors: number }[];
};

/** /admin/mcp/tools/{tool} — one tool's calls, arguments, errors, latency and clients. */
function McpTool({ range, tool, totals, series, latency, argValues, errorGroups, recentErrors, clients }: Props) {
    // Trim the empty buckets at either end so the bars fill the chart.
    const first = latency.buckets.findIndex((b) => b.count > 0);
    const last = latency.buckets.length - 1 - [...latency.buckets].reverse().findIndex((b) => b.count > 0);
    const buckets = first === -1 ? [] : latency.buckets.slice(first, last + 1);

    return (
        <>
            <Head title={`${tool} · MCP usage · Admin`} />
            <PageHeader
                title={tool}
                sub={`Tool calls · ${range.from} to ${range.to}`}
                actions={
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <RangePicker range={range} />
                        <Button as={Link} variant="ghost" size="sm" icon="arrow-left" href={withRange("/admin/mcp", range)}>Overview</Button>
                    </div>
                }
            />
            <div style={{ marginBottom: 16 }}>
                <McpTabs range={range} />
            </div>

            <div className="admin-grid-stats" data-mcp-tool-totals={tool}>
                <StatCard label="Calls" value={n(totals.calls)} icon="activity" sub={`${n(totals.empty)} empty results`} />
                <StatCard label="Error rate" value={pct(totals.errorRate)} icon="circle-alert" sub={`${n(totals.errors)} errors`} />
                <StatCard label="Latency p50 / p95" value={`${ms(latency.p50)} / ${ms(latency.p95)}`} icon="timer" sub={`avg ${ms(totals.avgLatency)} · max ${ms(latency.max)}`} />
            </div>

            <div className="admin-grid-2" style={{ marginTop: 16 }}>
                <Section title="Calls over time" icon="trending-up" handle="tool-series">
                    <div style={{ padding: "8px 16px 12px" }}>
                        <DailyChart
                            rows={series}
                            series={[
                                { name: "Calls", key: "calls", color: "#8b5cf6" },
                                { name: "Errors", key: "errors", color: "#ef4444" },
                                { name: "Empty", key: "empty", color: "#f59e0b" },
                            ]}
                        />
                    </div>
                </Section>
                <Section title="Latency distribution" icon="gauge" handle="tool-latency" aside={<Badge size="sm" color="zinc">{`p99 ${ms(latency.p99)}`}</Badge>}>
                    <div style={{ padding: "8px 16px 12px" }}>
                        <EChart
                            style={{ width: "100%", height: 240 }}
                            option={{
                                grid: { left: 40, right: 12, top: 16, bottom: 40 },
                                tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
                                xAxis: { type: "category", data: buckets.map((b) => b.label), axisLabel: { rotate: 35, fontSize: 10 } },
                                yAxis: { type: "value", minInterval: 1 },
                                series: [{ type: "bar", data: buckets.map((b) => b.count), itemStyle: { color: "#0ea5e9", borderRadius: [4, 4, 0, 0] } }],
                            }}
                        />
                    </div>
                </Section>
            </div>

            <div className="admin-stack" style={{ marginTop: 16 }}>
                <Section title="Top argument values" icon="list-ordered" handle="tool-arg-values">
                    {argValues.length === 0 ? (
                        <EmptyRow>No scalar arguments recorded for this tool.</EmptyRow>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 0 }}>
                            {argValues.map((arg) => (
                                <div key={arg.key} data-mcp-arg={arg.key} style={{ borderTop: "1px solid var(--border-1)" }}>
                                    <div style={{ padding: "10px 16px", fontSize: 12, color: "var(--fg-3)" }}>
                                        <Mono>{arg.key}</Mono> · {n(arg.calls)} calls · {n(arg.distinct)} distinct values
                                    </div>
                                    <div className="admin-table-wrap">
                                        <Table>
                                            <Table.Head>
                                                <Table.Row>
                                                    <Table.Cell header>Value</Table.Cell>
                                                    <Table.Cell header>Calls</Table.Cell>
                                                    <Table.Cell header>Empty</Table.Cell>
                                                    <Table.Cell header>Errors</Table.Cell>
                                                </Table.Row>
                                            </Table.Head>
                                            <Table.Body>
                                                {arg.values.map((v) => (
                                                    <Table.Row key={v.value} data-mcp-arg-value={v.value}>
                                                        <Table.Cell><Mono>{v.value}</Mono></Table.Cell>
                                                        <Table.Cell><strong>{n(v.calls)}</strong></Table.Cell>
                                                        <Table.Cell>{v.empty > 0 ? <Badge size="sm" color="amber">{n(v.empty)}</Badge> : "0"}</Table.Cell>
                                                        <Table.Cell>{v.errors > 0 ? <Badge size="sm" color="red">{n(v.errors)}</Badge> : "0"}</Table.Cell>
                                                    </Table.Row>
                                                ))}
                                            </Table.Body>
                                        </Table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>
            </div>

            <div className="admin-grid-2" style={{ marginTop: 16, gridTemplateColumns: "1fr 1.4fr" }}>
                <Section title="Clients using it" icon="bot" handle="tool-clients">
                    {clients.length === 0 ? (
                        <EmptyRow>No calls in this range.</EmptyRow>
                    ) : (
                        <div className="admin-table-wrap">
                            <Table>
                                <Table.Head>
                                    <Table.Row>
                                        <Table.Cell header>Client</Table.Cell>
                                        <Table.Cell header>Calls</Table.Cell>
                                        <Table.Cell header>Errors</Table.Cell>
                                    </Table.Row>
                                </Table.Head>
                                <Table.Body>
                                    {clients.map((c) => (
                                        <Table.Row key={`${c.key}@${c.version}`} data-mcp-client={c.key}>
                                            <Table.Cell>
                                                <Link href={clientHref(c.key, c.version || null, range)}>
                                                    {c.name}
                                                    {c.version ? ` ${c.version}` : ""}
                                                </Link>
                                            </Table.Cell>
                                            <Table.Cell><strong>{n(c.calls)}</strong></Table.Cell>
                                            <Table.Cell>{c.errors > 0 ? <Badge size="sm" color="red">{n(c.errors)}</Badge> : "0"}</Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </div>
                    )}
                </Section>
                <Section title="Errors" icon="circle-alert" handle="tool-errors">
                    {errorGroups.length === 0 ? <EmptyRow>No errors in this range.</EmptyRow> : <ErrorGroupsTable rows={errorGroups} range={range} tool={tool} />}
                </Section>
            </div>

            {recentErrors.length > 0 && (
                <div className="admin-stack" style={{ marginTop: 16 }}>
                    <Section title="Recent failing calls" icon="history" handle="tool-recent-errors">
                        <CallsTable rows={recentErrors} range={range} />
                    </Section>
                </div>
            )}
        </>
    );
}

McpTool.layout = adminLayout;
export default McpTool;
