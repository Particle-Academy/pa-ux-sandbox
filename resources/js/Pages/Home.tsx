import { Head, Link } from "@inertiajs/react";
import {
    Action,
    Badge,
    Card,
    Heading,
    Separator,
    Text,
} from "@particle-academy/react-fancy";
import { Sparkles, Cpu, Boxes, Paperclip, Smile, Send, Bot } from "lucide-react";
import { Avatar, Pillbox, Tabs } from "@particle-academy/react-fancy";
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

            <section className="relative isolate overflow-hidden rounded-2xl border border-zinc-200 bg-white px-6 py-12 dark:border-zinc-800 dark:bg-zinc-900 sm:px-12 sm:py-16">
                <div className="pointer-events-none absolute inset-x-0 -top-32 h-64 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(167,139,250,0.18),transparent)]" />
                <div className="pointer-events-none absolute -right-10 -top-10 hidden h-72 w-72 rounded-full bg-gradient-to-br from-sky-300/40 via-indigo-400/30 to-violet-300/40 blur-3xl md:block dark:from-sky-500/20 dark:via-indigo-500/15 dark:to-violet-500/20" />
                <div className="relative grid gap-10 md:grid-cols-[1.05fr_1fr] md:items-center">
                    <div>
                        <Badge color="violet" size="sm" className="mb-4">Particle Academy</Badge>
                        <Heading level={1} size="xl" className="!text-4xl !leading-[1.1] tracking-tight sm:!text-5xl">
                            Build apps where{" "}
                            <span className="brand-gradient-text">humans and agents</span>{" "}
                            share the same UI.
                        </Heading>
                        <Text className="mt-5 text-base !text-zinc-600 dark:!text-zinc-300">
                            Fancy UI is a constellation of React, PHP, and Babylon packages built for{" "}
                            <strong className="text-zinc-900 dark:text-zinc-100">Human+ UX</strong> —
                            interfaces designed from the ground up for humans and AI agents collaborating in the
                            same surface. Every component is bridgeable, not just paintable.
                        </Text>
                        <div className="mt-7 flex flex-wrap items-center gap-3">
                            <Action as={Link} href="/packages" color="violet" size="lg" iconTrailing="arrow-right">
                                Browse {packages.length} packages
                            </Action>
                            <Action as={Link} href="/docs/installation" size="lg" variant="ghost">
                                Get started
                            </Action>
                            <a
                                href="/docs/human-plus-ux"
                                className="text-sm text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400"
                            >
                                Read the whitepaper →
                            </a>
                        </div>
                    </div>

                    <HeroMock />
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
                        <Heading level={2} size="lg">Starter kits</Heading>
                        <Text size="sm" className="mt-1 !text-zinc-500">
                            6 vertical demos · clone, study, adapt.
                        </Text>
                    </div>
                    <Action as={Link} href="/starter-kits" variant="ghost" size="sm" iconTrailing="arrow-right">
                        See all
                    </Action>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        { slug: "react-fancy", name: "React Dashboard", pkg: "react-fancy", icon: "▦", tone: "from-violet-400/30 to-sky-400/30" },
                        { slug: "fancy-flow", name: "Workflow Studio", pkg: "fancy-flow", icon: "⟿", tone: "from-emerald-400/30 to-sky-400/30" },
                        { slug: "fancy-whiteboard", name: "Collaborative Board", pkg: "fancy-whiteboard", icon: "✦", tone: "from-amber-400/30 to-rose-400/30" },
                        { slug: "fancy-sheets", name: "Spreadsheet Studio", pkg: "fancy-sheets", icon: "▥", tone: "from-emerald-400/30 to-violet-400/30" },
                        { slug: "fancy-code", name: "Embedded IDE", pkg: "fancy-code", icon: "{ }", tone: "from-indigo-400/30 to-violet-400/30" },
                        { slug: "fancy-echarts", name: "Diagram Studio", pkg: "fancy-echarts", icon: "◊", tone: "from-sky-400/30 to-indigo-400/30" },
                    ].map((k) => (
                        <Link key={k.slug} href={`/starter-kits/${k.slug}`} className="block">
                            <Card className="group relative h-full overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
                                <div className={`grid h-24 place-items-center bg-gradient-to-br ${k.tone} text-3xl text-zinc-900 dark:text-zinc-100`}>
                                    <span>{k.icon}</span>
                                </div>
                                <Card.Body>
                                    <Heading level={3} size="sm">{k.name}</Heading>
                                    <Text size="xs" className="mt-1 !text-zinc-500 font-mono">{k.pkg}</Text>
                                </Card.Body>
                            </Card>
                        </Link>
                    ))}
                </div>
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

function HeroMock() {
    return (
        <div className="relative">
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-violet-200/40 via-sky-200/30 to-emerald-200/30 blur-2xl dark:from-violet-500/20 dark:via-sky-500/15 dark:to-emerald-500/15" />
            <Card className="overflow-hidden shadow-xl ring-1 ring-zinc-200/80 dark:ring-zinc-800">
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/60 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/40">
                    <div className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-rose-400/70" />
                        <span className="size-2.5 rounded-full bg-amber-400/70" />
                        <span className="size-2.5 rounded-full bg-emerald-400/70" />
                    </div>
                    <Text size="xs" className="!text-zinc-500 !font-mono">demo.fancy-ui.app</Text>
                    <span className="w-12" />
                </div>

                <Tabs defaultTab="inbox">
                    <div className="px-4 pt-3">
                        <Tabs.List>
                            <Tabs.Tab value="inbox">Inbox</Tabs.Tab>
                            <Tabs.Tab value="compose">Compose</Tabs.Tab>
                            <Tabs.Tab value="agent">Agent</Tabs.Tab>
                        </Tabs.List>
                    </div>
                    <Tabs.Panels>
                        <Tabs.Panel value="inbox">
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {INBOX.map((row) => (
                                    <div key={row.name} className="flex items-center gap-3 px-4 py-2.5">
                                        <Avatar fallback={row.initials} size="sm" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <Text size="sm" className="!font-medium">{row.name}</Text>
                                                <Text size="xs" className="!text-zinc-500">{row.time}</Text>
                                            </div>
                                            <Text size="xs" className="truncate !text-zinc-500">{row.preview}</Text>
                                        </div>
                                        {row.badge && <Badge color={row.badge.color} size="sm">{row.badge.label}</Badge>}
                                    </div>
                                ))}
                            </div>
                        </Tabs.Panel>
                        <Tabs.Panel value="compose">
                            <div className="space-y-3 p-4">
                                <Pillbox value={["product", "launch"]} onChange={() => {}} color="violet" size="sm" />
                                <div className="min-h-24 rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300">
                                    Hey team — here&apos;s the launch checklist for tomorrow. <br />
                                    Anything to add before EOD?
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-1">
                                        <Action variant="ghost" size="sm" aria-label="Attach">
                                            <Paperclip size={14} />
                                        </Action>
                                        <Action variant="ghost" size="sm" aria-label="Emoji">
                                            <Smile size={14} />
                                        </Action>
                                    </div>
                                    <Action color="violet" size="sm">
                                        <Send size={14} className="mr-1" />
                                        Send
                                    </Action>
                                </div>
                            </div>
                        </Tabs.Panel>
                        <Tabs.Panel value="agent">
                            <div className="space-y-2 p-4 font-mono text-[11px] leading-relaxed">
                                <div className="flex items-center gap-2 text-violet-600 dark:text-violet-300">
                                    <Bot size={14} />
                                    <span>agent · fancy-ui.mcp</span>
                                </div>
                                <div className="text-zinc-500">→ search_components({"{"} query: <span className="text-emerald-600 dark:text-emerald-300">&quot;calendar&quot;</span> {"}"})</div>
                                <div className="text-zinc-700 dark:text-zinc-300">  ← 1 match: <span className="font-semibold">calendar</span> (react-fancy)</div>
                                <div className="text-zinc-500">→ install_instructions({"{"} name: <span className="text-emerald-600 dark:text-emerald-300">&quot;calendar&quot;</span> {"}"})</div>
                                <div className="text-zinc-700 dark:text-zinc-300">  ← <span className="text-violet-600 dark:text-violet-300">npx fancy-ui@latest add calendar</span></div>
                                <div className="text-zinc-700 dark:text-zinc-300">  ← <span className="text-zinc-500">writes</span> src/components/fancy/calendar/</div>
                                <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                                    ready
                                </div>
                            </div>
                        </Tabs.Panel>
                    </Tabs.Panels>
                </Tabs>
            </Card>
        </div>
    );
}

const INBOX: Array<{
    initials: string;
    name: string;
    preview: string;
    time: string;
    badge?: { color: "violet" | "emerald" | "amber"; label: string };
}> = [
    { initials: "RK", name: "Rita Kumar", preview: "PR ready — switched the bridge to MCP framing.", time: "2m", badge: { color: "violet", label: "PR" } },
    { initials: "SL", name: "Sam Lin", preview: "Spec for the new compose surface is in Figma.", time: "1h" },
    { initials: "MA", name: "Maya Chen", preview: "Calendar a11y audit — three nits. See thread.", time: "3h", badge: { color: "amber", label: "review" } },
];
