import { Head, Link } from "@inertiajs/react";
import { Card, Heading, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";

type Kit = { slug: string; name: string; pkg: string; blurb: string };

export default function StarterKitsIndex({ kits }: { kits: Kit[] }) {
    return (
        <Layout>
            <Head title="Starter Kits · Fancy UI" />
            <Heading level={1} size="xl">Starter Kits</Heading>
            <Text className="mt-2 max-w-2xl">
                Full-app demos built from Fancy UI pieces. Each is a vertical example you can clone, study, and adapt.
            </Text>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {kits.map((k) => (
                    <Link key={k.slug} href={`/starter-kits/${k.slug}`} className="block">
                        <Card className="h-full transition hover:-translate-y-px hover:shadow-md">
                            <Card.Body>
                                <Heading level={2} size="sm">{k.name}</Heading>
                                <Text size="sm" className="mt-1">{k.blurb}</Text>
                                <Text size="xs" className="mt-3 text-zinc-400">Built with {k.pkg}</Text>
                            </Card.Body>
                        </Card>
                    </Link>
                ))}
            </div>
        </Layout>
    );
}
