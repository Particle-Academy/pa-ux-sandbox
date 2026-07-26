import { Head, Link } from "@inertiajs/react";
import { Badge, Button, Card, Heading, Icon, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";
import { PriceLine, type CatalogProduct } from "./parts";

/**
 * The laravel-catalog demo storefront. A worked example of the package's public
 * side — products, active prices, and the route into Stripe checkout — rendered
 * in the showcase chrome rather than in a leftover standalone Blade layout.
 */
export default function CatalogStorefront({ products }: { products: CatalogProduct[] }) {
    return (
        <Layout>
            <Head title="Catalog demo · Fancy UI" />

            <header className="max-w-2xl">
                <Badge color="sky">laravel-catalog</Badge>
                <Heading as="h1" size="2xl" className="mt-3">
                    Catalog demo storefront
                </Heading>
                <Text className="mt-3 !text-zinc-600 dark:!text-zinc-400">
                    Products and prices straight out of{" "}
                    <strong>particle-academy/laravel-catalog</strong> — the same models the admin syncs to
                    Stripe. Looking for the showcase&apos;s own plans?{" "}
                    <Link href="/subscriptions" className="text-sky-600 underline dark:text-sky-400">
                        Go Pro
                    </Link>
                    .
                </Text>
            </header>

            {products.length === 0 ? (
                <Card className="mt-8">
                    <div className="p-8 text-center">
                        <Icon name="package" className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                        <Text className="mt-3 !text-zinc-500 dark:!text-zinc-400">
                            No products are published in the catalog yet.
                        </Text>
                        <Button as={Link} href="/packages/laravel-catalog" variant="ghost" className="mt-4">
                            About laravel-catalog →
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {products.map((product) => (
                        <Card key={product.id} padding="none" className="flex h-full flex-col overflow-hidden">
                            {product.image && (
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    loading="lazy"
                                    className="h-40 w-full border-b border-zinc-100 object-cover dark:border-zinc-800"
                                />
                            )}
                            <div className="flex flex-1 flex-col p-5">
                                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    {product.name}
                                </h2>
                                {product.description && (
                                    <Text size="sm" className="mt-1.5 line-clamp-3 !text-zinc-600 dark:!text-zinc-400">
                                        {product.description}
                                    </Text>
                                )}
                                <div className="mt-4 space-y-1">
                                    {product.prices.slice(0, 2).map((price) => (
                                        <PriceLine key={price.id} price={price} />
                                    ))}
                                    {product.prices.length === 0 && (
                                        <Text size="sm" className="!text-zinc-400">
                                            No active price.
                                        </Text>
                                    )}
                                </div>
                                <Button
                                    as={Link}
                                    href={`/products/${product.id}`}
                                    variant="ghost"
                                    className="mt-4 self-start"
                                >
                                    View details →
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </Layout>
    );
}
