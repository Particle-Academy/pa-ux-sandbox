import { Head, Link } from "@inertiajs/react";
import {
    Action,
    Badge,
    Card,
    Heading,
    Separator,
    Text,
} from "@particle-academy/react-fancy";
import { Sparkles, Cpu, Boxes } from "lucide-react";
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

const PILLARS = [
    {
        icon: Sparkles,
        title: "Authorable",
        body: "Tailwind-first; tiny, typed APIs. An LLM that reads a prop signature once can use it correctly.",
    },
    {
        icon: Cpu,
        title: "Inhabitable",
        body: "Every interactive surface ships an MCP bridge so embedded agents drive it via JSON-RPC — no Playwright, no vision pass.",
    },
    {
        icon: Boxes,
        title: "Composable",
        body: "Small npm/PHP packages. Take one, take them all.",
    },
];

export default function Home({ packages, total_components }: HomeProps) {
    return (
        <Layout>
            <Head title="Fancy UI Kit · Particle Academy" />

            <section className="relative isolate overflow-hidden rounded-2xl border border-zinc-200 bg-white px-6 py-16 dark:border-zinc-800 dark:bg-zinc-900 sm:px-12 sm:py-20">
                <div className="pointer-events-none absolute inset-x-0 -top-32 h-64 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(167,139,250,0.18),transparent)]" />
                <div className="pointer-events-none absolute -right-10 -top-10 hidden h-72 w-72 rounded-full bg-gradient-to-br from-sky-300/40 via-indigo-400/30 to-violet-300/40 blur-3xl md:block dark:from-sky-500/20 dark:via-indigo-500/15 dark:to-violet-500/20" />
                <div className="relative max-w-3xl">
                    <Badge color="violet" size="sm" className="mb-4">Particle Academy</Badge>
                    <Heading level={1} size="xl" className="!text-4xl !leading-[1.1] tracking-tight sm:!text-5xl">
                        Build apps where{" "}
                        <span className="brand-gradient-text">humans and agents</span>{" "}
                        share the same UI.
                    </Heading>
                    <Text className="mt-5 max-w-2xl text-base !text-zinc-600 dark:!text-zinc-300">
                        Fancy UI is a constellation of React, PHP, and Babylon packages from Particle Academy
                        built for <strong className="text-zinc-900 dark:text-zinc-100">Human+ UX</strong> —
                        interfaces designed from the ground up for humans and AI agents collaborating in the
                        same surface. Every component is bridgeable, not just paintable.
                    </Text>
                    <div className="mt-7 flex flex-wrap items-center gap-3">
                        <Action as={Link} href="/packages" color="violet" size="lg" iconTrailing="arrow-right">
                            Browse {packages.length} packages
                        </Action>
                        <Action as={Link} href="/starter-kits" size="lg" variant="ghost">
                            Starter kits
                        </Action>
                        <a
                            href="/docs/human-plus-ux.md"
                            className="text-sm text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400"
                        >
                            Read the whitepaper →
                        </a>
                    </div>
                </div>
            </section>

            <section className="mt-10 grid gap-4 sm:grid-cols-3">
                {PILLARS.map(({ icon: Icon, title, body }) => (
                    <Card key={title} className="group relative overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-violet-200/40 to-sky-200/40 blur-2xl transition group-hover:from-violet-300/60 group-hover:to-sky-300/60 dark:from-violet-700/20 dark:to-sky-700/20" />
                        <Card.Body className="relative">
                            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                                <Icon size={18} strokeWidth={1.75} />
                            </div>
                            <Heading level={3} size="sm">{title}</Heading>
                            <Text size="sm" className="mt-1 !text-zinc-600 dark:!text-zinc-400">{body}</Text>
                        </Card.Body>
                    </Card>
                ))}
            </section>

            <section className="mt-16">
                <div className="flex items-end justify-between gap-3">
                    <div>
                        <Heading level={2} size="lg">Packages</Heading>
                        <Text size="sm" className="mt-1 !text-zinc-500">
                            {packages.length} packages · {total_components} components — every one with a live demo.
                        </Text>
                    </div>
                    <Action as={Link} href="/packages" variant="ghost" size="sm" iconTrailing="arrow-right">
                        See all
                    </Action>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {packages.map((pkg) => (
                        <Link key={pkg.slug} href={`/packages/${pkg.slug}`} className="block">
                            <Card className="group relative h-full overflow-hidden transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md dark:hover:border-violet-700">
                                <Card.Body>
                                    <div className="flex items-start justify-between gap-2">
                                        <Heading level={3} size="sm" className="!font-mono">{pkg.name}</Heading>
                                        <Badge color={pkg.language === "PHP" || pkg.language === "PHP/Blade" ? "indigo" : "sky"} size="sm">
                                            {pkg.language}
                                        </Badge>
                                    </div>
                                    <Text size="sm" className="mt-1.5 line-clamp-2 !text-zinc-600 dark:!text-zinc-300">
                                        {pkg.tagline}
                                    </Text>
                                    <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                                        <Text size="xs" className="!text-zinc-500 font-mono">
                                            {pkg.components_count} component{pkg.components_count === 1 ? "" : "s"}
                                        </Text>
                                        <Text size="xs" className="!text-violet-600 opacity-0 transition group-hover:opacity-100 dark:!text-violet-300">
                                            Explore →
                                        </Text>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

            <Separator className="my-14" />

            <section className="grid gap-4 sm:grid-cols-3">
                {[
                    {
                        href: "/dreaming",
                        title: "Dreaming",
                        body: "Speculative components you can vote on. Sign in with GitHub to participate.",
                        tone: "violet",
                    },
                    {
                        href: "/showcase",
                        title: "Designer Showcase",
                        body: "Sites and repos built with Fancy UI. Submit yours.",
                        tone: "sky",
                    },
                    {
                        href: "/leaderboard",
                        title: "Leaderboard",
                        body: "Top contributors by merged PRs and votes cast.",
                        tone: "emerald",
                    },
                ].map((tile) => (
                    <Link key={tile.href} href={tile.href} className="block">
                        <Card className="group relative h-full overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
                            <div
                                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${
                                    tile.tone === "violet"
                                        ? "from-violet-400 to-sky-400"
                                        : tile.tone === "sky"
                                            ? "from-sky-400 to-indigo-400"
                                            : "from-emerald-400 to-sky-400"
                                }`}
                            />
                            <Card.Body>
                                <Heading level={3} size="sm">{tile.title}</Heading>
                                <Text size="sm" className="mt-1 !text-zinc-600 dark:!text-zinc-400">{tile.body}</Text>
                                <Text size="xs" className="mt-3 inline-flex items-center gap-1 !text-violet-600 opacity-0 transition group-hover:opacity-100 dark:!text-violet-300">
                                    Open →
                                </Text>
                            </Card.Body>
                        </Card>
                    </Link>
                ))}
            </section>
        </Layout>
    );
}
