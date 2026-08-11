import { Head, Link } from "@inertiajs/react";
import { Badge, Button, Card, Icon, Table } from "@particle-academy/react-fancy";
import { adminLayout } from "../AdminLayout";
import { PageHeader, StatCard, StatusDot, EmptyRow } from "../ui";

type Rollups = {
    totalEvents: number;
    sites: number;
    visibleSites: number;
    sessions: number;
    human: number;
    agent: number;
    pixelPings: number;
};

type SiteRow = {
    site_key: string;
    url: string | null;
    visible: boolean;
    pixel_status: string | null;
    last_verified_at: string | null;
    events: number;
    sessions: number;
    last_activity: string | null;
};

type Props = { rollups: Rollups; sites: SiteRow[]; pending: number };

const n = (v: number) => v.toLocaleString();

function humanAgentSplit(human: number, agent: number): string {
    const total = human + agent;
    if (total === 0) return "no activity";
    const agentPct = Math.round((agent / total) * 100);
    return `${agentPct}% agent`;
}

const STATUS_COLOR: Record<string, "emerald" | "red" | "amber" | "zinc"> = {
    passed: "emerald",
    failed: "red",
};

function Heuristics({ rollups: r, sites }: Props) {
    return (
        <>
            <Head title="Heuristics · Admin" />
            <PageHeader
                title="Heuristics"
                sub="Platform-wide behavioural analytics from the Fancy Pixel — every registered site."
                actions={<Button as={Link} variant="ghost" size="sm" iconTrailing="external-link" href="/analytics">Pro dashboard</Button>}
            />

            <div className="admin-grid-stats">
                <StatCard label="Total events" value={n(r.totalEvents)} icon="activity" sub={`${n(r.sessions)} sessions`} />
                <StatCard label="Registered sites" value={n(r.sites)} icon="globe" sub={`${n(r.visibleSites)} visible`} />
                <StatCard label="Pixel pings" value={n(r.pixelPings)} icon="radio" sub="liveness beacons" />
            </div>
            <div className="admin-grid-stats" style={{ marginTop: 14 }}>
                <StatCard
                    label="Human events"
                    value={n(r.human)}
                    icon="user"
                    sub={`${humanAgentSplit(r.human, r.agent)}`}
                />
                <StatCard label="Agent events" value={n(r.agent)} icon="bot" sub="Human+ UX signal" />
                <StatCard
                    label="Human : Agent"
                    value={`${n(r.human)} : ${n(r.agent)}`}
                    icon="users"
                    sub="across all sites"
                />
            </div>

            <div className="admin-stack" style={{ marginTop: 16 }}>
                <Card>
                    <Card.Header>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <Icon name="globe" size="sm" style={{ color: "var(--fg-3)" }} /> Registered sites
                        </span>
                    </Card.Header>
                    {sites.length === 0 ? (
                        <EmptyRow>No sites registered yet.</EmptyRow>
                    ) : (
                        <div className="admin-table-wrap">
                            <Table>
                                <Table.Head>
                                    <Table.Row>
                                        <Table.Cell header>Site</Table.Cell>
                                        <Table.Cell header>Pixel</Table.Cell>
                                        <Table.Cell header>Visibility</Table.Cell>
                                        <Table.Cell header>Events</Table.Cell>
                                        <Table.Cell header>Sessions</Table.Cell>
                                        <Table.Cell header>Last activity</Table.Cell>
                                        <Table.Cell header></Table.Cell>
                                    </Table.Row>
                                </Table.Head>
                                <Table.Body>
                                    {sites.map((s) => (
                                        <Table.Row key={s.site_key} data-site={s.site_key}>
                                            <Table.Cell>
                                                <div>
                                                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 500, color: "var(--fg-1)" }}>{s.site_key}</div>
                                                    {s.url && <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2, wordBreak: "break-all" }}>{s.url}</div>}
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell>
                                                {s.pixel_status ? (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                                        <Badge color={STATUS_COLOR[s.pixel_status] ?? "zinc"}>{s.pixel_status}</Badge>
                                                        {s.last_verified_at && <span style={{ fontSize: 11, color: "var(--fg-4)" }}>{s.last_verified_at}</span>}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: "var(--fg-4)" }}>unverified</span>
                                                )}
                                            </Table.Cell>
                                            <Table.Cell>
                                                <StatusDot ok={s.visible} on="Visible" off="Hidden" />
                                            </Table.Cell>
                                            <Table.Cell>
                                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{n(s.events)}</span>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{n(s.sessions)}</span>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <span style={{ fontSize: 13, color: "var(--fg-2)" }}>{s.last_activity ?? "—"}</span>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Button variant="ghost" size="sm" href={`/admin/heuristics/${s.site_key}`}>View</Button>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </div>
                    )}
                </Card>
            </div>
        </>
    );
}

Heuristics.layout = adminLayout;
export default Heuristics;
