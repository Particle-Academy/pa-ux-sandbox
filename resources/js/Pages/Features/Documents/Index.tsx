import { useMemo, useState } from "react";
import { Badge, Button, Callout, Card, Heading, Tabs, Text, useTheme } from "@particle-academy/react-fancy";
import { CodeEditor } from "@particle-academy/fancy-code";
import { DemoFrame } from "../shared/DemoFrame";
import { FeatureCta } from "../shared/FeatureCta";
import { FeatureHero } from "../shared/FeatureHero";
import { FeatureShell } from "../shared/FeatureShell";
import { FeatureTour } from "../shared/FeatureTour";
import { HowItFits } from "../shared/HowItFits";
import { InstallSteps } from "../shared/InstallSteps";
import { PackagesGrid } from "../shared/PackagesGrid";
import type { FeatureMember, FeaturePageProps } from "../shared/types";
import { DOCUMENTS_TOUR } from "./content";
import {
    check,
    filenameFor,
    FORMATS,
    formatBytes,
    jsonToMarkdown,
    markdownToJson,
    readBack,
    write,
    type DocFormat,
} from "./generate";
import { DOCX_SEED, MARKDOWN_SEED, PPTX_SEED, pretty } from "./seeds";

/**
 * /features/documents: the Documents micro-site.
 *
 * Identity: a document "dossier". Serif display type, ink-blue, and the four
 * product families shown as file tabs with their own extension colour, since
 * this Feature is four products that share one way of working.
 *
 * The demo runs the installed npm writers in the browser (./generate.ts):
 * last-word for .docx and dark-slide for .pptx. The agent's JSON is editable
 * beside the result; validate / describe / lint run on every keystroke, and
 * the generated file is read back with the same package's reader.
 */

const FAMILIES = [
    { slug: "holy-sheet", name: "Holy Sheet", ext: "xlsx", tone: "sheet" },
    { slug: "dark-slide", name: "Dark Slide", ext: "pptx", tone: "slide" },
    { slug: "last-word", name: "Last Word", ext: "docx", tone: "word" },
    { slug: "fine-print", name: "FinePrint", ext: "pdf", tone: "print" },
] as const;

const SEEDS: Record<DocFormat, string> = { docx: pretty(DOCX_SEED), pptx: pretty(PPTX_SEED) };

type Output = { format: DocFormat; name: string; size: number; readBack: string } | { format: DocFormat; error: string };

export default function DocumentsFeature({ feature, versions }: FeaturePageProps) {
    const [format, setFormat] = useState<DocFormat>("docx");
    const [sources, setSources] = useState<Record<DocFormat, string>>(SEEDS);
    const [markdown, setMarkdown] = useState(MARKDOWN_SEED);
    const [output, setOutput] = useState<Output | null>(null);

    const json = sources[format];
    const result = useMemo(() => check(format, json), [format, json]);
    const valid = result.parseError === null && result.errors.length === 0;
    const meta = FORMATS[format];
    const editorTheme = useTheme().resolved === "dark" ? "dark" : "light";

    const setJson = (next: string) => {
        setSources((prev) => ({ ...prev, [format]: next }));
        setOutput(null);
    };

    const generate = () => {
        try {
            const bytes = write(format, json);
            const name = filenameFor(format, json);
            const blob = new Blob([bytes.slice()], { type: meta.mime });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = name;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            setOutput({ format, name, size: bytes.length, readBack: readBack(format, bytes) });
        } catch (error) {
            setOutput({ format, error: (error as Error).message });
        }
    };

    const fromMarkdown = () => {
        setFormat("docx");
        setSources((prev) => ({ ...prev, docx: markdownToJson(markdown) }));
        setOutput(null);
    };

    const toMarkdown = () => {
        if (valid && format === "docx") setMarkdown(jsonToMarkdown(json));
    };

    // InstallSteps lists the Node writers (registry data), the runtime this demo uses.
    const nodeWriters = feature.members.filter((m: FeatureMember) => m.language === "Node / TypeScript");

    return (
        <FeatureShell feature={feature}>
            <div className="docs-site">
                <FeatureHero
                    feature={feature}
                    eyebrow="Feature · Four file formats"
                    title="Documents agents can write and read"
                    lede="Spreadsheets, decks and Word documents from plain JSON, in PHP, Node and Python, plus PDF in PHP. Every file can be read back into the same model."
                    languages={feature.languages}
                    actions={
                        <Button href="#documents-demo" icon="file-down" color="blue">
                            Generate a file below
                        </Button>
                    }
                >
                    <ul className="docs-tabs" aria-label="The four product families">
                        {FAMILIES.map((family) => (
                            <li key={family.slug} className="docs-tab" data-tone={family.tone}>
                                <span className="docs-tab__ext">.{family.ext}</span>
                                <span className="docs-tab__name">{family.name}</span>
                            </li>
                        ))}
                    </ul>
                </FeatureHero>

                <div id="documents-demo" className="docs-site__anchor">
                    <DemoFrame
                        id="documents"
                        label="Generate a file in your browser"
                        caption="Edit the JSON on the left: validate, describe and lint run as you type. Download writes the file with the npm package in this page, then reads it back with that package's reader."
                    >
                        <div className="docs-demo">
                            <Tabs
                                activeTab={format}
                                onTabChange={(tab) => {
                                    setFormat(tab as DocFormat);
                                    setOutput(null);
                                }}
                                variant="pills"
                            >
                                <Tabs.List className="docs-demo__formats">
                                    <Tabs.Tab value="docx">Word · .docx</Tabs.Tab>
                                    <Tabs.Tab value="pptx">PowerPoint · .pptx</Tabs.Tab>
                                </Tabs.List>
                            </Tabs>

                            <div className="docs-demo__grid">
                                <div className="docs-demo__pane">
                                    <div className="docs-demo__label">
                                        <Text as="span" size="sm" weight="semibold">
                                            Agent JSON
                                        </Text>
                                        <code className="feature-code">{meta.package}</code>
                                    </div>
                                    <div className="docs-demo__editor" data-documents-json={format}>
                                        <CodeEditor
                                            key={format}
                                            value={json}
                                            onChange={setJson}
                                            language="javascript"
                                            theme={editorTheme}
                                            minHeight={360}
                                            maxHeight={460}
                                        >
                                            <CodeEditor.Panel />
                                        </CodeEditor>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="md"
                                        icon="rotate-ccw"
                                        onClick={() => setJson(SEEDS[format])}
                                        disabled={json === SEEDS[format]}
                                    >
                                        Reset the JSON
                                    </Button>
                                </div>

                                <div className="docs-demo__pane" aria-live="polite">
                                    <div className="docs-demo__label">
                                        <Text as="span" size="sm" weight="semibold">
                                            What the Agent says
                                        </Text>
                                        <Badge color={valid ? "green" : "red"} variant="soft" data-documents-status={valid ? "valid" : "invalid"}>
                                            {valid ? "valid" : result.parseError ? "not JSON" : `${result.errors.length} schema error${result.errors.length === 1 ? "" : "s"}`}
                                        </Badge>
                                    </div>

                                    {result.parseError && <Callout color="red">JSON.parse: {result.parseError}</Callout>}

                                    {result.errors.length > 0 && (
                                        <Callout color="red">
                                            <ul className="docs-demo__problems">
                                                {result.errors.slice(0, 6).map((e, i) => (
                                                    <li key={`${e.path}-${i}`}>
                                                        <code className="feature-code">{e.path || "/"}</code> {e.message}
                                                    </li>
                                                ))}
                                            </ul>
                                        </Callout>
                                    )}

                                    {result.description && (
                                        <Card variant="muted" padding="sm">
                                            <Text as="div" size="sm" color="muted" className="docs-demo__caption">
                                                Agent.describe()
                                            </Text>
                                            <pre className="docs-demo__pre" data-documents-describe="">{result.description}</pre>
                                        </Card>
                                    )}

                                    {format === "pptx" && valid && (
                                        <Card variant="muted" padding="sm">
                                            <Text as="div" size="sm" color="muted" className="docs-demo__caption">
                                                Agent.lint()
                                            </Text>
                                            {result.lint.length === 0 ? (
                                                <Text as="p" size="sm">No layout problems found.</Text>
                                            ) : (
                                                <ul className="docs-demo__problems">
                                                    {result.lint.map((f, i) => (
                                                        <li key={`${f.path}-${i}`}>
                                                            <code className="feature-code">{f.path}</code> {f.message}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </Card>
                                    )}

                                    <Button color="blue" icon="download" onClick={generate} disabled={!valid} data-documents-download="">
                                        Download {filenameFor(format, json)}
                                    </Button>

                                    {output && output.format === format && "error" in output && (
                                        <Callout color="red">The writer refused it: {output.error}</Callout>
                                    )}
                                    {output && output.format === format && "readBack" in output && (
                                        <Card variant="outlined" padding="sm" className="docs-demo__result" data-documents-result="">
                                            <Text as="p" size="sm" weight="semibold">
                                                Wrote {output.name}, {formatBytes(output.size)}
                                            </Text>
                                            <Text as="div" size="sm" color="muted" className="docs-demo__caption">
                                                Read back with Agent.read(), then described
                                            </Text>
                                            <pre className="docs-demo__pre">{output.readBack}</pre>
                                        </Card>
                                    )}
                                </div>
                            </div>

                            <section className="docs-bridge" aria-labelledby="docs-bridge-title">
                                <div className="docs-demo__label">
                                    <Heading as="h2" size="sm" weight="semibold" id="docs-bridge-title">
                                        The markdown bridge
                                    </Heading>
                                    <code className="feature-code">fromMarkdown / toMarkdown</code>
                                </div>
                                <Text as="p" size="sm" color="muted">
                                    Last Word turns markdown into its document model and back. Convert this into the Word JSON
                                    above, or pull the current Word JSON out as markdown.
                                </Text>
                                <div className="docs-demo__editor">
                                    <CodeEditor value={markdown} onChange={setMarkdown} language="markdown" theme={editorTheme} minHeight={160} maxHeight={260}>
                                        <CodeEditor.Panel />
                                    </CodeEditor>
                                </div>
                                <div className="docs-bridge__actions">
                                    <Button icon="arrow-up" onClick={fromMarkdown} data-documents-from-markdown="">
                                        Markdown to Word JSON
                                    </Button>
                                    <Button variant="ghost" icon="arrow-down" onClick={toMarkdown} disabled={!(valid && format === "docx")}>
                                        Word JSON to markdown
                                    </Button>
                                </div>
                            </section>

                            <Callout color="blue" icon={null}>
                                This page writes Word and PowerPoint because those Node writers are what the showcase installs.
                                Holy Sheet's Node writer (<code className="feature-code">@particle-academy/holy-sheet</code>)
                                writes .xlsx the same way, and FinePrint is a PHP package, so neither runs in this demo.
                            </Callout>
                        </div>
                    </DemoFrame>
                </div>

                <FeatureTour
                    title="What it does"
                    intro="Four product families, one way of working: an agent emits JSON, the package checks it, writes the file and reads files back."
                    items={DOCUMENTS_TOUR}
                />

                <HowItFits
                    members={feature.members}
                    bridges={feature.bridges}
                    intro="Pick the package for the runtime you are in; the schema is the same in each. Holy Sheet, Dark Slide and Last Word each have a PHP, Node and Python mirror, and FinePrint is PHP."
                />
                <InstallSteps
                    members={nodeWriters}
                    versions={versions}
                    title="Install a Node writer"
                    intro="Holy Sheet, Dark Slide and Last Word for Node. The demo above runs the last two; the PHP and Python mirrors are listed below."
                />
                <PackagesGrid members={feature.members} versions={versions} />

                <FeatureCta
                    title="Hand your agent a file format"
                    body="Start with the format you need. Each package page has the install command for every language and the full schema."
                    primary={{ label: "Last Word package", href: "/packages/last-word" }}
                    secondary={{ label: "Dark Slide package", href: "/packages/dark-slide" }}
                />
            </div>
        </FeatureShell>
    );
}
