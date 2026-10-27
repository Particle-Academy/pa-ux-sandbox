import { describe, expect, it } from "vitest";
import * as lucide from "lucide-react";
import {
    check,
    filenameFor,
    jsonToMarkdown,
    markdownToJson,
    readBack,
    write,
} from "../../resources/js/Pages/Features/Documents/generate";
import { DOCX_SEED, MARKDOWN_SEED, PPTX_SEED, pretty } from "../../resources/js/Pages/Features/Documents/seeds";
import { DOCUMENTS_TOUR } from "../../resources/js/Pages/Features/Documents/content";
import { CMS_TOUR } from "../../resources/js/Pages/Features/Cms/content";

/**
 * The /features/documents demo drives the installed npm writers directly.
 * These run the same calls in Node: the seeds are valid, the bytes are a real
 * OOXML (zip) package, and the package's own reader takes them back.
 */

const isZip = (bytes: Uint8Array) => bytes[0] === 0x50 && bytes[1] === 0x4b; // "PK"

describe.each([
    ["docx", pretty(DOCX_SEED)],
    ["pptx", pretty(PPTX_SEED)],
] as const)("%s", (format, json) => {
    it("seed validates and describes", () => {
        const result = check(format, json);
        expect(result.parseError).toBeNull();
        expect(result.errors).toEqual([]);
        expect(result.description).toBeTruthy();
    });

    it("writes a zip package the reader takes back", () => {
        const bytes = write(format, json);
        expect(isZip(bytes)).toBe(true);
        expect(bytes.length).toBeGreaterThan(1000);
        expect(readBack(format, bytes)).toContain("garden");
    });

    it("reports a JSON syntax error without calling the writer", () => {
        const result = check(format, "{ not json");
        expect(result.parseError).toBeTruthy();
        expect(result.description).toBeNull();
    });

    it("reports schema errors with a path", () => {
        const result = check(format, JSON.stringify(format === "docx" ? { blocks: [{ type: "heading", level: "x" }] } : { slides: "nope" }));
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.description).toBeNull();
    });
});

describe("deck lint", () => {
    it("the seed deck has no layout findings", () => {
        expect(check("pptx", pretty(PPTX_SEED)).lint).toEqual([]);
    });

    it("reports a finding once markdown loses its format", () => {
        const deck = structuredClone(PPTX_SEED) as { slides: { elements: Record<string, unknown>[] }[] };
        delete deck.slides[0].elements[0].format;
        expect(check("pptx", JSON.stringify(deck)).lint.length).toBeGreaterThan(0);
    });
});

describe("markdown bridge", () => {
    it("turns markdown into a valid doc and back", () => {
        const json = markdownToJson(MARKDOWN_SEED);
        expect(check("docx", json).errors).toEqual([]);
        expect(jsonToMarkdown(json)).toContain("**first dry weekend in April**");
    });
});

describe("filenameFor", () => {
    it("derives a safe name from the title", () => {
        expect(filenameFor("docx", pretty(DOCX_SEED))).toBe("Community-garden-spring-plan.docx");
        expect(filenameFor("pptx", "{")).toBe("document.pptx");
    });
});

const pascal = (name: string) =>
    name
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("");

describe("tour icons", () => {
    // react-fancy's <Icon> renders an EMPTY span for a name lucide lacks.
    it.each([...DOCUMENTS_TOUR, ...CMS_TOUR].map((item) => item.icon))("%s is a lucide icon", (name) => {
        const icon = (lucide as Record<string, unknown>)[pascal(name)];
        expect(typeof icon === "function" || (typeof icon === "object" && icon !== null)).toBe(true);
    });

    it("each tour has 3 to 6 items", () => {
        for (const tour of [DOCUMENTS_TOUR, CMS_TOUR]) {
            expect(tour.length).toBeGreaterThanOrEqual(3);
            expect(tour.length).toBeLessThanOrEqual(6);
        }
    });
});
