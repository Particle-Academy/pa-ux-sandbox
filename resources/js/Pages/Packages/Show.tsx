import { Head, Link } from "@inertiajs/react";
import { Badge, Breadcrumbs, Card, Heading, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";

type Pkg = {
    slug: string;
    name: string;
    tagline: string;
    language: string;
    npm?: string;
    composer?: string;
    repo: string;
    components: { slug: string; name: string; blurb?: string }[];
};

export default function PackagesShow({ package: pkg }: { package: Pkg }) {
    return (
        <Layout>
            <Head title={`${pkg.name} · Fancy UI`} />

            <Breadcrumbs>
                <Breadcrumbs.Item href="/packages">Packages</Breadcrumbs.Item>
                <Breadcrumbs.Item>{pkg.name}</Breadcrumbs.Item>
            </Breadcrumbs>

            <Heading level={1} size="xl" className="mt-3">{pkg.name}</Heading>
            <Text className="mt-2 max-w-3xl">{pkg.tagline}</Text>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                {pkg.npm && <Badge color="indigo" size="sm">npm: {pkg.npm}</Badge>}
                {pkg.composer && <Badge color="violet" size="sm">composer: {pkg.composer}</Badge>}
                <a
                    href={`https://github.com/${pkg.repo}`}
                    target="_blank"
                    rel="noopener"
                    className="hover:underline"
                >
                    github.com/{pkg.repo}
                </a>
            </div>

            <Heading level={2} size="lg" className="mt-10">Components</Heading>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {pkg.components.map((c) => (
                    <Link key={c.slug} href={`/packages/${pkg.slug}/${c.slug}`} className="block">
                        <Card className="transition hover:bg-zinc-50 dark:hover:bg-zinc-900">
                            <Card.Body>
                                <Text className="font-mono font-medium">{c.name}</Text>
                                {c.blurb && <Text size="xs" className="mt-0.5">{c.blurb}</Text>}
                            </Card.Body>
                        </Card>
                    </Link>
                ))}
            </div>
        </Layout>
    );
}
