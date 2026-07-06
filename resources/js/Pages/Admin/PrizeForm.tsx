import { Head, Link, useForm } from "@inertiajs/react";
import { Button, Card, Field, Input, Select, Switch, Textarea } from "@particle-academy/react-fancy";
import { adminLayout } from "./AdminLayout";
import { PageHeader } from "./ui";

type Prize = {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    type: string;
    cost_in_points: number;
    inventory_quantity: number | null;
    is_active: boolean;
    sort_order: number;
};
type Props = { prize: Prize | null; pending: number };

function PrizeForm({ prize }: Props) {
    const editing = prize !== null;
    const f = useForm({
        slug: prize?.slug ?? "",
        name: prize?.name ?? "",
        description: prize?.description ?? "",
        type: prize?.type ?? "virtual",
        cost_in_points: prize?.cost_in_points ?? 0,
        inventory_quantity: prize?.inventory_quantity != null ? String(prize.inventory_quantity) : "",
        is_active: prize?.is_active ?? true,
        sort_order: prize?.sort_order ?? 0,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            f.put(`/admin/gamification/prizes/${prize!.id}`, { preserveScroll: true });
        } else {
            f.post("/admin/gamification/prizes", { preserveScroll: true });
        }
    }

    return (
        <>
            <Head title={`${editing ? "Edit" : "New"} prize · Admin`} />
            <PageHeader title={editing ? "Edit prize" : "New prize"} sub="Prizes taxonomy." />

            <form onSubmit={submit}>
                <div className="admin-form-grid">
                    <Card>
                        <Card.Header>Prize details</Card.Header>
                        <div style={{ padding: 16 }} className="admin-field-stack">
                            <Field label="Slug" error={f.errors.slug} required>
                                <Input value={f.data.slug} onChange={(e) => f.setData("slug", e.target.value)} placeholder="hoodie" />
                            </Field>
                            <Field label="Name" error={f.errors.name} required>
                                <Input value={f.data.name} onChange={(e) => f.setData("name", e.target.value)} />
                            </Field>
                            <Field label="Type" error={f.errors.type} required>
                                <Select
                                    value={f.data.type}
                                    onValueChange={(v) => f.setData("type", v)}
                                    list={[
                                        { value: "virtual", label: "Virtual" },
                                        { value: "physical", label: "Physical" },
                                    ]}
                                />
                            </Field>
                            <Field label="Cost (coins)" error={f.errors.cost_in_points} required>
                                <Input type="number" value={String(f.data.cost_in_points)} onChange={(e) => f.setData("cost_in_points", Number(e.target.value))} placeholder="500" />
                            </Field>
                            <Field label="Inventory (blank = unlimited)" error={f.errors.inventory_quantity}>
                                <Input type="number" value={f.data.inventory_quantity} onChange={(e) => f.setData("inventory_quantity", e.target.value)} />
                            </Field>
                            <Field label="Sort order" error={f.errors.sort_order}>
                                <Input type="number" value={String(f.data.sort_order)} onChange={(e) => f.setData("sort_order", Number(e.target.value))} />
                            </Field>
                            <Textarea
                                label="Description"
                                error={f.errors.description}
                                value={f.data.description ?? ""}
                                onValueChange={(v) => f.setData("description", v)}
                                autoResize
                                minRows={2}
                            />
                        </div>
                    </Card>

                    <Card>
                        <Card.Header>Status</Card.Header>
                        <div style={{ padding: 16 }} className="admin-field-stack">
                            <Switch checked={f.data.is_active} onCheckedChange={(v) => f.setData("is_active", v)} label="Active" color="violet" />
                            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                <Button type="submit" color="violet" loading={f.processing}>
                                    {editing ? "Save changes" : "Create prize"}
                                </Button>
                                <Button as={Link} variant="ghost" href="/admin/gamification">
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </form>
        </>
    );
}

PrizeForm.layout = adminLayout;
export default PrizeForm;
