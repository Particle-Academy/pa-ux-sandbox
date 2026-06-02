import { Head, Link } from "@inertiajs/react";
import { useState } from "react";
import { Button, Badge, Breadcrumbs, Card, Heading, Tabs, Text } from "@particle-academy/react-fancy";
import { Layout } from "../Layout";
import { getComponentPreview, GenericPlaceholder } from "./ComponentPreviews";

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
    const [copied, setCopied] = useState<string | null>(null);
    const installCmd = pkg.npm ? `npm install ${pkg.npm}` : pkg.composer ? `composer require ${pkg.composer}` : null;

    const copy = (text: string, key: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(key);
            window.setTimeout(() => setCopied(null), 1200);
        });
    };

    return (
        <Layout>
            <Head title={`${pkg.name} · Fancy UI`} />

            <Breadcrumbs>
                <Breadcrumbs.Item href="/packages">Packages</Breadcrumbs.Item>
                <Breadcrumbs.Item>{pkg.name}</Breadcrumbs.Item>
            </Breadcrumbs>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <Heading level={1} size="xl" className="!font-mono">{pkg.name}</Heading>
                        <Badge color={pkg.language === "PHP" || pkg.language === "PHP/Blade" ? "indigo" : "sky"} size="sm">
                            {pkg.language}
                        </Badge>
                    </div>
                    <Text className="mt-2 max-w-3xl">{pkg.tagline}</Text>
                </div>
                <Button
                    as="a"
                    href={`https://github.com/${pkg.repo}`}
                    target="_blank"
                    rel="noopener"
                    variant="ghost"
                    icon="github"
                >
                    View on GitHub
                </Button>
            </div>

            <Card className="mt-6">
                <div className="px-4 pt-3">
                    <Tabs defaultTab={pkg.npm ? "npm" : "composer"}>
                        <Tabs.List>
                            {pkg.npm && <Tabs.Tab value="npm">npm</Tabs.Tab>}
                            {pkg.npm && <Tabs.Tab value="pnpm">pnpm</Tabs.Tab>}
                            {pkg.npm && <Tabs.Tab value="yarn">yarn</Tabs.Tab>}
                            {pkg.composer && <Tabs.Tab value="composer">composer</Tabs.Tab>}
                        </Tabs.List>
                        <Tabs.Panels>
                            {pkg.npm && (
                                <Tabs.Panel value="npm">
                                    <InstallBlock cmd={`npm install ${pkg.npm}`} onCopy={(t) => copy(t, "npm")} copied={copied === "npm"} />
                                </Tabs.Panel>
                            )}
                            {pkg.npm && (
                                <Tabs.Panel value="pnpm">
                                    <InstallBlock cmd={`pnpm add ${pkg.npm}`} onCopy={(t) => copy(t, "pnpm")} copied={copied === "pnpm"} />
                                </Tabs.Panel>
                            )}
                            {pkg.npm && (
                                <Tabs.Panel value="yarn">
                                    <InstallBlock cmd={`yarn add ${pkg.npm}`} onCopy={(t) => copy(t, "yarn")} copied={copied === "yarn"} />
                                </Tabs.Panel>
                            )}
                            {pkg.composer && (
                                <Tabs.Panel value="composer">
                                    <InstallBlock cmd={`composer require ${pkg.composer}`} onCopy={(t) => copy(t, "composer")} copied={copied === "composer"} />
                                </Tabs.Panel>
                            )}
                        </Tabs.Panels>
                    </Tabs>
                </div>
            </Card>

            <div className="mt-6 flex flex-wrap gap-2 text-xs">
                <DocLink href={`https://github.com/${pkg.repo}#readme`} label="README" />
                <DocLink href={`https://github.com/${pkg.repo}/blob/main/CHANGELOG.md`} label="Changelog" />
                {pkg.npm && <DocLink href={`https://www.npmjs.com/package/${pkg.npm}`} label="npm" />}
                {pkg.composer && <DocLink href={`https://packagist.org/packages/${pkg.composer}`} label="Packagist" />}
                <DocLink href={`https://github.com/${pkg.repo}/issues`} label="Issues" />
            </div>

            <Heading level={2} size="lg" className="mt-10">Components</Heading>
            <Text size="sm" className="mt-1 !text-zinc-500">
                {pkg.components.length} component{pkg.components.length === 1 ? "" : "s"} · click any tile for a full demo, source, and install snippet.
            </Text>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pkg.components.map((c) => {
                    const Preview = getComponentPreview(pkg.slug, c.slug);
                    return (
                        <Link key={c.slug} href={`/packages/${pkg.slug}/${c.slug}`} className="block">
                            <Card className="group h-full overflow-hidden transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md dark:hover:border-violet-700">
                                <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
                                    <Text className="!font-mono !text-xs !font-semibold !text-zinc-700 dark:!text-zinc-200">{c.name}</Text>
                                    <Text size="xs" className="!text-violet-600 opacity-0 transition group-hover:opacity-100 dark:!text-violet-300">
                                        Open →
                                    </Text>
                                </div>
                                <div className="flex min-h-[10rem] items-center justify-center overflow-hidden p-4">
                                    {Preview ? <Preview /> : <GenericPlaceholder name={c.name} />}
                                </div>
                                {c.blurb && (
                                    <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
                                        <Text size="xs" className="!text-zinc-500">{c.blurb}</Text>
                                    </div>
                                )}
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </Layout>
    );
}

function InstallBlock({ cmd, onCopy, copied }: { cmd: string; onCopy: (text: string) => void; copied: boolean }) {
    return (
        <div className="mb-3 mt-2 flex items-center gap-3 rounded-md bg-zinc-950 px-3 py-2.5 font-mono text-xs text-zinc-100">
            <span className="text-zinc-500">$</span>
            <code className="flex-1">{cmd}</code>
            <button
                onClick={() => onCopy(cmd)}
                className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-300 hover:bg-zinc-800"
            >
                {copied ? "copied" : "copy"}
            </button>
        </div>
    );
}

function DocLink({ href, label }: { href: string; label: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener"
            className="rounded-md border border-zinc-300 px-2.5 py-1 font-medium text-zinc-600 hover:border-violet-300 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-violet-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
        >
            {label} →
        </a>
    );
}
