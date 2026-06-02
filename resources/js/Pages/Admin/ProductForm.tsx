import { Head, useForm } from "@inertiajs/react";
import { Button, Card, Field, Input, Switch, Textarea } from "@particle-academy/react-fancy";
import { adminLayout } from "./AdminLayout";
import { PageHeader } from "./ui";

type Product = {
    id: number;
    name: string;
    description: string | null;
    active: boolean;
    order: number;
};
type Props = { product: Product | null; pending: number };

function ProductForm({ product }: Props) {
    const f = useForm({
        name: product?.name ?? "",
        description: product?.description ?? "",
        active: product?.active ?? true,
        order: product?.order ?? 0,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (product) {
            f.put(`/admin/products/${product.id}`, { preserveScroll: true });
        } else {
            f.post("/admin/products", { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title={`${product ? "Edit" : "Create"} Product · Admin`} />
            <PageHeader
                title={product ? "Edit product" : "Create product"}
                sub="Manage the Stripe catalog."
            />

            <form onSubmit={submit}>
                <div className="admin-form-grid">
                    <Card>
                        <Card.Body>
                            <div className="admin-field-stack">
                                <Field label="Name" required error={f.errors.name}>
                                    <Input
                                        value={f.data.name}
                                        onChange={(e) => f.setData("name", e.target.value)}
                                        placeholder="Starter"
                                    />
                                </Field>
                                <Textarea
                                    label="Description"
                                    value={f.data.description}
                                    onValueChange={(v) => f.setData("description", v)}
                                    error={f.errors.description}
                                    autoResize
                                    minRows={3}
                                />
                                <Field label="Order" error={f.errors.order}>
                                    <Input
                                        type="number"
                                        value={String(f.data.order)}
                                        onChange={(e) => f.setData("order", Number(e.target.value))}
                                    />
                                </Field>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card>
                        <Card.Body>
                            <div className="admin-field-stack">
                                <Switch
                                    checked={f.data.active}
                                    onCheckedChange={(v) => f.setData("active", v)}
                                    label="Active"
                                    color="violet"
                                />
                                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                                    <Button type="submit" color="violet" loading={f.processing}>
                                        {product ? "Update product" : "Create product"}
                                    </Button>
                                    <Button variant="ghost" href={product ? `/admin/products/${product.id}` : "/admin/products"}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </form>
        </>
    );
}

ProductForm.layout = adminLayout;
export default ProductForm;
