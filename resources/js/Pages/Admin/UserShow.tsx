import { Head, Link, router, useForm } from "@inertiajs/react";
import { Avatar, Badge, Button, Card, Field, Icon, Input, Select, Table, Text } from "@particle-academy/react-fancy";
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
type Option = { slug: string; name: string };

type Props = {
    user: AdminUser;
    metrics: MetricRow[];
    transactions: Transaction[];
    achievements: AchievementRow[];
    allMetrics: Option[];
    allAchievements: Option[];
    allPrizes: Option[];
};

const n = (v: number) => v.toLocaleString();

function initials(name: string): string {
    return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function UserShow({ user, metrics, transactions, achievements, allMetrics, allAchievements, allPrizes }: Props) {
    const base = `/admin/users/${user.id}`;

    const xpForm = useForm({ metric: allMetrics[0]?.slug ?? "", amount: 100, reason: "" });
    const coinForm = useForm({ amount: 100, reason: "" });
    const achievementForm = useForm({ achievement: allAchievements[0]?.slug ?? "" });
    const prizeForm = useForm({ prize: allPrizes[0]?.slug ?? "" });

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
