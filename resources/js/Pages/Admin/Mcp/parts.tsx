import { type ReactNode } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import { Badge, Button, Card, DatePicker, Icon, Table } from "@particle-academy/react-fancy";
import { EChart } from "@particle-academy/fancy-echarts";

/**
 * Shared pieces of the MCP usage dashboard (/admin/mcp).
 *
 * The date range is the dashboard's one piece of state and it lives in the
 * URL: every control is CONTROLLED by the `range` prop the server echoes
 * back, and changing it is an Inertia visit. So a range is linkable, survives
 * a reload, and an agent can set it by visiting a URL — no hidden component
 * state to scrape. Every row carries a `data-mcp-*` handle.
 */

export type Range = {
    from: string;
    to: string;
    days: number;
    preset: string;
    query: Record<string, string | number>;
    presets: number[];
};

export type CallRow = {
    id: number;
    at: string | null;
    session_id: string | null;
    method: string;
    target: string | null;
    arguments: Record<string, unknown> | unknown[] | null;
    arguments_truncated: boolean;
    status: string;
    error_code: number | null;
    error_message: string | null;
    result_count: number | null;
    latency_ms: number;
    client_name: string;
    client_key: string;
    client_version: string | null;
    offset_ms?: number;
};

export type SessionRow = {
    session_id: string;
    client_name: string;
    client_key: string;
    client_version: string | null;
    protocol_version: string | null;
    ua_family: string | null;
    request_count: number;
    error_count: number;
    first_seen_at: string | null;
    last_seen_at: string | null;
};

export type ErrorGroup = {
    status: string;
    code: number | null;
    method: string | null;
    tool: string | null;
    count: number;
    clients: number;
    lastDay: string;
};

export const n = (v: number | null | undefined) => (v == null ? "—" : v.toLocaleString());
export const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
export const ms = (v: number | null | undefined) => (v == null ? "—" : `${v.toLocaleString()} ms`);
export const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

/** A URL with the current range carried along, plus any extra query. */
export function withRange(path: string, range: Range, extra: Record<string, string | number | null | undefined> = {}): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...range.query, ...extra })) {
        if (v !== null && v !== undefined && v !== "") params.set(k, String(v));
    }
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
}

export const toolHref = (tool: string, range: Range) => withRange(`/admin/mcp/tools/${encodeURIComponent(tool)}`, range);
export const clientHref = (key: string, version: string | null, range: Range) =>
    withRange(`/admin/mcp/clients/${encodeURIComponent(key)}`, range, { version: version || null });
export const sessionHref = (id: string, range: Range) => withRange(`/admin/mcp/sessions/${encodeURIComponent(id)}`, range);

/** The dashboard's sub-navigation, shown on every MCP page. */
export function McpTabs({ range }: { range: Range }) {
    const { url } = usePage();
    const path = url.replace(/\?.*$/, "");
    const tabs = [
        { label: "Overview", href: "/admin/mcp", icon: "layout-dashboard", active: path === "/admin/mcp" },
        { label: "Errors", href: "/admin/mcp/errors", icon: "circle-alert", active: path.startsWith("/admin/mcp/errors") },
        { label: "Search demand", href: "/admin/mcp/search-demand", icon: "search", active: path.startsWith("/admin/mcp/search-demand") },
    ];

    return (
        <div data-mcp-tabs style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tabs.map((t) => (
                <Button
                    key={t.href}
                    as={Link}
                    href={withRange(t.href, range)}
                    size="sm"
                    variant={t.active ? "default" : "ghost"}
                    color={t.active ? "violet" : undefined}
                    icon={t.icon}
                    data-mcp-tab={t.label.toLowerCase().replace(/\s+/g, "-")}
                >
                    {t.label}
                </Button>
            ))}
        </div>
    );
}

/**
 * 7 / 30 day presets and a custom range. Controlled: the value is the range
 * the server rendered, and a change is a visit to the same page.
 */
export function RangePicker({ range }: { range: Range }) {
    const { url } = usePage();
    const path = url.replace(/\?.*$/, "");
    const keep = Object.fromEntries(new URLSearchParams(url.split("?")[1] ?? ""));
    delete keep.days;
    delete keep.from;
    delete keep.to;
    delete keep.page;

    const visit = (query: Record<string, string | number>) => router.get(path, { ...keep, ...query }, { preserveScroll: true });

    return (
        <div data-mcp-range={`${range.from}..${range.to}`} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {range.presets.map((d) => (
                <Button
                    key={d}
                    size="sm"
                    variant={range.preset === `${d}d` ? "default" : "ghost"}
                    color={range.preset === `${d}d` ? "violet" : undefined}
                    onClick={() => visit({ days: d })}
                    data-mcp-range-preset={d}
                >
                    {d} days
                </Button>
            ))}
            <div data-mcp-range-custom>
                <DatePicker
                    range
                    size="sm"
                    value={[range.from, range.to]}
                    max={new Date().toISOString().slice(0, 10)}
                    onValueChange={([from, to]) => {
                        if (from && to && (from !== range.from || to !== range.to)) visit({ from, to });
                    }}
                />
            </div>
        </div>
    );
}

/** Card with an icon title and optional right-hand aside. */
export function Section({ title, icon, aside, children, handle }: { title: string; icon: string; aside?: ReactNode; children: ReactNode; handle?: string }) {
    return (
        <Card style={{ overflow: "hidden" }} data-mcp-section={handle}>
            <Card.Header>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", gap: 12 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <Icon name={icon} size="sm" style={{ color: "var(--fg-3)" }} /> {title}
                    </span>
                    {aside}
                </div>
            </Card.Header>
            {children}
        </Card>
    );
}

const STATUS_COLOR: Record<string, "emerald" | "red" | "amber" | "zinc" | "sky"> = {
    ok: "emerald",
    error: "red",
    tool_error: "amber",
    http_error: "red",
    stream: "sky",
};

export function StatusBadge({ status, code }: { status: string; code?: number | null }) {
    return (
        <Badge color={STATUS_COLOR[status] ?? "zinc"} size="sm">
            {status}
            {code != null ? ` ${code}` : ""}
        </Badge>
    );
}

export function Mono({ children }: { children: ReactNode }) {
    return <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--fg-2)" }}>{children}</span>;
}

/** Compact one-line rendering of stored arguments. */
export function Args({ value, truncated }: { value: CallRow["arguments"]; truncated?: boolean }) {
    if (value == null) return <span style={{ color: "var(--fg-4)" }}>—</span>;
    const text = JSON.stringify(value);
    return (
        <span title={text} style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-2)", wordBreak: "break-all" }}>
            {text.length > 160 ? `${text.slice(0, 160)}…` : text}
            {truncated ? <Badge size="sm" color="zinc">truncated</Badge> : null}
        </span>
    );
}

type SeriesDef = { name: string; key: string; color: string; type?: "line" | "bar"; axis?: 0 | 1; stack?: string };

/** A daily time series. Rows are `{ date, ...values }`. */
export function DailyChart({ rows, series, height = 240, percentAxis }: { rows: Record<string, number | string>[]; series: SeriesDef[]; height?: number; percentAxis?: boolean }) {
    return (
        <EChart
            style={{ width: "100%", height }}
            option={{
                grid: { left: 44, right: percentAxis ? 48 : 16, top: 32, bottom: 28 },
                tooltip: { trigger: "axis" },
                legend: { data: series.map((s) => s.name), right: 0, top: 0, itemHeight: 8 },
                xAxis: { type: "category", data: rows.map((r) => String(r.date).slice(5)), boundaryGap: series.some((s) => s.type === "bar") },
                yAxis: percentAxis
                    ? [
                          { type: "value", minInterval: 1 },
                          { type: "value", min: 0, axisLabel: { formatter: (v: number) => `${Math.round(v * 100)}%` }, splitLine: { show: false } },
                      ]
                    : { type: "value", minInterval: 1 },
                series: series.map((s) => ({
                    name: s.name,
                    type: s.type ?? "line",
                    stack: s.stack,
                    smooth: true,
                    showSymbol: false,
                    yAxisIndex: s.axis ?? 0,
                    areaStyle: s.type === "bar" || s.axis === 1 ? undefined : { opacity: 0.1 },
                    lineStyle: { width: 2 },
                    itemStyle: { color: s.color },
                    data: rows.map((r) => Number(r[s.key] ?? 0)),
                })),
            }}
        />
    );
}

/** A ranked horizontal bar chart: `[label, value]`, largest first. */
export function RankChart({ rows, color = "#8b5cf6", height }: { rows: { label: string; value: number }[]; color?: string; height?: number }) {
    const ordered = [...rows].reverse();
    return (
        <EChart
            style={{ width: "100%", height: height ?? Math.max(160, rows.length * 26 + 40) }}
            option={{
                grid: { left: 150, right: 24, top: 8, bottom: 24 },
                tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
                xAxis: { type: "value", minInterval: 1 },
                yAxis: { type: "category", data: ordered.map((r) => r.label), axisLabel: { width: 140, overflow: "truncate" } },
                series: [{ type: "bar", data: ordered.map((r) => r.value), itemStyle: { color, borderRadius: [0, 4, 4, 0] }, barMaxWidth: 18 }],
            }}
        />
    );
}

/** A table of calls (used by a session timeline, a tool's errors and the error drill-down). */
export function CallsTable({ rows, range, showSession = true, showOffset = false }: { rows: CallRow[]; range: Range; showSession?: boolean; showOffset?: boolean }) {
    return (
        <div className="admin-table-wrap">
            <Table>
                <Table.Head>
                    <Table.Row>
                        <Table.Cell header>{showOffset ? "+ms" : "When"}</Table.Cell>
                        <Table.Cell header>Method</Table.Cell>
                        <Table.Cell header>Tool / target</Table.Cell>
                        <Table.Cell header>Arguments</Table.Cell>
                        <Table.Cell header>Result</Table.Cell>
                        <Table.Cell header>Latency</Table.Cell>
                        {showSession && <Table.Cell header>Client · session</Table.Cell>}
                    </Table.Row>
                </Table.Head>
                <Table.Body>
                    {rows.map((r) => (
                        <Table.Row key={r.id} data-mcp-call={r.id} data-mcp-status={r.status}>
                            <Table.Cell>
                                <span style={{ fontSize: 12, color: "var(--fg-3)", whiteSpace: "nowrap" }}>{showOffset ? n(r.offset_ms ?? 0) : when(r.at)}</span>
                            </Table.Cell>
                            <Table.Cell><Mono>{r.method}</Mono></Table.Cell>
                            <Table.Cell>
                                {r.method === "tools/call" && r.target ? <Link href={toolHref(r.target, range)}><Mono>{r.target}</Mono></Link> : <Mono>{r.target ?? "—"}</Mono>}
                            </Table.Cell>
                            <Table.Cell><Args value={r.arguments} truncated={r.arguments_truncated} /></Table.Cell>
                            <Table.Cell>
                                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                    <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                        <StatusBadge status={r.status} code={r.error_code} />
                                        {r.result_count != null && <span style={{ fontSize: 12, color: r.result_count === 0 ? "#d97706" : "var(--fg-3)" }}>{n(r.result_count)} results</span>}
                                    </span>
                                    {r.error_message && <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{r.error_message}</span>}
                                </div>
                            </Table.Cell>
                            <Table.Cell><span style={{ fontSize: 12.5 }}>{ms(r.latency_ms)}</span></Table.Cell>
                            {showSession && (
                                <Table.Cell>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 12 }}>
                                        <Link href={clientHref(r.client_key, r.client_version, range)}>
                                            {r.client_name}
                                            {r.client_version ? ` ${r.client_version}` : ""}
                                        </Link>
                                        {r.session_id && (
                                            <Link href={sessionHref(r.session_id, range)}>
                                                <Mono>{r.session_id.slice(0, 8)}…</Mono>
                                            </Link>
                                        )}
                                    </div>
                                </Table.Cell>
                            )}
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
        </div>
    );
}

/** Sessions list (overview + a client's page). */
export function SessionsTable({ rows, range }: { rows: SessionRow[]; range: Range }) {
    return (
        <div className="admin-table-wrap">
            <Table>
                <Table.Head>
                    <Table.Row>
                        <Table.Cell header>Session</Table.Cell>
                        <Table.Cell header>Client</Table.Cell>
                        <Table.Cell header>User agent</Table.Cell>
                        <Table.Cell header>Requests</Table.Cell>
                        <Table.Cell header>Errors</Table.Cell>
                        <Table.Cell header>Last seen</Table.Cell>
                    </Table.Row>
                </Table.Head>
                <Table.Body>
                    {rows.map((s) => (
                        <Table.Row key={s.session_id} data-mcp-session={s.session_id}>
                            <Table.Cell>
                                <Link href={sessionHref(s.session_id, range)}><Mono>{s.session_id.slice(0, 8)}…</Mono></Link>
                            </Table.Cell>
                            <Table.Cell>
                                <Link href={clientHref(s.client_key, s.client_version, range)}>
                                    {s.client_name}
                                    {s.client_version ? ` ${s.client_version}` : ""}
                                </Link>
                            </Table.Cell>
                            <Table.Cell><span style={{ fontSize: 12, color: "var(--fg-3)" }}>{s.ua_family ?? "—"}</span></Table.Cell>
                            <Table.Cell>{n(s.request_count)}</Table.Cell>
                            <Table.Cell>{s.error_count > 0 ? <Badge size="sm" color="red">{n(s.error_count)}</Badge> : "0"}</Table.Cell>
                            <Table.Cell><span style={{ fontSize: 12, color: "var(--fg-3)" }}>{when(s.last_seen_at)}</span></Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
        </div>
    );
}

/** Error groups (status + code [+ method/tool]) linking to their calls. */
export function ErrorGroupsTable({ rows, range, tool }: { rows: ErrorGroup[]; range: Range; tool?: string }) {
    return (
        <div className="admin-table-wrap">
            <Table>
                <Table.Head>
                    <Table.Row>
                        <Table.Cell header>Error</Table.Cell>
                        <Table.Cell header>Method</Table.Cell>
                        <Table.Cell header>Tool</Table.Cell>
                        <Table.Cell header>Count</Table.Cell>
                        <Table.Cell header>Clients</Table.Cell>
                        <Table.Cell header>Last day</Table.Cell>
                        <Table.Cell header />
                    </Table.Row>
                </Table.Head>
                <Table.Body>
                    {rows.map((g) => {
                        const t = g.tool ?? tool ?? null;
                        const key = `${g.status}|${g.code ?? ""}|${g.method ?? ""}|${t ?? ""}`;
                        return (
                            <Table.Row key={key} data-mcp-error-group={key}>
                                <Table.Cell><StatusBadge status={g.status} code={g.code} /></Table.Cell>
                                <Table.Cell><Mono>{g.method ?? (tool ? "tools/call" : "—")}</Mono></Table.Cell>
                                <Table.Cell>{t ? <Link href={toolHref(t, range)}><Mono>{t}</Mono></Link> : "—"}</Table.Cell>
                                <Table.Cell><strong>{n(g.count)}</strong></Table.Cell>
                                <Table.Cell>{n(g.clients)}</Table.Cell>
                                <Table.Cell><span style={{ fontSize: 12, color: "var(--fg-3)" }}>{g.lastDay}</span></Table.Cell>
                                <Table.Cell>
                                    <Button
                                        as={Link}
                                        size="xs"
                                        variant="ghost"
                                        icon="arrow-right"
                                        href={withRange("/admin/mcp/errors/calls", range, {
                                            status: g.status,
                                            code: g.code ?? (g.status === "tool_error" ? 0 : null),
                                            tool: t,
                                            method: g.method,
                                        })}
                                        data-mcp-error-calls={key}
                                    >
                                        Calls
                                    </Button>
                                </Table.Cell>
                            </Table.Row>
                        );
                    })}
                </Table.Body>
            </Table>
        </div>
    );
}
