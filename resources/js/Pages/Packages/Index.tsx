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

// Packages we have hand-curated screenshots for. The rest fall back to a
// tasteful logo-style tile rendered from the package slug.
const HAS_SHOT = new Set([
    "react-fancy",
    "fancy-flow",
    "fancy-whiteboard",
    "fancy-code",
    "fancy-sheets",
    "fancy-echarts",
    "fancy-screens",
    "fancy-3d",
    "fancy-inertia",
    "fancy-slides",
    "agent-integrations",
    "holy-sheet",
    "dark-slide",
]);

export default function PackagesIndex({ packages }: { packages: Pkg[] }) {
    const totalComponents = packages.reduce((s, p) => s + p.components_count, 0);
    return (
        <Layout>
            <Head title="Packages · Fancy UI" />

            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <Heading level={1} size="xl" className="!text-zinc-900 dark:!text-zinc-100">Packages</Heading>
                    <Text className="mt-2 max-w-2xl !text-zinc-600 dark:!text-zinc-300">
                        Every Fancy UI package, with a per-component live demo behind each tile.
                    </Text>
                </div>
                <div className="flex items-center gap-2">
                    <Badge color="violet" size="sm">{packages.length} packages</Badge>
                    <Badge color="emerald" size="sm">{totalComponents} components</Badge>
                </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg) => (
                    <Link key={pkg.slug} href={`/packages/${pkg.slug}`} className="block">
                        <Card className="group h-full overflow-hidden transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg dark:hover:border-violet-700">
                            <PackageHero pkg={pkg} />
                            <Card.Body>
                                <div className="flex items-start justify-between gap-2">
                                    <Heading level={2} size="sm" className="!font-mono !text-zinc-900 dark:!text-zinc-100">{pkg.name}</Heading>
                                    <Badge color={pkg.language === "PHP" || pkg.language === "PHP/Blade" ? "indigo" : "sky"} size="sm">
                                        {pkg.language}
                                    </Badge>
                                </div>
                                <Text size="sm" className="mt-2 line-clamp-2 !text-zinc-600 dark:!text-zinc-300">{pkg.tagline}</Text>
                                <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                                    <Text size="xs" className="!font-mono !text-zinc-500">
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
        </Layout>
    );
}

function PackageHero({ pkg }: { pkg: Pkg }) {
    if (HAS_SHOT.has(pkg.slug)) {
        return (
            <div className="relative aspect-[16/10] overflow-hidden border-b border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                <img
                    src={`/showcase-shots/${pkg.slug}.png`}
                    alt={`${pkg.name} preview`}
                    className="absolute inset-0 size-full object-cover object-top transition duration-500 group-hover:scale-[1.02]"
                    loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
            </div>
        );
    }
    // Tasteful fallback for infrastructure-y packages (e.g. holy-sheet) that
    // don't have a natural "money shot" — a code-snippet card themed by the
    // package's language.
    const isPhp = pkg.language === "PHP";
    return (
        <div className={`grid aspect-[16/10] place-items-center border-b border-zinc-100 ${
            isPhp
                ? "bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-sky-500/15"
                : "bg-gradient-to-br from-violet-500/15 via-sky-500/10 to-emerald-500/15"
        } dark:border-zinc-800`}>
            <div className="text-center">
                <div className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-zinc-950/90 px-3 py-1.5 font-mono text-xs text-zinc-100 shadow-lg backdrop-blur">
                    <span className="text-zinc-500">$</span>
                    <span>{isPhp ? "composer require" : "npm install"}</span>
                    <span className="text-violet-300">{pkg.name}</span>
                </div>
                <div className="mt-3 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    {isPhp ? "PHP package" : "infrastructure"}
                </div>
            </div>
        </div>
    );
}
