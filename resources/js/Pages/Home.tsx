import { Head, Link } from "@inertiajs/react";
import {
    Action,
    Badge,
    Card,
    
    
    Heading,
    Separator,
    Text,
} from "@particle-academy/react-fancy";
import { Layout } from "./Layout";

type PackageRow = {
    slug: string;
    name: string;
    tagline: string;
    language: string;
    components_count: number;
};

type HomeProps = {
    packages: PackageRow[];
    total_components: number;
};

export default function Home({ packages, total_components }: HomeProps) {
    return (
        <Layout>
            <Head title="Fancy UI Kit · Particle Academy" />

            <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
                <div>
                    <Text size="xs" className="font-semibold uppercase tracking-wider text-zinc-500">
                        Particle Academy
                    </Text>
                    <Heading level={1} size="xl" className="mt-2">
                        Build apps where{" "}
                        <span className="brand-gradient-text">humans and agents</span>{" "}
                        share the same UI.
                    </Heading>
                    <Text className="mt-4 max-w-xl">
                        Fancy UI is a constellation of React, PHP, and Babylon packages from Particle Academy built for{" "}
                        <strong>Human+ UX</strong> — interfaces designed from the ground up for humans and AI agents
                        collaborating in the same surface. Every component is bridgeable, not just paintable.
                    </Text>
                    <div className="mt-6 flex flex-wrap items-center gap-2">
                        <Action as={Link} href="/packages" color="violet">
                            Browse packages →
                        </Action>
                        <Action as={Link} href="/starter-kits">
                            See starter kits
                        </Action>
                        <a href="/docs/human-plus-ux.md" className="self-center text-sm text-zinc-500 hover:underline">
                            Read the whitepaper →
                        </a>
                    </div>
                </div>

                <Card>
                    <Card.Header>
                        <Heading level={3} size="sm">Why this kit</Heading>
                    </Card.Header>
                    <Card.Body>
                        <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                            <li>
                                <strong className="text-zinc-900 dark:text-zinc-100">Authorable.</strong>{" "}
                                Tailwind-first; tiny, typed APIs. An LLM that reads a prop signature once can use it correctly.
                            </li>
                            <li>
                                <strong className="text-zinc-900 dark:text-zinc-100">Inhabitable.</strong>{" "}
                                Every interactive surface ships an MCP bridge so embedded agents drive it via JSON-RPC — no Playwright, no vision pass.
                            </li>
                            <li>
                                <strong className="text-zinc-900 dark:text-zinc-100">Composable.</strong>{" "}
                                Small npm/PHP packages. Take one, take them all.
                            </li>
                        </ul>
                    </Card.Body>
                </Card>
            </section>

            <Separator className="my-12" />

            <section>
                <div className="flex items-baseline justify-between">
                    <Heading level={2} size="lg">Packages</Heading>
                    <Text size="sm" className="text-zinc-500">
                        {packages.length} packages · {total_components} components
                    </Text>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {packages.map((pkg) => (
                        <Link key={pkg.slug} href={`/packages/${pkg.slug}`} className="block">
                            <Card className="h-full transition hover:-translate-y-px hover:shadow-md">
                                <Card.Body>
                                    <div className="flex items-center justify-between">
                                        <Heading level={3} size="sm">{pkg.name}</Heading>
                                        <Badge color="zinc" size="sm">{pkg.language}</Badge>
                                    </div>
                                    <Text size="xs" className="mt-1 text-zinc-500">{pkg.tagline}</Text>
                                    <Text size="xs" className="mt-3 text-zinc-400">
                                        {pkg.components_count} components
                                    </Text>
                                </Card.Body>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

            <Separator className="my-12" />

            <section className="grid gap-4 sm:grid-cols-3">
                {[
                    { href: "/dreaming", title: "Dreaming", body: "Speculative components you can vote on. Sign in with GitHub to participate." },
                    { href: "/showcase", title: "Designer Showcase", body: "Sites and repos built with Fancy UI. Submit yours." },
                    { href: "/leaderboard", title: "Leaderboard", body: "Top contributors by merged PRs and votes cast." },
                ].map((tile) => (
                    <Link key={tile.href} href={tile.href} className="block">
                        <Card className="h-full transition hover:-translate-y-px hover:shadow-md">
                            <Card.Body>
                                <Heading level={3} size="sm">{tile.title}</Heading>
                                <Text size="xs" className="mt-1 text-zinc-500">{tile.body}</Text>
                            </Card.Body>
                        </Card>
                    </Link>
                ))}
            </section>
        </Layout>
    );
}
