import { Head, Link } from "@inertiajs/react";
import { Action, Badge, Card, Heading, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";

type Kit = { slug: string; name: string; pkg: string; blurb: string };

export default function StarterKitsIndex({ kits }: { kits: Kit[] }) {
    return (
        <Layout>
            <Head title="Starter Kits · Fancy UI" />

            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <Heading level={1} size="xl" className="!text-zinc-900 dark:!text-zinc-100">Starter Kits</Heading>
                    <Text className="mt-2 max-w-2xl !text-zinc-600 dark:!text-zinc-300">
                        Full-app demos built from Fancy UI pieces. Each is a vertical example you can clone, study, and adapt — every kit is downloadable as a runnable Vite + React 19 + Tailwind v4 project.
                    </Text>
                </div>
                <Badge color="violet" size="sm">{kits.length} kits</Badge>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {kits.map((k) => (
                    <Link key={k.slug} href={`/starter-kits/${k.slug}`} className="block">
                        <Card className="group h-full overflow-hidden transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg dark:hover:border-violet-700">
                            {/* Screenshot */}
                            <div className="relative aspect-[16/10] overflow-hidden border-b border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                                <img
                                    src={`/showcase-shots/${k.slug}.png`}
                                    alt={`${k.name} preview`}
                                    className="absolute inset-0 size-full object-cover object-top transition duration-500 group-hover:scale-[1.02]"
                                    loading="lazy"
                                />
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                                <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100">
                                    <Badge color="violet" size="sm">starter kit</Badge>
                                </div>
                            </div>

                            <Card.Body>
                                <div className="flex items-start justify-between gap-2">
                                    <Heading level={2} size="sm" className="!text-zinc-900 dark:!text-zinc-100">{k.name}</Heading>
                                    <Text size="xs" className="!font-mono !text-zinc-400 shrink-0 mt-0.5">
                                        {k.pkg}
                                    </Text>
                                </div>
                                <Text size="sm" className="mt-2 !text-zinc-600 dark:!text-zinc-300">{k.blurb}</Text>
                                <div className="mt-4 flex items-center justify-between">
                                    <Text size="xs" className="!text-violet-600 opacity-0 transition group-hover:opacity-100 dark:!text-violet-300">
                                        Open kit →
                                    </Text>
                                    <Action
                                        as="a"
                                        href={`/starter-kits/${k.slug}/download.zip`}
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        ↓ zip
                                    </Action>
                                </div>
                            </Card.Body>
                        </Card>
                    </Link>
                ))}
            </div>
        </Layout>
    );
}
