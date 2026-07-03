import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import { Badge, Button, Callout, Card, Heading, Icon, Text } from "@particle-academy/react-fancy";
import type { Color } from "@particle-academy/react-fancy";
import {
    DownlineTree,
    CommissionStatement,
    RankProgress,
    type CommissionRow,
    type DownlineEdge,
    type DownlineMember,
} from "@particle-academy/fancy-mlm-ui";
import { Layout } from "../Layout";

type Program = {
    tree: "unilevel" | "binary" | "matrix";
    edge: DownlineEdge;
    metric: string;
    tiers: string[];
};
type Rank = { tier: string; nextTier: string | null; value: number; target: number | null };

type Props = {
    program: Program;
    myMemberId: string;
    referralCode: string;
    network: DownlineMember[];
    commissions: CommissionRow[];
    rank: Rank;
};

const TIER_COLOR: Record<string, Color> = {
    bronze: "orange",
    silver: "zinc",
    gold: "amber",
    diamond: "violet",
};
const tierColor = (tier?: string): Color => (tier && TIER_COLOR[tier]) || "slate";

const TREE_COPY: Record<Program["tree"], string> = {
    unilevel: "Unlimited frontline — everyone you personally refer is a direct leg on your sponsor tree.",
    binary: "Two legs per member — extra referrals spill over into the placement tree below your team.",
    matrix: "A forced-width grid — referrals fill each level left-to-right down the placement tree.",
};

export default function ReferralsShow({ program, myMemberId, referralCode, network, commissions, rank }: Props) {
    const page = usePage<{ flash: { mlm_rewards?: CommissionRow[] | null } }>();
    const justEarned = page.props.flash?.mlm_rewards ?? null;

    const [copied, setCopied] = useState(false);
    const referralLink = typeof window !== "undefined" ? `${window.location.origin}/join/${referralCode}` : `/join/${referralCode}`;

    const copy = () => {
        navigator.clipboard?.writeText(referralLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        });
    };

    // Downline members eligible to "act" in the demo — everyone but the root.
    const downlineMembers = useMemo(
        () => network.filter((m) => m.id !== myMemberId),
        [network, myMemberId],
    );

    const form = useForm({ member_id: downlineMembers[0]?.id ?? "", amount: 100 });
    const simulate = (e: React.FormEvent) => {
        e.preventDefault();
        form.post("/referrals/simulate", { preserveScroll: true });
    };

    return (
        <Layout>
            <Head title="Refer a friend" />

            <div className="flex flex-col gap-8">
                {/* ── Hero: referral link + current program shape ─────────── */}
                <Card className="overflow-hidden">
                    <div className="bg-gradient-to-br from-teal-500/10 via-transparent to-violet-500/10 p-6 md:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-6">
                            <div className="max-w-xl">
                                <div className="mb-2 flex items-center gap-2">
                                    <Icon name="gift" className="h-5 w-5 text-teal-500" />
                                    <Heading as="h1" className="!text-2xl">Refer a friend</Heading>
                                </div>
                                <Text className="text-[var(--fg-2)]">
                                    Share your link. When people you refer stay active, a bonus flows up your
                                    downline — scaled by your rank and how deep the action happened. Powered by{" "}
                                    <Link href="/packages/fancy-mlm-ui" className="text-teal-600 underline decoration-dotted">fancy-mlm</Link>.
                                </Text>
                            </div>
                            <Badge color="teal" variant="soft" className="capitalize">
                                <Icon name="git-merge" className="mr-1 h-3.5 w-3.5" />
                                {program.tree} plan
                            </Badge>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 rounded-lg border border-[var(--border-1)] bg-[var(--bg-0)] px-3 py-2 font-mono text-sm">
                                <Icon name="link" className="h-4 w-4 text-[var(--fg-3)]" />
                                <span className="truncate">{referralLink}</span>
                            </div>
                            <Button color="teal" onClick={copy}>
                                <Icon name={copied ? "check" : "copy"} className="mr-1 h-4 w-4" />
                                {copied ? "Copied" : "Copy link"}
                            </Button>
                            <Badge variant="outline" className="font-mono">{referralCode}</Badge>
                        </div>

                        <Text className="mt-3 text-xs text-[var(--fg-3)]">{TREE_COPY[program.tree]}</Text>
                    </div>
                </Card>

                <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                    {/* ── Downline tree ──────────────────────────────────── */}
                    <Card>
                        <Card.Header>
                            <div className="flex items-center justify-between">
                                <Heading as="h2" className="!text-lg">Your downline</Heading>
                                <Badge variant="soft">{network.length} members</Badge>
                            </div>
                            <Text className="text-sm text-[var(--fg-3)]">
                                The {program.tree} tree, drawn along the{" "}
                                <span className="font-medium">{program.edge}</span> edge.
                            </Text>
                        </Card.Header>
                        <Card.Body>
                            <DownlineTree
                                value={network}
                                rootId={myMemberId}
                                edge={program.edge}
                                tierColor={tierColor}
                            />
                        </Card.Body>
                    </Card>

                    <div className="flex flex-col gap-6">
                        {/* ── Rank progress ──────────────────────────────── */}
                        <Card>
                            <Card.Header>
                                <Heading as="h2" className="!text-lg">Your rank</Heading>
                            </Card.Header>
                            <Card.Body>
                                <RankProgress
                                    tier={rank.tier}
                                    nextTier={rank.nextTier}
                                    value={rank.value}
                                    target={rank.target}
                                    unit="team members"
                                />
                            </Card.Body>
                        </Card>

                        {/* ── Live loop: simulate a downline action ──────── */}
                        <Card>
                            <Card.Header>
                                <Heading as="h2" className="!text-lg">Try the live loop</Heading>
                                <Text className="text-sm text-[var(--fg-3)]">
                                    Simulate a downline member taking an action. The fun-lab referral
                                    engine credits their upline instantly.
                                </Text>
                            </Card.Header>
                            <Card.Body>
                                <form onSubmit={simulate} className="flex flex-col gap-3">
                                    <label className="text-xs font-medium text-[var(--fg-2)]">
                                        Active member
                                        <select
                                            className="mt-1 w-full rounded-lg border border-[var(--border-1)] bg-[var(--bg-0)] px-3 py-2 text-sm"
                                            value={form.data.member_id}
                                            onChange={(e) => form.setData("member_id", e.target.value)}
                                        >
                                            {downlineMembers.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.label ?? m.id}{m.tier ? ` · ${m.tier}` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="text-xs font-medium text-[var(--fg-2)]">
                                        Activity value
                                        <input
                                            type="number"
                                            min={1}
                                            max={100000}
                                            className="mt-1 w-full rounded-lg border border-[var(--border-1)] bg-[var(--bg-0)] px-3 py-2 text-sm"
                                            value={form.data.amount}
                                            onChange={(e) => form.setData("amount", Number(e.target.value))}
                                        />
                                    </label>
                                    <Button type="submit" color="teal" disabled={form.processing || !form.data.member_id}>
                                        <Icon name="zap" className="mr-1 h-4 w-4" />
                                        Simulate activity
                                    </Button>
                                </form>

                                {justEarned && justEarned.length > 0 && (
                                    <Callout color="green" className="mt-4">
                                        <div className="text-sm font-medium">Bonuses paid up the tree</div>
                                        <ul className="mt-1 space-y-0.5 text-sm">
                                            {justEarned.map((r) => (
                                                <li key={r.id ?? `${r.level}`} className="flex justify-between gap-4">
                                                    <span>{r.recipientLabel ?? `Level ${r.level}`}</span>
                                                    <span className="font-mono">+{Math.round(r.amount)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </Callout>
                                )}
                            </Card.Body>
                        </Card>
                    </div>
                </div>

                {/* ── Commission statement ───────────────────────────────── */}
                <Card>
                    <Card.Header>
                        <div className="flex items-center justify-between">
                            <Heading as="h2" className="!text-lg">Your referral earnings</Heading>
                            <Button variant="ghost" size="sm" onClick={() => router.reload({ only: ["commissions"] })}>
                                <Icon name="refresh-cw" className="mr-1 h-3.5 w-3.5" />
                                Refresh
                            </Button>
                        </div>
                        <Text className="text-sm text-[var(--fg-3)]">
                            Referral bonuses paid to you, newest first.
                        </Text>
                    </Card.Header>
                    <Card.Body>
                        <CommissionStatement
                            rows={commissions}
                            formatAmount={(n) => `${Math.round(n).toLocaleString()} pts`}
                            emptyLabel="No referral bonuses yet — run the live loop above to earn your first."
                        />
                    </Card.Body>
                </Card>
            </div>
        </Layout>
    );
}
