import { useEffect, useMemo, useState } from "react";
import {
    Badge,
    Button,
    Callout,
    Card,
    CheckboxGroup,
    Heading,
    Input,
    NumberField,
    Table,
    Tabs,
    Text,
    useTheme,
} from "@particle-academy/react-fancy";
import { CodeEditor } from "@particle-academy/fancy-code";
import { DocViewer, type Doc, type DocViewerLayout } from "@particle-academy/last-word-ui";
import { DemoFrame } from "../shared/DemoFrame";
import {
    QUOTE_DEFAULTS,
    QUOTE_LIMITS,
    QUOTE_MODELS,
    TEMPLATES,
    inspectTemplate,
    money,
    quoteUrl,
    renderInBrowser,
    sameJson,
    type QuoteInput,
    type QuoteModel,
    type QuoteResponse,
    type TemplateWriter,
} from "./quote";

/**
 * Three sections from one quote: Templates (fancy-template, the files), Viewers
 * (last-word-ui's DocViewer) and Formulas (fancy-formula's pricing trace).
 *
 * The server prices the inputs and returns the data; the browser renders the
 * Word/PDF template from it with fancy-template's TypeScript leg and draws the
 * pages with DocViewer. The download buttons ask the server for the files,
 * written by fine-print (PDF), last-word (DOCX) and holy-sheet (XLSX).
 */

/** Counts browser renders, so the viewer remounts on a new document (see the DocViewer key). */
let renders = 0;

type Fetch = { status: "idle" | "loading" | "ready" | "error"; response: QuoteResponse | null; error: string | null };

const FORMULA_LABELS: Record<string, string> = {

    seat_qty: "seat-months",
    retainer_hours_qty: "hours",
};

export function QuoteStudio({ input, onInput }: { input: QuoteInput; onInput: (next: QuoteInput) => void }) {
    const [fetched, setFetched] = useState<Fetch>({ status: "idle", response: null, error: null });
    const [templateTab, setTemplateTab] = useState<TemplateWriter>("last-word");
    const [layout, setLayout] = useState<DocViewerLayout | null>(null);
    const editorTheme = useTheme().resolved === "dark" ? "dark" : "light";
    const inspections = useMemo(() => ({ "last-word": inspectTemplate("last-word"), "holy-sheet": inspectTemplate("holy-sheet") }), []);

    const ready = input.models.length > 0 && input.company.trim() !== "" && input.contact.trim() !== "";

    useEffect(() => {
        if (!ready) return;
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            setFetched((f) => ({ ...f, status: "loading", error: null }));
            fetch(quoteUrl(input, "json"), { headers: { Accept: "application/json" }, signal: controller.signal })
                .then(async (res) => {
                    if (!res.ok) throw new Error(res.status === 429 ? "Too many requests; wait a minute." : `The server said ${res.status}.`);
                    return (await res.json()) as QuoteResponse;
                })
                .then((response) => setFetched({ status: "ready", response, error: null }))
                .catch((error: Error) => {
                    if (error.name !== "AbortError") setFetched((f) => ({ ...f, status: "error", error: error.message }));
                });
        }, 300);
        return () => {
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [input, ready]);

    const rendered = useMemo(() => {
        if (!fetched.response) return null;
        try {
            const doc = renderInBrowser(fetched.response.data);
            renders += 1;
            return { doc, parity: sameJson(doc, fetched.response.document), error: null, version: renders };
        } catch (error) {
            return { doc: null, parity: false, error: (error as Error).message, version: renders };
        }
    }, [fetched.response]);

    const set = <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => onInput({ ...input, [key]: value });
    const num = (key: "seats" | "hours" | "months") => (value: number | null) =>
        set(key, value === null ? QUOTE_DEFAULTS[key] : Math.min(QUOTE_LIMITS[key].max, Math.max(QUOTE_LIMITS[key].min, Math.round(value))));

    const trace = fetched.response?.trace ?? [];

    return (
        <>
            <section id="templates" className="feature-section docs-site__anchor">
                <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                    Templates: one quote, three files
                </Heading>
                <Text as="p" color="muted" className="feature-section__intro">
                    fancy-template fills a JSON template with data: {"{{ tokens }}"} with filters such as money and date,{" "}
                    <code className="feature-code">$each</code> for a row per line item, and{" "}
                    <code className="feature-code">$spread</code> for a whole section per pricing model. The same template is
                    written as a PDF by fine-print and as a Word file by last-word; a second template writes the workbook.
                </Text>
            </section>

            <DemoFrame
                id="documents-quote"
                label="A branded quote from a template"
                status="Live · this server + your browser"
                caption="Change the client or the pricing models: the server prices it, your browser renders the template and draws the pages below. Download any format; nothing you type is stored."
            >
                <div className="docs-quote">
                    <div className="docs-quote__form" data-documents-quote-form="">
                        <Input
                            label="Client company"
                            value={input.company}
                            onValueChange={(v) => set("company", v.slice(0, QUOTE_LIMITS.text))}
                            required
                        />
                        <Input
                            label="Contact name"
                            value={input.contact}
                            onValueChange={(v) => set("contact", v.slice(0, QUOTE_LIMITS.text))}
                            required
                        />
                        <CheckboxGroup<QuoteModel>
                            label="Pricing models (one section each)"
                            list={QUOTE_MODELS.map((m) => ({ value: m.value, label: m.label, description: m.description }))}
                            value={input.models}
                            onValueChange={(models) => set("models", QUOTE_MODELS.map((m) => m.value).filter((v) => models.includes(v)))}
                            error={input.models.length === 0 ? "Pick at least one." : undefined}
                        />
                        <div className="docs-quote__numbers">
                            <NumberField label="Seats" value={input.seats} onValueChange={num("seats")} min={1} max={5000} step={1} disabled={!input.models.includes("usage")} />
                            <NumberField label="Hours a month" value={input.hours} onValueChange={num("hours")} min={1} max={160} step={1} disabled={!input.models.includes("retainer")} />
                            <NumberField label="Months" value={input.months} onValueChange={num("months")} min={1} max={24} step={1} disabled={!input.models.includes("retainer")} />
                        </div>

                        <div className="docs-quote__downloads">
                            <Text as="span" size="sm" weight="semibold">
                                Download
                            </Text>
                            <div className="docs-quote__buttons">
                                <Button href={quoteUrl(input, "pdf")} download icon="file-text" color="blue" disabled={!ready} data-documents-quote-download="pdf">
                                    PDF
                                </Button>
                                <Button href={quoteUrl(input, "docx")} download icon="file-type" disabled={!ready} data-documents-quote-download="docx">
                                    Word
                                </Button>
                                <Button href={quoteUrl(input, "xlsx")} download icon="sheet" disabled={!ready} data-documents-quote-download="xlsx">
                                    Excel
                                </Button>
                            </div>
                            <Text as="p" size="sm" color="muted">
                                fine-print writes the PDF with the site's Geist font embedded; last-word the .docx; holy-sheet the .xlsx,
                                with a cover sheet, a summary and a sheet per pricing model.
                            </Text>
                        </div>
                    </div>

                    <div className="docs-quote__template">
                        <div className="docs-demo__label">
                            <Text as="span" size="sm" weight="semibold">
                                The template
                            </Text>
                            <Badge
                                color={inspections[templateTab].ok ? "green" : "red"}
                                variant="soft"
                                data-documents-template-inspect={inspections[templateTab].ok ? "ok" : "issues"}
                            >
                                inspect(): {inspections[templateTab].ok ? "ok" : `${inspections[templateTab].issues.length} issues`}
                            </Badge>
                        </div>
                        <Tabs activeTab={templateTab} onTabChange={(t) => setTemplateTab(t as TemplateWriter)} variant="pills">
                            <Tabs.List className="docs-demo__formats">
                                <Tabs.Tab value="last-word">{TEMPLATES["last-word"].file}</Tabs.Tab>
                                <Tabs.Tab value="holy-sheet">{TEMPLATES["holy-sheet"].file}</Tabs.Tab>
                            </Tabs.List>
                        </Tabs>
                        <Text as="p" size="sm" color="muted">
                            Writes {TEMPLATES[templateTab].writes.join(" and ")}. Look for <code className="feature-code">$each</code>{" "}
                            and <code className="feature-code">$spread</code>.
                        </Text>
                        <div className="docs-demo__editor">
                            <CodeEditor key={templateTab} value={TEMPLATES[templateTab].source} language="json" theme={editorTheme} readOnly minHeight={300} maxHeight={420}>
                                <CodeEditor.Panel />
                            </CodeEditor>
                        </div>
                        {rendered && (
                            <Badge color={rendered.parity ? "green" : "amber"} variant="soft" data-documents-quote-parity={rendered.parity ? "same" : "differs"}>
                                {rendered.parity
                                    ? "TypeScript and PHP renders are identical"
                                    : "The TypeScript and PHP renders differ"}
                            </Badge>
                        )}
                    </div>
                </div>
            </DemoFrame>

            <section id="viewers" className="feature-section docs-site__anchor">
                <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                    Viewers: the pages, in the browser
                </Heading>
                <Text as="p" color="muted" className="feature-section__intro">
                    last-word-ui's DocViewer draws last-word JSON as the pages it prints on: the paper size and margins from the
                    document, page breaks from measured content, the letterhead on page one, the running header and footer with
                    live page numbers, and tables that keep their shading and borders. Nothing is converted to PDF to show it.
                </Text>
            </section>

            <DemoFrame
                id="documents-viewer"
                label="last-word-ui DocViewer"
                status={layout ? `${layout.pages} pages` : "Live demo"}
                caption="This is the quote above, rendered in your browser by fancy-template's TypeScript leg and drawn by DocViewer. It updates as you change the quote."
            >
                <div className="docs-viewer" aria-live="polite">
                    {!ready && <Callout color="amber">Fill in the client and pick at least one pricing model.</Callout>}
                    {fetched.status === "error" && <Callout color="red">{fetched.error}</Callout>}
                    {rendered?.error && <Callout color="red">{rendered.error}</Callout>}
                    {rendered?.doc ? (
                        <div className="docs-viewer__pages" data-documents-viewer="">
                            {/* Keyed per render: last-word-ui 0.6.0 reuses its previous pagination when
                                `doc` changes shape and throws on a table with fewer rows. */}
                            <DocViewer key={rendered.version} doc={rendered.doc as unknown as Doc} fit="width" maxScale={0.9} onLayout={setLayout} filename="quote" />
                        </div>
                    ) : (
                        ready && fetched.status !== "error" && <Text color="muted">Pricing the quote...</Text>
                    )}
                </div>
            </DemoFrame>

            <section id="formulas" className="feature-section docs-site__anchor">
                <Heading as="h2" size="lg" weight="semibold" className="feature-display">
                    Formulas: prices with their reasons
                </Heading>
                <Text as="p" color="muted" className="feature-section__intro">
                    A pricing agent should not do quote maths in the model. fancy-formula evaluates spreadsheet formulas with Google
                    Sheets semantics, deterministically, and returns a trace of what each one read, including which price break a
                    lookup matched. Every amount in the quote above comes from these formulas, in integer cents.
                </Text>
            </section>

            <DemoFrame id="documents-formulas" label="fancy-formula pricing trace" status="Live · this server">
                <div className="docs-formulas" data-documents-formulas="">
                    {trace.length === 0 ? (
                        <Text color="muted">{ready ? "Evaluating..." : "Pick a pricing model to price the quote."}</Text>
                    ) : (
                        <Card variant="outlined" padding="none">
                            <Table>
                                <Table.Head>
                                    <Table.Row>
                                        <Table.Column label="Name" />
                                        <Table.Column label="Formula" />
                                        <Table.Column label="Value" />
                                        <Table.Column label="Why" />
                                    </Table.Row>
                                </Table.Head>
                                <Table.Body>
                                    {trace.map((row) => (
                                        <Table.Row key={row.name} data-formula={row.name}>
                                            <Table.Cell>
                                                <code className="feature-code">{row.name}</code>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <code className="docs-formulas__formula">{row.formula}</code>
                                            </Table.Cell>
                                            <Table.Cell>{FORMULA_LABELS[row.name] ? `${row.value.toLocaleString("en-US")} ${FORMULA_LABELS[row.name]}` : money(row.value)}</Table.Cell>
                                            <Table.Cell>
                                                {row.matched
                                                    ? `${input.seats} seats matched the break from ${row.matched.values[0]} seats: ${money(Number(row.matched.values[1]))} a seat`
                                                    : ""}
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </Card>
                    )}
                    <Text as="p" size="sm" color="muted">
                        Seat price breaks: 1-49 seats $12.50, 50-99 $11.00, 100-499 $9.75, 500-999 $8.40, 1,000 and more $7.20 per seat
                        per month. Try 49, 50 and 500 seats.
                    </Text>
                </div>
            </DemoFrame>
        </>
    );
}
