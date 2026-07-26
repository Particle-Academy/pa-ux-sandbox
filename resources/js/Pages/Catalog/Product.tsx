import { Head, Link, router, usePage } from "@inertiajs/react";
import { Badge, Breadcrumbs, Button, Card, Heading, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";
import { priceLabel, type CatalogProduct } from "./parts";

/**
 * A single catalog product: its active prices, and the route into Stripe
 * checkout for the recurring ones.
 */
export default function CatalogProductPage({ product }: { product: CatalogProduct }) {
    const { auth } = usePage().props as any;
    const signedIn = Boolean(auth?.user);

    const subscribe = (priceId: number) => {
        if (!signedIn) {
            window.location.href = "/auth/github";
            return;
        }
        router.post(`/subscriptions/create/${priceId}`);
    };

    return (
        <Layout>
            <Head title={`${product.name} · Catalog demo`} />

            <Breadcrumbs>
                <Breadcrumbs.Item href="/catalog-demo">Catalog demo</Breadcrumbs.Item>
                <Breadcrumbs.Item>{product.name}</Breadcrumbs.Item>
            </Breadcrumbs>

            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div>
                    {product.image && (
                        <img
                            src={product.image}
                            alt={product.name}
                            className="mb-6 w-full rounded-xl border border-zinc-200 object-cover dark:border-zinc-800"
                        />
                    )}
                    <Heading as="h1" size="2xl">{product.name}</Heading>
                    {product.description && (
                        <Text className="mt-3 !text-zinc-600 dark:!text-zinc-400">{product.description}</Text>
                    )}
                </div>

                <Card className="h-fit">
                    <div className="space-y-4 p-5">
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Pricing</h2>

                        {product.prices.length === 0 && (
                            <Text size="sm" className="!text-zinc-500 dark:!text-zinc-400">
                                This product has no active price yet.
                            </Text>
                        )}

                        {product.prices.map((price) => (
                            <div
                                key={price.id}
                                className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        {priceLabel(price)}
                                    </span>
                                    {!price.recurring && <Badge color="zinc">one-time</Badge>}
                                </div>

                                {price.recurring &&
                                    (price.purchasable ? (
                                        <Button
                                            className="mt-3 w-full"
                                            color="sky"
                                            onClick={() => subscribe(price.id)}
                                        >
                                            {signedIn ? "Subscribe" : "Sign in to subscribe"}
                                        </Button>
                                    ) : (
                                        // Honest about why there's no button: the price
                                        // exists locally but has never been synced to
                                        // Stripe, so checkout would fail.
                                        <Text size="sm" className="mt-2 !text-zinc-500 dark:!text-zinc-400">
                                            Not yet synced to Stripe — checkout is unavailable.
                                        </Text>
                                    ))}
                            </div>
                        ))}

                        <Button as={Link} href="/subscriptions" variant="ghost" className="w-full">
                            See the showcase&apos;s plans →
                        </Button>
                    </div>
                </Card>
            </div>
        </Layout>
    );
}
