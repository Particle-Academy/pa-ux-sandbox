import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { Head, Link, router } from "@inertiajs/react";
import { Badge, Button, Switch, Table } from "@particle-academy/react-fancy";
import { useFancyQuery } from "@particle-academy/fancy-query";
import { Map, type MapMarker, type MapView } from "@particle-academy/fancy-map";
import { leafletProvider } from "@particle-academy/fancy-map/leaflet";
import { adminLayout } from "../AdminLayout";
import { EmptyRow, PageHeader, StatCard } from "../ui";
import { CallsTable, McpTabs, Mono, n, Section, toolHref, withRange, type CallRow, type Range } from "./parts";

/** One map engine for the page, created at module load, not per render. */
const osm = leafletProvider();

type Ping = { lat: number; lng: number; approximate: boolean };
type LiveRow = CallRow & { country: string | null; city: string | null; ping: Ping | null };
type Cluster = { id: string; country: string | null; city: string | null; lat: number; lng: number; count: number; approximate: boolean };
type CountryRow = { country: string; name: string; requests: number; sessions: number };

type Feed = {
    cursor: number;
    rows: LiveRow[];
    counters: { minutes: number; requests: number; sessions: number; errors: number; topTools: { tool: string; calls: number }[] };
    map: Cluster[];
    countries: CountryRow[];
    located: number;
    unlocated: number;
    mapHours: number;
    serverTime: string;
};

type Props = { range: Range; feedUrl: string; pollMs: number; rowCap: number; pingMs: number };

type ActivePing = { id: string; row: LiveRow; until: number };

/**
 * /admin/mcp/live — requests as they arrive.
 *
 * Polls a bounded feed (`?since=<cursor>&limit=<cap>`) every `pollMs` through
 * fancy-query. The first poll fills the table; every later poll prepends what
 * is new and drops a pulsing ping on the map for each new request that has a
 * location. Reads raw rows only, so it is never behind the rollups.
 *
 * State an agent might read or set is controlled and exposed: `paused` is a
 * Switch, rows carry `data-mcp-call`, map pins carry `data-map-marker-id`.
 */
function McpLive({ range, feedUrl, pollMs, rowCap, pingMs }: Props) {
    const cursor = useRef(0);
    const primed = useRef(false);
    const [paused, setPaused] = useState(false);
    const [rows, setRows] = useState<LiveRow[]>([]);
    const [pings, setPings] = useState<ActivePing[]>([]);
    const [fresh, setFresh] = useState<Set<number>>(new Set());
    const [view, setView] = useState<MapView>({ center: { lat: 25, lng: 10 }, zoom: 2 });

    const { data, dataUpdatedAt, error, isFetching } = useFancyQuery<Feed>(
        ["admin", "mcp", "live"],
        async () => {
            const res = await fetch(`${feedUrl}?since=${cursor.current}&limit=${rowCap}`, {
                credentials: "same-origin",
                headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
            });
            if (!res.ok) throw new Error(`Feed answered ${res.status}`);
            return (await res.json()) as Feed;
        },
        { refetchInterval: paused ? false : pollMs, refetchOnWindowFocus: false, staleTime: 0, gcTime: 0 },
    );

    // Merge each poll: newest first, capped. The first poll is history, not
    // news, so it fills the table without pinging the map.
    useEffect(() => {
        if (!data) return;
        cursor.current = Math.max(cursor.current, data.cursor);
        if (data.rows.length === 0) {
            primed.current = true;
            return;
        }

        setRows((current) => {
            const seen = new Set(current.map((r) => r.id));
            const added = data.rows.filter((r) => !seen.has(r.id));
            return [...added, ...current].slice(0, rowCap);
        });

        if (primed.current) {
            const now = Date.now();
            setFresh(new Set(data.rows.map((r) => r.id)));
            setPings((current) => [
                ...data.rows.filter((r) => r.ping).map((r) => ({ id: `ping-${r.id}`, row: r, until: now + pingMs })),
                ...current,
            ].slice(0, rowCap));
        }
        primed.current = true;
    }, [dataUpdatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

    // Expire pings once their pulse is over.
    useEffect(() => {
        if (pings.length === 0) return;
        const timer = window.setTimeout(() => setPings((current) => current.filter((p) => p.until > Date.now())), 1000);
        return () => window.clearTimeout(timer);
    }, [pings]);

    const markers = useMemo<MapMarker[]>(() => {
        const clusters = (data?.map ?? []).map((c) => ({
            id: c.id,
            position: { lat: c.lat, lng: c.lng },
            color: c.approximate ? "#a78bfa" : "#7c3aed",
            icon: String(Math.min(c.count, 99)),
            label: `${c.city ?? c.country ?? "?"} · ${c.count} requests (last ${data?.mapHours ?? 24}h)${c.approximate ? " · placed at the country centre" : ""}`,
            data: { country: c.country },
        }));
        const live = pings.map((p) => ({
            id: p.id,
            position: { lat: p.row.ping!.lat, lng: p.row.ping!.lng },
            color: "#ef4444",
            icon: "",
            label: `${p.row.client_name} · ${p.row.target ?? p.row.method} · ${p.row.city ?? p.row.country ?? ""}`,
        }));
        return [...clusters, ...live];
    }, [data?.map, data?.mapHours, pings]);

    const counters = data?.counters;

    return (
        <>
            <Head title="Live · MCP usage · Admin" />
            <PageHeader
                title="Live"
                sub={`Requests to the MCP server as they arrive · polling every ${(pollMs / 1000).toFixed(1)} s · raw rows, no rollup delay`}
                actions={
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <span data-mcp-live-status={paused ? "paused" : error ? "error" : "live"} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <Badge color={paused ? "zinc" : error ? "red" : "emerald"} dot>
                                {paused ? "Paused" : error ? "Feed error" : isFetching ? "Updating" : "Live"}
                            </Badge>
                        </span>
                        <Switch label="Pause" checked={paused} onCheckedChange={setPaused} data-mcp-live-pause />
                        <Button as={Link} variant="ghost" size="sm" icon="arrow-left" href={withRange("/admin/mcp", range)}>Overview</Button>
                    </div>
                }
            />
            <div style={{ marginBottom: 16 }}>
                <McpTabs range={range} />
            </div>

            <div className="admin-grid-stats" data-mcp-live-counters>
                <StatCard label={`Requests · last ${counters?.minutes ?? 15} min`} value={n(counters?.requests ?? 0)} icon="activity" />
                <StatCard label={`Sessions · last ${counters?.minutes ?? 15} min`} value={n(counters?.sessions ?? 0)} icon="plug" />
                <StatCard label={`Errors · last ${counters?.minutes ?? 15} min`} value={n(counters?.errors ?? 0)} icon="circle-alert" />
            </div>

            <div className="admin-grid-2" style={{ marginTop: 16, gridTemplateColumns: "1.7fr 1fr" }}>
                <Section
                    title={`Where requests come from · last ${data?.mapHours ?? 24}h`}
                    icon="map"
                    handle="live-map"
                    aside={
                        <span style={{ fontSize: 12, color: "var(--fg-3)" }}>
                            {n(data?.located ?? 0)} located · {n(data?.unlocated ?? 0)} without location
                        </span>
                    }
                >
                    <div className="mcp-live-map" style={{ height: 380 }} data-mcp-live-map>
                        <Map
                            provider={osm}
                            view={view}
                            onViewChange={setView}
                            markers={markers}
                            onSelect={(id) => {
                                const cluster = data?.map.find((c) => c.id === id);
                                if (cluster?.country) router.visit(withRange(`/admin/mcp/countries/${cluster.country}`, range));
                            }}
                        />
                    </div>
                    <div style={{ padding: "8px 16px", fontSize: 12, color: "var(--fg-3)" }}>
                        Red pings pulse for each new request. Purple pins cluster the last {data?.mapHours ?? 24}h (pale = country centre only). Location comes from
                        Cloudflare's visitor headers; no IP is stored.
                    </div>
                </Section>

                <div className="admin-stack">
                    <Section title={`Top tools · last ${counters?.minutes ?? 15} min`} icon="wrench" handle="live-top-tools">
                        {!counters || counters.topTools.length === 0 ? (
                            <EmptyRow>No tool calls in the window.</EmptyRow>
                        ) : (
                            <div className="admin-table-wrap">
                                <Table>
                                    <Table.Body>
                                        {counters.topTools.map((t) => (
                                            <Table.Row key={t.tool} data-mcp-live-tool={t.tool}>
                                                <Table.Cell><Link href={toolHref(t.tool, range)}><Mono>{t.tool}</Mono></Link></Table.Cell>
                                                <Table.Cell><strong>{n(t.calls)}</strong></Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table>
                            </div>
                        )}
                    </Section>
                    <Section title={`Countries · last ${data?.mapHours ?? 24}h`} icon="globe" handle="live-countries">
                        {!data || data.countries.length === 0 ? (
                            <EmptyRow>No located requests yet.</EmptyRow>
                        ) : (
                            <div className="admin-table-wrap">
                                <Table>
                                    <Table.Head>
                                        <Table.Row>
                                            <Table.Cell header>Country</Table.Cell>
                                            <Table.Cell header>Requests</Table.Cell>
                                            <Table.Cell header>Sessions</Table.Cell>
                                        </Table.Row>
                                    </Table.Head>
                                    <Table.Body>
                                        {data.countries.map((c) => (
                                            <Table.Row key={c.country} data-mcp-country={c.country}>
                                                <Table.Cell>
                                                    <Link href={withRange(`/admin/mcp/countries/${c.country}`, range)}>
                                                        {c.name} <Mono>{c.country}</Mono>
                                                    </Link>
                                                </Table.Cell>
                                                <Table.Cell><strong>{n(c.requests)}</strong></Table.Cell>
                                                <Table.Cell>{n(c.sessions)}</Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table>
                            </div>
                        )}
                    </Section>
                </div>
            </div>

            <div className="admin-stack" style={{ marginTop: 16 }}>
                <Section title="Newest requests" icon="radio" handle="live-rows" aside={<Badge size="sm" color="violet">{`${n(rows.length)} / ${n(rowCap)}`}</Badge>}>
                    {rows.length === 0 ? (
                        <EmptyRow>{data ? "No requests recorded yet. New ones appear here within a few seconds." : "Connecting…"}</EmptyRow>
                    ) : (
                        <CallsTable rows={rows} range={range} showPlace fresh={fresh} />
                    )}
                </Section>
            </div>
        </>
    );
}

McpLive.layout = adminLayout;
export default McpLive;
