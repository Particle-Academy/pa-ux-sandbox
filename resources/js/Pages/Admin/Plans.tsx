import { Head, router } from "@inertiajs/react";
import { Badge, Button, Card, Table } from "@particle-academy/react-fancy";
import { adminLayout } from "./AdminLayout";
import { PageHeader, EmptyRow } from "./ui";

type Price = { id: number; amount: number; currency: string; interval: string | null; interval_count: number | null };
type Plan = { id: number; name: string; description: string | null; active: boolean; recommended: boolean; synced: boolean; prices: Price[] };
type Props = { plans: Plan[]; pending: number };

const money = (cents: number, currency: string) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: (currency || "usd").toUpperCase() }).format(cents / 100);

function priceLabel(plan: Plan): string {
    const p = plan.prices[0];
    if (!p) return "—";
    return `${money(p.amount, p.currency)}${p.interval ? `/${p.interval}` : ""}`;
}

function Plans({ plans }: Props) {
    return (
        <>
            <Head title="Plans · Admin" />
            <PageHeader title="Plans" sub="Recurring products shown on the storefront." />

            <Card>
                {plans.length === 0 ? (
                    <EmptyRow>No storefront plans yet.</EmptyRow>
                ) : (
                    <div className="admin-table-wrap">
                        <Table>
                            <Table.Head>
                                <Table.Row>
                                    <Table.Cell header>Plan</Table.Cell>
                                    <Table.Cell header>Price</Table.Cell>
                                    <Table.Cell header>Status</Table.Cell>
                                    <Table.Cell header>Recommended</Table.Cell>
                                    <Table.Cell header>Sync</Table.Cell>
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {plans.map((plan) => (
                                    <Table.Row key={plan.id}>
                                        <Table.Cell>
                                            <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--fg-1)" }}>{plan.name}</div>
                                            {plan.description && (
                                                <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{plan.description}</div>
                                            )}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{priceLabel(plan)}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge color={plan.active ? "emerald" : "zinc"}>{plan.active ? "Active" : "Inactive"}</Badge>
                                        </Table.Cell>
                                        <Table.Cell>
                                            {plan.recommended ? <Badge color="violet">Recommended</Badge> : <span style={{ color: "var(--fg-4)" }}>—</span>}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Button
                                                color="violet"
                                                variant="ghost"
                                                size="sm"
                                                icon="refresh-cw"
                                                onClick={() => router.post(`/admin/plans/${plan.id}/sync`, {}, { preserveScroll: true })}
                                            >
                                                Sync
                                            </Button>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </div>
                )}
            </Card>
        </>
    );
}

Plans.layout = adminLayout;
export default Plans;
