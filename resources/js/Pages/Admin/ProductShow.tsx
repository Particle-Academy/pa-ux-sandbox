import { Head, router } from "@inertiajs/react";
import { Badge, Button, Card, Table } from "@particle-academy/react-fancy";
import { adminLayout } from "./AdminLayout";
import { PageHeader, StatusDot, EmptyRow } from "./ui";

type Price = {
    id: number;
    amount: number;
    currency: string;
    type: string;
    interval: string | null;
    recurring: boolean;
    active: boolean;
    external_id: string | null;
};
type Product = {
    id: number;
    name: string;
    description: string | null;
    active: boolean;
    order: number;
    external_id: string | null;
    synced: boolean;
    prices: Price[];
};
type Props = { product: Product; pending: number };

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

function ProductShow({ product }: Props) {
    return (
        <>
            <Head title={`${product.name} · Admin`} />
            <PageHeader
                title={product.name}
                sub="Product details and management."
                actions={
                    <>
                        <Button
                            color="violet"
                            size="sm"
                            icon="refresh-cw"
                            onClick={() => router.post(`/admin/products/${product.id}/sync`, {}, { preserveScroll: true })}
                        >
                            Sync
                        </Button>
                        <Button variant="ghost" size="sm" icon="pencil" href={`/admin/products/${product.id}/edit`}>
                            Edit
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            color="red"
                            icon="trash-2"
                            onClick={() => {
                                if (confirm("Delete this product? This cannot be undone.")) {
                                    router.delete(`/admin/products/${product.id}`);
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
                            <Detail label="Name">{product.name}</Detail>
                            <Detail label="Status">
                                <Badge color={product.active ? "emerald" : "zinc"}>{product.active ? "Active" : "Inactive"}</Badge>
                            </Detail>
                            {product.description && <Detail label="Description">{product.description}</Detail>}
                            <Detail label="Order">{product.order}</Detail>
                            <Detail label="Stripe Product ID">
                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{product.external_id ?? "Not synced"}</span>
                            </Detail>
                            <Detail label="Stripe sync">
                                <StatusDot ok={product.synced} />
                            </Detail>
                        </div>
                    </Card.Body>
                </Card>

                <Card>
                    <Card.Header>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>Prices</div>
                    </Card.Header>
                    {product.prices.length === 0 ? (
                        <EmptyRow>No prices yet.</EmptyRow>
                    ) : (
                        <div className="admin-table-wrap">
                            <Table>
                                <Table.Head>
                                    <Table.Row>
                                        <Table.Cell header>Amount</Table.Cell>
                                        <Table.Cell header>Type</Table.Cell>
                                        <Table.Cell header>Status</Table.Cell>
                                        <Table.Cell header>Stripe Price ID</Table.Cell>
                                    </Table.Row>
                                </Table.Head>
                                <Table.Body>
                                    {product.prices.map((price) => (
                                        <Table.Row key={price.id}>
                                            <Table.Cell>
                                                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>
                                                    {money(price.amount, price.currency)}
                                                </span>
                                            </Table.Cell>
                                            <Table.Cell>
                                                {price.recurring ? `Recurring (${price.interval ?? "—"})` : "One-time"}
                                            </Table.Cell>
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

ProductShow.layout = adminLayout;
export default ProductShow;
