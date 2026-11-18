import type { FeatureTourItem } from "../shared/FeatureTour";

/**
 * The capabilities the page gathers, each linking to its live section. `slugs`
 * are registry slugs of the packages that provide it; the page shows their
 * Node and Python twins as chips from the Feature's members (a twin is a
 * member named `<slug>-js` or `<slug>-py`), so a newly published twin appears
 * with no edit here. DocumentsFeatureSiteTest checks every documents-group
 * package is named in this list or under BUILT_ON.
 */
export type DocumentsCapability = {
    anchor: string;
    icon: string;
    title: string;
    body: string;
    slugs: string[];
};

export const DOCUMENTS_CAPABILITIES: DocumentsCapability[] = [
    {
        anchor: "templates",
        icon: "file-stack",
        title: "Templates",
        body: "Fill a JSON template with data: tokens and filters, a row per item with $each, a section per item with $spread. One package for PHP, Node and Python.",
        slugs: ["fancy-template"],
    },
    {
        anchor: "templates",
        icon: "file-text",
        title: "PDF",
        body: "Write, read and render PDFs in pure PHP, with a guard on text an agent reads.",
        slugs: ["fine-print"],
    },
    {
        anchor: "documents-demo",
        icon: "file-type",
        title: "Word",
        body: "docx writer and reader on one JSON model, with markdown both ways.",
        slugs: ["last-word"],
    },
    {
        anchor: "documents-demo",
        icon: "presentation",
        title: "Slides",
        body: "pptx writer and reader with a layout lint.",
        slugs: ["dark-slide"],
    },
    {
        anchor: "templates",
        icon: "sheet",
        title: "Spreadsheets",
        body: "xlsx writer and reader with themes, totals and typed columns.",
        slugs: ["holy-sheet"],
    },
    {
        anchor: "viewers",
        icon: "book-open",
        title: "Viewers",
        body: "DocViewer draws last-word JSON as printed pages in React.",
        slugs: ["last-word-ui"],
    },
    {
        anchor: "formulas",
        icon: "sigma",
        title: "Formulas",
        body: "Spreadsheet formulas with Google Sheets semantics and a trace of every lookup.",
        slugs: ["fancy-formula"],
    },
    {
        anchor: "codes",
        icon: "qr-code",
        title: "Codes",
        body: "QR codes on the server as SVG and PNG, identical to react-fancy's QrCode.",
        slugs: ["fancy-qr"],
    },
    {
        anchor: "signing",
        icon: "signature",
        title: "E-signing",
        body: "Envelopes, one-time codes, a hash-chained audit trail and a verifiable certificate.",
        slugs: ["fancy-sign", "fancy-sign-ui"],
    },
];

/** The shared cores the document packages are built on. Internal: nothing to install directly. */
export const BUILT_ON: Array<{ slug: string; body: string }> = [
    { slug: "fancy-doc-commons", body: "The shared pure core for the document and surface packages: one node, tree and operation model." },
    { slug: "fancy-file-commons", body: "The shared pure core for the file packages: editors, viewers, writers and diff." },
];

/**
 * The Documents tour. Each line is checkable against the shipped packages;
 * the source is named beside it (repos holy-sheet*, dark-slide*, last-word*,
 * fine-print).
 */
export const DOCUMENTS_TOUR: FeatureTourItem[] = [
    {
        // holy-sheet/src/Agent.php, dark-slide/src/Agent.php, last-word-js dist Agent, fine-print/src/Agent.php.
        // describe differs: last-word + dark-slide describe(doc): string; holy-sheet describe(path)
        // reads a file (holy-sheet-js agent.ts too); fine-print 0.3.0 has no describe.
        icon: "braces",
        title: "One Agent, plain JSON in",
        body: "Each format is a JSON document an agent can emit, and each package exposes a static Agent: validate and validateAndRepair, a schema to register as a tool, guide() for what a professional file looks like, and toBytes. Last Word and Dark Slide describe() a document as text; Holy Sheet's describe() reads a file back into its schema instead, and FinePrint has no describe. Sheets, decks and PDFs add lint().",
    },
    {
        // PackageFamily: holy-sheet / dark-slide / last-word each have PHP, Node and Python members; dark-slide-js README parity note
        icon: "languages",
        title: "PHP, Node and Python mirrors",
        body: "Holy Sheet, Dark Slide and Last Word each ship for PHP, Node / TypeScript and Python, on the same schema. The Node writers are universal, which is why the demo above runs in your browser. FinePrint is PHP.",
    },
    {
        // last-word-js README (read: .docx, .doc, .odt, .rtf); dark-slide-js README (read is deterministic); holy-sheet CHANGELOG 2.9.2 (XLSX/ODS reads); fine-print README
        icon: "book-open-check",
        title: "Readers as well as writers",
        body: "Files come back into the same model: Last Word reads .docx, legacy .doc, .odt and .rtf; Dark Slide reads .pptx, deterministically; Holy Sheet reads .xlsx and .ods; FinePrint reads PDF text in reading order.",
    },
    {
        // last-word-js README "API" + markdown notes; last-word PHP README; last-word-py agent.py to_markdown/from_markdown
        icon: "file-type",
        title: "Markdown bridges",
        body: "Last Word converts between its document model and GitHub-flavoured markdown in both directions: headings, emphasis, links, nested lists, tables, code and quotes. It is lossy only where markdown has no syntax, such as underline, colour and page breaks.",
    },
    {
        // CHANGELOGs dated 2026-10-26: holy-sheet 2.9.2, holy-sheet-js 2.10.2, dark-slide 0.21.1, dark-slide-js 0.19.1, last-word 0.10.1, last-word-js 0.10.1
        icon: "shield-check",
        title: "Untrusted archives, read safely",
        body: "The PHP and Node releases of 26 October 2026 bound every archive read before allocating: zip bombs, unsafe or duplicate member names, CRC and size mismatches and truncated files are refused with a typed ArchiveRefused, without echoing document content.",
    },
    {
        // fine-print README: reader, active-content report, prompt-injection guard, writer from last-word's model
        icon: "scan-text",
        title: "PDFs with a prompt-injection guard",
        body: "FinePrint parses PDFs in pure PHP, reports active content such as scripts and launch actions without running it, and passes extracted text through a guard that can flag, redact or discard. It writes PDFs from Last Word's JSON model.",
    },
];
