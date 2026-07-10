import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
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
    referralUrl: string | null;
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

/** Pre-written messages a member can grab and drop into a DM / text / email.
 *  `{link}` is replaced with the member's referral URL. */
const CONVERSATION_STARTERS: { tone: string; text: string }[] = [
    {
        tone: "Warm intro",
        text: "Hey! Been meaning to share this with you — I think you'd genuinely like it, and if you join with my link we both get a little bonus. Here you go: {link}",
    },
    {
        tone: "Quick nudge",
        text: "Quick one — here's my invite. Takes a minute to sign up and you're in: {link}",
    },
    {
        tone: "Value first",
        text: "I've been getting real value out of this lately and thought of you. Join through my link so we're connected: {link}",
    },
    {
        tone: "Group drop",
        text: "Sharing my link for anyone who wants in — sign up here and we both earn a bonus: {link}",
    },
];

/** The default one-liner used by the one-tap social share buttons. */
const SHARE_HEADLINE = "Thought you'd like this — join with my link and we both get a bonus:";

export default function ReferralsShow({ program, myMemberId, referralUrl, network, commissions, rank }: Props) {
    const [copiedLink, setCopiedLink] = useState(false);
    // Server-built absolute URL — NEVER derive it from window.location here:
    // SSR has no window, so any fallback string differs from the client's and
    // hydration fails (React #418).
    const referralLink = referralUrl;

    const copyLink = () => {
        if (!referralLink) return;
        navigator.clipboard?.writeText(referralLink).then(() => {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 1600);
        });
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

                        {referralLink !== null ? (
                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[var(--border-1)] bg-[var(--bg-0)] px-3 py-2 font-mono text-sm">
                                    <Icon name="link" className="h-4 w-4 shrink-0 text-[var(--fg-3)]" />
                                    <span className="truncate">{referralLink}</span>
                                </div>
                                <Button color="teal" onClick={copyLink}>
                                    <Icon name={copiedLink ? "check" : "copy"} className="mr-1 h-4 w-4" />
                                    {copiedLink ? "Copied" : "Copy link"}
                                </Button>
                            </div>
                        ) : (
                            <Callout color="amber" className="mt-6">
                                <div className="text-sm font-medium">Your referral link isn't active yet</div>
                                <div className="mt-0.5 text-sm">
                                    Set your username in{" "}
                                    <Link href="/profile" className="font-medium underline decoration-dotted">profile settings</Link>{" "}
                                    to activate your personal <span className="font-mono">/join/…</span> link.
                                </div>
                            </Callout>
                        )}

                        <Text className="mt-3 text-xs text-[var(--fg-3)]">{TREE_COPY[program.tree]}</Text>
                    </div>
                </Card>

                {/* ── Share kit: one-tap social + copy-ready conversation starters ── */}
                {referralLink !== null && <ShareKit link={referralLink} />}

                {/* ── Dashboard stats: downline + rank ─────────────────────── */}
                <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
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
                            emptyLabel="No referral bonuses yet — share your link above to earn your first."
                        />
                    </Card.Body>
                </Card>
            </div>
        </Layout>
    );
}

/** One-tap social share buttons + copy-ready conversation starters. */
function ShareKit({ link }: { link: string }) {
    const enc = encodeURIComponent;
    const oneLine = `${SHARE_HEADLINE} ${link}`;

    // Brand marks (x, linkedin) come from fancy-brand-icons; the rest are lucide.
    const channels: { key: string; label: string; icon?: string; brand?: string; href: string; className: string }[] = [
        { key: "whatsapp", label: "WhatsApp", icon: "message-circle", href: `https://wa.me/?text=${enc(oneLine)}`, className: "hover:border-green-500/50 hover:text-green-600" },
        { key: "sms", label: "Text", icon: "message-square", href: `sms:?&body=${enc(oneLine)}`, className: "hover:border-teal-500/50 hover:text-teal-600" },
        { key: "email", label: "Email", icon: "mail", href: `mailto:?subject=${enc("Thought you'd like this")}&body=${enc(`${SHARE_HEADLINE}\n\n${link}`)}`, className: "hover:border-amber-500/50 hover:text-amber-600" },
        { key: "x", label: "X", brand: "x", href: `https://twitter.com/intent/tweet?text=${enc(SHARE_HEADLINE)}&url=${enc(link)}`, className: "hover:border-[var(--fg-1)] hover:text-[var(--fg-1)]" },
        { key: "linkedin", label: "LinkedIn", brand: "linkedin", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(link)}`, className: "hover:border-blue-500/50 hover:text-blue-600" },
    ];

    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const copyStarter = (idx: number, text: string) => {
        navigator.clipboard?.writeText(text.replace("{link}", link)).then(() => {
            setCopiedIdx(idx);
            setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1600);
        });
    };

    return (
        <Card>
            <Card.Header>
                <div className="flex items-center gap-2">
                    <Icon name="share-2" className="h-5 w-5 text-teal-500" />
                    <Heading as="h2" className="!text-lg">Spread the word</Heading>
                </div>
                <Text className="text-sm text-[var(--fg-3)]">
                    One tap to share, or grab a ready-made message and paste it into a chat.
                </Text>
            </Card.Header>
            <Card.Body>
                {/* One-tap social channels */}
                <div className="flex flex-wrap gap-2">
                    {channels.map((c) => (
                        <a
                            key={c.key}
                            href={c.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-2 rounded-full border border-[var(--border-1)] bg-[var(--bg-0)] px-3.5 py-2 text-sm font-medium text-[var(--fg-2)] transition-colors ${c.className}`}
                        >
                            <Icon name={c.brand ?? c.icon ?? "share-2"} className="h-4 w-4" />
                            {c.label}
                        </a>
                    ))}
                </div>

                {/* Conversation starters */}
                <div className="mt-6">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--fg-3)]">
                        <Icon name="message-square" className="h-3.5 w-3.5" />
                        Conversation starters
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {CONVERSATION_STARTERS.map((s, idx) => (
                            <div
                                key={s.tone}
                                className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--border-1)] bg-[var(--bg-0)] p-4"
                            >
                                <div>
                                    <Badge variant="soft" color="teal" className="mb-2 text-[11px]">{s.tone}</Badge>
                                    <Text className="text-sm leading-relaxed text-[var(--fg-2)]">
                                        {s.text.replace("{link}", link)}
                                    </Text>
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        color={copiedIdx === idx ? "green" : "teal"}
                                        onClick={() => copyStarter(idx, s.text)}
                                    >
                                        <Icon name={copiedIdx === idx ? "check" : "copy"} className="mr-1 h-3.5 w-3.5" />
                                        {copiedIdx === idx ? "Copied" : "Copy message"}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}
