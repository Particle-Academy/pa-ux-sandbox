import { Head, Link, useForm } from "@inertiajs/react";
import { Badge, Button, Card, Heading, Icon, Text } from "@particle-academy/react-fancy";
import { useState } from "react";
import { Layout } from "../Layout";
import { avatarFrameClass, bannerStyle, nameColorClass, type CosmeticSlots } from "../../lib/cosmetics";

type Item = {
    slug: string;
    name: string;
    description: string | null;
    kind: "cosmetic" | "service";
    price: number;
    metadata: Record<string, unknown> | null;
};

type Submission = {
    id: number;
    title: string;
    url: string;
    kind: string;
    featured_until: string | null;
};

type Props = {
    items: Item[];
    balance: number | null;
    submissions: Submission[];
    cosmeticSlots: Record<string, string>;
};

export default function ShopIndex({ items, balance, submissions, cosmeticSlots }: Props) {
    const cosmetics = items.filter((i) => i.kind === "cosmetic");
    const services = items.filter((i) => i.kind === "service");

    return (
        <Layout>
            <Head title="Coin Shop · Fancy UI" />

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <Heading as="h1" size="xl">Coin Shop</Heading>
                    <Text className="mt-2 max-w-3xl">
                        Spend the coins you've earned across the showcase on profile cosmetics and showcase boosts.
                        Coins are minted automatically as you earn XP, unlock achievements, and win prizes.
                    </Text>
                </div>
                <Balance balance={balance} />
            </div>

            {/* Flash success/error render globally in Layout. */}

            <section className="mt-8">
                <SectionHead
                    icon="sparkles"
                    tone="text-violet-500"
                    title="Cosmetics"
                    sub="One-time purchases that stay on your profile forever."
                />
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {cosmetics.map((item) => (
                        <CosmeticCard
                            key={item.slug}
                            item={item}
                            balance={balance}
                            owned={isOwned(item, cosmeticSlots)}
                        />
                    ))}
                </div>
            </section>

            <section className="mt-10">
                <SectionHead
                    icon="rocket"
                    tone="text-sky-500"
                    title="Services"
                    sub="Time-bounded boosts. Featuring stacks if you already have an active window."
                />
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {services.map((item) => (
                        <ServiceCard key={item.slug} item={item} balance={balance} submissions={submissions} />
                    ))}
                </div>
            </section>
        </Layout>
    );
}

function SectionHead({ icon, tone, title, sub }: { icon: string; tone: string; title: string; sub: string }) {
    return (
        <div>
            <Heading as="h2" size="lg">
                <span className="inline-flex items-center gap-2">
                    <Icon name={icon} size="sm" className={tone} />
                    {title}
                </span>
            </Heading>
            <Text className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{sub}</Text>
        </div>
    );
}

function Balance({ balance }: { balance: number | null }) {
    if (balance === null) {
        return (
            <Link
                href="/login"
                className="text-sm font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400"
            >
                Sign in to see your balance
            </Link>
        );
    }
    return (
        <div className="flex items-center gap-3 rounded-xl border border-amber-300/60 bg-amber-50/70 px-4 py-2.5 dark:border-amber-500/25 dark:bg-amber-500/10">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-300">
                <Icon name="coins" size="sm" />
            </span>
            <span>
                <span className="block font-mono text-xl font-semibold tabular-nums text-amber-700 dark:text-amber-200">
                    {balance.toLocaleString()}
                </span>
                <span className="block text-[11px] font-medium uppercase tracking-wide text-amber-700/70 dark:text-amber-200/60">
                    Your balance
                </span>
            </span>
        </div>
    );
}

function isOwned(item: Item, slots: Record<string, string>): boolean {
    const slot = item.metadata?.slot as string | undefined;
    const value = item.metadata?.value as string | undefined;
    return Boolean(slot && value && slots[slot] === value);
}

/**
 * Shows the cosmetic instead of describing it. The item's `{slot, value}`
 * metadata is fed to the SAME render helpers a real profile uses, so the swatch
 * is the actual thing being bought — not an illustration of it that can drift
 * out of sync with the catalog.
 */
function CosmeticPreview({ item }: { item: Item }) {
    const slot = item.metadata?.slot as string | undefined;
    const value = item.metadata?.value as string | undefined;
    const slots = (slot && value ? { [slot]: value } : {}) as CosmeticSlots;

    if (slot === "avatar-frame") {
        return (
            <span
                className={`grid h-12 w-12 place-items-center rounded-full bg-zinc-300 text-sm font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200 ${avatarFrameClass(slots)}`}
            >
                F
            </span>
        );
    }
    if (slot === "name-color") {
        return <span className={`text-lg font-semibold ${nameColorClass(slots)}`}>your name</span>;
    }
    if (slot === "banner") {
        return (
            <span className="flex h-12 w-full max-w-[10rem] items-end rounded-lg px-2 pb-1.5" style={bannerStyle(slots)}>
                <span className="h-5 w-5 rounded-full bg-white/85 ring-2 ring-white/60" />
            </span>
        );
    }
    return <Icon name="sparkles" size="md" className="text-zinc-400" />;
}

function CosmeticCard({ item, balance, owned }: { item: Item; balance: number | null; owned: boolean }) {
    const { post, processing } = useForm({});
    const affordable = balance !== null && balance >= item.price;
    const canBuy = affordable && !owned;

    return (
        <Card
            className={[
                "flex flex-col overflow-hidden transition",
                owned ? "border-emerald-300/70 dark:border-emerald-500/30" : affordable ? "" : "opacity-70",
            ].join(" ")}
        >
            <div className="grid h-28 place-items-center border-b border-zinc-200 bg-zinc-50/70 px-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <CosmeticPreview item={item} />
            </div>

            <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-1.5">
                    <Heading as="h3" size="sm">{item.name}</Heading>
                    {owned && <Icon name="check-circle" size="xs" className="text-emerald-500" />}
                </div>
                {item.description && <Text className="mt-1.5 flex-1 text-sm">{item.description}</Text>}

                <div className="mt-4 flex items-center justify-between gap-3">
                    {owned ? (
                        <Badge color="emerald" variant="soft">Owned</Badge>
                    ) : (
                        <span
                            className={`inline-flex items-center gap-1 font-mono text-sm font-semibold tabular-nums ${
                                affordable ? "text-amber-600 dark:text-amber-400" : "text-zinc-400 dark:text-zinc-500"
                            }`}
                        >
                            <Icon name="coins" size="xs" />
                            {item.price.toLocaleString()}
                        </span>
                    )}
                    <Button
                        size="sm"
                        color={canBuy ? "violet" : undefined}
                        disabled={!canBuy || processing}
                        onClick={() => post(`/shop/${item.slug}/purchase`)}
                    >
                        {owned ? "Owned" : "Buy"}
                    </Button>
                </div>
            </div>
        </Card>
    );
}

function ServiceCard({
    item,
    balance,
    submissions,
}: {
    item: Item;
    balance: number | null;
    submissions: Submission[];
}) {
    const [submissionId, setSubmissionId] = useState<number | null>(submissions[0]?.id ?? null);
    const { post, processing } = useForm<{ submission_id: number | null }>({ submission_id: submissionId });

    const service = item.metadata?.service as string | undefined;
    const requiresSubmission = service === "featured-showcase";
    const affordable = balance !== null && balance >= item.price;
    const canBuy = affordable && (!requiresSubmission || submissionId !== null);

    return (
        <Card className={`flex flex-col gap-4 p-5 ${affordable ? "" : "opacity-70"}`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <Heading as="h3" size="sm">{item.name}</Heading>
                    {item.description && <Text className="mt-1 text-sm">{item.description}</Text>}
                </div>
                <Badge color="violet" variant="soft">Service</Badge>
            </div>

            {requiresSubmission && (
                <div>
                    {submissions.length === 0 ? (
                        <Text className="text-xs text-zinc-500">
                            You need a verified showcase submission first.{" "}
                            <Link href="/showcase/submit" className="underline">Submit one →</Link>
                        </Text>
                    ) : (
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                            Feature which submission?
                            <select
                                className="mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                                value={submissionId ?? ""}
                                onChange={(e) => setSubmissionId(Number(e.target.value))}
                            >
                                {submissions.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.title} {s.featured_until ? "(already featured)" : ""}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                </div>
            )}

            <div className="mt-auto flex items-center justify-between gap-3">
                <span
                    className={`inline-flex items-center gap-1 font-mono text-sm font-semibold tabular-nums ${
                        affordable ? "text-amber-600 dark:text-amber-400" : "text-zinc-400 dark:text-zinc-500"
                    }`}
                >
                    <Icon name="coins" size="xs" />
                    {item.price.toLocaleString()}
                </span>
                <Button
                    size="sm"
                    color={canBuy ? "violet" : undefined}
                    disabled={!canBuy || processing}
                    onClick={() => {
                        post(`/shop/${item.slug}/purchase`, {
                            data: { submission_id: submissionId },
                        } as never);
                    }}
                >
                    Buy
                </Button>
            </div>
        </Card>
    );
}
