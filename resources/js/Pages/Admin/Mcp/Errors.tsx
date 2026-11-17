import { Head, Link } from "@inertiajs/react";
import { Badge, Button } from "@particle-academy/react-fancy";
import { adminLayout } from "../AdminLayout";
import { EmptyRow, PageHeader } from "../ui";
import { DailyChart, ErrorGroupsTable, McpTabs, n, RangePicker, Section, withRange, type ErrorGroup, type Range } from "./parts";

type Props = {
    range: Range;
    total: number;
    groups: ErrorGroup[];
    series: { date: string; error: number; tool_error: number; http_error: number }[];
};

/** /admin/mcp/errors — every error, grouped by status, code, method and tool. */
function McpErrors({ range, total, groups, series }: Props) {
    return (
        <>
            <Head title="Errors · MCP usage · Admin" />
            <PageHeader
                title="MCP errors"
                sub={`${n(total)} failed requests · ${range.from} to ${range.to}`}
                actions={
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <RangePicker range={range} />
                        <Button as={Link} variant="ghost" size="sm" icon="list" href={withRange("/admin/mcp/errors/calls", range)}>All failing calls</Button>
                    </div>
                }
            />
            <div style={{ marginBottom: 16 }}>
                <McpTabs range={range} />
            </div>

            <div className="admin-stack">
                <Section title="Errors over time" icon="trending-up" handle="errors-series">
                    <div style={{ padding: "8px 16px 12px" }}>
                        <DailyChart
                            rows={series}
                            series={[
                                { name: "JSON-RPC error", key: "error", color: "#ef4444", type: "bar", stack: "e" },
                                { name: "Tool error", key: "tool_error", color: "#f59e0b", type: "bar", stack: "e" },
                                { name: "HTTP error", key: "http_error", color: "#a855f7", type: "bar", stack: "e" },
                            ]}
                        />
                    </div>
                </Section>
                <Section title="Grouped by code and tool" icon="layers" handle="errors-groups" aside={<Badge size="sm" color="red">{n(groups.length)}</Badge>}>
                    {groups.length === 0 ? <EmptyRow>No errors in this range.</EmptyRow> : <ErrorGroupsTable rows={groups} range={range} />}
                </Section>
            </div>
        </>
    );
}

McpErrors.layout = adminLayout;
export default McpErrors;
