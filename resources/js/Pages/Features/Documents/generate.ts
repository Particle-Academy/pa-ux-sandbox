import { Agent as LastWord } from "@particle-academy/last-word";
import { Agent as DarkSlide } from "@particle-academy/dark-slide";

/**
 * The Documents demo's engine room: nothing here but calls into the npm
 * writers the showcase installs (`@particle-academy/last-word` and
 * `@particle-academy/dark-slide`), both universal, so they run in the browser.
 * Kept pure (no React, no DOM) so tests/js/features-documents.test.ts can
 * drive it in Node.
 */

export type DocFormat = "docx" | "pptx";

export type Problem = { path: string; message: string };

export type Check = {
    /** JSON that did not parse never reaches a writer. */
    parseError: string | null;
    /** Schema errors from `Agent.validate()`; empty means writable. */
    errors: Problem[];
    /** `Agent.describe()`, when the document validates. */
    description: string | null;
    /** `Agent.lint()` findings (decks only). */
    lint: Problem[];
};

export const FORMATS: Record<DocFormat, { label: string; extension: string; mime: string; package: string }> = {
    docx: {
        label: "Word",
        extension: "docx",
        mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        package: "@particle-academy/last-word",
    },
    pptx: {
        label: "PowerPoint",
        extension: "pptx",
        mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        package: "@particle-academy/dark-slide",
    },
};

/** Parse, validate, describe and (for decks) lint the agent's JSON. */
export function check(format: DocFormat, json: string): Check {
    let value: unknown;
    try {
        value = JSON.parse(json);
    } catch (error) {
        return { parseError: (error as Error).message, errors: [], description: null, lint: [] };
    }

    if (format === "docx") {
        const errors = LastWord.validate(value).map((e) => ({ path: e.path, message: e.message }));
        return {
            parseError: null,
            errors,
            description: errors.length === 0 ? LastWord.describe(value) : null,
            lint: [],
        };
    }

    const errors = DarkSlide.validate(value).map((e) => ({
        path: e.path,
        message: [e.hint, e.expected && `expected ${e.expected}`, e.got && `got ${e.got}`].filter(Boolean).join("; "),
    }));
    if (errors.length > 0) {
        return { parseError: null, errors, description: null, lint: [] };
    }

    return {
        parseError: null,
        errors,
        description: DarkSlide.describe(value),
        lint: DarkSlide.lint(value).map((f) => ({ path: `slide ${f.slide} · ${f.element}`, message: f.message })),
    };
}

/** The file's bytes. Throws the writer's SchemaException on an invalid document. */
export function write(format: DocFormat, json: string): Uint8Array {
    const value: unknown = JSON.parse(json);
    return format === "docx" ? LastWord.toBytes(value) : DarkSlide.toBytes(value);
}

/**
 * Read the bytes back with the same package's READER, and summarise what it
 * found. This is the round trip: the writer's output goes through the reader
 * (the hardened archive path) and comes back as the document model.
 */
export function readBack(format: DocFormat, bytes: Uint8Array): string {
    return format === "docx" ? LastWord.describe(LastWord.read(bytes)) : DarkSlide.describe(DarkSlide.read(bytes));
}

/** last-word's markdown bridge, in both directions. */
export function markdownToJson(markdown: string): string {
    return JSON.stringify(LastWord.fromMarkdown(markdown), null, 2);
}

export function jsonToMarkdown(json: string): string {
    return LastWord.toMarkdown(JSON.parse(json));
}

/** A safe download name from the document's title. */
export function filenameFor(format: DocFormat, json: string): string {
    let title = "";
    try {
        const parsed = JSON.parse(json) as { title?: unknown };
        title = typeof parsed.title === "string" ? parsed.title : "";
    } catch {
        title = "";
    }
    const stem = title.trim().replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "document";
    return `${stem}.${FORMATS[format].extension}`;
}

/** Human-sized byte count. */
export function formatBytes(n: number): string {
    return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}
