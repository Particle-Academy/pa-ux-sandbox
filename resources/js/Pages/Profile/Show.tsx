import { Head, Link, useForm } from "@inertiajs/react";
import { Badge, Button, Card, Icon, Input } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";
import { avatarFrameClass, type CosmeticSlots } from "../../lib/cosmetics";

type Metric = { slug: string; name: string; icon: string | null; xp: number; level: number };
type Achievement = { slug: string; name: string; description: string | null; icon: string | null };
type Prize = { slug: string; name: string; type: string | null };

type ProfileData = {
    name: string;
    githubUsername: string | null;
    avatarUrl: string | null;
    coins: number;
    level: number;
    levelName: string | null;
    totalXp: number;
    nextThreshold: number | null;
    progress: number;
    cosmetics: CosmeticSlots;
    optedOut: boolean;
    pro: boolean;
    proSource: "subscription" | "prize" | null;
    metrics: Metric[];
    achievements: Achievement[];
    prizes: Prize[];
    lifetimeEarned: number;
    lifetimeSpent: number;
    memberSince: number | null;
};

// Per-activity accent colors + safe react-fancy icon names (assigned by index,
// since the raw metric icons aren't guaranteed to be in the icon set).
const ACT_COLORS = ["#0ea5e9", "#10b981", "#8b5cf6", "#f59e0b", "#f43f5e", "#6366f1"];
const ACT_ICONS = ["flame", "sparkles", "code", "award", "medal", "package"];

type Props = {
    profile: ProfileData;
    username: string | null;
    usernameSuggestion: string | null;
};

export default function ProfileShow({ profile, username, usernameSuggestion }: Props) {
    const displayName = profile.githubUsername ?? profile.name;
    const optOutForm = useForm({});
    const usernameForm = useForm({ username: username ?? usernameSuggestion ?? "" });
    const maxXp = Math.max(1, ...profile.metrics.map((m) => m.xp));

    return (
        <Layout>
            <Head title={`${displayName} · Profile`} />

            <div className="pf-wrap">
                {/* ── Hero ──────────────────────────────────────────────── */}
                <Card className="pf-hero pf-fade">
                    <div className="pf-hero-banner" />
                    <div className="pf-hero-body">
                        <div className="pf-id">
                            <span className="pf-avatar-ring">
                                <img
                                    src={profile.avatarUrl ?? "/showcase-assets/fancy-ui-logo.jpg"}
                                    alt=""
                                    className={avatarFrameClass(profile.cosmetics)}
                                />
                            </span>
                            <div style={{ paddingBottom: 4 }}>
                                <div className="pf-name-row">
                                    <span className="pf-name">{displayName}</span>
                                    {profile.pro && (
                                        <Badge color="violet" variant="soft">
                                            <Icon name="sparkles" className="mr-0.5 h-3 w-3" />
                                            PRO
                                        </Badge>
                                    )}
                                </div>
                                <div className="pf-sub">
                                    {profile.levelName && (
                                        <>
                                            <span>{profile.levelName}</span>
                                            <span className="dot">·</span>
                                        </>
                                    )}
                                    <span className="lvl-chip">
                                        <Icon name="shield" className="h-3.5 w-3.5 text-violet-500" />
                                        Level {profile.level}
                                    </span>
                                    <span className="dot">·</span>
                                    <span className="lvl-chip">
                                        <Icon name="flame" className="h-3.5 w-3.5 text-amber-500" />
                                        {profile.totalXp.toLocaleString()} XP
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="pf-coins">
                            <span className="amt">
                                <Icon name="coins" className="h-5 w-5" />
                                {profile.coins.toLocaleString()}
                            </span>
                            <Link href="/shop" className="shop">
                                Spend in the shop <Icon name="arrow-right" className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>

                    {/* Level meter */}
                    <div className="pf-meter">
                        <div className="pf-meter-head">
                            <span className="lbl">
                                <Icon name="trending-up" className="h-4 w-4 text-violet-500" />
                                {profile.nextThreshold ? `Progress to Level ${profile.level + 1}` : "Max tier reached"}
                            </span>
                            <span className="val">
                                {profile.nextThreshold
                                    ? `${profile.totalXp.toLocaleString()} / ${profile.nextThreshold.toLocaleString()} XP`
                                    : `${profile.totalXp.toLocaleString()} XP`}
                            </span>
                        </div>
                        <div className="pf-bar">
                            <span style={{ width: `${Math.min(100, profile.progress)}%` }} />
                        </div>
                        <div className="pf-bar-ticks">
                            <span>Level {profile.level}</span>
                            {profile.nextThreshold && (
                                <span>
                                    <b>{Math.max(0, profile.nextThreshold - profile.totalXp).toLocaleString()} XP</b> to go
                                </span>
                            )}
                            <span>Level {profile.level + 1}</span>
                        </div>
                    </div>
                </Card>

                {/* ── XP by activity + Achievements ─────────────────────── */}
                <div className="pf-grid2">
                    <Card className="pf-fade">
                        <div className="pf-card-head">
                            <Icon name="trending-up" className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                            XP by activity
                        </div>
                        <div className="pf-card-pad">
                            {profile.metrics.length === 0 ? (
                                <p style={{ color: "var(--fg-4)", fontSize: 13, padding: "10px 0" }}>
                                    No XP yet — explore packages, try demos, or ship a project to start earning.
                                </p>
                            ) : (
                                profile.metrics.map((m, i) => {
                                    const color = ACT_COLORS[i % ACT_COLORS.length];
                                    const pct = Math.round((m.xp / maxXp) * 100);
                                    return (
                                        <div className="xp-row" key={m.slug}>
                                            <div className="xp-row-head">
                                                <span
                                                    className="xp-ico"
                                                    style={{ color }}
                                                >
                                                    <Icon name={ACT_ICONS[i % ACT_ICONS.length]} className="h-4 w-4" />
                                                </span>
                                                <span className="xp-name">{m.name}</span>
                                                <Badge color="zinc" size="sm">Lv {m.level}</Badge>
                                                <span className="xp-amt">{m.xp.toLocaleString()}</span>
                                            </div>
                                            <div className="xp-mini">
                                                <span style={{ width: `${pct}%`, background: color }} />
                                            </div>
                                            <div className="xp-row-foot">
                                                <span>Level {m.level}</span>
                                                <span>{m.xp.toLocaleString()} XP</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>

                    <Card className="pf-fade">
                        <div className="pf-card-head">
                            <Icon name="award" className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                            Achievements
                            <span className="count">{profile.achievements.length}</span>
                        </div>
                        <div className="pf-card-pad">
                            {profile.achievements.length === 0 ? (
                                <p style={{ color: "var(--fg-4)", fontSize: 13, padding: "10px 0" }}>
                                    None yet — keep exploring to earn your first.
                                </p>
                            ) : (
                                <div className="ach-grid">
                                    {profile.achievements.map((a) => (
                                        <div className="ach" key={a.slug} title={a.description ?? a.name}>
                                            <span className="ach-medal earned">
                                                <span className="ring" />
                                                <Icon name="medal" className="h-6 w-6" />
                                            </span>
                                            <span className="ach-label">{a.name}</span>
                                            <span className="ach-tier">Earned</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* ── Pro access ────────────────────────────────────────── */}
                <Card className="pf-fade">
                    <div style={{ padding: 18 }}>
                        <div className="pro-banner">
                            <span className={`pro-icon${profile.pro ? "" : " locked"}`}>
                                <Icon name="sparkles" className="h-5 w-5" />
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
                                    <span style={{ fontSize: 15, fontWeight: 600, color: "var(--fg-1)" }}>Pro access</span>
                                    {profile.pro ? (
                                        <Badge color="violet" variant="soft" dot>Unlocked</Badge>
                                    ) : (
                                        <Badge color="zinc" variant="soft">Locked</Badge>
                                    )}
                                </div>
                                <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5 }}>
                                    {profile.pro ? (
                                        profile.proSource === "subscription" ? (
                                            <>
                                                Unlocked via your <b style={{ color: "var(--fg-1)", fontWeight: 600 }}>active subscription</b>.
                                                Pro features — extra themes, source export, advanced bridge tools — are on.
                                            </>
                                        ) : (
                                            <>
                                                Earned via the <b style={{ color: "var(--fg-1)", fontWeight: 600 }}>Sandbox Pro</b> prize at the
                                                Ambassador tier — no subscription needed. Pro features are on.
                                            </>
                                        )
                                    ) : (
                                        <>
                                            Unlock Pro two ways: subscribe to a paid plan, or reach the{" "}
                                            <b style={{ color: "var(--fg-1)", fontWeight: 600 }}>Ambassador tier</b> (Level 10 overall engagement)
                                            to earn the Sandbox Pro prize.
                                        </>
                                    )}
                                </div>
                            </div>
                            {profile.pro && profile.proSource === "subscription" && (
                                <Link href="/shop" className="pro-manage">
                                    Manage <Icon name="arrow-right" className="h-3 w-3" />
                                </Link>
                            )}
                        </div>
                    </div>
                </Card>

                {/* ── Username (referral link handle) ───────────────────── */}
                <Card className="pf-fade">
                    <div className="pf-card-head">
                        <Icon name="at-sign" className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                        Username
                    </div>
                    <div className="pf-card-pad" style={{ paddingBottom: 16 }}>
                        <p style={{ color: "var(--fg-3)", fontSize: 13, margin: "4px 0 10px" }}>
                            {username
                                ? <>Your referral link is <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-2)" }}>/join/{username}</span> — share it from the <Link href="/referrals" style={{ textDecoration: "underline", textDecorationStyle: "dotted" }}>referrals page</Link>.</>
                                : <>Claim a username to activate your personal referral link (<span style={{ fontFamily: "var(--font-mono)" }}>/join/your-name</span>).</>}
                        </p>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                usernameForm.post("/profile/username", { preserveScroll: true });
                            }}
                            style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}
                        >
                            <div style={{ flex: 1, minWidth: 220 }}>
                                <Input
                                    value={usernameForm.data.username}
                                    onChange={(e) => usernameForm.setData("username", e.target.value)}
                                    placeholder={usernameSuggestion ?? "your-name"}
                                    leading={<span style={{ color: "var(--fg-4)", fontSize: 13 }}>@</span>}
                                    error={usernameForm.errors.username}
                                />
                                {usernameForm.errors.username && (
                                    <p style={{ color: "var(--color-red-500, #ef4444)", fontSize: 12, marginTop: 6 }}>{usernameForm.errors.username}</p>
                                )}
                            </div>
                            <Button type="submit" color="violet" loading={usernameForm.processing}>
                                {username ? "Update username" : "Claim username"}
                            </Button>
                        </form>
                        {usernameForm.recentlySuccessful && (
                            <p style={{ color: "var(--color-teal-600, #0d9488)", fontSize: 12, marginTop: 8 }}>Saved.</p>
                        )}
                    </div>
                </Card>

                {/* ── Prizes + Coins ────────────────────────────────────── */}
                <div className="pf-grid2">
                    <Card className="pf-fade">
                        <div className="pf-card-head">
                            <Icon name="gift" className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                            Prizes
                            <span className="count">{profile.prizes.length}</span>
                        </div>
                        <div className="pf-card-pad">
                            {profile.prizes.length === 0 ? (
                                <p style={{ color: "var(--fg-4)", fontSize: 13, padding: "10px 0" }}>
                                    None yet — climb the tiers to earn prizes.
                                </p>
                            ) : (
                                profile.prizes.map((p) => (
                                    <div key={p.slug} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
                                        <span
                                            style={{
                                                width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center",
                                                flexShrink: 0, color: "#8b5cf6",
                                            }}
                                        >
                                            <Icon name="package" className="h-5 w-5" />
                                        </span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)" }}>{p.name}</div>
                                            {p.type && <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{p.type} reward</div>}
                                        </div>
                                        {p.type && <Badge color="violet" variant="soft">{p.type}</Badge>}
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    <Card className="pf-fade">
                        <div className="pf-card-head">
                            <Icon name="coins" className="h-4 w-4 text-amber-500" />
                            Coins
                        </div>
                        <div style={{ padding: "4px 18px 8px" }}>
                            <div className="coin-row balance">
                                <span className="k">
                                    <Icon name="coins" className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                    Balance
                                </span>
                                <span className="v">{profile.coins.toLocaleString()}</span>
                            </div>
                            <div className="coin-row">
                                <span className="k">
                                    <Icon name="trending-up" className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                    Lifetime earned
                                </span>
                                <span className="v" style={{ color: "var(--fg-2)" }}>{profile.lifetimeEarned.toLocaleString()}</span>
                            </div>
                            <div className="coin-row">
                                <span className="k">
                                    <Icon name="history" className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                    Lifetime spent
                                </span>
                                <span className="v" style={{ color: "var(--fg-2)" }}>{profile.lifetimeSpent.toLocaleString()}</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ── Footer ────────────────────────────────────────────── */}
                <div className="pf-foot">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            optOutForm.post("/profile/opt-out");
                        }}
                    >
                        <button type="submit" disabled={optOutForm.processing} className="optout">
                            <Icon name="eye" className="h-3.5 w-3.5" />
                            {profile.optedOut ? "Opt back in to gamification" : "Opt out of gamification"}
                        </button>
                    </form>
                    {profile.memberSince && <span className="since">member since {profile.memberSince}</span>}
                </div>
            </div>
        </Layout>
    );
}
