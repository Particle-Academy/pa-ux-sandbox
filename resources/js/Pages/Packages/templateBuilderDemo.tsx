// /packages/fancy-template-ui/template-builder: the document builder, wired the way
// the package's AGENTS.md tells a host to wire it.
//
//   - a quote template with a letterhead, a heading and a letter with field chips,
//     line items as a repeating section with a page each, and a required-once
//     totals block (a host kind of this app's own);
//   - the EXACT preview: the template goes to this app's server, which renders it
//     with fancy-template (PHP) and writes it with fine-print, and fine-print's own
//     renderer draws the pages (TemplateBuilderPreviewController + PageImages);
//   - the draft view: last-word-ui's DocViewer, in the browser, labelled approximate.
//
// Signing fields (fancy-sign-ui/template's signBlockKinds) join the kinds once that
// release is installed here.
import { useMemo, useState } from "react";
import { DocViewer } from "@particle-academy/last-word-ui";
import {
    TemplateBuilder,
    addBlock,
    applyOp,
    compile,
    createState,
    defineKind,
    orderedBlocks,
    type BlockKind,
    type FieldDef,
    type JsonObject,
    type ListDef,
    type TemplateEnvelope,
} from "@particle-academy/fancy-template-ui";

const FIELDS: FieldDef[] = [
    { label: "Customer name", token: "customer.name", sample: "Ada Lovelace" },
    { label: "Customer company", token: "customer.company", sample: "Analytical Engines Ltd" },
    { label: "Quote number", token: "quote.number", sample: "Q-2042" },
    { label: "Quote total", token: "quote.total", sample: "$3,600.00" },
];

const LISTS: ListDef[] = [
    {
        label: "Line items",
        token: "lines",
        itemFields: [
            { label: "Title", token: "title", sample: "Difference engine" },
            { label: "Description", token: "body", sample: "A calculating machine for polynomial tables." },
            { label: "Amount", token: "amount", sample: "$1,200.00" },
        ],
        sample: [
            { title: "Difference engine", body: "A calculating machine for polynomial tables.", amount: "$1,200.00" },
            { title: "Analytical engine", body: "A general-purpose machine with a mill and a store.", amount: "$2,000.00" },
            { title: "Installation", body: "Delivery, assembly and a week of training.", amount: "$400.00" },
        ],
    },
];

const TOTALS = defineKind({
    kind: "showcase:totals",
    label: "Quote totals",
    icon: "calculator",
    schema: { type: "object", properties: { label: { type: "string", maxLength: 40 } }, required: ["label"] },
    defaults: { label: "Total" },
    required: "once",
    styleable: ["align"],
    render: (props, ctx) => {
        const label: JsonObject = { text: `${String(props.label)}: `, bold: true };
        const total: JsonObject = { text: ctx.fieldToken("quote.total"), bold: true, color: ctx.accent };
        return [{ type: "paragraph", align: "right", runs: [label, total] }];
    },
}) as BlockKind;

const KINDS: BlockKind[] = [TOTALS];
const CTX = { fields: FIELDS, lists: LISTS, kinds: KINDS };

/** The starting quote: built through the package's own core, so it is exactly what the builder would make. */
function starterTemplate(): TemplateEnvelope {
    let s = createState([], KINDS);
    s = applyOp(s, {
        t: "set_page",
        patch: {
            size: "letter",
            accent: "#1F4E79",
            header: { left: [{ text: "Analytical Engines Ltd" }], right: [{ text: "Quote " }, { field: "quote.number" }] },
            footer: { center: [{ text: "Page " }, { page: "page" }, { text: " of " }, { page: "pages" }] },
        },
    }, KINDS);
    s = addBlock(s, { type: "heading", props: { level: 1, runs: [{ text: "Quote " }, { field: "quote.number" }] } }, { index: 0 });
    s = addBlock(s, {
        type: "text",
        props: {
            paras: [
                { type: "paragraph", runs: [{ text: "Dear " }, { field: "customer.name" }, { text: "," }] },
                { type: "paragraph", runs: [{ text: "Thank you for asking. Each item below is on its own page." }] },
            ],
        },
    }, { index: 1 });
    s = addBlock(s, { type: "repeat", props: { list: "lines", pageEach: true } }, { index: 2 });
    const group = orderedBlocks(s).find((n) => n.type === "repeat")!.id;
    s = addBlock(s, { type: "heading", props: { level: 2, runs: [{ field: "item.title" }] } }, { parent: group });
    s = addBlock(s, {
        type: "text",
        props: { paras: [{ type: "paragraph", runs: [{ field: "item.body" }, { text: " Amount: " }, { field: "item.amount", bold: true }] }] },
    }, { parent: group });
    return compile(s, CTX).template;
}

/** Laravel's XSRF-TOKEN cookie, for the preview POST. */
function xsrfToken(): string | null {
    if (typeof document === "undefined") return null;
    const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]!) : null;
}

async function renderPreview(template: TemplateEnvelope, data: Record<string, unknown>) {
    const token = xsrfToken();
    const res = await fetch("/packages/fancy-template-ui/preview", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...(token ? { "X-XSRF-TOKEN": token } : {}) },
        body: JSON.stringify({ template, data }),
    });
    const body = (await res.json()) as { key?: string; count?: number; aspect?: number; code?: string; path?: string; message?: string };
    if (!res.ok || !body.key) {
        throw new Error(body.code ? `${body.code}${body.path ? ` at ${body.path}` : ""}` : (body.message ?? `Preview failed (${res.status})`));
    }
    const key = body.key;
    return {
        count: body.count ?? 1,
        aspectRatio: body.aspect,
        url: (page: number, scale: number) => `/packages/fancy-template-ui/preview/${key}/pages/${page}?scale=${scale}`,
    };
}

export function TemplateBuilderSurface() {
    const initial = useMemo(() => starterTemplate(), []);
    const [template, setTemplate] = useState<TemplateEnvelope>(initial);
    return (
        <div data-package-shot="" className="min-h-[44rem]">
            <TemplateBuilder
                value={template}
                onChange={setTemplate}
                fields={FIELDS}
                lists={LISTS}
                kinds={KINDS}
                renderPreview={renderPreview}
                renderDraft={(doc) => <DocViewer doc={doc as never} />}
                surfaceId="showcase-quote"
            />
        </div>
    );
}
