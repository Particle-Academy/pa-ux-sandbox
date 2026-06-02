import { Head, router } from "@inertiajs/react";
import { Badge, Button, Card, Table } from "@particle-academy/react-fancy";
import { adminLayout } from "./AdminLayout";
import { PageHeader, StatusDot, EmptyRow } from "./ui";

type Price = { amount: number; currency: string; type: string; interval: string | null };
type Product = {
    id: number;
    name: string;
    description: string | null;
    active: boolean;
    synced: boolean;
    order: number;
    prices_count: number;
    prices: Price[];
};
type Props = { products: Product[]; pending: number };

function Products({ products }: Props) {
    return (
        <>
            <Head title="Products · Admin" />
            <PageHeader
                title="Products"
                sub="Manage the Stripe catalog."
                actions={
                    <Button
                        color="violet"
                        size="sm"
                        icon="refresh-cw"
                        onClick={() => router.post("/admin/products/sync-all", {}, { preserveScroll: true })}
                    >
                        Sync all
                    </Button>
                }
            />

            <Card>
                {products.length === 0 ? (
                    <EmptyRow>No products yet.</EmptyRow>
                ) : (
                    <div className="admin-table-wrap">
                        <Table>
                            <Table.Head>
                                <Table.Row>
                                    <Table.Cell header>Product</Table.Cell>
                                    <Table.Cell header>Prices</Table.Cell>
                                    <Table.Cell header>Stripe</Table.Cell>
                                    <Table.Cell header>Status</Table.Cell>
                                    <Table.Cell header></Table.Cell>
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {products.map((product) => (
                                    <Table.Row key={product.id}>
                                        <Table.Cell>
                                            <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--fg-1)" }}>{product.name}</div>
                                            {product.description && (
                                                <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{product.description}</div>
                                            )}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{product.prices_count}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <StatusDot ok={product.synced} />
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge color={product.active ? "emerald" : "zinc"}>{product.active ? "Active" : "Inactive"}</Badge>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Button
                                                color="violet"
                                                variant="ghost"
                                                size="sm"
                                                icon="refresh-cw"
                                                onClick={() => router.post(`/admin/products/${product.id}/sync`, {}, { preserveScroll: true })}
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

Products.layout = adminLayout;
export default Products;
