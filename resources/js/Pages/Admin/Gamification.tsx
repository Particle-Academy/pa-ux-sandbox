import { Head, Link, router } from "@inertiajs/react";
import { Badge, Button, Card, Icon, Table } from "@particle-academy/react-fancy";
import { adminLayout } from "./AdminLayout";
import { PageHeader, EmptyRow } from "./ui";

type Achievement = { id: number; slug: string; name: string; description: string | null; icon: string | null; is_active: boolean; sort_order: number };
type Prize = { id: number; slug: string; name: string; description: string | null; type: string; cost_in_points: number; inventory_quantity: number | null; is_active: boolean; sort_order: number };
type Props = { achievements: Achievement[]; prizes: Prize[]; pending: number };

function Gamification({ achievements, prizes }: Props) {
    return (
        <>
            <Head title="Gamification · Admin" />
            <PageHeader
                title="Gamification"
                sub="Achievements + prizes taxonomy."
                actions={<Button as={Link} icon="plus" size="sm" href="/admin/gamification/achievements/create">New achievement</Button>}
            />

            <div className="admin-stack">
                <Card>
                    <Card.Header>
                        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                <Icon name="trophy" size="sm" style={{ color: "var(--fg-3)" }} /> Achievements
                            </span>
                            <Button as={Link} variant="ghost" size="sm" icon="plus" href="/admin/gamification/achievements/create">New</Button>
                        </div>
                    </Card.Header>
                    {achievements.length === 0 ? (
                        <EmptyRow>No achievements yet.</EmptyRow>
                    ) : (
                        <div className="admin-table-wrap">
                            <Table>
                                <Table.Head>
                                    <Table.Row>
                                        <Table.Cell header>Name</Table.Cell>
                                        <Table.Cell header>Status</Table.Cell>
                                        <Table.Cell header>Action</Table.Cell>
                                    </Table.Row>
                                </Table.Head>
                                <Table.Body>
                                    {achievements.map((a) => (
                                        <Table.Row key={a.id}>
                                            <Table.Cell>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    {a.icon && <Icon name={a.icon} size="sm" style={{ color: "var(--fg-3)" }} />}
                                                    <div>
                                                        <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--fg-1)" }}>{a.name}</div>
                                                        {a.description && <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{a.description}</div>}
                                                    </div>
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Badge color={a.is_active ? "emerald" : "zinc"}>{a.is_active ? "Active" : "Inactive"}</Badge>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <div style={{ display: "flex", gap: 4 }}>
                                                    <Button variant="ghost" size="sm" icon="pencil" href={`/admin/gamification/achievements/${a.id}/edit`}>
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        color="violet"
                                                        variant="ghost"
                                                        size="sm"
                                                        icon="power"
                                                        onClick={() => router.post(`/admin/gamification/achievements/${a.id}/toggle`, {}, { preserveScroll: true })}
                                                    >
                                                        Toggle
                                                    </Button>
                                                </div>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </div>
                    )}
                </Card>

                <Card>
                    <Card.Header>
                        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                <Icon name="gift" size="sm" style={{ color: "var(--fg-3)" }} /> Prizes
                            </span>
                            <Button as={Link} variant="ghost" size="sm" icon="plus" href="/admin/gamification/prizes/create">New prize</Button>
                        </div>
                    </Card.Header>
                    {prizes.length === 0 ? (
                        <EmptyRow>No prizes yet.</EmptyRow>
                    ) : (
                        <div className="admin-table-wrap">
                            <Table>
                                <Table.Head>
                                    <Table.Row>
                                        <Table.Cell header>Name</Table.Cell>
                                        <Table.Cell header>Type</Table.Cell>
                                        <Table.Cell header>Cost</Table.Cell>
                                        <Table.Cell header>Stock</Table.Cell>
                                        <Table.Cell header>Status</Table.Cell>
                                        <Table.Cell header>Action</Table.Cell>
                                    </Table.Row>
                                </Table.Head>
                                <Table.Body>
                                    {prizes.map((p) => (
                                        <Table.Row key={p.id}>
                                            <Table.Cell>
                                                <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--fg-1)" }}>{p.name}</div>
                                                {p.description && <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{p.description}</div>}
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Badge color="sky">{p.type}</Badge>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{p.cost_in_points} ◈</span>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{p.inventory_quantity ?? "∞"}</span>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Badge color={p.is_active ? "emerald" : "zinc"}>{p.is_active ? "Active" : "Inactive"}</Badge>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <div style={{ display: "flex", gap: 4 }}>
                                                    <Button variant="ghost" size="sm" icon="pencil" href={`/admin/gamification/prizes/${p.id}/edit`}>
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        color="violet"
                                                        variant="ghost"
                                                        size="sm"
                                                        icon="power"
                                                        onClick={() => router.post(`/admin/gamification/prizes/${p.id}/toggle`, {}, { preserveScroll: true })}
                                                    >
                                                        Toggle
                                                    </Button>
                                                </div>
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

Gamification.layout = adminLayout;
export default Gamification;
