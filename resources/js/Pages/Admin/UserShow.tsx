import { Head, Link, router, useForm } from "@inertiajs/react";
import { useMemo } from "react";
import { Avatar, Badge, Button, Card, Field, Icon, Input, Select, Switch, Table, Text } from "@particle-academy/react-fancy";
import type { Color } from "@particle-academy/react-fancy";
import { adminLayout } from "./AdminLayout";
import { PageHeader, StatCard, EmptyRow } from "./ui";

type AdminUser = {
    id: number;
    name: string;
    email: string;
    github_username: string | null;
    avatar_url: string | null;
    is_admin: boolean;
    opted_out: boolean;
    suspended: boolean;
    suspension_reason: string | null;
    can_suspend: boolean;
    pro: boolean;
    proSource: string | null;
    pro_override: boolean;
    coins: number;
    lifetime_earned: number;
    lifetime_spent: number;
    level: number;
    levelName: string | null;
    totalXp: number;
};
type MetricRow = { metric: string; slug: string; level: number; xp: number };
type Transaction = { kind: string; amount: number; reason: string | null; at: string | null };
type AchievementRow = { name: string; granted_at: string | null };
type OwnedSite = { id: number; label: string; host: string; status: string; listable: boolean; suspended: boolean; nsfw_status: string; created: string | null };
type Option = { slug: string; name: string };
type MlmMember = {
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

type Props = {
    user: AdminUser;
    metrics: MetricRow[];
    transactions: Transaction[];
    achievements: AchievementRow[];
    ownedSites: OwnedSite[];
    allMetrics: Option[];
    allAchievements: Option[];
    allPrizes: Option[];
    mlmMember: MlmMember | null;
    mlmMembers: MlmMember[];
    mlmTierKeys: string[];
};

const n = (v: number) => v.toLocaleString();

function initials(name: string): string {
    return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

const TIER_COLOR: Record<string, Color> = { bronze: "orange", silver: "zinc", gold: "amber", diamond: "violet" };
const tierColor = (tier?: string): Color => (tier && TIER_COLOR[tier]) || "slate";

/**
 * Every member in `id`'s downline, walking BOTH edges (sponsor, and the
 * placement edge's `placement ?? sponsor` fallback — the pointers the engine
 * climbs). Used to exclude a member's own subtree from the sponsor/placement
 * pickers; the server re-checks and rejects cycles regardless.
 */
function descendantsOf(id: string, members: MlmMember[]): Set<string> {
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

/** Enroll this user in the referral network: sponsor + optional tier → POST. */
function MlmEnrollForm({ userId, members, tierKeys }: { userId: number; members: MlmMember[]; tierKeys: string[] }) {
    const f = useForm<{ user_id: number; sponsor_id: string | null; tier: string | null }>({
        user_id: userId,
        sponsor_id: null,
        tier: null, // null → the server applies the plan's defaultTier
    });

    return (
        <form
            className="admin-field-stack"
            onSubmit={(e) => {
                e.preventDefault();
                f.post("/admin/mlm/members", { preserveScroll: true });
            }}
        >
            <Field label="Sponsor (referring member)" error={f.errors.sponsor_id}>
                <Select
                    value={f.data.sponsor_id ?? ""}
                    onValueChange={(v) => f.setData("sponsor_id", v || null)}
                    list={[
                        { value: "", label: "— none (network root)" },
                        ...members.map((m) => ({ value: m.id, label: m.label })),
                    ]}
                />
            </Field>
            <Field label="Tier" error={f.errors.tier}>
                <Select
                    value={f.data.tier ?? ""}
                    onValueChange={(v) => f.setData("tier", v || null)}
                    list={[
                        { value: "", label: "Plan default" },
                        ...tierKeys.map((t) => ({ value: t, label: t })),
                    ]}
                />
            </Field>
            <Button type="submit" color="teal" icon="user-plus" loading={f.processing}>Enroll in network</Button>
        </form>
    );
}

/** Inline editor for the user's member row: sponsor / placement / tier / active → PUT. */
function MlmMemberEditor({ member, members, tierKeys }: { member: MlmMember; members: MlmMember[]; tierKeys: string[] }) {
    // Self + own subtree can't be a parent — that would loop the tree.
    const excluded = useMemo(() => descendantsOf(member.id, members), [member.id, members]);
    const parentOptions = members.filter((m) => m.id !== member.id && !excluded.has(m.id));
    const parentList = (noneLabel: string) => [
        { value: "", label: noneLabel },
        ...parentOptions.map((m) => ({ value: m.id, label: m.label })),
    ];

    const f = useForm<{ sponsor_id: string | null; placement_id: string | null; tier: string; active: boolean }>({
        sponsor_id: member.sponsorId,
        placement_id: member.placementId,
        tier: member.tier,
        active: member.active,
    });

    return (
        <form
            className="admin-field-stack"
            onSubmit={(e) => {
                e.preventDefault();
                f.put(`/admin/mlm/members/${member.id}`, { preserveScroll: true });
            }}
        >
            <Field label="Sponsor (referring member)" error={f.errors.sponsor_id}>
                <Select
                    value={f.data.sponsor_id ?? ""}
                    onValueChange={(v) => f.setData("sponsor_id", v || null)}
                    list={parentList("— none (network root)")}
                />
            </Field>
            <Field label="Placement (binary / matrix slot)" error={f.errors.placement_id}>
                <Select
                    value={f.data.placement_id ?? ""}
                    onValueChange={(v) => f.setData("placement_id", v || null)}
                    list={parentList("— none (falls back to sponsor)")}
                />
            </Field>
            <Field label="Tier" error={f.errors.tier}>
                <Select
                    value={f.data.tier}
                    onValueChange={(v) => f.setData("tier", v)}
                    list={tierKeys.map((t) => ({ value: t, label: t }))}
                />
            </Field>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--fg-2)" }}>
                <Switch checked={f.data.active} onCheckedChange={(v) => f.setData("active", Boolean(v))} />
                Active
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Button type="submit" color="teal" icon="check" loading={f.processing}>Save member</Button>
                {f.recentlySuccessful && (
                    <span style={{ fontSize: 12, color: "var(--color-teal-600, #0d9488)" }}>Saved — the tree re-shaped.</span>
                )}
            </div>
        </form>
    );
}

/** The user's spot in the referral network: enroll them, or re-organize their member row. */
function ReferralNetworkCard({ userId, member, members, tierKeys }: { userId: number; member: MlmMember | null; members: MlmMember[]; tierKeys: string[] }) {
    const labelOf = (id: string | null) =>
        id === null ? "— none" : (members.find((m) => m.id === id)?.label ?? `#${id}`);

    return (
        <Card>
            <Card.Header>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>Referral network</div>
                    <Link href="/admin/mlm" style={{ fontSize: 12, color: "var(--fg-3)" }}>Open full network →</Link>
                </div>
            </Card.Header>
            <Card.Body>
                {member === null ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <Text size="xs" className="!text-zinc-500">
                            Not in the referral network yet. Enroll them under a referring member (sponsor) — or leave the sponsor empty to make them a network root.
                        </Text>
                        <MlmEnrollForm userId={userId} members={members} tierKeys={tierKeys} />
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                            <Badge color={tierColor(member.tier)} variant="soft" className="capitalize">{member.tier}</Badge>
                            <Badge color={member.active ? "emerald" : "zinc"} variant="soft">{member.active ? "active" : "inactive"}</Badge>
                            {member.demo && <Badge color="rose" variant="soft">demo</Badge>}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--fg-2)" }}>
                            <div>Sponsor: <span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{labelOf(member.sponsorId)}</span></div>
                            <div style={{ marginTop: 4 }}>Placement: <span style={{ color: "var(--fg-1)", fontWeight: 500 }}>{labelOf(member.placementId)}</span></div>
                        </div>
                        <div style={{ borderTop: "1px solid var(--border-1)", paddingTop: 12 }}>
                            <MlmMemberEditor key={member.id} member={member} members={members} tierKeys={tierKeys} />
                        </div>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}

function UserShow({ user, metrics, transactions, achievements, ownedSites, allMetrics, allAchievements, allPrizes, mlmMember, mlmMembers, mlmTierKeys }: Props) {
    const base = `/admin/users/${user.id}`;

    const xpForm = useForm({ metric: allMetrics[0]?.slug ?? "", amount: 100, reason: "" });
    const coinForm = useForm({ amount: 100, reason: "" });
    const achievementForm = useForm({ achievement: allAchievements[0]?.slug ?? "" });
    const prizeForm = useForm({ prize: allPrizes[0]?.slug ?? "" });
    const suspendForm = useForm({ reason: "" });

    return (
        <>
            <Head title={`${user.name} · Admin`} />
            <PageHeader
                title={user.name}
                sub={`${user.email}${user.github_username ? ` · @${user.github_username}` : ""}`}
                actions={
                    <Button variant="ghost" size="sm" icon="arrow-left" href="/admin/users">
                        Users
                    </Button>
                }
            />

            <div className="admin-form-grid">
                {/* Left column — profile + stats + breakdowns */}
                <div className="admin-stack">
                    <Card padding="lg">
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <Avatar src={user.avatar_url ?? undefined} fallback={initials(user.name)} size="lg" />
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--fg-1)" }}>{user.name}</div>
                                {user.github_username && (
                                    <div style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 2 }}>@{user.github_username}</div>
                                )}
                                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                                    {user.suspended && <Badge color="red">Suspended</Badge>}
                                    {user.is_admin && <Badge color="violet">Admin</Badge>}
                                    {user.pro && <Badge color="emerald">Pro{user.proSource ? ` · ${user.proSource}` : ""}</Badge>}
                                    {user.opted_out && <Badge color="amber">Opted out</Badge>}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="admin-grid-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                        <StatCard
                            label="Level"
                            value={`L${user.level}`}
                            icon="trending-up"
                            sub={user.levelName ?? undefined}
                        />
                        <StatCard
                            label="Coins"
                            value={`${n(user.coins)} ◈`}
                            icon="coins"
                            sub={`+${n(user.lifetime_earned)} / −${n(user.lifetime_spent)}`}
                        />
                        <StatCard label="Total XP" value={n(user.totalXp)} icon="award" />
                    </div>

                    <Card>
                        <Card.Header>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>Owned sites ({ownedSites.length})</div>
                        </Card.Header>
                        {ownedSites.length === 0 ? (
                            <EmptyRow>No showcase submissions yet.</EmptyRow>
                        ) : (
                            <div className="admin-table-wrap">
                                <Table>
                                    <Table.Head>
                                        <Table.Row>
                                            <Table.Cell header>Site</Table.Cell>
                                            <Table.Cell header>Status</Table.Cell>
                                            <Table.Cell header></Table.Cell>
                                        </Table.Row>
                                    </Table.Head>
                                    <Table.Body>
                                        {ownedSites.map((s) => (
                                            <Table.Row key={s.id}>
                                                <Table.Cell>
                                                    <Link href={`/admin/sites/${s.id}`} style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-1)" }}>{s.label}</Link>
                                                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-4)", marginTop: 2 }}>{s.host}</div>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                                                        <Badge color={s.status === "verified" ? "emerald" : s.status === "rejected" ? "red" : "zinc"} size="sm">{s.status}</Badge>
                                                        {s.suspended && <Badge color="red" size="sm">suspended</Badge>}
                                                        {s.nsfw_status === "flagged" && <Badge color="amber" size="sm">NSFW?</Badge>}
                                                        {s.listable && <Badge color="violet" size="sm" variant="soft">listed</Badge>}
                                                    </div>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Button variant="ghost" size="sm" href={`/admin/sites/${s.id}`}>Open →</Button>
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table>
                            </div>
                        )}
                    </Card>

                    <Card>
                        <Card.Header>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>XP by metric</div>
                        </Card.Header>
                        {metrics.length === 0 ? (
                            <EmptyRow>No XP yet.</EmptyRow>
                        ) : (
                            <div className="admin-table-wrap">
                                <Table>
                                    <Table.Head>
                                        <Table.Row>
                                            <Table.Cell header>Metric</Table.Cell>
                                            <Table.Cell header>Level</Table.Cell>
                                            <Table.Cell header>XP</Table.Cell>
                                        </Table.Row>
                                    </Table.Head>
                                    <Table.Body>
                                        {metrics.map((m) => (
                                            <Table.Row key={m.slug}>
                                                <Table.Cell>
                                                    <span style={{ fontSize: 13, color: "var(--fg-1)" }}>{m.metric}</span>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <span style={{ fontSize: 13, color: "var(--fg-3)" }}>L{m.level}</span>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{n(m.xp)}</span>
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table>
                            </div>
                        )}
                    </Card>

                    <Card>
                        <Card.Header>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>Recent wallet transactions</div>
                        </Card.Header>
                        {transactions.length === 0 ? (
                            <EmptyRow>No transactions yet.</EmptyRow>
                        ) : (
                            <div className="admin-table-wrap">
                                <Table>
                                    <Table.Head>
                                        <Table.Row>
                                            <Table.Cell header>When</Table.Cell>
                                            <Table.Cell header>Kind</Table.Cell>
                                            <Table.Cell header>Amount</Table.Cell>
                                            <Table.Cell header>Reason</Table.Cell>
                                        </Table.Row>
                                    </Table.Head>
                                    <Table.Body>
                                        {transactions.map((tx, i) => (
                                            <Table.Row key={i}>
                                                <Table.Cell>
                                                    <span style={{ fontSize: 13, color: "var(--fg-3)" }}>{tx.at ?? "—"}</span>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Badge color={tx.kind === "debit" ? "red" : "emerald"}>{tx.kind}</Badge>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>
                                                        {tx.kind === "debit" ? "−" : "+"}{n(tx.amount)}
                                                    </span>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <span style={{ fontSize: 13, color: "var(--fg-3)" }}>{tx.reason ?? "—"}</span>
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table>
                            </div>
                        )}
                    </Card>

                    <Card>
                        <Card.Header>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>Achievements ({achievements.length})</div>
                        </Card.Header>
                        {achievements.length === 0 ? (
                            <EmptyRow>None yet.</EmptyRow>
                        ) : (
                            <Card.Body>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {achievements.map((a, i) => (
                                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--fg-1)" }}>
                                                <Icon name="medal" size={14} style={{ color: "var(--fg-3)" }} />
                                                {a.name}
                                            </span>
                                            {a.granted_at && <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{a.granted_at}</span>}
                                        </div>
                                    ))}
                                </div>
                            </Card.Body>
                        )}
                    </Card>
                </div>

                {/* Right column — moderation */}
                <div className="admin-stack">
                    <Card>
                        <Card.Header>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>Grant XP</div>
                        </Card.Header>
                        <Card.Body>
                            <form
                                className="admin-field-stack"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    xpForm.post(`${base}/grant-xp`, { preserveScroll: true });
                                }}
                            >
                                <Field label="Metric" error={xpForm.errors.metric}>
                                    <Select
                                        value={xpForm.data.metric}
                                        onValueChange={(v) => xpForm.setData("metric", v)}
                                        list={allMetrics.map((m) => ({ value: m.slug, label: m.name }))}
                                    />
                                </Field>
                                <Field label="Amount" error={xpForm.errors.amount}>
                                    <Input
                                        type="number"
                                        value={String(xpForm.data.amount)}
                                        onValueChange={(v) => xpForm.setData("amount", Number(v))}
                                    />
                                </Field>
                                <Field label="Reason" error={xpForm.errors.reason}>
                                    <Input
                                        value={xpForm.data.reason}
                                        onValueChange={(v) => xpForm.setData("reason", v)}
                                        placeholder="reason (optional)"
                                    />
                                </Field>
                                <Button type="submit" color="violet" loading={xpForm.processing}>Grant XP</Button>
                            </form>
                        </Card.Body>
                    </Card>

                    <Card>
                        <Card.Header>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>Grant coins</div>
                        </Card.Header>
                        <Card.Body>
                            <form
                                className="admin-field-stack"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    coinForm.post(`${base}/grant-coins`, { preserveScroll: true });
                                }}
                            >
                                <Field label="Amount" error={coinForm.errors.amount}>
                                    <Input
                                        type="number"
                                        value={String(coinForm.data.amount)}
                                        onValueChange={(v) => coinForm.setData("amount", Number(v))}
                                    />
                                </Field>
                                <Field label="Reason" error={coinForm.errors.reason}>
                                    <Input
                                        value={coinForm.data.reason}
                                        onValueChange={(v) => coinForm.setData("reason", v)}
                                        placeholder="reason (optional)"
                                    />
                                </Field>
                                <Button type="submit" color="amber" loading={coinForm.processing}>Credit coins</Button>
                            </form>
                        </Card.Body>
                    </Card>

                    <Card>
                        <Card.Header>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>Grant achievement</div>
                        </Card.Header>
                        <Card.Body>
                            <form
                                className="admin-field-stack"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    achievementForm.post(`${base}/grant-achievement`, { preserveScroll: true });
                                }}
                            >
                                <Field label="Achievement" error={achievementForm.errors.achievement}>
                                    <Select
                                        value={achievementForm.data.achievement}
                                        onValueChange={(v) => achievementForm.setData("achievement", v)}
                                        list={allAchievements.map((a) => ({ value: a.slug, label: a.name }))}
                                    />
                                </Field>
                                <Button type="submit" color="violet" loading={achievementForm.processing}>Grant</Button>
                            </form>
                        </Card.Body>
                    </Card>

                    <Card>
                        <Card.Header>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>Grant prize</div>
                        </Card.Header>
                        <Card.Body>
                            <form
                                className="admin-field-stack"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    prizeForm.post(`${base}/grant-prize`, { preserveScroll: true });
                                }}
                            >
                                <Field label="Prize" error={prizeForm.errors.prize}>
                                    <Select
                                        value={prizeForm.data.prize}
                                        onValueChange={(v) => prizeForm.setData("prize", v)}
                                        list={allPrizes.map((p) => ({ value: p.slug, label: p.name }))}
                                    />
                                </Field>
                                <Button type="submit" color="violet" loading={prizeForm.processing}>Grant</Button>
                            </form>
                        </Card.Body>
                    </Card>

                    <ReferralNetworkCard userId={user.id} member={mlmMember} members={mlmMembers} tierKeys={mlmTierKeys} />

                    <Card>
                        <Card.Header>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg-1)" }}>Flags</div>
                        </Card.Header>
                        <Card.Body>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <Button
                                    variant="ghost"
                                    icon="ban"
                                    onClick={() => router.post(`${base}/toggle-opt-out`, {}, { preserveScroll: true })}
                                >
                                    {user.opted_out ? "Opt back in to gamification" : "Opt out of gamification"}
                                </Button>
                                <Button
                                    color={user.is_admin ? "red" : "violet"}
                                    variant="ghost"
                                    icon="shield"
                                    onClick={() => router.post(`${base}/toggle-admin`, {}, { preserveScroll: true })}
                                >
                                    {user.is_admin ? "Revoke admin" : "Make admin"}
                                </Button>
                                <Button
                                    color={user.pro_override ? "red" : "emerald"}
                                    variant="ghost"
                                    icon="sparkles"
                                    onClick={() => router.post(`${base}/toggle-pro`, {}, { preserveScroll: true })}
                                >
                                    {user.pro_override ? "Revoke manual Pro" : "Grant Pro"}
                                </Button>
                                {user.pro && !user.pro_override && (
                                    <Text size="xs" className="!text-zinc-500">
                                        Already Pro via {user.proSource} — granting manual Pro keeps it after that lapses.
                                    </Text>
                                )}

                                {user.suspended ? (
                                    <div style={{ borderTop: "1px solid var(--border-1)", paddingTop: 10, marginTop: 2 }}>
                                        {user.suspension_reason && (
                                            <Text size="xs" className="!text-red-500" style={{ marginBottom: 8 }}>
                                                Suspended — {user.suspension_reason}
                                            </Text>
                                        )}
                                        <Button
                                            color="emerald"
                                            variant="ghost"
                                            icon="check"
                                            onClick={() => router.post(`${base}/toggle-suspend`, {}, { preserveScroll: true })}
                                        >
                                            Lift suspension
                                        </Button>
                                    </div>
                                ) : user.can_suspend ? (
                                    <form
                                        style={{ borderTop: "1px solid var(--border-1)", paddingTop: 10, marginTop: 2, display: "flex", flexDirection: "column", gap: 8 }}
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            suspendForm.post(`${base}/toggle-suspend`, { preserveScroll: true });
                                        }}
                                    >
                                        <Input
                                            value={suspendForm.data.reason}
                                            onValueChange={(v) => suspendForm.setData("reason", v)}
                                            placeholder="Suspension reason (optional)"
                                        />
                                        <Button type="submit" color="red" variant="ghost" icon="ban" loading={suspendForm.processing}>
                                            Suspend account
                                        </Button>
                                        <Text size="xs" className="!text-zinc-500">
                                            Blocks login, delists every site, and freezes Pro until reinstated.
                                        </Text>
                                    </form>
                                ) : null}
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </>
    );
}

UserShow.layout = adminLayout;
export default UserShow;
