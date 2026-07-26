import { Head, Link, router, usePage } from "@inertiajs/react";
import { Badge, Button, Callout, Card, Heading, Icon, Text } from "@particle-academy/react-fancy";
import { PricingTable } from "../../components/fancy/catalog-fms";
import type { Plan } from "../../components/fancy/catalog-fms/types";
import { Layout } from "../Layout";

/**
 * Go Pro.
 *
 * Rendered with the showcase's own `catalog-fms` block — the same components
 * anyone gets from `npx fancy-cli add catalog-fms`. If the kit can't dress its
 * own pricing page, it has no business selling one.
 *
 * The page has to answer "am I already Pro, and how?" before it sells anything:
 * Pro is reachable by subscription, by earning the sandbox-pro prize, or by an
 * admin grant, and telling someone who earned it to buy it is the fastest way to
 * look broken.
 */

type ProSource = "subscription" | "manual" | "prize" | null;

type Feature = { key: string; name: string; description: string; icon: string };
type Subscription = { id: number; name: string; status: string; endsAt: string | null };

type Props = {
    plans: Plan[];
    features: Feature[];
    pro: { isPro: boolean; source: ProSource };
    subscriptions: Subscription[];
};

/** How the viewer got Pro, said plainly. */
const SOURCE_COPY: Record<Exclude<ProSource, null>, { title: string; body: string }> = {
    subscription: {
        title: "You're Pro, by subscription",
        body: "Everything below is unlocked. Your billing details are managed in Stripe.",
    },
    prize: {
        title: "You're Pro — you earned it",
        body: "The sandbox-pro prize at Ambassador tier unlocks the same features a subscription does. Nothing to buy.",
    },
    manual: {
        title: "You're Pro, by admin grant",
        body: "Everything below is unlocked. There's no subscription attached to this account.",
    },
};

export default function ProIndex({ plans, features, pro, subscriptions }: Props) {
    const { auth, flash } = usePage().props as any;
    const signedIn = Boolean(auth?.user);
    const status = pro.source ? SOURCE_COPY[pro.source] : null;

    const startCheckout = (planId: string, priceId?: string) => {
        if (!signedIn) {
            // Sign in first — checkout needs an owner to attach the subscription to.
            window.location.href = "/auth/github";
            return;
        }
        if (priceId) router.post(`/subscriptions/create/${priceId}`);
    };

    return (
        <Layout>
            <Head title="Go Pro · Fancy UI" />

            {flash?.success && (
                <Callout color="emerald" className="mb-6">
                    {flash.success}
                </Callout>
            )}
            {flash?.error && (
                <Callout color="red" className="mb-6">
                    {flash.error}
                </Callout>
            )}

            <header className="max-w-2xl">
                <Badge color="violet" dot>
                    Pro
                </Badge>
                <Heading as="h1" size="2xl" className="mt-3">
                    Everything in Fancy UI is free. Pro is the analytics.
                </Heading>
                <Text className="mt-3 !text-zinc-600 dark:!text-zinc-400">
                    Every package, component, block, and starter kit stays free and MIT — Pro doesn&apos;t
                    gate the kit. It unlocks the Pro Analytics Suite off the Fancy Pixel, plus a few
                    conveniences on top.
                </Text>
            </header>

            {/* Where the viewer already stands, before any pitch. */}
            {status && (
                <Card className="mt-8 border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                    <div className="flex flex-wrap items-start gap-3 p-5">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
                            <Icon name="check" className="h-5 w-5" />
                        </span>
                        <div className="min-w-[16rem] flex-1">
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {status.title}
                            </div>
                            <Text size="sm" className="mt-0.5 !text-zinc-600 dark:!text-zinc-400">
                                {status.body}
                            </Text>
                            {subscriptions.length > 0 && (
                                <ul className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                                    {subscriptions.map((s) => (
                                        <li key={s.id}>
                                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                                {s.name}
                                            </span>{" "}
                                            — {s.status}
                                            {s.endsAt ? ` · ends ${s.endsAt}` : ""}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <Button as={Link} href="/analytics" color="violet">
                            Open analytics
                        </Button>
                    </div>
                </Card>
            )}

            {/* What you get. Worth reading whether or not there's anything to buy. */}
            <section className="mt-10">
                <Heading as="h2" size="lg">
                    What Pro unlocks
                </Heading>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {features.map((f) => (
                        <Card key={f.key} className="h-full">
                            <div className="p-5">
                                <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                                    <Icon name={f.icon} className="h-[18px] w-[18px]" />
                                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                        {f.name}
                                    </h3>
                                </div>
                                <Text size="sm" className="mt-2 !text-zinc-600 dark:!text-zinc-400">
                                    {f.description}
                                </Text>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* The plans — or an honest word about why there aren't any yet. */}
            <section className="mt-10">
                <Heading as="h2" size="lg">
                    {plans.length > 0 ? "Plans" : "Two ways in"}
                </Heading>

                {plans.length > 0 ? (
                    <PricingTable
                        className="mt-5"
                        plans={plans.map((p) => ({
                            ...p,
                            current: pro.source === "subscription",
                            ctaLabel: pro.source === "subscription" ? "Your plan" : signedIn ? "Subscribe" : "Sign in to subscribe",
                            disabled: pro.source === "subscription",
                        }))}
                        onSelectPlan={(planId, price) => startCheckout(planId, price?.id)}
                        intervalLabel={(i) => (i === "year" ? "Yearly · 2 months free" : undefined)}
                    />
                ) : (
                    <>
                        <Text className="mt-3 !text-zinc-600 dark:!text-zinc-400">
                            Paid plans aren&apos;t open yet — the subscription side is still in setup. The
                            earned route is live now, and it grants exactly the same features.
                        </Text>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <Card>
                                <div className="p-5">
                                    <div className="flex items-center gap-2">
                                        <Icon name="trophy" className="h-[18px] w-[18px] text-amber-500" />
                                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                            Earn it
                                        </h3>
                                        <Badge color="emerald">available now</Badge>
                                    </div>
                                    <Text size="sm" className="mt-2 !text-zinc-600 dark:!text-zinc-400">
                                        Reach Ambassador tier on overall engagement and the{" "}
                                        <code className="text-xs">sandbox-pro</code> prize unlocks the whole
                                        suite — permanently, and for free.
                                    </Text>
                                    <Button as={Link} href="/leaderboard" className="mt-4" color="amber">
                                        See the leaderboard
                                    </Button>
                                </div>
                            </Card>
                            <Card>
                                <div className="p-5">
                                    <div className="flex items-center gap-2">
                                        <Icon name="credit-card" className="h-[18px] w-[18px] text-zinc-400" />
                                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                            Subscribe
                                        </h3>
                                        <Badge color="zinc">soon</Badge>
                                    </div>
                                    <Text size="sm" className="mt-2 !text-zinc-600 dark:!text-zinc-400">
                                        When plans open they&apos;ll appear right here, priced per month or
                                        year, and checkout runs through Stripe via laravel-catalog.
                                    </Text>
                                    <Button
                                        as={Link}
                                        href="/packages/catalog-fms"
                                        variant="ghost"
                                        className="mt-4"
                                    >
                                        How this page is built →
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </>
                )}
            </section>

            {/* Dogfooding note — this page IS the block. */}
            <section className="mt-10 rounded-xl border border-zinc-200 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
                <Text size="sm" className="!text-zinc-600 dark:!text-zinc-400">
                    The plans above render through <code className="text-xs">PricingTable</code> from the{" "}
                    <strong>catalog-fms</strong> block, over <strong>laravel-catalog</strong> products and{" "}
                    <strong>laravel-fms</strong> entitlements. The block also ships{" "}
                    <code className="text-xs">FeatureMatrix</code>, <code className="text-xs">FeatureGate</code>
                    , and <code className="text-xs">PlanFeaturesEditor</code> — vendor the lot with{" "}
                    <code className="text-xs">npx fancy-cli add catalog-fms</code>.
                </Text>
            </section>
        </Layout>
    );
}
