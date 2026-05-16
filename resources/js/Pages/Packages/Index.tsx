import { Head, Link } from "@inertiajs/react";
import { Badge, Card, Heading, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";

type Pkg = {
    slug: string;
    name: string;
    tagline: string;
    language: string;
    components_count: number;
};

export default function PackagesIndex({ packages }: { packages: Pkg[] }) {
    return (
        <Layout>
            <Head title="Packages · Fancy UI" />
            <Heading level={1} size="xl">Packages</Heading>
            <Text className="mt-2">
                Every Fancy UI package, with a per-component live demo behind each tile.
            </Text>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg) => (
                    <Link key={pkg.slug} href={`/packages/${pkg.slug}`} className="block">
                        <Card className="h-full transition hover:-translate-y-px hover:shadow-md">
                            <Card.Body>
                                <div className="flex items-center justify-between">
                                    <Heading level={2} size="sm">{pkg.name}</Heading>
                                    <Badge color="zinc" size="sm">{pkg.language}</Badge>
                                </div>
                                <Text size="sm" className="mt-1">{pkg.tagline}</Text>
                                <Text size="xs" className="mt-3 text-zinc-400">
                                    {pkg.components_count} components
                                </Text>
                            </Card.Body>
                        </Card>
                    </Link>
                ))}
            </div>
        </Layout>
    );
}
