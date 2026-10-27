import type { FeatureTourItem } from "../shared/FeatureTour";

/**
 * The Documents tour. Each line is checkable against the shipped packages;
 * the source is named beside it (repos holy-sheet*, dark-slide*, last-word*,
 * fine-print).
 */
export const DOCUMENTS_TOUR: FeatureTourItem[] = [
    {
        // holy-sheet/src/Agent.php, dark-slide/src/Agent.php, last-word-js dist Agent, fine-print/src/Agent.php
        icon: "braces",
        title: "One Agent, plain JSON in",
        body: "Each format is a JSON document an agent can emit, and each package exposes the same static Agent: validate and validateAndRepair, describe, a schema to register as a tool, guide() for what a professional file looks like, and toBytes. Sheets, decks and PDFs add lint().",
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
