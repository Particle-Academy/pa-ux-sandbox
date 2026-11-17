import { Head, Link } from "@inertiajs/react";
import { Badge, Table } from "@particle-academy/react-fancy";
import { adminLayout } from "../AdminLayout";
import { EmptyRow, PageHeader } from "../ui";
import { McpTabs, Mono, n, RangePicker, RankChart, Section, toolHref, type Range } from "./parts";

type DemandRow = { tool: string; value: string; misses: number; calls: number; lastDay: string };

type Props = {
    range: Range;
    emptySearches: DemandRow[];
    missingLookups: DemandRow[];
    searchTools: string[];
    lookupTools: string[];
};

function DemandTable({ rows, range, handle, missLabel }: { rows: DemandRow[]; range: Range; handle: string; missLabel: string }) {
    return (
        <div className="admin-table-wrap">
            <Table>
                <Table.Head>
                    <Table.Row>
                        <Table.Cell header>Asked for</Table.Cell>
                        <Table.Cell header>Tool</Table.Cell>
                        <Table.Cell header>{missLabel}</Table.Cell>
                        <Table.Cell header>Calls</Table.Cell>
                        <Table.Cell header>Last day</Table.Cell>
                    </Table.Row>
                </Table.Head>
                <Table.Body>
                    {rows.map((r) => (
                        <Table.Row key={`${r.tool}|${r.value}`} data-mcp-demand={handle} data-mcp-demand-value={r.value}>
                            <Table.Cell><Mono>{r.value}</Mono></Table.Cell>
                            <Table.Cell><Link href={toolHref(r.tool, range)}><Mono>{r.tool}</Mono></Link></Table.Cell>
                            <Table.Cell><Badge size="sm" color="amber">{n(r.misses)}</Badge></Table.Cell>
                            <Table.Cell>{n(r.calls)}</Table.Cell>
                            <Table.Cell><span style={{ fontSize: 12, color: "var(--fg-3)", whiteSpace: "nowrap" }}>{r.lastDay}</span></Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
        </div>
    );
}

/**
 * /admin/mcp/search-demand — what agents searched for and found nothing, and
 * which slugs they asked for that do not exist. Demand for components we lack.
 */
function McpSearchDemand({ range, emptySearches, missingLookups, searchTools, lookupTools }: Props) {
    return (
        <>
            <Head title="Search demand · MCP usage · Admin" />
            <PageHeader
                title="Search demand"
                sub={`What agents asked for and did not get · ${range.from} to ${range.to}`}
                actions={<RangePicker range={range} />}
            />
            <div style={{ marginBottom: 16 }}>
                <McpTabs range={range} />
            </div>

            <div className="admin-grid-2" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
                <Section title="Searches with no results" icon="search-x" handle="empty-searches" aside={<Badge size="sm" color="amber">{n(emptySearches.length)}</Badge>}>
                    <div style={{ padding: "8px 16px 0", fontSize: 12, color: "var(--fg-3)" }}>
                        Empty results from {searchTools.join(", ")}, by normalised query.
                    </div>
                    {emptySearches.length === 0 ? <EmptyRow>Every search returned something.</EmptyRow> : <DemandTable rows={emptySearches} range={range} handle="empty-search" missLabel="Empty" />}
                </Section>
                <Section title="Most-missed queries" icon="chart-bar" handle="empty-searches-chart">
                    {emptySearches.length === 0 ? (
                        <EmptyRow>Nothing to chart.</EmptyRow>
                    ) : (
                        <div style={{ padding: "8px 12px" }}>
                            <RankChart rows={emptySearches.slice(0, 12).map((r) => ({ label: r.value, value: r.misses }))} color="#f59e0b" />
                        </div>
                    )}
                </Section>
            </div>

            <div className="admin-stack" style={{ marginTop: 16 }}>
                <Section title="Asked for, not found" icon="file-question" handle="missing-lookups" aside={<Badge size="sm" color="amber">{n(missingLookups.length)}</Badge>}>
                    <div style={{ padding: "8px 16px 0", fontSize: 12, color: "var(--fg-3)" }}>
                        Slugs and kinds requested from {lookupTools.join(", ")} that came back as an error.
                    </div>
                    {missingLookups.length === 0 ? <EmptyRow>Every lookup found what it asked for.</EmptyRow> : <DemandTable rows={missingLookups} range={range} handle="missing-lookup" missLabel="Not found" />}
                </Section>
            </div>
        </>
    );
}

McpSearchDemand.layout = adminLayout;
export default McpSearchDemand;
