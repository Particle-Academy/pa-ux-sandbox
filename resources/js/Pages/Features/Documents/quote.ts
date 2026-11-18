import { inspect, render, validateData } from "@particle-academy/fancy-template";
import lastWordTemplateSource from "../../../../documents/quote.last-word.json?raw";
import holySheetTemplateSource from "../../../../documents/quote.holy-sheet.json?raw";

/**
 * The quote demo's engine room, kept free of React so
 * tests/js/features-documents.test.ts can drive it in Node.
 *
 * The templates are the SAME files the server renders
 * (resources/documents/quote.*.json). The server prices the quote with
 * fancy-formula (PHP) and returns the data; this file renders the Word/PDF
 * template from that data with fancy-template's TypeScript leg, so the preview
 * needs no second round trip, and compares the result with the PHP leg's render
 * of the same template and data.
 */

export type QuoteModel = "fixed" | "retainer" | "usage";

export const QUOTE_MODELS: Array<{ value: QuoteModel; label: string; description: string }> = [
    { value: "fixed", label: "Fixed-fee build", description: "One price for an agreed scope" },
    { value: "retainer", label: "Monthly care retainer", description: "Hours a month, times months" },
    { value: "usage", label: "Platform licence", description: "Seats, priced by volume breaks" },
];

export type QuoteInput = {
    company: string;
    contact: string;
    models: QuoteModel[];
    seats: number;
    hours: number;
    months: number;
};

export const QUOTE_DEFAULTS: QuoteInput = {
    company: "Example Corp",
    contact: "Jordan Lee",
    models: ["fixed", "retainer", "usage"],
    seats: 120,
    hours: 20,
    months: 6,
};

/** The bounds the server's Form Request enforces, mirrored for the inputs. */
export const QUOTE_LIMITS = {
    text: 80,
    seats: { min: 1, max: 5000 },
    hours: { min: 1, max: 160 },
    months: { min: 1, max: 24 },
} as const;

export type TraceRow = {
    name: string;
    formula: string;
    value: number;
    matched: { row: number; values: Array<number> } | null;
};

export type QuoteResponse = {
    data: Record<string, unknown>;
    document: Record<string, unknown>;
    trace: TraceRow[];
};

export const TEMPLATES = {
    "last-word": { file: "quote.last-word.json", source: lastWordTemplateSource, writes: ["PDF (fine-print)", "DOCX (last-word)"] },
    "holy-sheet": { file: "quote.holy-sheet.json", source: holySheetTemplateSource, writes: ["XLSX (holy-sheet)"] },
} as const;

export type TemplateWriter = keyof typeof TEMPLATES;

export function template(writer: TemplateWriter): unknown {
    return JSON.parse(TEMPLATES[writer].source);
}

/** fancy-template's static check, as the TS leg reports it. */
export function inspectTemplate(writer: TemplateWriter) {
    return inspect(template(writer));
}

/** The query string the server's quote routes take. Only what differs from nothing is sent. */
export function quoteQuery(input: QuoteInput): string {
    const params = new URLSearchParams();
    params.set("company", input.company.slice(0, QUOTE_LIMITS.text));
    params.set("contact", input.contact.slice(0, QUOTE_LIMITS.text));
    for (const model of input.models) params.append("models[]", model);
    params.set("seats", String(clamp(input.seats, QUOTE_LIMITS.seats)));
    params.set("hours", String(clamp(input.hours, QUOTE_LIMITS.hours)));
    params.set("months", String(clamp(input.months, QUOTE_LIMITS.months)));
    return params.toString();
}

export function quoteUrl(input: QuoteInput, format: "json" | "pdf" | "docx" | "xlsx", extra = ""): string {
    const path = format === "json" ? "/features/documents/quote" : `/features/documents/quote.${format}`;
    return `${path}?${quoteQuery(input)}${extra}`;
}

/** Render the Word/PDF template in the browser from the server's priced data. */
export function renderInBrowser(data: Record<string, unknown>): Record<string, unknown> {
    const errors = validateData(template("last-word"), data);
    if (errors.length > 0) {
        throw new Error(`Data does not fit the template: ${errors.map((e) => `${e.path} ${e.code}`).join(", ")}`);
    }
    return render(template("last-word"), data) as Record<string, unknown>;
}

/** Order-insensitive for object keys, exact for everything else. */
export function sameJson(a: unknown, b: unknown): boolean {
    return stable(a) === stable(b);
}

function stable(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
    if (value && typeof value === "object") {
        const entries = Object.entries(value as Record<string, unknown>).sort(([x], [y]) => (x < y ? -1 : x > y ? 1 : 0));
        return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(",")}}`;
    }
    return JSON.stringify(value);
}

function clamp(n: number, range: { min: number; max: number }): number {
    if (!Number.isFinite(n)) return range.min;
    return Math.min(range.max, Math.max(range.min, Math.round(n)));
}

/** Integer cents as dollars, for the pricing trace. */
export function money(cents: number): string {
    return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
