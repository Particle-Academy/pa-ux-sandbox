import { Head, Link, useForm } from "@inertiajs/react";
import { Button, Card, Field, Input, Select, Switch, Textarea } from "@particle-academy/react-fancy";
import { adminLayout } from "./AdminLayout";
import { PageHeader } from "./ui";
import { COSMETIC_CATALOG, avatarFrameClass, nameColorClass, bannerStyle } from "../../lib/cosmetics";

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

/**
 * Live preview of a cosmetic, rendered with the SAME helpers the real UI uses
 * (lib/cosmetics.ts) — so what you see here is exactly what a buyer gets on
 * their profile/avatar/name. `slots` carries only the slot being edited, so the
 * other surfaces show their default (un-owned) state for context.
 */
function CosmeticPreview({ slot, value }: { slot: string; value: string }) {
    if (!slot || !value) {
        return (
            <div style={{ ...HINT, padding: 12, border: "1px dashed var(--border, #e4e4e7)", borderRadius: 8 }}>
                Pick a slot and value to preview the cosmetic.
            </div>
        );
    }
    const slots = { [slot]: value };
    const banner = bannerStyle(slots);

    return (
        <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--border, #e4e4e7)", background: "var(--bg-2, #fafafa)" }}>
            <div
                style={{
                    height: 52,
                    ...(banner ?? { backgroundImage: "linear-gradient(120deg, #e4e4e7, #f4f4f5)" }),
                }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 14px 14px", marginTop: -18 }}>
                <div
                    className={avatarFrameClass(slots)}
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: "9999px",
                        background: "linear-gradient(135deg, #a78bfa, #6366f1)",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 700,
                        fontSize: 15,
                        flexShrink: 0,
                    }}
                >
                    AW
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: 18 }}>
                    <span className={nameColorClass(slots)} style={{ fontWeight: 600, fontSize: 14 }}>Ava Wu</span>
                    <span style={{ fontSize: 12, color: "var(--fg-3)" }}>Level 7 · 4,820 XP</span>
                </div>
            </div>
        </div>
    );
}

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
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--fg-2)", marginBottom: 6 }}>Preview</div>
                                            <CosmeticPreview slot={f.data.slot} value={f.data.value} />
                                        </div>
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
                                <Button as={Link} variant="ghost" href="/admin/shop">
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
