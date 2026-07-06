import { Head, router, useForm } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { Badge, Button, Card, Icon, Switch, Table, Text } from "@particle-academy/react-fancy";
import type { Color } from "@particle-academy/react-fancy";
import { DownlineTree, type DownlineEdge, type DownlineMember } from "@particle-academy/fancy-mlm-ui";
import { adminLayout } from "../AdminLayout";
import { EmptyRow, PageHeader } from "../ui";

type Tree = "unilevel" | "binary" | "matrix";
type Plan = {
    tree: Tree;
    width: number;
    metric: string;
    levelFactors: number[];
    tiers: Record<string, number>;
    compression: boolean;
    defaultTier: string;
};
type TreeOption = { value: Tree; label: string; blurb: string };
type AdminMember = {
    id: string;
    label: string;
    userId: number | null;
    userName: string | null;
    userEmail: string | null;
    tier: string;
    active: boolean;
    sponsorId: string | null;
    placementId: string | null;
    demo: boolean;
};
type EligibleUser = { id: number; name: string; email: string };
type Props = {
    plan: Plan;
    edge: DownlineEdge;
    network: DownlineMember[];
    trees: TreeOption[];
    members: AdminMember[];
    eligibleUsers: EligibleUser[];
    tierKeys: string[];
};

const TIER_COLOR: Record<string, Color> = { bronze: "orange", silver: "zinc", gold: "amber", diamond: "violet" };
const tierColor = (tier?: string): Color => (tier && TIER_COLOR[tier]) || "slate";
const edgeFor = (tree: Tree): DownlineEdge => (tree === "unilevel" ? "sponsor" : "placement");

/**
 * Every member in `id`'s downline, walking BOTH edges (sponsor, and the
 * placement edge's `placement ?? sponsor` fallback — the pointers the engine
 * climbs). Used to exclude a member's own subtree from the sponsor/placement
 * pickers; the server re-checks and rejects cycles regardless.
 */
function descendantsOf(id: string, members: AdminMember[]): Set<string> {
    const out = new Set<string>();
    const queue = [id];
    while (queue.length > 0) {
        const cur = queue.shift()!;
        for (const m of members) {
            if (m.id === id || out.has(m.id)) continue;
            if (m.sponsorId === cur || (m.placementId ?? m.sponsorId) === cur) {
                out.add(m.id);
                queue.push(m.id);
            }
        }
    }
    return out;
}

const selectClass =
    "mt-1 w-full rounded-lg border border-[var(--border-1)] bg-[var(--bg-0)] px-3 py-2 text-sm";

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <span className="mt-1 block text-xs text-rose-500">{message}</span>;
}

/** Inline editor for one member: sponsor / placement / tier / active. */
function MemberEditor({
    member,
    members,
    tierKeys,
    onClose,
}: {
    member: AdminMember;
    members: AdminMember[];
    tierKeys: string[];
    onClose: () => void;
}) {
    // Self + own subtree can't be a parent — that would loop the tree.
    const excluded = useMemo(() => descendantsOf(member.id, members), [member.id, members]);
    const parentOptions = members.filter((m) => m.id !== member.id && !excluded.has(m.id));

    const f = useForm<{
        sponsor_id: string | null;
        placement_id: string | null;
        tier: string;
        active: boolean;
    }>({
        sponsor_id: member.sponsorId,
        placement_id: member.placementId,
        tier: member.tier,
        active: member.active,
    });

    const save = (e: React.FormEvent) => {
        e.preventDefault();
        f.put(`/admin/mlm/members/${member.id}`, { preserveScroll: true, onSuccess: onClose });
    };

    return (
        <form onSubmit={save} className="grid gap-3 rounded-xl border border-teal-500/40 bg-teal-500/5 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-medium text-[var(--fg-2)]">
                Sponsor (referring member)
                <select
                    className={selectClass}
                    value={f.data.sponsor_id ?? ""}
                    onChange={(e) => f.setData("sponsor_id", e.target.value || null)}
                >
                    <option value="">— none (network root)</option>
                    {parentOptions.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                </select>
                <FieldError message={f.errors.sponsor_id} />
            </label>

            <label className="text-xs font-medium text-[var(--fg-2)]">
                Placement (binary / matrix slot)
                <select
                    className={selectClass}
                    value={f.data.placement_id ?? ""}
                    onChange={(e) => f.setData("placement_id", e.target.value || null)}
                >
                    <option value="">— none (falls back to sponsor)</option>
                    {parentOptions.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                </select>
                <FieldError message={f.errors.placement_id} />
            </label>

            <label className="text-xs font-medium text-[var(--fg-2)]">
                Tier
                <select
                    className={selectClass}
                    value={f.data.tier}
                    onChange={(e) => f.setData("tier", e.target.value)}
                >
                    {tierKeys.map((t) => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
                <FieldError message={f.errors.tier} />
            </label>

            <div className="flex flex-col justify-between gap-2">
                <label className="flex items-center gap-2 text-xs font-medium text-[var(--fg-2)]">
                    <Switch checked={f.data.active} onCheckedChange={(v) => f.setData("active", Boolean(v))} />
                    Active
                </label>
                <div className="flex items-center gap-2">
                    <Button type="submit" color="teal" size="sm" disabled={f.processing}>
                        <Icon name="check" className="mr-1 h-3.5 w-3.5" /> Save
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
                </div>
            </div>
        </form>
    );
}

/** Enroll an existing user (one without a member row) into the network. */
function CreateMemberForm({
    eligibleUsers,
    members,
    tierKeys,
    defaultTier,
}: {
    eligibleUsers: EligibleUser[];
    members: AdminMember[];
    tierKeys: string[];
    defaultTier: string;
}) {
    const f = useForm<{
        user_id: string;
        sponsor_id: string | null;
        placement_id: string | null;
        tier: string;
    }>({ user_id: "", sponsor_id: null, placement_id: null, tier: defaultTier });

    if (eligibleUsers.length === 0) {
        return (
            <Text className="text-sm text-[var(--fg-3)]">
                Every user already has a member row — new signups join automatically on their first visit to /referrals.
            </Text>
        );
    }

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        f.post("/admin/mlm/members", { preserveScroll: true, onSuccess: () => f.reset() });
    };

    return (
        <form onSubmit={submit} className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-xs font-medium text-[var(--fg-2)]">
                User
                <select
                    className={selectClass}
                    value={f.data.user_id}
                    onChange={(e) => f.setData("user_id", e.target.value)}
                >
                    <option value="">— pick a user…</option>
                    {eligibleUsers.map((u) => (
                        <option key={u.id} value={String(u.id)}>{u.name} ({u.email})</option>
                    ))}
                </select>
                <FieldError message={f.errors.user_id} />
            </label>

            <label className="text-xs font-medium text-[var(--fg-2)]">
                Sponsor (optional)
                <select
                    className={selectClass}
                    value={f.data.sponsor_id ?? ""}
                    onChange={(e) => f.setData("sponsor_id", e.target.value || null)}
                >
                    <option value="">— none (network root)</option>
                    {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                </select>
                <FieldError message={f.errors.sponsor_id} />
            </label>

            <label className="text-xs font-medium text-[var(--fg-2)]">
                Placement (optional)
                <select
                    className={selectClass}
                    value={f.data.placement_id ?? ""}
                    onChange={(e) => f.setData("placement_id", e.target.value || null)}
                >
                    <option value="">— falls back to sponsor</option>
                    {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                </select>
                <FieldError message={f.errors.placement_id} />
            </label>

            <label className="text-xs font-medium text-[var(--fg-2)]">
                Tier
                <select
                    className={selectClass}
                    value={f.data.tier}
                    onChange={(e) => f.setData("tier", e.target.value)}
                >
                    {tierKeys.map((t) => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
                <FieldError message={f.errors.tier} />
            </label>

            <Button type="submit" color="teal" disabled={f.processing || !f.data.user_id}>
                <Icon name="user-plus" className="mr-1 h-4 w-4" /> Add member
            </Button>
        </form>
    );
}

/** The Members card: list, inline edit, create-for-user, delete, demo purge. */
function MembersSection({
    members,
    eligibleUsers,
    tierKeys,
    defaultTier,
}: {
    members: AdminMember[];
    eligibleUsers: EligibleUser[];
    tierKeys: string[];
    defaultTier: string;
}) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const hasDemo = members.some((m) => m.demo);
    const labelOf = (id: string | null) =>
        id === null ? "—" : (members.find((m) => m.id === id)?.label ?? `#${id}`);

    const purgeDemo = () => {
        if (window.confirm("Delete ALL demo-seeded members? Real members sponsored by a demo member are re-attached to the nearest surviving upline.")) {
            router.post("/admin/mlm/members/purge-demo", {}, { preserveScroll: true });
        }
    };

    const destroy = (m: AdminMember) => {
        if (window.confirm(`Remove ${m.label} from the network? Their downline re-attaches to their own upline.`)) {
            router.delete(`/admin/mlm/members/${m.id}`, { preserveScroll: true });
        }
    };

    return (
        <Card className="mt-6">
            <Card.Header>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">Members</span>
                        <Badge variant="soft">{members.length}</Badge>
                    </div>
                    {hasDemo && (
                        <Button type="button" color="red" size="sm" onClick={purgeDemo}>
                            <Icon name="trash-2" className="mr-1 h-3.5 w-3.5" /> Remove demo data
                        </Button>
                    )}
                </div>
                <Text className="text-sm text-[var(--fg-3)]">
                    The live network. Re-point a member's sponsor or placement, adjust their tier, or enroll an
                    existing user — the preview above re-shapes instantly.
                </Text>
            </Card.Header>
            <Card.Body>
                {members.length === 0 ? (
                    <EmptyRow>
                        No members yet — they appear automatically when a signed-in user visits /referrals, or add one below.
                    </EmptyRow>
                ) : (
                    <div className="admin-table-wrap">
                        <Table>
                            <Table.Head>
                                <Table.Row>
                                    <Table.Cell header>Member</Table.Cell>
                                    <Table.Cell header>Tier</Table.Cell>
                                    <Table.Cell header>Active</Table.Cell>
                                    <Table.Cell header>Sponsor</Table.Cell>
                                    <Table.Cell header>Placement</Table.Cell>
                                    <Table.Cell header></Table.Cell>
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {members.map((m) => (
                                    <Table.Row key={m.id}>
                                        <Table.Cell>
                                            <div className="flex items-center gap-2">
                                                <div>
                                                    <div className="text-[13.5px] font-medium text-[var(--fg-1)]">{m.label}</div>
                                                    <div className="mt-0.5 text-xs text-[var(--fg-3)]">
                                                        {m.userEmail ?? "(no user)"}
                                                    </div>
                                                </div>
                                                {m.demo && <Badge color="rose" variant="soft" size="sm">demo</Badge>}
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge color={tierColor(m.tier)} variant="soft" size="sm" className="capitalize">{m.tier}</Badge>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className={`text-xs ${m.active ? "text-emerald-600" : "text-[var(--fg-4)]"}`}>
                                                {m.active ? "active" : "inactive"}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell><span className="text-[13px] text-[var(--fg-2)]">{labelOf(m.sponsorId)}</span></Table.Cell>
                                        <Table.Cell><span className="text-[13px] text-[var(--fg-2)]">{labelOf(m.placementId)}</span></Table.Cell>
                                        <Table.Cell>
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setEditingId(editingId === m.id ? null : m.id)}
                                                >
                                                    <Icon name="pencil" className="mr-1 h-3.5 w-3.5" /> Edit
                                                </Button>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => destroy(m)}>
                                                    <Icon name="trash-2" className="h-3.5 w-3.5 text-rose-500" />
                                                </Button>
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </div>
                )}

                {editingId !== null && members.some((m) => m.id === editingId) && (
                    <div className="mt-4">
                        <MemberEditor
                            key={editingId}
                            member={members.find((m) => m.id === editingId)!}
                            members={members}
                            tierKeys={tierKeys}
                            onClose={() => setEditingId(null)}
                        />
                    </div>
                )}

                <div className="mt-6 border-t border-[var(--border-1)] pt-4">
                    <div className="mb-2 text-sm font-semibold">Add a member</div>
                    <CreateMemberForm
                        eligibleUsers={eligibleUsers}
                        members={members}
                        tierKeys={tierKeys}
                        defaultTier={defaultTier}
                    />
                </div>
            </Card.Body>
        </Card>
    );
}

function AdminMlm({ plan, network, trees, members, eligibleUsers, tierKeys }: Props) {
    const f = useForm<{
        tree: Tree;
        width: number;
        levelFactors: number[];
        compression: boolean;
        tiers: Record<string, number>;
    }>({
        tree: plan.tree,
        width: plan.width || 3,
        levelFactors: plan.levelFactors.length ? plan.levelFactors : [1],
        compression: plan.compression,
        tiers: plan.tiers,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        f.put("/admin/mlm", { preserveScroll: true });
    };

    const setFactor = (i: number, v: number) =>
        f.setData("levelFactors", f.data.levelFactors.map((x, idx) => (idx === i ? v : x)));
    const addLevel = () => f.setData("levelFactors", [...f.data.levelFactors, 0.1]);
    const removeLevel = (i: number) =>
        f.setData("levelFactors", f.data.levelFactors.filter((_, idx) => idx !== i));
    const setTier = (key: string, v: number) => f.setData("tiers", { ...f.data.tiers, [key]: v });

    const previewEdge = edgeFor(f.data.tree);

    return (
        <>
            <Head title="Referral Program · Admin" />
            <PageHeader
                title="Referral Program"
                sub="Configure the fancy-mlm compensation plan. Changes go live immediately across the engine, the /referrals surface, and the fun-lab referral loop."
            />

            <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
                <div className="flex flex-col gap-6">
                    {/* ── Tree shape ─────────────────────────────────────── */}
                    <Card>
                        <Card.Header>
                            <span className="font-semibold">Downline shape</span>
                        </Card.Header>
                        <Card.Body>
                            <div className="grid gap-3">
                                {trees.map((t) => {
                                    const active = f.data.tree === t.value;
                                    return (
                                        <button
                                            type="button"
                                            key={t.value}
                                            onClick={() => f.setData("tree", t.value)}
                                            className={`rounded-xl border p-4 text-left transition ${
                                                active
                                                    ? "border-teal-500 bg-teal-500/5 ring-1 ring-teal-500/30"
                                                    : "border-[var(--border-1)] hover:border-[var(--border-2)]"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{t.label}</span>
                                                {active && <Icon name="check-circle" className="h-4 w-4 text-teal-500" />}
                                            </div>
                                            <Text className="mt-1 text-sm text-[var(--fg-3)]">{t.blurb}</Text>
                                        </button>
                                    );
                                })}
                            </div>

                            {f.data.tree === "matrix" && (
                                <label className="mt-4 block text-sm font-medium">
                                    Matrix width (legs per member)
                                    <input
                                        type="number"
                                        min={2}
                                        max={6}
                                        value={f.data.width}
                                        onChange={(e) => f.setData("width", Number(e.target.value))}
                                        className="mt-1 w-32 rounded-lg border border-[var(--border-1)] bg-[var(--bg-0)] px-3 py-2 text-sm"
                                    />
                                </label>
                            )}
                        </Card.Body>
                    </Card>

                    {/* ── Level factors ──────────────────────────────────── */}
                    <Card>
                        <Card.Header>
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">Level decay</span>
                                <Button type="button" variant="ghost" size="sm" onClick={addLevel} disabled={f.data.levelFactors.length >= 8}>
                                    <Icon name="plus" className="mr-1 h-3.5 w-3.5" /> Add level
                                </Button>
                            </div>
                            <Text className="text-sm text-[var(--fg-3)]">
                                Share of the base bonus paid at each upline level (0–1).
                            </Text>
                        </Card.Header>
                        <Card.Body>
                            <div className="flex flex-wrap gap-3">
                                {f.data.levelFactors.map((factor, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1">
                                        <span className="text-xs text-[var(--fg-3)]">L{i + 1}</span>
                                        <input
                                            type="number"
                                            step={0.05}
                                            min={0}
                                            max={1}
                                            value={factor}
                                            onChange={(e) => setFactor(i, Number(e.target.value))}
                                            className="w-20 rounded-lg border border-[var(--border-1)] bg-[var(--bg-0)] px-2 py-1.5 text-center text-sm"
                                        />
                                        {f.data.levelFactors.length > 1 && (
                                            <button type="button" onClick={() => removeLevel(i)} className="text-xs text-rose-500 hover:underline">
                                                remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>

                    {/* ── Tiers ──────────────────────────────────────────── */}
                    <Card>
                        <Card.Header>
                            <span className="font-semibold">Tier multipliers</span>
                            <Text className="text-sm text-[var(--fg-3)]">Scales the bonus by each upline member's rank.</Text>
                        </Card.Header>
                        <Card.Body>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {Object.entries(f.data.tiers).map(([key, mult]) => (
                                    <label key={key} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-1)] px-3 py-2">
                                        <Badge color={tierColor(key)} variant="soft" className="capitalize">{key}</Badge>
                                        <input
                                            type="number"
                                            step={0.05}
                                            min={0.1}
                                            max={10}
                                            value={mult}
                                            onChange={(e) => setTier(key, Number(e.target.value))}
                                            className="w-24 rounded-lg border border-[var(--border-1)] bg-[var(--bg-0)] px-2 py-1.5 text-right text-sm"
                                        />
                                    </label>
                                ))}
                            </div>

                            <label className="mt-4 flex items-center gap-3">
                                <Switch checked={f.data.compression} onCheckedChange={(v) => f.setData("compression", Boolean(v))} />
                                <span className="text-sm">
                                    <span className="font-medium">Dynamic compression</span>
                                    <span className="text-[var(--fg-3)]"> — skip inactive uplines so the next active member earns the level.</span>
                                </span>
                            </label>
                        </Card.Body>
                    </Card>

                    <div className="flex items-center gap-3">
                        <Button type="submit" color="teal" disabled={f.processing}>
                            <Icon name="save" className="mr-1 h-4 w-4" /> Save plan
                        </Button>
                        {f.recentlySuccessful && (
                            <span className="text-sm text-teal-600">
                                <Icon name="check" className="mr-1 inline h-4 w-4" /> Saved — live now.
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Live preview ───────────────────────────────────────── */}
                <Card className="h-fit xl:sticky xl:top-6">
                    <Card.Header>
                        <div className="flex items-center justify-between">
                            <span className="font-semibold">Live preview</span>
                            <Badge color="teal" variant="soft" className="capitalize">{f.data.tree}</Badge>
                        </div>
                        <Text className="text-sm text-[var(--fg-3)]">
                            The live network, re-shaped by the selected tree — drawn along the{" "}
                            <span className="font-medium">{previewEdge}</span> edge.
                        </Text>
                    </Card.Header>
                    <Card.Body>
                        {network.length > 0 ? (
                            <DownlineTree value={network} edge={previewEdge} tierColor={tierColor} />
                        ) : (
                            <Text className="text-sm text-[var(--fg-3)]">
                                No members yet. A member is created automatically the first time a signed-in
                                user visits /referrals — or add and organize members in the section below.
                            </Text>
                        )}
                    </Card.Body>
                </Card>
            </form>

            {/* ── Members ────────────────────────────────────────────────── */}
            <MembersSection
                members={members}
                eligibleUsers={eligibleUsers}
                tierKeys={tierKeys}
                defaultTier={plan.defaultTier || tierKeys[0] || "bronze"}
            />
        </>
    );
}

AdminMlm.layout = adminLayout;

export default AdminMlm;
