/**
 * Shared fixtures for the fancy-slides + dark-slide showcase components.
 *
 * Both `ComponentPreviews.tsx` (per-component mini tile on /packages/{slug})
 * and `ComponentDemo.tsx` (full Preview tab on /packages/{slug}/{component})
 * import from here so the tile is a faithful miniature of what the user sees
 * when they click into the detail page. The transition feels continuous —
 * "this is the same demo, just bigger."
 *
 * Naming convention:
 *   `CANONICAL_X` — a single piece of demo data used by component X.
 *   `*_SLIDE` / `*_DECK` — fancy-slides Schema instances.
 *   `*_IMAGE_SRC` — image URL.
 *   `*_SHAPES` — slide composed entirely of shape elements.
 */

import type { Deck, SlideData } from "@particle-academy/fancy-slides";
import { defaultTheme } from "@particle-academy/fancy-slides";

// ── Slide (the shared single-slide renderer) ──────────────────────────────

export const CANONICAL_SLIDE: SlideData = {
    id: "canonical",
    layout: "title-content",
    elements: [
        {
            id: "h",
            type: "text",
            x: 0.08, y: 0.08, w: 0.84, h: 0.16,
            content: "Composable slide schema",
            format: "plain",
            style: { fontSize: 44, weight: "semibold" },
        },
        {
            id: "body",
            type: "text",
            x: 0.08, y: 0.3, w: 0.55, h: 0.55,
            content: "- Coords are **0..1** fractions\n- Themes swap fonts + colors\n- One renderer powers viewer, editor, thumbnails",
            format: "markdown",
            style: { fontSize: 22, lineHeight: 1.6 },
        },
        {
            id: "accent",
            type: "shape",
            shape: "rounded-rect",
            x: 0.68, y: 0.32, w: 0.24, h: 0.48,
            fill: "rgba(139,92,246,0.12)",
            stroke: "#8B5CF6",
            strokeWidth: 3,
            radius: 16,
        },
        {
            id: "accent-label",
            type: "text",
            x: 0.68, y: 0.5, w: 0.24, h: 0.12,
            content: "JSON",
            format: "plain",
            style: { fontSize: 48, weight: "bold", align: "center", color: "#581c87" },
        },
    ],
    background: { gradient: "linear-gradient(135deg, #faf5ff 0%, #ffffff 60%)" },
    notes: "Open with the schema bullets. The JSON accent on the right grounds the audience in the file format before we walk through the editor.",
};

// ── Deck (used by SlideViewer, PresenterView, DeckEditor) ─────────────────

export const CANONICAL_DECK: Deck = {
    id: "canonical-deck",
    title: "Showcase deck",
    theme: defaultTheme,
    slides: [
        CANONICAL_SLIDE,
        {
            id: "s2",
            layout: "title-content",
            elements: [
                {
                    id: "h2", type: "text",
                    x: 0.08, y: 0.08, w: 0.84, h: 0.14,
                    content: "Why Human+ UX",
                    format: "plain",
                    style: { fontSize: 36, weight: "semibold" },
                },
                {
                    id: "b2", type: "text",
                    x: 0.08, y: 0.28, w: 0.84, h: 0.6,
                    content: "- Agents and humans share the same UI\n- Components are **authorable** and **inhabitable**\n- Bridges expose typed tools; no Playwright scraping",
                    format: "markdown",
                    style: { fontSize: 22, lineHeight: 1.7 },
                },
            ],
            notes: "Walk through the three bullets. Pause after `inhabitable` to set up the bridge example.",
        },
        {
            id: "s3",
            layout: "title",
            elements: [
                {
                    id: "thanks", type: "text",
                    x: 0.1, y: 0.4, w: 0.8, h: 0.2,
                    content: "Thanks",
                    format: "plain",
                    style: { fontSize: 80, weight: "bold", align: "center" },
                },
            ],
            background: { gradient: "linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%)" },
        },
    ],
};

// ── TextElement canonical sample (markdown demo, no inline code so it
// renders consistently inside Slide + tile-size containers) ──────────────

export const CANONICAL_TEXT_SLIDE: SlideData = {
    id: "canonical-text",
    elements: [
        {
            id: "t",
            type: "text",
            x: 0.06, y: 0.14, w: 0.88, h: 0.72,
            content: "## Markdown headings\n\nInline **bold** and *italic* spans.\n\n- list item one\n- list item **two**",
            format: "markdown",
            style: { fontSize: 22, lineHeight: 1.5 },
        },
    ],
    background: { color: "#ffffff" },
};

// ── ImageElement canonical sample ─────────────────────────────────────────

export const CANONICAL_IMAGE_SRC = "https://placehold.co/600x400/8b5cf6/ffffff?text=image";

export const CANONICAL_IMAGE_SLIDE: SlideData = {
    id: "canonical-image",
    elements: [
        {
            id: "img",
            type: "image",
            x: 0.06, y: 0.06, w: 0.88, h: 0.88,
            src: CANONICAL_IMAGE_SRC,
            fit: "cover",
        },
    ],
    background: { color: "#ffffff" },
};

// ── ShapeElement canonical sample — three shapes wired with a connector so
// the composition reads as "input → process → output" at any size. ────────

export const CANONICAL_SHAPES_SLIDE: SlideData = {
    id: "canonical-shapes",
    elements: [
        {
            id: "left",
            type: "shape",
            shape: "rect",
            x: 0.08, y: 0.25, w: 0.24, h: 0.5,
            fill: "rgba(139,92,246,0.18)",
            stroke: "#8B5CF6",
            strokeWidth: 2,
        },
        {
            id: "arrow",
            type: "shape",
            shape: "arrow",
            x: 0.34, y: 0.42, w: 0.32, h: 0.16,
            stroke: "#8B5CF6",
            strokeWidth: 3,
        },
        {
            id: "right",
            type: "shape",
            shape: "ellipse",
            x: 0.68, y: 0.25, w: 0.24, h: 0.5,
            fill: "rgba(34,197,94,0.18)",
            stroke: "#22c55e",
            strokeWidth: 2,
        },
    ],
    background: { color: "#ffffff" },
};

// ── dark-slide canonical sample code (used by SyntaxHighlighter demos) ───
//
// Plain string — no template-literal interpolation tricks. Both the tile and
// the detail page render this exact string with the same color mapping.

export const CANONICAL_HIGHLIGHTED_CODE = "const greet = (name) => 'Hello, ' + name;\n// returns a friendly string";

/**
 * Pre-tokenized output of `CANONICAL_HIGHLIGHTED_CODE` for JS/TS. Avoids
 * shipping the SyntaxHighlighter helper to the browser just to render two
 * cards. Each token is `{ text, kind }` with `kind` ∈
 * `keyword | string | comment | number | builtin | punctuation | plain`.
 */
export const CANONICAL_HIGHLIGHTED_TOKENS: Array<{ text: string; kind: string }> = [
    { kind: "keyword", text: "const" },
    { kind: "plain", text: " greet " },
    { kind: "punctuation", text: "=" },
    { kind: "plain", text: " " },
    { kind: "punctuation", text: "(" },
    { kind: "plain", text: "name" },
    { kind: "punctuation", text: ")" },
    { kind: "plain", text: " " },
    { kind: "punctuation", text: "=" },
    { kind: "plain", text: "> " },
    { kind: "string", text: "'Hello, '" },
    { kind: "plain", text: " " },
    { kind: "punctuation", text: "+" },
    { kind: "plain", text: " name" },
    { kind: "punctuation", text: ";" },
    { kind: "plain", text: "\n" },
    { kind: "comment", text: "// returns a friendly string" },
];

export const HIGHLIGHT_KIND_COLOR: Record<string, string> = {
    keyword: "text-violet-300",     // C084FC
    string: "text-emerald-300",     // 86EFAC
    comment: "text-slate-400",      // 64748B
    number: "text-amber-300",       // FBBF24
    builtin: "text-cyan-300",       // 67E8F9
    punctuation: "text-slate-300",  // CBD5E1
    plain: "text-slate-100",        // F8FAFC
};

// ── dark-slide PptxWriter coverage matrix (used by tile + detail) ─────────

export const PPTX_WRITER_COVERAGE: Array<{ label: string; check: boolean; note?: string }> = [
    { label: "text", check: true },
    { label: "image", check: true },
    { label: "shape", check: true },
    { label: "table", check: true },
    { label: "code", check: true },
    { label: "chart", check: false, note: "v0.4" },
];

// ── dark-slide PptxReader round-trip facts (used by tile + detail) ────────

export const PPTX_READER_ROUNDTRIP: string[] = [
    "tables → columns + rows",
    "gradients → linear-gradient()",
    "images → data: URIs",
    "inline **bold** / `code` spans",
];
