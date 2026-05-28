import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { Badge, Button, Card, Heading, Text } from "@particle-academy/react-fancy";
import { useState } from "react";
import { Layout } from "../Layout";

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

type FlashShape = { success?: string; error?: string };

export default function ShopIndex({ items, balance, submissions, cosmeticSlots }: Props) {
    const { flash } = usePage<{ flash: FlashShape }>().props;
    const cosmetics = items.filter((i) => i.kind === "cosmetic");
    const services = items.filter((i) => i.kind === "service");

    return (
        <Layout>
            <Head title="Coin Shop · Fancy UI" />

            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <Heading level={1} size="xl">Coin Shop</Heading>
                    <Text className="mt-2 max-w-3xl">
                        Spend the coins you've earned across the showcase on profile cosmetics and showcase boosts.
                        Coins are minted automatically as you earn XP, unlock achievements, and win prizes.
                    </Text>
                </div>
                <BalanceBadge balance={balance} />
            </div>

            {flash?.success && (
                <Card className="mt-6 border-green-500/50 bg-green-50/50 dark:bg-green-900/20">
                    <div className="p-4 text-sm text-green-800 dark:text-green-200">{flash.success}</div>
                </Card>
            )}
            {flash?.error && (
                <Card className="mt-6 border-red-500/50 bg-red-50/50 dark:bg-red-900/20">
                    <div className="p-4 text-sm text-red-800 dark:text-red-200">{flash.error}</div>
                </Card>
            )}

            <section className="mt-8">
                <Heading level={2} size="lg">Cosmetics</Heading>
                <Text className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    One-time purchases that stay on your profile forever.
                </Text>
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
                <Heading level={2} size="lg">Services</Heading>
                <Text className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Time-bounded boosts. Featuring stacks if you already have an active window.
                </Text>
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {services.map((item) => (
                        <ServiceCard key={item.slug} item={item} balance={balance} submissions={submissions} />
                    ))}
                </div>
            </section>
        </Layout>
    );
}

function BalanceBadge({ balance }: { balance: number | null }) {
    if (balance === null) {
        return (
            <Link href="/login" className="text-sm font-medium text-violet-600 underline-offset-4 hover:underline dark:text-violet-400">
                Sign in to see your balance
            </Link>
        );
    }
    return (
        <div className="rounded-full border border-amber-400/40 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-200">
            {balance.toLocaleString()} coins
        </div>
    );
}

function isOwned(item: Item, slots: Record<string, string>): boolean {
    const slot = item.metadata?.slot as string | undefined;
    const value = item.metadata?.value as string | undefined;
    return Boolean(slot && value && slots[slot] === value);
}

function CosmeticCard({ item, balance, owned }: { item: Item; balance: number | null; owned: boolean }) {
    const { post, processing } = useForm({});
    const canBuy = balance !== null && balance >= item.price && !owned;

    return (
        <Card className="flex flex-col p-5">
            <div className="flex items-center justify-between">
                <Heading level={3} size="sm">{item.name}</Heading>
                {owned && <Badge tone="success">Owned</Badge>}
            </div>
            {item.description && <Text className="mt-2 flex-1 text-sm">{item.description}</Text>}
            <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold">{item.price.toLocaleString()} coins</span>
                <Button
                    disabled={!canBuy || processing}
                    onClick={() => post(`/shop/${item.slug}/purchase`)}
                >
                    {owned ? "Owned" : "Buy"}
                </Button>
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
    const canBuy = balance !== null && balance >= item.price && submissionId !== null;

    const service = item.metadata?.service as string | undefined;
    const requiresSubmission = service === "featured-showcase";

    return (
        <Card className="flex flex-col p-5">
            <div className="flex items-center justify-between">
                <Heading level={3} size="sm">{item.name}</Heading>
                <Badge tone="info">Service</Badge>
            </div>
            {item.description && <Text className="mt-2 text-sm">{item.description}</Text>}

            {requiresSubmission && (
                <div className="mt-4">
                    {submissions.length === 0 ? (
                        <Text className="text-xs text-zinc-500">
                            You need a verified showcase submission first. <Link href="/showcase/submit" className="underline">Submit one →</Link>
                        </Text>
                    ) : (
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                            Feature which submission?
                            <select
                                className="mt-1 block w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
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

            <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold">{item.price.toLocaleString()} coins</span>
                <Button
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
