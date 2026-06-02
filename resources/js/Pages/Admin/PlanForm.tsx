import { Head, useForm } from "@inertiajs/react";
import { Button, Card, Field, Input, Switch, Textarea } from "@particle-academy/react-fancy";
import { adminLayout } from "./AdminLayout";
import { PageHeader } from "./ui";

type Plan = {
    id: number;
    name: string;
    description: string | null;
    active: boolean;
    order: number;
    show_on_storefront: boolean;
    recommended: boolean;
};
type Props = { plan: Plan | null; pending: number };

function PlanForm({ plan }: Props) {
    const f = useForm({
        name: plan?.name ?? "",
        description: plan?.description ?? "",
        active: plan?.active ?? true,
        order: plan?.order ?? 0,
        show_on_storefront: plan?.show_on_storefront ?? false,
        recommended: plan?.recommended ?? false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (plan) {
            f.put(`/admin/plans/${plan.id}`, { preserveScroll: true });
        } else {
            f.post("/admin/plans", { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title={`${plan ? "Edit" : "Create"} Plan · Admin`} />
            <PageHeader
                title={plan ? "Edit plan" : "Create plan"}
                sub="Recurring products shown on the storefront."
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
                                        placeholder="Pro Plan"
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
                                <Switch
                                    checked={f.data.show_on_storefront}
                                    onCheckedChange={(v) => f.setData("show_on_storefront", v)}
                                    label="Show on storefront"
                                    color="violet"
                                />
                                <Switch
                                    checked={f.data.recommended}
                                    onCheckedChange={(v) => f.setData("recommended", v)}
                                    label="Mark as recommended"
                                    color="violet"
                                />
                                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                                    <Button type="submit" color="violet" loading={f.processing}>
                                        {plan ? "Update plan" : "Create plan"}
                                    </Button>
                                    <Button variant="ghost" href={plan ? `/admin/plans/${plan.id}` : "/admin/plans"}>
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

PlanForm.layout = adminLayout;
export default PlanForm;
