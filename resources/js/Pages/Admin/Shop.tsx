import { Head, router } from "@inertiajs/react";
import { Badge, Button, Card, Table } from "@particle-academy/react-fancy";
import { adminLayout } from "./AdminLayout";
import { PageHeader, EmptyRow } from "./ui";

type ShopItem = { id: number; name: string; slug: string; kind: string; description: string | null; price: number; active: boolean; purchases: number };
type Props = { items: ShopItem[]; pending: number };

function Shop({ items }: Props) {
    return (
        <>
            <Head title="Coin Shop · Admin" />
            <PageHeader
                title="Coin Shop"
                sub="Cosmetics + perks players buy with coins."
                actions={<Button icon="plus" size="sm" href="/admin/shop/create">New item</Button>}
            />

            <Card>
                {items.length === 0 ? (
                    <EmptyRow>No shop items yet.</EmptyRow>
                ) : (
                    <div className="admin-table-wrap">
                        <Table>
                            <Table.Head>
                                <Table.Row>
                                    <Table.Cell header>Item</Table.Cell>
                                    <Table.Cell header>Kind</Table.Cell>
                                    <Table.Cell header>Price</Table.Cell>
                                    <Table.Cell header>Sold</Table.Cell>
                                    <Table.Cell header>Status</Table.Cell>
                                    <Table.Cell header>Actions</Table.Cell>
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {items.map((item) => (
                                    <Table.Row key={item.id}>
                                        <Table.Cell>
                                            <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--fg-1)" }}>{item.name}</div>
                                            {item.description && <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{item.description}</div>}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge color="sky">{item.kind}</Badge>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{item.price} ◈</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{item.purchases}</span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge color={item.active ? "emerald" : "zinc"}>{item.active ? "Active" : "Inactive"}</Badge>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div style={{ display: "flex", gap: 4 }}>
                                                <Button variant="ghost" size="sm" icon="pencil" href={`/admin/shop/${item.id}/edit`}>
                                                    Edit
                                                </Button>
                                                <Button
                                                    color="violet"
                                                    variant="ghost"
                                                    size="sm"
                                                    icon="power"
                                                    onClick={() => router.post(`/admin/shop/${item.id}/toggle`, {}, { preserveScroll: true })}
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
        </>
    );
}

Shop.layout = adminLayout;
export default Shop;
