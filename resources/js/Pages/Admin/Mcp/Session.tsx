import { Head, Link } from "@inertiajs/react";
import { Badge, Button } from "@particle-academy/react-fancy";
import { adminLayout } from "../AdminLayout";
import { EmptyRow, PageHeader, StatCard } from "../ui";
import { CallsTable, clientHref, McpTabs, Mono, n, Section, when, withRange, type CallRow, type Range, type SessionRow } from "./parts";

type Props = {
    range: Range;
    session: SessionRow;
    requests: CallRow[];
    truncated: boolean;
};

/** /admin/mcp/sessions/{session} — the full ordered request timeline of one session. */
function McpSessionPage({ range, session, requests, truncated }: Props) {
    const durationMs = requests.length > 0 ? requests[requests.length - 1].offset_ms ?? 0 : 0;

    return (
        <>
            <Head title={`Session ${session.session_id.slice(0, 8)} · MCP usage · Admin`} />
            <PageHeader
                title={`Session ${session.session_id.slice(0, 8)}…`}
                sub={`${session.client_name}${session.client_version ? ` ${session.client_version}` : ""} · ${when(session.first_seen_at)} to ${when(session.last_seen_at)}`}
                actions={
                    <div style={{ display: "flex", gap: 8 }}>
                        <Button as={Link} variant="ghost" size="sm" icon="bot" href={clientHref(session.client_key, session.client_version, range)}>Client</Button>
                        <Button as={Link} variant="ghost" size="sm" icon="arrow-left" href={withRange("/admin/mcp", range)}>Overview</Button>
                    </div>
                }
            />
            <div style={{ marginBottom: 16 }}>
                <McpTabs range={range} />
            </div>

            <div className="admin-grid-stats" data-mcp-session-totals={session.session_id}>
                <StatCard label="Requests" value={n(session.request_count)} icon="activity" sub={`over ${(durationMs / 1000).toFixed(1)} s`} />
                <StatCard label="Errors" value={n(session.error_count)} icon="circle-alert" />
                <StatCard label="Protocol" value={session.protocol_version ?? "—"} icon="plug" sub={`user agent: ${session.ua_family ?? "unknown"}`} />
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "16px 0 8px", fontSize: 12, color: "var(--fg-3)" }}>
                <Mono>{session.session_id}</Mono>
                {truncated && <Badge size="sm" color="amber">timeline truncated to {n(requests.length)} requests</Badge>}
            </div>

            <Section title="Timeline" icon="list" handle="session-timeline" aside={<Badge size="sm" color="violet">{n(requests.length)}</Badge>}>
                {requests.length === 0 ? <EmptyRow>No requests recorded for this session.</EmptyRow> : <CallsTable rows={requests} range={range} showSession={false} showOffset />}
            </Section>
        </>
    );
}

McpSessionPage.layout = adminLayout;
export default McpSessionPage;
