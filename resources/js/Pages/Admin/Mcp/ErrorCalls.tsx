import { Head, Link, router, usePage } from "@inertiajs/react";
import { Badge, Button, Pagination } from "@particle-academy/react-fancy";
import { adminLayout } from "../AdminLayout";
import { EmptyRow, PageHeader } from "../ui";
import { CallsTable, McpTabs, Mono, n, RangePicker, Section, withRange, type CallRow, type Range } from "./parts";

type Filters = { status: string | null; code: number | null; tool: string | null; method: string | null };

type Props = {
    range: Range;
    filters: Filters;
    calls: { data: CallRow[]; current_page: number; last_page: number; total: number };
};

/** /admin/mcp/errors/calls — the individual calls behind an error group. */
function McpErrorCalls({ range, filters, calls }: Props) {
    const { url } = usePage();
    const path = url.replace(/\?.*$/, "");
    const query = Object.fromEntries(new URLSearchParams(url.split("?")[1] ?? ""));
    const active = Object.entries(filters).filter(([, v]) => v !== null && v !== "");

    return (
        <>
            <Head title="Failing calls · MCP usage · Admin" />
            <PageHeader
                title="Failing calls"
                sub={`${n(calls.total)} calls · ${range.from} to ${range.to}`}
                actions={
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <RangePicker range={range} />
                        <Button as={Link} variant="ghost" size="sm" icon="arrow-left" href={withRange("/admin/mcp/errors", range)}>Error groups</Button>
                    </div>
                }
            />
            <div style={{ marginBottom: 16 }}>
                <McpTabs range={range} />
            </div>

            <div data-mcp-error-filters style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap", fontSize: 12, color: "var(--fg-3)" }}>
                {active.length === 0 ? (
                    <span>Every failing call in the range.</span>
                ) : (
                    <>
                        {active.map(([k, v]) => (
                            <Badge key={k} size="sm" color="zinc">
                                {k}: <Mono>{k === "code" && v === 0 ? "none" : String(v)}</Mono>
                            </Badge>
                        ))}
                        <Button as={Link} size="xs" variant="ghost" icon="x" href={withRange(path, range)}>Clear filters</Button>
                    </>
                )}
            </div>

            <Section title="Calls" icon="list" handle="error-calls" aside={<Badge size="sm" color="red">{n(calls.total)}</Badge>}>
                {calls.data.length === 0 ? <EmptyRow>No failing calls match.</EmptyRow> : <CallsTable rows={calls.data} range={range} />}
            </Section>

            {calls.last_page > 1 && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }} data-mcp-pagination>
                    <Pagination
                        page={calls.current_page}
                        totalPages={calls.last_page}
                        onPageChange={(page) => router.get(path, { ...query, page }, { preserveScroll: true })}
                    />
                </div>
            )}
        </>
    );
}

McpErrorCalls.layout = adminLayout;
export default McpErrorCalls;
