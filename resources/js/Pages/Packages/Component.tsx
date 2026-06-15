import { Seo } from "@particle-academy/fancy-inertia/seo";
import { useRef, useState, type ReactNode } from "react";
import {
    Button,
    Badge,
    Breadcrumbs,
    Card,
    Heading,
    Tabs,
    Text,
} from "@particle-academy/react-fancy";
import { CodeEditor } from "@particle-academy/fancy-code";
import { Layout } from "../Layout";
import { ComponentDemo } from "./ComponentDemo";
import { ContextCards } from "./ContextCards";
import { useXp } from "../../lib/useXp";
import { getComponentDoc, type ComponentDoc, type ComponentDocExample, type ComponentDocProp } from "./ComponentDocs";

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

/**
 * Awards tinkerer-xp the first time the user actually interacts with a
 * live demo (pointer or keyboard inside the preview), then a lighter
 * "interaction" credit on subsequent interactions. Server-throttled, so
 * this just listens and fires — no debounce needed. Signed-in only
 * (useXp no-ops for guests).
 */
function DemoInteractionTracker({ demo, children }: { demo: string; children: ReactNode }) {
    const xp = useXp();
    const firedFirstUse = useRef(false);

    const onInteract = () => {
        if (!firedFirstUse.current) {
            firedFirstUse.current = true;
            xp.demo(demo, "first-use");
        } else {
            xp.demo(demo, "interaction");
        }
    };

    return (
        <div onPointerDownCapture={onInteract} onKeyDownCapture={onInteract}>
            {children}
        </div>
    );
}

export default function PackagesComponent({ package: pkg, component, usage, context, source }: Props) {
    const importLine = pkg.npm
        ? `import { ${component.name} } from "${pkg.npm}";`
        : `// ${component.name} ships in ${pkg.composer ?? pkg.slug}`;

    const hasSource = source !== null && source.files.length > 0;
    const doc = getComponentDoc(pkg.slug, component.slug);
    const hasDocs = doc !== null;

    return (
        <Layout>
            <Seo
                title={`${component.name} — ${pkg.name}`}
                description={component.blurb ?? `A ${pkg.name} component for Human+ UX — controlled state, stable handles, agent-bridgeable.`}
            />

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
                    <Button
                        as="a"
                        href={source!.registryUrl}
                        target="_blank"
                        rel="noopener"
                        variant="ghost"
                        size="sm"
                        iconTrailing="arrow-right"
                    >
                        Registry JSON
                    </Button>
                )}
            </div>

            <ContextStrip context={context} component={component} pkg={pkg} />

            <div className="mt-6">
                <Tabs defaultTab="preview">
                    <Tabs.List>
                        <Tabs.Tab value="preview">Preview</Tabs.Tab>
                        {hasDocs && <Tabs.Tab value="examples">Examples</Tabs.Tab>}
                        {hasDocs && <Tabs.Tab value="props">Props</Tabs.Tab>}
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
                                    <DemoInteractionTracker demo={`${pkg.slug}/${component.slug}`}>
                                        <ComponentDemo slug={component.slug} name={component.name} pkg={pkg.slug} />
                                    </DemoInteractionTracker>
                                </Card.Body>
                            </Card>
                        </Tabs.Panel>

                        {hasDocs && (
                            <Tabs.Panel value="examples">
                                <ExamplesPanel doc={doc!} />
                            </Tabs.Panel>
                        )}

                        {hasDocs && (
                            <Tabs.Panel value="props">
                                <PropsPanel doc={doc!} component={component} />
                            </Tabs.Panel>
                        )}

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

// ─── Examples gallery (Examples tab) ──────────────────────────────────────

function ExamplesPanel({ doc }: { doc: ComponentDoc }) {
    return (
        <div className="mt-4 space-y-5">
            {doc.intro && (
                <Card>
                    <Card.Body>
                        <Text size="sm" className="!text-zinc-700 dark:!text-zinc-200 [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs dark:[&_code]:bg-zinc-800">
                            {doc.intro}
                        </Text>
                    </Card.Body>
                </Card>
            )}
            {doc.examples.map((ex, i) => (
                <ExampleSection key={ex.name} index={i + 1} example={ex} />
            ))}
        </div>
    );
}

function renderMarkdownInline(text: string): ReactNode[] {
    // Splits "use `Foo` for X" into ["use ", <code>Foo</code>, " for X"].
    const parts: ReactNode[] = [];
    let last = 0;
    const re = /`([^`]+)`/g;
    let m: RegExpExecArray | null;
    let key = 0;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) parts.push(text.slice(last, m.index));
        parts.push(<code key={key++}>{m[1]}</code>);
        last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
}

function ExampleSection({ index, example }: { index: number; example: ComponentDocExample }) {
    const [showCode, setShowCode] = useState(false);
    const [copied, setCopied] = useState(false);

    return (
        <Card>
            <Card.Body className="!p-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
                    <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                            <Text size="xs" className="!font-mono !text-zinc-400">{String(index).padStart(2, "0")}</Text>
                            <Heading level={3} size="sm" className="!text-zinc-900 dark:!text-zinc-100">{example.name}</Heading>
                        </div>
                        {example.description && (
                            <Text
                                size="sm"
                                className="mt-1 max-w-3xl !text-zinc-600 dark:!text-zinc-300 [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[11px] dark:[&_code]:bg-zinc-800"
                            >
                                {typeof example.description === "string"
                                    ? renderMarkdownInline(example.description)
                                    : example.description}
                            </Text>
                        )}
                    </div>
                    <button
                        onClick={() => setShowCode((s) => !s)}
                        className="shrink-0 rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:border-violet-300 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-violet-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                    >
                        {showCode ? "Hide code" : "Show code"}
                    </button>
                </div>

                <div className="grid place-items-center bg-gradient-to-b from-zinc-50/50 to-transparent px-5 py-8 dark:from-zinc-900/30">
                    {example.render()}
                </div>

                {showCode && (
                    <div className="relative border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            onClick={() =>
                                navigator.clipboard.writeText(example.code).then(() => {
                                    setCopied(true);
                                    window.setTimeout(() => setCopied(false), 1200);
                                })
                            }
                            className="absolute right-3 top-3 z-10 rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-0.5 text-[10px] font-medium text-zinc-300 backdrop-blur hover:bg-zinc-800"
                        >
                            {copied ? "copied" : "copy"}
                        </button>
                        <CodeEditor value={example.code} language="tsx" theme="dark" readOnly minHeight={80} maxHeight={500}>
                            <CodeEditor.Panel />
                        </CodeEditor>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}

// ─── Props table (Props tab) ──────────────────────────────────────────────

function PropsPanel({ doc, component }: { doc: ComponentDoc; component: { name: string } }) {
    return (
        <div className="mt-4 space-y-4">
            <Card>
                <Card.Body className="!p-0">
                    <div className="border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
                        <Heading level={3} size="sm" className="!text-zinc-900 dark:!text-zinc-100">
                            <code className="!font-mono">{component.name}</code> props
                        </Heading>
                        <Text size="xs" className="mt-0.5 !text-zinc-500">
                            {doc.props.length} prop{doc.props.length === 1 ? "" : "s"}. Required props are marked.
                        </Text>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-zinc-50/60 text-left text-[10px] uppercase tracking-wider text-zinc-500 dark:bg-zinc-900/50">
                                <tr>
                                    <th className="px-5 py-2 font-semibold">Prop</th>
                                    <th className="px-5 py-2 font-semibold">Type</th>
                                    <th className="px-5 py-2 font-semibold">Default</th>
                                    <th className="px-5 py-2 font-semibold">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {doc.props.map((p) => (
                                    <PropRow key={p.name} prop={p} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card.Body>
            </Card>

            {doc.notes && (
                <Card>
                    <Card.Body>
                        <Text size="xs" className="!font-semibold !uppercase !tracking-wider !text-zinc-500">Notes</Text>
                        <Text
                            size="sm"
                            className="mt-2 !text-zinc-700 dark:!text-zinc-200 [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs dark:[&_code]:bg-zinc-800"
                        >
                            {doc.notes}
                        </Text>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
}

function PropRow({ prop }: { prop: ComponentDocProp }) {
    return (
        <tr className="border-t border-zinc-100 align-top dark:border-zinc-800">
            <td className="px-5 py-3">
                <div className="flex items-baseline gap-2">
                    <code className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">{prop.name}</code>
                    {prop.required && (
                        <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                            required
                        </span>
                    )}
                </div>
            </td>
            <td className="px-5 py-3">
                <code className="break-all font-mono text-xs text-violet-700 dark:text-violet-300">{prop.type}</code>
            </td>
            <td className="px-5 py-3">
                {prop.default ? (
                    <code className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{prop.default}</code>
                ) : (
                    <span className="text-xs text-zinc-400">—</span>
                )}
            </td>
            <td className="px-5 py-3 text-xs text-zinc-600 dark:text-zinc-300 [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[10px] dark:[&_code]:bg-zinc-800">
                {renderMarkdownInline(prop.description)}
            </td>
        </tr>
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
            <div className="mt-6">
                <ContextCards why={context.why} what={context.what} how={context.how} />
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
                    <Button
                        as="a"
                        href="https://github.com/Particle-Academy/pa-ux-sandbox/edit/main/app/Support/ComponentContext.php"
                        target="_blank"
                        rel="noopener"
                        variant="ghost"
                        size="sm"
                        iconTrailing="arrow-right"
                    >
                        Contribute
                    </Button>
                </div>
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
                        <div className="mt-1 overflow-hidden rounded-md">
                            <CodeEditor value={importLine} language="typescript" theme="dark" readOnly lineNumbers={false} minHeight={36} maxHeight={36}>
                                <CodeEditor.Panel />
                            </CodeEditor>
                        </div>
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
            <CodeEditor value={file.content} language={file.language || "tsx"} theme="dark" readOnly minHeight={200} maxHeight={576}>
                <CodeEditor.Panel />
            </CodeEditor>
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
