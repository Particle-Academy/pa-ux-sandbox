import { Head, useForm } from "@inertiajs/react";
import { Button, Card, Field, Input, Select, Switch, Textarea } from "@particle-academy/react-fancy";
import { adminLayout } from "./AdminLayout";
import { PageHeader } from "./ui";
import { COSMETIC_CATALOG } from "../../lib/cosmetics";

type ShopItem = {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    kind: string;
    price: number;
    active: boolean;
    order: number;
    slot: string;
    value: string;
    service: string;
    duration_days: string;
};
type Props = { item: ShopItem | null; pending: number };

const HINT = { fontSize: 12, color: "var(--fg-3)", marginTop: -2, lineHeight: 1.45 } as const;

function ShopForm({ item }: Props) {
    const editing = item !== null;
    const f = useForm({
        slug: item?.slug ?? "",
        name: item?.name ?? "",
        description: item?.description ?? "",
        kind: item?.kind ?? "cosmetic",
        price: item?.price ?? 0,
        order: item?.order ?? 0,
        active: item?.active ?? true,
        slot: item?.slot ?? "",
        value: item?.value ?? "",
        service: item?.service ?? "",
        duration_days: item?.duration_days ?? "",
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            f.put(`/admin/shop/${item!.id}`, { preserveScroll: true });
        } else {
            f.post("/admin/shop", { preserveScroll: true });
        }
    }

    return (
        <>
            <Head title={`${editing ? "Edit" : "New"} item · Coin Shop · Admin`} />
            <PageHeader
                title={editing ? "Edit item" : "New item"}
                sub="Cosmetics + perks players buy with coins."
            />

            <form onSubmit={submit}>
                <div className="admin-form-grid">
                    <Card>
                        <Card.Header>Item details</Card.Header>
                        <div style={{ padding: 16 }} className="admin-field-stack">
                            <Field label="Slug" error={f.errors.slug} required>
                                <Input value={f.data.slug} onChange={(e) => f.setData("slug", e.target.value)} placeholder="gold-frame" />
                            </Field>
                            <Field label="Name" error={f.errors.name} required>
                                <Input value={f.data.name} onChange={(e) => f.setData("name", e.target.value)} />
                            </Field>
                            <Textarea
                                label="Description"
                                error={f.errors.description}
                                value={f.data.description ?? ""}
                                onValueChange={(v) => f.setData("description", v)}
                                autoResize
                                minRows={2}
                            />
                            <Field label="Kind" error={f.errors.kind} required>
                                <Select
                                    value={f.data.kind}
                                    onValueChange={(v) => f.setData("kind", v)}
                                    list={[
                                        { value: "cosmetic", label: "Cosmetic" },
                                        { value: "service", label: "Service" },
                                    ]}
                                />
                            </Field>
                            <Field label="Price (coins)" error={f.errors.price} required>
                                <Input type="number" value={String(f.data.price)} onChange={(e) => f.setData("price", Number(e.target.value))} />
                            </Field>
                            <Field label="Order" error={f.errors.order}>
                                <Input type="number" value={String(f.data.order)} onChange={(e) => f.setData("order", Number(e.target.value))} />
                            </Field>

                            {f.data.kind === "cosmetic" && (() => {
                                const slotDef = COSMETIC_CATALOG.find((s) => s.slot === f.data.slot);
                                return (
                                    <>
                                        <Field label="Cosmetic slot" error={f.errors.slot} required>
                                            <Select
                                                value={f.data.slot}
                                                onValueChange={(v) => {
                                                    f.setData("slot", v);
                                                    f.setData("value", ""); // reset — values are slot-specific
                                                }}
                                                list={[
                                                    { value: "", label: "Select a slot…" },
                                                    ...COSMETIC_CATALOG.map((s) => ({ value: s.slot, label: s.label })),
                                                ]}
                                            />
                                        </Field>
                                        <Field label="Cosmetic value" error={f.errors.value} required>
                                            <Select
                                                value={f.data.value}
                                                onValueChange={(v) => f.setData("value", v)}
                                                disabled={!slotDef}
                                                list={[
                                                    { value: "", label: slotDef ? "Select a value…" : "Pick a slot first" },
                                                    ...(slotDef?.options ?? []).map((o) => ({ value: o.value, label: o.label })),
                                                ]}
                                            />
                                        </Field>
                                        <p style={HINT}>
                                            {slotDef ? slotDef.hint : "Pick the cosmetic slot this item unlocks."} Buying it sets the
                                            player's <code>{f.data.slot || "slot"}</code> cosmetic to <code>{f.data.value || "value"}</code>,
                                            rendered by <code>resources/js/lib/cosmetics.ts</code>. New options must be added there too.
                                        </p>
                                    </>
                                );
                            })()}
                            {f.data.kind === "service" && (
                                <>
                                    <Field label="Service handler" error={f.errors.service} required>
                                        <Select
                                            value={f.data.service}
                                            onValueChange={(v) => f.setData("service", v)}
                                            list={[
                                                { value: "", label: "Select a handler…" },
                                                { value: "featured-showcase", label: "Featured showcase — pins a submission" },
                                            ]}
                                        />
                                    </Field>
                                    <Field label="Duration (days)" error={f.errors.duration_days} required>
                                        <Input type="number" value={f.data.duration_days} onChange={(e) => f.setData("duration_days", e.target.value)} placeholder="7" />
                                    </Field>
                                    <p style={HINT}>
                                        On purchase, <code>featured-showcase</code> extends the linked submission's
                                        <code> featured_until</code> by the duration. It's the only service handler wired in
                                        <code> app/Services/Shop.php</code>.
                                    </p>
                                </>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <Card.Header>Status</Card.Header>
                        <div style={{ padding: 16 }} className="admin-field-stack">
                            <Switch checked={f.data.active} onCheckedChange={(v) => f.setData("active", v)} label="Active" color="violet" />
                            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                                <Button type="submit" color="violet" loading={f.processing}>
                                    {editing ? "Save changes" : "Create item"}
                                </Button>
                                <Button variant="ghost" href="/admin/shop">
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

ShopForm.layout = adminLayout;
export default ShopForm;
