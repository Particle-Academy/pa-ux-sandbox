import { Head, Link, router, usePage } from "@inertiajs/react";
import { Badge, Button, Pagination, Table } from "@particle-academy/react-fancy";
import { adminLayout } from "../AdminLayout";
import { EmptyRow, PageHeader, StatCard } from "../ui";
import { CallsTable, McpTabs, n, RangePicker, Section, withRange, type CallRow, type Range } from "./parts";

type Props = {
    range: Range;
    country: { code: string; name: string; centroid: { lat: number; lng: number } | null };
    total: number;
    cities: { city: string | null; requests: number; sessions: number }[];
    calls: { data: CallRow[]; current_page: number; last_page: number; total: number };
};

/** /admin/mcp/countries/{code} — the requests from one country. */
function McpCountry({ range, country, total, cities, calls }: Props) {
    const { url } = usePage();
    const path = url.replace(/\?.*$/, "");
    const query = Object.fromEntries(new URLSearchParams(url.split("?")[1] ?? ""));

    return (
        <>
            <Head title={`${country.name} · MCP usage · Admin`} />
            <PageHeader
                title={country.name}
                sub={`Requests from ${country.code} · ${range.from} to ${range.to}`}
                actions={
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <RangePicker range={range} />
                        <Button as={Link} variant="ghost" size="sm" icon="radio" href={withRange("/admin/mcp/live", range)}>Live</Button>
                    </div>
                }
            />
            <div style={{ marginBottom: 16 }}>
                <McpTabs range={range} />
            </div>

            <div className="admin-grid-stats" data-mcp-country-totals={country.code}>
                <StatCard label="Requests" value={n(total)} icon="activity" />
                <StatCard label="Cities" value={n(cities.filter((c) => c.city).length)} icon="map-pin" sub={cities.some((c) => !c.city) ? "some requests carry only the country" : undefined} />
                <StatCard label="Code" value={country.code} icon="globe" />
            </div>

            <div className="admin-grid-2" style={{ marginTop: 16, gridTemplateColumns: "1fr 2fr" }}>
                <Section title="Cities" icon="map-pin" handle="country-cities">
                    {cities.length === 0 ? (
                        <EmptyRow>No requests from {country.name} in this range.</EmptyRow>
                    ) : (
                        <div className="admin-table-wrap">
                            <Table>
                                <Table.Head>
                                    <Table.Row>
                                        <Table.Cell header>City</Table.Cell>
                                        <Table.Cell header>Requests</Table.Cell>
                                        <Table.Cell header>Sessions</Table.Cell>
                                    </Table.Row>
                                </Table.Head>
                                <Table.Body>
                                    {cities.map((c) => (
                                        <Table.Row key={c.city ?? "-"} data-mcp-city={c.city ?? ""}>
                                            <Table.Cell>{c.city ?? <span style={{ color: "var(--fg-3)" }}>(country only)</span>}</Table.Cell>
                                            <Table.Cell><strong>{n(c.requests)}</strong></Table.Cell>
                                            <Table.Cell>{n(c.sessions)}</Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </div>
                    )}
                </Section>
                <Section title="Requests" icon="list" handle="country-calls" aside={<Badge size="sm" color="violet">{n(calls.total)}</Badge>}>
                    {calls.data.length === 0 ? <EmptyRow>No requests in this range.</EmptyRow> : <CallsTable rows={calls.data} range={range} showPlace />}
                </Section>
            </div>

            {calls.last_page > 1 && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }} data-mcp-pagination>
                    <Pagination page={calls.current_page} totalPages={calls.last_page} onPageChange={(page) => router.get(path, { ...query, page }, { preserveScroll: true })} />
                </div>
            )}
        </>
    );
}

McpCountry.layout = adminLayout;
export default McpCountry;
