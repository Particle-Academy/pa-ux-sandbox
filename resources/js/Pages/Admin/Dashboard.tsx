import { Head, Link } from "@inertiajs/react";
import { Button, Badge, Card, Icon, MultiSwitch } from "@particle-academy/react-fancy";
import { useState } from "react";
import { adminLayout } from "./AdminLayout";
import { PageHeader, StatCard, StatusDot, EmptyRow } from "./ui";

type Earner = { name: string; value: number };
type Props = {
    stats: { products: number; active_products: number; prices: number; active_prices: number; synced_products: number; stripe_connected: boolean };
    enabledFeatures: string[];
    gamification: {
        coins: { in_circulation: number; lifetime_minted: number; earned_today: number; spent_today: number };
        engagement: { total_xp: number; achievements_unlocked: number; active_profiles: number; new_users_7d: number };
        topEarners: { all_time: Earner[]; this_week: Earner[] };
        featured: { count: number; items: Array<{ id: number; title: string; url: string; until: string }> };
        pendingSubmissions: number;
    };
};

const n = (v: number) => v.toLocaleString();

function AdminDashboard({ stats, enabledFeatures, gamification: g }: Props) {
    const [range, setRange] = useState<"all" | "week">("all");
    const earners = range === "all" ? g.topEarners.all_time : g.topEarners.this_week;

    const attention = [
        { icon: "image", label: "Submissions pending review", n: g.pendingSubmissions, href: "/admin/submissions", show: g.pendingSubmissions > 0 },
        { icon: "refresh-cw", label: "Products not synced to Stripe", n: stats.products - stats.synced_products, href: "/admin/products", show: stats.products - stats.synced_products > 0 },
    ].filter((a) => a.show);

    return (
        <>
            <Head title="Dashboard · Admin" />
            <PageHeader
                title="Dashboard"
                sub="Catalog, engagement, and moderation at a glance."
                actions={<Button variant="ghost" size="sm" iconTrailing="external-link" href="/">View site</Button>}
            />

            <div className="admin-grid-stats">
                <StatCard label="Active products" value={n(stats.active_products)} icon="package" sub={`of ${n(stats.products)} total`} />
                <StatCard label="Synced to Stripe" value={n(stats.synced_products)} icon="refresh-cw" sub={stats.stripe_connected ? "connected" : "offline"} />
                <StatCard label="Prices" value={n(stats.active_prices)} icon="credit-card" sub={`of ${n(stats.prices)} total`} />
            </div>
            <div className="admin-grid-stats" style={{ marginTop: 14 }}>
                <StatCard label="Coins in circulation" value={n(g.coins.in_circulation)} icon="coins" sub={`${n(g.coins.lifetime_minted)} minted`} />
                <StatCard label="Total XP" value={n(g.engagement.total_xp)} icon="award" sub={`${n(g.engagement.active_profiles)} active players`} />
                <StatCard label="New users (7d)" value={n(g.engagement.new_users_7d)} icon="user-plus" up={g.engagement.new_users_7d > 0 ? true : null} delta={`+${g.engagement.new_users_7d}`} />
            </div>

            <div className="admin-grid-2" style={{ marginTop: 16, gridTemplateColumns: "1.5fr 1fr" }}>
                <Card>
                    <Card.Header>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 12 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                <Icon name="trophy" size={16} style={{ color: "var(--fg-3)" }} /> Top earners
                            </span>
                            <MultiSwitch value={range} onValueChange={(v) => setRange(v as "all" | "week")} list={[{ value: "all", label: "All-time" }, { value: "week", label: "This week" }]} />
                        </div>
                    </Card.Header>
                    <div>
                        {earners.length === 0 ? (
                            <EmptyRow>No coin earners yet.</EmptyRow>
                        ) : (
                            earners.map((e, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: i === earners.length - 1 ? "none" : "1px solid var(--border-1)" }}>
                                    <span style={{ width: 22, textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-4)" }}>{i + 1}</span>
                                    <span style={{ flex: 1, fontSize: 13.5, color: "var(--fg-1)", fontWeight: 500 }}>{e.name}</span>
                                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{n(e.value)} ◈</span>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                <div className="admin-stack">
                    <Card>
                        <Card.Header><Icon name="bell-ring" size={16} style={{ color: "var(--fg-3)" }} /> Needs attention</Card.Header>
                        <div style={{ padding: 6 }}>
                            {attention.length === 0 ? (
                                <EmptyRow>All clear — nothing needs review.</EmptyRow>
                            ) : (
                                attention.map((r, i) => (
                                    <Link key={i} href={r.href} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px", borderRadius: 9, textDecoration: "none" }} className="admin-attn-row">
                                        <span style={{ width: 28, height: 28, borderRadius: 7, display: "grid", placeItems: "center", color: "#f59e0b" }}>
                                            <Icon name={r.icon} size={14} />
                                        </span>
                                        <span style={{ flex: 1, fontSize: 13, color: "var(--fg-2)" }}>{r.label}</span>
                                        <Badge color="amber">{r.n}</Badge>
                                        <Icon name="chevron-right" size={15} style={{ color: "var(--fg-4)" }} />
                                    </Link>
                                ))
                            )}
                        </div>
                    </Card>

                    <Card>
                        <Card.Header><Icon name="coins" size={16} style={{ color: "var(--fg-3)" }} /> Coin economy (today)</Card.Header>
                        <Card.Body>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                {[
                                    { k: "Earned", v: g.coins.earned_today, c: "var(--fg-1)" },
                                    { k: "Spent", v: g.coins.spent_today, c: "var(--fg-1)" },
                                    { k: "Net", v: g.coins.earned_today - g.coins.spent_today, c: g.coins.earned_today - g.coins.spent_today < 0 ? "#dc2626" : "var(--emerald-600, #059669)" },
                                ].map((s) => (
                                    <div key={s.k}>
                                        <div className="admin-stat-label">{s.k}</div>
                                        <div style={{ fontSize: 19, fontWeight: 600, marginTop: 4, color: s.c }}>{n(s.v)}</div>
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>

                    {enabledFeatures.length > 0 && (
                        <Card>
                            <Card.Header><Icon name="toggle-right" size={16} style={{ color: "var(--fg-3)" }} /> Enabled features</Card.Header>
                            <Card.Body>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {enabledFeatures.map((f) => <Badge key={f} color="violet">{f}</Badge>)}
                                </div>
                            </Card.Body>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}

AdminDashboard.layout = adminLayout;
export default AdminDashboard;
