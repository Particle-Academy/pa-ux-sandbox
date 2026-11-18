import { useMemo, useState } from "react";
import { Link } from "@inertiajs/react";
import { Badge, Button, Callout, Card, Grid, Heading, Icon, Tabs, Text, useTheme } from "@particle-academy/react-fancy";
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
import { BUILT_ON, DOCUMENTS_CAPABILITIES, DOCUMENTS_TOUR } from "./content";
import { QrDemo } from "./QrDemo";
import { QUOTE_DEFAULTS, type QuoteInput } from "./quote";
import { QuoteStudio } from "./QuoteStudio";
import { SignDemo } from "./SignDemo";
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
 * /features/documents: the Documents micro-site. A Feature gathers
 * CAPABILITIES across packages (owner, 2026-11-13), so every package in
 * PackageRegistry's `documents` group is a member and has a section here:
 *
 * - Templates, Viewers, Formulas (./QuoteStudio): a branded quote, priced by
 *   fancy-formula, filled by fancy-template, drawn by last-word-ui's DocViewer
 *   and downloadable as PDF (fine-print), DOCX (last-word) and XLSX
 *   (holy-sheet).
 * - JSON to Word and PowerPoint in the browser (./generate.ts): last-word and
 *   dark-slide's npm writers, with validate / describe / lint as you type.
 * - Codes (./QrDemo): fancy-qr on the server beside react-fancy's QrCode.
 * - E-signing (./SignDemo): fancy-sign-ui's ceremony against an in-page
 *   backend (./sign.ts), so nothing is emailed or stored.
 *
 * Identity: a document "dossier". Serif display type, ink-blue, and the file
 * families shown as tabs with their own extension colour.
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
    const [quote, setQuote] = useState<QuoteInput>(QUOTE_DEFAULTS);

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
    const bySlug = new Map(feature.members.map((m: FeatureMember) => [m.slug, m]));
    // A twin is a member named <slug>-js or <slug>-py: data, not a typed list.
    const twinsOf = (slug: string) => feature.members.filter((m: FeatureMember) => m.slug === `${slug}-js` || m.slug === `${slug}-py`);

    return (
        <FeatureShell feature={feature}>
            <div className="docs-site">
                <FeatureHero
                    feature={feature}
                    eyebrow="Feature · Documents, end to end"
                    title="Documents agents can write, read and get signed"
                    lede="Spreadsheets, decks, Word documents and PDFs from plain JSON, in PHP, Node and Python. Fill templates, price with formulas, add QR codes, show the pages in the browser and collect signatures."
                    languages={feature.languages}
                    actions={
                        <>
                            <Button href="#templates" icon="file-down" color="blue">
                                Generate a quote
                            </Button>
                            <Button href="#signing" variant="ghost" icon="signature">
                                Sign it
                            </Button>
                        </>
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

                <section className="feature-section" aria-labelledby="docs-capabilities-title">
                    <Heading as="h2" size="lg" weight="semibold" className="feature-display" id="docs-capabilities-title">
                        What you can do with documents
                    </Heading>
                    <Grid cols={3} gap="md" className="docs-capabilities">
                        {DOCUMENTS_CAPABILITIES.map((cap) => (
                            <Card key={cap.title} variant="outlined" padding="sm" className="docs-capability" data-documents-capability={cap.title}>
                                <a href={`#${cap.anchor}`} className="docs-capability__title">
                                    <Icon name={cap.icon} />
                                    <Text as="span" weight="semibold">
                                        {cap.title}
                                    </Text>
                                </a>
                                <Text as="p" size="sm" color="muted">
                                    {cap.body}
                                </Text>
                                <div className="docs-capability__chips">
                                    {cap.slugs.map((slug) => {
                                        const member = bySlug.get(slug);
                                        return member ? (
                                            <Link key={slug} href={member.href} data-package-chip={slug}>
                                                <Badge variant="soft" color="blue">
                                                    {member.name} · {member.language}
                                                </Badge>
                                            </Link>
                                        ) : null;
                                    })}
                                    {cap.slugs.flatMap(twinsOf).length > 0 && (
                                        <Text as="span" size="sm" color="muted">
                                            also in
                                        </Text>
                                    )}
                                    {cap.slugs.flatMap(twinsOf).map((twin) => (
                                        <Link key={twin.slug} href={twin.href} data-package-chip={twin.slug}>
                                            <Badge variant="outline" color="zinc">
                                                {twin.language === "Node / TypeScript" ? "Node" : twin.language}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </Grid>
                </section>

                <QuoteStudio input={quote} onInput={setQuote} />

                <section id="documents-demo" className="feature-section docs-site__anchor">
                    <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                        From an agent's JSON, in your browser
                    </Heading>
                    <Text as="p" color="muted" className="feature-section__intro">
                        last-word and dark-slide's Node writers are universal, so they run in this page. Edit the JSON an agent would
                        emit and download the file it writes.
                    </Text>
                </section>
                <div className="docs-site__anchor">
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
                                This panel writes Word and PowerPoint because those Node writers are what the showcase installs.
                                Holy Sheet's Node writer (<code className="feature-code">@particle-academy/holy-sheet</code>)
                                writes .xlsx the same way. The quote above gets its PDF and .xlsx from the PHP packages on this
                                server.
                            </Callout>
                        </div>
                    </DemoFrame>
                </div>

                <section id="codes" className="feature-section docs-site__anchor">
                    <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                        Codes: QR on the server and in the browser
                    </Heading>
                    <Text as="p" color="muted" className="feature-section__intro">
                        fancy-qr encodes QR codes in PHP with no dependencies, as SVG, PNG or a block for a fine-print document,
                        and draws the same symbol as react-fancy's QrCode for the same value, byte for byte.
                    </Text>
                </section>
                <QrDemo />

                <section id="signing" className="feature-section docs-site__anchor">
                    <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                        E-signing: send it, sign it, prove it
                    </Heading>
                    <Text as="p" color="muted" className="feature-section__intro">
                        fancy-sign runs envelopes on Laravel: one-time codes to view and to sign, consent, a hash-chained audit
                        trail, a sealed final PDF and a certificate of completion anyone can verify. fancy-sign-ui is the React side,
                        and the signer's ceremony below is its real component, signing the quote from the Templates section.
                    </Text>
                </section>
                <SignDemo input={quote} />

                <FeatureTour
                    title="What it does"
                    intro="One way of working across every format: an agent emits JSON, the package checks it, writes the file and reads files back."
                    items={DOCUMENTS_TOUR}
                />

                <section className="feature-section" aria-labelledby="docs-built-on-title">
                    <Heading as="h2" size="lg" weight="semibold" className="feature-display" id="docs-built-on-title">
                        Built on
                    </Heading>
                    <Text as="p" color="muted" className="feature-section__intro">
                        Two shared cores sit under the document packages. You get them with the packages that use them.
                    </Text>
                    <Grid cols={2} gap="md">
                        {BUILT_ON.map((core) => {
                            const member = bySlug.get(core.slug);
                            return (
                                <Card key={core.slug} variant="outlined" padding="sm" data-documents-built-on={core.slug}>
                                    <Text as="p" weight="semibold">
                                        {member ? <Link href={member.href}>{member.name}</Link> : core.slug}
                                    </Text>
                                    <Text as="p" size="sm" color="muted">
                                        {core.body}
                                    </Text>
                                </Card>
                            );
                        })}
                    </Grid>
                </section>

                <HowItFits
                    members={feature.members}
                    bridges={feature.bridges}
                    intro="Pick the package for the runtime you are in; the schema is the same in each. Holy Sheet, Dark Slide and Last Word each have a PHP, Node and Python mirror, FinePrint has PHP and Python, and fancy-template ships all three from one package."
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
