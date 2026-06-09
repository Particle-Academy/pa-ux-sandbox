import { Head, Link } from "@inertiajs/react";
import { Badge, Card, Heading, Text } from "@particle-academy/react-fancy";
import { useState } from "react";
import { Layout } from "../Layout";

type Pkg = {
    slug: string;
    name: string;
    tagline: string;
    language: string;
    components_count: number;
    core: boolean;
};

/**
 * Companion packages — composer deps the sandbox monorepo develops against
 * (laravel-catalog, laravel-fms, etc.) but aren't part of the Fancy UI
 * showcase narrative. Rendered as a compact footnote below the main grid.
 */
type Companion = {
    slug: string;
    name: string;
    tagline: string;
    language: string;
    core: boolean;
    composer: string | null;
    packagist: string | null;
    npm: string | null;
    repoUrl: string;
    packagistUrl: string | null;
    npmUrl: string | null;
    issuesUrl: string;
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
    "fancy-3d-babylon",
    "fancy-artboard",
    "fancy-inertia",
    "fancy-slides",
    "agent-integrations",
    "fancy-diff",
    "fancy-pixel",
    "fancy-3d-three",
]);

export default function PackagesIndex({ packages, companions = [] }: { packages: Pkg[]; companions?: Companion[] }) {
    const corePkgs = packages.filter((p) => p.core);
    const gridPkgs = packages.filter((p) => !p.core);
    const coreCompanions = companions.filter((c) => c.core);
    const otherCompanions = companions.filter((c) => !c.core);
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

            <FancyCore pkgs={corePkgs} companions={coreCompanions} />

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {gridPkgs.map((pkg) => (
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

            {otherCompanions.length > 0 && <CompanionPackages companions={otherCompanions} />}
        </Layout>
    );
}

/**
 * Fancy Core — the minimal stack to build a normal web application: UI
 * components (react-fancy), the Inertia bridge (fancy-inertia), and server-state
 * (fancy-query). Lifted out of the grid into a highlighted band at the top so
 * newcomers know what to reach for first.
 */
function FancyCore({ pkgs, companions }: { pkgs: Pkg[]; companions: Companion[] }) {
    if (pkgs.length === 0 && companions.length === 0) {
        return null;
    }
    return (
        <div className="mt-6 overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-sky-50 p-5 shadow-sm dark:border-violet-900/50 dark:from-violet-950/40 dark:via-zinc-950 dark:to-sky-950/20">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Heading level={2} size="md" className="!text-zinc-900 dark:!text-zinc-100">Fancy Core</Heading>
                <Badge color="violet" size="sm">the essentials</Badge>
                <Text size="sm" className="!text-zinc-600 dark:!text-zinc-300">
                    everything you need to build a normal web app — components, the Inertia bridge, and server-state
                </Text>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {pkgs.map((p) => (
                    <Link key={p.slug} href={`/packages/${p.slug}`} className="block">
                        <Card className="group h-full overflow-hidden transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg dark:hover:border-violet-700">
                            <PackageHero pkg={p} />
                            <Card.Body>
                                <div className="flex items-start justify-between gap-2">
                                    <Heading level={3} size="sm" className="!font-mono !text-zinc-900 dark:!text-zinc-100">{p.name}</Heading>
                                    <Badge color="sky" size="sm">{p.language}</Badge>
                                </div>
                                <Text size="sm" className="mt-2 line-clamp-2 !text-zinc-600 dark:!text-zinc-300">{p.tagline}</Text>
                                <Text size="xs" className="mt-3 !font-mono !text-violet-600 dark:!text-violet-300">
                                    {p.components_count} component{p.components_count === 1 ? "" : "s"} · Explore →
                                </Text>
                            </Card.Body>
                        </Card>
                    </Link>
                ))}
                {companions.map((c) => (
                    <Link key={c.slug} href={`/packages/${c.slug}`} className="block">
                        <Card className="group h-full overflow-hidden transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg dark:hover:border-violet-700">
                            <CoreHooksHero />
                            <Card.Body>
                                <div className="flex items-start justify-between gap-2">
                                    <Heading level={3} size="sm" className="!font-mono !text-zinc-900 dark:!text-zinc-100">{c.name}</Heading>
                                    <Badge color="zinc" size="sm" variant="soft">hooks</Badge>
                                </div>
                                <Text size="sm" className="mt-2 line-clamp-2 !text-zinc-600 dark:!text-zinc-300">{c.tagline}</Text>
                                <Text size="xs" className="mt-3 !font-mono !text-violet-600 dark:!text-violet-300">Explore →</Text>
                            </Card.Body>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}

/** Code-snippet hero for the hooks-only Core member (fancy-query). */
function CoreHooksHero() {
    return (
        <div className="grid aspect-[16/10] place-items-center overflow-hidden border-b border-zinc-100 bg-gradient-to-br from-violet-500/15 via-sky-500/10 to-emerald-500/15 dark:border-zinc-800">
            <pre className="rounded-md border border-white/15 bg-zinc-950/90 px-3 py-2 text-left font-mono text-[10px] leading-relaxed text-zinc-100 shadow-lg">
                <span className="text-sky-300">const</span> {"{ data } = "}
                <span className="text-violet-300">useFancyQuery</span>({"\n"}
                {"  "}[<span className="text-emerald-300">"leaderboard"</span>],{"\n"}
                {"  () => api.get("}<span className="text-emerald-300">"/api/leaderboard"</span>{"),\n"}
                );
            </pre>
        </div>
    );
}

function CompanionPackages({ companions }: { companions: Companion[] }) {
    return (
        <section className="mt-16 border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <Heading level={2} size="sm" className="!text-zinc-700 dark:!text-zinc-300">
                        Companion packages
                    </Heading>
                    <Text size="sm" className="mt-2 max-w-2xl !text-zinc-500">
                        Headless, no-UI packages developed alongside the Fancy UI kit — the agentic document writers (holy-sheet, dark-slide, plus their isomorphic Node/TS ports), the server-state data hooks (fancy-query), and the composer deps the sandbox runs on. No component grid since they render no UI surface; open issues are tracked on GitHub.
                    </Text>
                </div>
            </div>

            <ul className="mt-5 divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
                {companions.map((c) => (
                    <li key={c.slug} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                        <Link
                            href={`/packages/${c.slug}`}
                            className="font-mono text-sm font-medium text-zinc-900 hover:text-violet-600 dark:text-zinc-100 dark:hover:text-violet-300"
                        >
                            {c.name}
                        </Link>
                        <Badge color="indigo" size="sm">{c.language}</Badge>
                        <Link href={`/packages/${c.slug}`} className="min-w-[14rem] flex-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">{c.tagline}</Link>
                        <div className="flex items-center gap-3 text-xs">
                            <Link
                                href={`/packages/${c.slug}`}
                                className="font-medium text-violet-600 hover:text-violet-700 dark:text-violet-300"
                            >
                                Docs →
                            </Link>
                            <a
                                href={c.repoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-zinc-600 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-300"
                            >
                                GitHub →
                            </a>
                            <a
                                href={c.issuesUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-zinc-600 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-300"
                            >
                                Issues →
                            </a>
                            {c.packagistUrl && (
                                <a
                                    href={c.packagistUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-zinc-600 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-300"
                                >
                                    Packagist →
                                </a>
                            )}
                            {c.npmUrl && (
                                <a
                                    href={c.npmUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-zinc-600 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-300"
                                >
                                    npm →
                                </a>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}

function PackageHero({ pkg }: { pkg: Pkg }) {
    const [shotFailed, setShotFailed] = useState(false);
    if (HAS_SHOT.has(pkg.slug) && !shotFailed) {
        return (
            <div className="relative aspect-[16/10] overflow-hidden border-b border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                <img
                    src={`/showcase-shots/${pkg.slug}.png`}
                    alt={`${pkg.name} preview`}
                    className="absolute inset-0 size-full object-cover object-top transition duration-500 group-hover:scale-[1.02]"
                    loading="lazy"
                    onError={() => setShotFailed(true)}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
            </div>
        );
    }
    // Tasteful fallback for packages without a curated "money shot" (or whose
    // shot 404s) — a code-snippet card themed by the package's language.
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
