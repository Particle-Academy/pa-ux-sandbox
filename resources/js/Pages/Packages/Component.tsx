import { Head } from "@inertiajs/react";
import { useState } from "react";
import {
    Action,
    Badge,
    Breadcrumbs,
    Card,
    Heading,
    Tabs,
    Text,
} from "@particle-academy/react-fancy";
import { Layout } from "../Layout";
import { ComponentDemo } from "./ComponentDemo";

type SourceFile = {
    path: string;
    name: string;
    content: string;
    language: string;
};

type Source = {
    files: SourceFile[];
    dependencies: string[];
    registryDependencies: string[];
    registryUrl: string;
};

type Context = {
    why: string;
    what: string;
    how: string;
};

type Props = {
    package: { slug: string; name: string; npm?: string; composer?: string };
    component: { slug: string; name: string; blurb?: string };
    usage: string | null;
    context: Context | null;
    source: Source | null;
};

export default function PackagesComponent({ package: pkg, component, usage, context, source }: Props) {
    const importLine = pkg.npm
        ? `import { ${component.name} } from "${pkg.npm}";`
        : `// ${component.name} ships in ${pkg.composer ?? pkg.slug}`;

    const hasSource = source !== null && source.files.length > 0;

    return (
        <Layout>
            <Head title={`${component.name} · ${pkg.name}`} />

            <Breadcrumbs>
                <Breadcrumbs.Item href="/packages">Packages</Breadcrumbs.Item>
                <Breadcrumbs.Item href={`/packages/${pkg.slug}`}>{pkg.name}</Breadcrumbs.Item>
                <Breadcrumbs.Item>{component.name}</Breadcrumbs.Item>
            </Breadcrumbs>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <Heading level={1} size="xl">{component.name}</Heading>
                        <Badge color="sky" size="sm">{pkg.name}</Badge>
                    </div>
                    {component.blurb && <Text className="mt-2 max-w-3xl">{component.blurb}</Text>}
                </div>
                {hasSource && (
                    <Action
                        as="a"
                        href={source!.registryUrl}
                        target="_blank"
                        rel="noopener"
                        variant="ghost"
                        size="sm"
                        iconTrailing="arrow-right"
                    >
                        Registry JSON
                    </Action>
                )}
            </div>

            <ContextStrip context={context} component={component} pkg={pkg} />

            <div className="mt-6">
                <Tabs defaultTab="preview">
                    <Tabs.List>
                        <Tabs.Tab value="preview">Preview</Tabs.Tab>
                        <Tabs.Tab value="install">Install</Tabs.Tab>
                        {hasSource && <Tabs.Tab value="source">Source</Tabs.Tab>}
                        {hasSource && (source!.dependencies.length > 0 || source!.registryDependencies.length > 0) && (
                            <Tabs.Tab value="deps">Dependencies</Tabs.Tab>
                        )}
                    </Tabs.List>

                    <Tabs.Panels>
                        <Tabs.Panel value="preview">
                            <Card className="mt-4">
                                <Card.Body>
                                    <ComponentDemo slug={component.slug} name={component.name} pkg={pkg.slug} />
                                </Card.Body>
                            </Card>
                        </Tabs.Panel>

                        <Tabs.Panel value="install">
                            <InstallPanel pkg={pkg} component={component} importLine={importLine} hasSource={hasSource} />
                        </Tabs.Panel>

                        {hasSource && (
                            <Tabs.Panel value="source">
                                <SourcePanel files={source!.files} />
                            </Tabs.Panel>
                        )}

                        {hasSource && (source!.dependencies.length > 0 || source!.registryDependencies.length > 0) && (
                            <Tabs.Panel value="deps">
                                <DepsPanel
                                    npm={source!.dependencies}
                                    registry={source!.registryDependencies}
                                />
                            </Tabs.Panel>
                        )}
                    </Tabs.Panels>
                </Tabs>
            </div>
        </Layout>
    );
}

function ContextStrip({
    context,
    component,
    pkg,
}: {
    context: Context | null;
    component: Props["component"];
    pkg: Props["package"];
}) {
    if (context) {
        return (
            <div className="mt-6 grid gap-3 md:grid-cols-3">
                <ContextCard label="Why" tone="amber" body={context.why} />
                <ContextCard label="What" tone="sky" body={context.what} />
                <ContextCard label="How" tone="emerald" body={context.how} />
            </div>
        );
    }

    return (
        <Card className="mt-6 border-dashed">
            <Card.Body>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <Text size="xs" className="font-semibold uppercase tracking-wider !text-zinc-500">
                            Editorial · Why / What / How
                        </Text>
                        <Text size="sm" className="mt-1 max-w-2xl !text-zinc-600 dark:!text-zinc-300">
                            Long-form context for <code className="font-mono">{component.name}</code> hasn&apos;t been written yet.
                            Contribute one — open a PR to <code className="font-mono">app/Support/ComponentContext.php</code> on
                            the showcase repo and add a <code className="font-mono">{pkg.slug}/{component.slug}</code> entry.
                        </Text>
                    </div>
                    <Action
                        as="a"
                        href="https://github.com/Particle-Academy/pa-ux-sandbox/edit/main/app/Support/ComponentContext.php"
                        target="_blank"
                        rel="noopener"
                        variant="ghost"
                        size="sm"
                        iconTrailing="arrow-right"
                    >
                        Contribute
                    </Action>
                </div>
            </Card.Body>
        </Card>
    );
}

function ContextCard({ label, tone, body }: { label: string; tone: "amber" | "sky" | "emerald"; body: string }) {
    const stripe =
        tone === "amber"
            ? "from-amber-300 to-orange-400"
            : tone === "sky"
                ? "from-sky-300 to-indigo-400"
                : "from-emerald-300 to-teal-400";
    const chip =
        tone === "amber"
            ? "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
            : tone === "sky"
                ? "bg-sky-50 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200"
                : "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200";
    return (
        <Card className="relative h-full overflow-hidden">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stripe}`} />
            <Card.Body>
                <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${chip}`}>
                    {label}
                </span>
                <div
                    className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-zinc-700 dark:[&_code]:bg-zinc-800 dark:[&_code]:text-zinc-200"
                    dangerouslySetInnerHTML={{ __html: body }}
                />
            </Card.Body>
        </Card>
    );
}

function InstallPanel({
    pkg,
    component,
    importLine,
    hasSource,
}: {
    pkg: Props["package"];
    component: Props["component"];
    importLine: string;
    hasSource: boolean;
}) {
    return (
        <div className="mt-4 space-y-4">
            {pkg.npm && (
                <Card>
                    <Card.Header>
                        <Text size="xs" className="font-semibold uppercase tracking-wider !text-zinc-500">
                            Install the package (npm)
                        </Text>
                    </Card.Header>
                    <Card.Body>
                        <Tabs defaultTab="npm">
                            <Tabs.List>
                                <Tabs.Tab value="npm">npm</Tabs.Tab>
                                <Tabs.Tab value="pnpm">pnpm</Tabs.Tab>
                                <Tabs.Tab value="yarn">yarn</Tabs.Tab>
                            </Tabs.List>
                            <Tabs.Panels>
                                <Tabs.Panel value="npm"><CodeBlock cmd={`npm install ${pkg.npm}`} /></Tabs.Panel>
                                <Tabs.Panel value="pnpm"><CodeBlock cmd={`pnpm add ${pkg.npm}`} /></Tabs.Panel>
                                <Tabs.Panel value="yarn"><CodeBlock cmd={`yarn add ${pkg.npm}`} /></Tabs.Panel>
                            </Tabs.Panels>
                        </Tabs>
                        <Text size="xs" className="mt-3 !text-zinc-500">
                            Then import in your code:
                        </Text>
                        <pre className="mt-1 overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs text-zinc-100">{importLine}</pre>
                    </Card.Body>
                </Card>
            )}

            {pkg.composer && (
                <Card>
                    <Card.Header>
                        <Text size="xs" className="font-semibold uppercase tracking-wider !text-zinc-500">
                            Install the package (composer)
                        </Text>
                    </Card.Header>
                    <Card.Body>
                        <CodeBlock cmd={`composer require ${pkg.composer}`} />
                    </Card.Body>
                </Card>
            )}

            {hasSource && (
                <Card>
                    <Card.Header>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <Text size="xs" className="font-semibold uppercase tracking-wider !text-zinc-500">
                                Or copy the source (fancy-ui CLI)
                            </Text>
                            <Badge color="violet" size="sm">vendored</Badge>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <CodeBlock cmd={`npx fancy-ui@latest add ${component.slug}`} />
                        <Text size="xs" className="mt-2 !text-zinc-500">
                            Copies the component source into <code className="font-mono">src/components/fancy/{component.slug}/</code> so
                            you own it and can edit it directly. Use this path when you want to fork the design system. (CLI is on the
                            roadmap — see <a href="/docs/cli" className="underline">docs</a>.)
                        </Text>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
}

function SourcePanel({ files }: { files: SourceFile[] }) {
    const [active, setActive] = useState(0);
    return (
        <Card className="mt-4 overflow-hidden">
            <div className="flex flex-col md:flex-row md:divide-x md:divide-zinc-200 md:dark:divide-zinc-800">
                <div className="border-b border-zinc-200 md:w-56 md:shrink-0 md:border-b-0 dark:border-zinc-800">
                    <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Files</div>
                    <ul className="max-h-96 overflow-auto pb-2 text-xs">
                        {files.map((f, i) => (
                            <li key={f.path}>
                                <button
                                    onClick={() => setActive(i)}
                                    className={`block w-full truncate px-3 py-1.5 text-left font-mono ${
                                        i === active
                                            ? "bg-violet-50 text-violet-900 dark:bg-violet-500/15 dark:text-violet-200"
                                            : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                                    }`}
                                >
                                    {f.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex-1 overflow-hidden">
                    <FileView file={files[active]} />
                </div>
            </div>
        </Card>
    );
}

function FileView({ file }: { file: SourceFile }) {
    const [copied, setCopied] = useState(false);
    const copy = () =>
        navigator.clipboard.writeText(file.content).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
        });

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
                <code className="truncate font-mono text-xs text-zinc-500">{file.path}</code>
                <button
                    onClick={copy}
                    className="rounded border border-zinc-300 px-2 py-0.5 text-[10px] font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                    {copied ? "copied" : "copy"}
                </button>
            </div>
            <pre className="max-h-[36rem] overflow-auto bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100">
                <code>{file.content}</code>
            </pre>
        </div>
    );
}

function DepsPanel({ npm, registry }: { npm: string[]; registry: string[] }) {
    return (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Card>
                <Card.Header>
                    <Text size="xs" className="font-semibold uppercase tracking-wider !text-zinc-500">
                        npm dependencies
                    </Text>
                </Card.Header>
                <Card.Body>
                    {npm.length === 0 ? (
                        <Text size="sm" className="!text-zinc-500">None — only peer deps (react, tailwindcss).</Text>
                    ) : (
                        <ul className="flex flex-wrap gap-1.5">
                            {npm.map((d) => (
                                <li key={d}>
                                    <a
                                        href={`https://www.npmjs.com/package/${d}`}
                                        target="_blank"
                                        rel="noopener"
                                        className="inline-flex rounded-md border border-zinc-300 bg-white px-2 py-1 font-mono text-xs text-zinc-700 hover:border-violet-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                                    >
                                        {d}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card.Body>
            </Card>
            <Card>
                <Card.Header>
                    <Text size="xs" className="font-semibold uppercase tracking-wider !text-zinc-500">
                        Registry dependencies
                    </Text>
                </Card.Header>
                <Card.Body>
                    {registry.length === 0 ? (
                        <Text size="sm" className="!text-zinc-500">None — this component stands alone.</Text>
                    ) : (
                        <ul className="flex flex-wrap gap-1.5">
                            {registry.map((d) => (
                                <li key={d}>
                                    <a
                                        href={`/r/${d}.json`}
                                        target="_blank"
                                        rel="noopener"
                                        className="inline-flex rounded-md border border-zinc-300 bg-white px-2 py-1 font-mono text-xs text-zinc-700 hover:border-violet-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                                    >
                                        {d}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}

function CodeBlock({ cmd }: { cmd: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <div className="flex items-center gap-3 rounded-md bg-zinc-950 px-3 py-2.5 font-mono text-xs text-zinc-100">
            <span className="text-zinc-500">$</span>
            <code className="flex-1">{cmd}</code>
            <button
                onClick={() =>
                    navigator.clipboard.writeText(cmd).then(() => {
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1200);
                    })
                }
                className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-300 hover:bg-zinc-800"
            >
                {copied ? "copied" : "copy"}
            </button>
        </div>
    );
}
