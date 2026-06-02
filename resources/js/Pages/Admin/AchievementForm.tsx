import { Head, useForm } from "@inertiajs/react";
import { Button, Card, Field, Input, Switch, Textarea } from "@particle-academy/react-fancy";
import { adminLayout } from "./AdminLayout";
import { PageHeader } from "./ui";

type Achievement = {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    icon: string | null;
    is_active: boolean;
    sort_order: number;
};
type Props = { achievement: Achievement | null; pending: number };

function AchievementForm({ achievement }: Props) {
    const editing = achievement !== null;
    const f = useForm({
        slug: achievement?.slug ?? "",
        name: achievement?.name ?? "",
        description: achievement?.description ?? "",
        icon: achievement?.icon ?? "",
        is_active: achievement?.is_active ?? true,
        sort_order: achievement?.sort_order ?? 0,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            f.put(`/admin/gamification/achievements/${achievement!.id}`, { preserveScroll: true });
        } else {
            f.post("/admin/gamification/achievements", { preserveScroll: true });
        }
    }

    return (
        <>
            <Head title={`${editing ? "Edit" : "New"} achievement · Admin`} />
            <PageHeader
                title={editing ? "Edit achievement" : "New achievement"}
                sub="Achievements taxonomy."
            />

            <form onSubmit={submit}>
                <div className="admin-form-grid">
                    <Card>
                        <Card.Header>Achievement details</Card.Header>
                        <div style={{ padding: 16 }} className="admin-field-stack">
                            <Field label="Slug" error={f.errors.slug} required>
                                <Input value={f.data.slug} onChange={(e) => f.setData("slug", e.target.value)} placeholder="first-light" />
                            </Field>
                            <Field label="Name" error={f.errors.name} required>
                                <Input value={f.data.name} onChange={(e) => f.setData("name", e.target.value)} />
                            </Field>
                            <Field label="Icon" error={f.errors.icon}>
                                <Input value={f.data.icon ?? ""} onChange={(e) => f.setData("icon", e.target.value)} placeholder="lucide icon name" />
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
                                    {editing ? "Save changes" : "Create achievement"}
                                </Button>
                                <Button variant="ghost" href="/admin/gamification">
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

AchievementForm.layout = adminLayout;
export default AchievementForm;
