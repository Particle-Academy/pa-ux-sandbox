import { Head, Link, useForm } from "@inertiajs/react";
import { Badge, Card, Heading, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";
import {
    avatarFrameClass,
    bannerStyle,
    nameColorClass,
    type CosmeticSlots,
} from "../../lib/cosmetics";

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
};

export default function ProfileShow({ profile }: { profile: ProfileData }) {
    const banner = bannerStyle(profile.cosmetics);
    const displayName = profile.githubUsername ?? profile.name;
    const optOutForm = useForm({});

    return (
        <Layout>
            <Head title={`${displayName} · Profile`} />

            {/* Banner + identity */}
            <Card className="overflow-hidden">
                <div
                    className="h-28 w-full"
                    style={banner ?? { backgroundColor: "rgb(244 244 245)" }}
                />
                <div className="flex flex-wrap items-end gap-4 px-6 pb-6">
                    <img
                        src={profile.avatarUrl ?? "/showcase-assets/fancy-ui-logo.jpg"}
                        alt=""
                        className={`-mt-10 h-20 w-20 rounded-full bg-white object-cover ${avatarFrameClass(profile.cosmetics)}`}
                    />
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <Heading level={1} size="lg" className={nameColorClass(profile.cosmetics)}>
                                {displayName}
                            </Heading>
                            {profile.pro && (
                                <span className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                    Pro
                                </span>
                            )}
                        </div>
                        <Text className="text-sm text-zinc-500">
                            {profile.levelName ? `${profile.levelName} · ` : ""}Level {profile.level} · {profile.totalXp.toLocaleString()} XP
                        </Text>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {profile.coins.toLocaleString()} ◈
                        </div>
                        <Link href="/shop" className="text-xs text-violet-600 hover:underline dark:text-violet-400">
                            Spend in the shop →
                        </Link>
                    </div>
                </div>
            </Card>

            {/* Level progress */}
            <Card className="mt-6 p-5">
                <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Overall engagement</span>
                    <span className="text-zinc-500">
                        {profile.nextThreshold
                            ? `${profile.totalXp.toLocaleString()} / ${profile.nextThreshold.toLocaleString()} XP to Lv ${profile.level + 1}`
                            : "Max tier reached"}
                    </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                        className="h-full rounded-full bg-violet-500 transition-all"
                        style={{ width: `${Math.min(100, profile.progress)}%` }}
                    />
                </div>
            </Card>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* XP by metric */}
                <Card className="p-5">
                    <Heading level={2} size="sm">XP by activity</Heading>
                    <div className="mt-3 space-y-2">
                        {profile.metrics.length === 0 && (
                            <Text className="text-sm text-zinc-400">
                                No XP yet — explore packages, try demos, or ship a project to start earning.
                            </Text>
                        )}
                        {profile.metrics.map((m) => (
                            <div key={m.slug} className="flex items-center justify-between text-sm">
                                <span className="text-zinc-700 dark:text-zinc-300">{m.name}</span>
                                <span className="flex items-center gap-2">
                                    <Badge color="zinc" size="sm">Lv {m.level}</Badge>
                                    <span className="font-medium tabular-nums">{m.xp.toLocaleString()}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Achievements */}
                <Card className="p-5">
                    <Heading level={2} size="sm">Achievements ({profile.achievements.length})</Heading>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {profile.achievements.length === 0 && (
                            <Text className="text-sm text-zinc-400">None yet.</Text>
                        )}
                        {profile.achievements.map((a) => (
                            <span
                                key={a.slug}
                                title={a.description ?? a.name}
                                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                            >
                                {a.name}
                            </span>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Pro status */}
            <Card className="mt-6 p-5">
                <div className="flex items-center justify-between">
                    <Heading level={2} size="sm">Pro access</Heading>
                    {profile.pro ? (
                        <Badge color="violet">Unlocked</Badge>
                    ) : (
                        <Badge color="zinc">Locked</Badge>
                    )}
                </div>
                <Text className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {profile.pro
                        ? profile.proSource === "subscription"
                            ? "Unlocked via your active subscription. Pro features (extra themes, source export, advanced bridge tools) are on."
                            : "Earned via the Sandbox Pro prize at the Ambassador tier — no subscription needed. Pro features are on."
                        : "Pro features unlock two ways: subscribe to a paid plan, or reach the Ambassador tier (Level 10 overall engagement) to earn the Sandbox Pro prize."}
                </Text>
            </Card>

            {/* Prizes + cosmetics */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="p-5">
                    <Heading level={2} size="sm">Prizes</Heading>
                    <div className="mt-3 space-y-1 text-sm">
                        {profile.prizes.length === 0 && <Text className="text-sm text-zinc-400">None yet.</Text>}
                        {profile.prizes.map((p) => (
                            <div key={p.slug} className="flex items-center justify-between">
                                <span className="text-zinc-700 dark:text-zinc-300">{p.name}</span>
                                {p.type && <Badge color="violet" size="sm">{p.type}</Badge>}
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-5">
                    <Heading level={2} size="sm">Coins</Heading>
                    <div className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                        <div className="flex justify-between"><span>Balance</span><span className="font-semibold text-amber-600 dark:text-amber-400">{profile.coins.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Lifetime earned</span><span>{profile.lifetimeEarned.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Lifetime spent</span><span>{profile.lifetimeSpent.toLocaleString()}</span></div>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            optOutForm.post("/profile/opt-out");
                        }}
                        className="mt-4"
                    >
                        <button
                            type="submit"
                            disabled={optOutForm.processing}
                            className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-700 hover:underline dark:hover:text-zinc-300"
                        >
                            {profile.optedOut ? "Opt back in to gamification" : "Opt out of gamification"}
                        </button>
                    </form>
                </Card>
            </div>
        </Layout>
    );
}
