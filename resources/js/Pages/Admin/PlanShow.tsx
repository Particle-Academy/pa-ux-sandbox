import { Head, router } from "@inertiajs/react";
import { Badge, Button, Card, Table } from "@particle-academy/react-fancy";
import { adminLayout } from "./AdminLayout";
import { PageHeader, StatusDot, EmptyRow } from "./ui";

type Price = {
    id: number;
    amount: number;
    currency: string;
    interval: string | null;
    active: boolean;
    external_id: string | null;
};
type Plan = {
    id: number;
    name: string;
    description: string | null;
    active: boolean;
    order: number;
    external_id: string | null;
    synced: boolean;
    show_on_storefront: boolean;
    recommended: boolean;
    prices: Price[];
};
type Props = { plan: Plan; pending: number };

const money = (cents: number, currency: string) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: (currency || "usd").toUpperCase() }).format(cents / 100);

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--fg-3)", fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 13.5, color: "var(--fg-1)", marginTop: 4 }}>{children}</div>
        </div>
    );
}

function PlanShow({ plan }: Props) {
    return (
        <>
            <Head title={`${plan.name} · Admin`} />
            <PageHeader
                title={plan.name}
                sub="Plan details and management."
                actions={
                    <>
                        <Button
                            color="violet"
                            size="sm"
                            icon="refresh-cw"
                            onClick={() => router.post(`/admin/plans/${plan.id}/sync`, {}, { preserveScroll: true })}
                        >
                            Sync
                        </Button>
                        <Button variant="ghost" size="sm" icon="pencil" href={`/admin/plans/${plan.id}/edit`}>
                            Edit
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            color="red"
                            icon="trash-2"
                            onClick={() => {
                                if (confirm("Delete this plan? This cannot be undone.")) {
                                    router.delete(`/admin/plans/${plan.id}`);
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </>
                }
            />

            <div className="admin-stack">
                <Card>
                    <Card.Body>
                        <div className="admin-grid-2">
                            <Detail label="Name">{plan.name}</Detail>
                            <Detail label="Status">
                                <Badge color={plan.active ? "emerald" : "zinc"}>{plan.active ? "Active" : "Inactive"}</Badge>
                            </Detail>
                            {plan.description && <Detail label="Description">{plan.description}</Detail>}
                            <Detail label="Order">{plan.order}</Detail>
                            <Detail label="Stripe Product ID">
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{plan.external_id ?? "Not synced"}</span>
                            </Detail>
                            <Detail label="Stripe sync">
                                <StatusDot ok={plan.synced} />
                            </Detail>
                            <Detail label="Show on storefront">{plan.show_on_storefront ? "Yes" : "No"}</Detail>
                            <Detail label="Recommended">
                                {plan.recommended ? <Badge color="violet">Recommended</Badge> : "No"}
                            </Detail>
                        </div>
                    </Card.Body>
                </Card>

                <Card>
                    <Card.Header>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>Recurring prices</div>
                    </Card.Header>
                    {plan.prices.length === 0 ? (
                        <EmptyRow>No recurring prices yet.</EmptyRow>
                    ) : (
                        <div className="admin-table-wrap">
                            <Table>
                                <Table.Head>
                                    <Table.Row>
                                        <Table.Cell header>Amount</Table.Cell>
                                        <Table.Cell header>Interval</Table.Cell>
                                        <Table.Cell header>Status</Table.Cell>
                                        <Table.Cell header>Stripe Price ID</Table.Cell>
                                    </Table.Row>
                                </Table.Head>
                                <Table.Body>
                                    {plan.prices.map((price) => (
                                        <Table.Row key={price.id}>
                                            <Table.Cell>
                                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>
                                                    {money(price.amount, price.currency)}
                                                </span>
                                            </Table.Cell>
                                            <Table.Cell>{price.interval ?? "—"}</Table.Cell>
                                            <Table.Cell>
                                                <Badge color={price.active ? "emerald" : "zinc"}>{price.active ? "Active" : "Inactive"}</Badge>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--fg-3)" }}>
                                                    {price.external_id ?? "Not synced"}
                                                </span>
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

PlanShow.layout = adminLayout;
export default PlanShow;
