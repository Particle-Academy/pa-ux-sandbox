/**
 * Shared fixtures for the fancy-slides + dark-slide showcase components.
 *
 * The canonical deck is a real Fancy UI presentation — 6 slides about the
 * kit, using the screenshots in `public/showcase-shots/`. Both
 * `ComponentPreviews.tsx` (per-component mini tile on /packages/{slug}) and
 * `ComponentDemo.tsx` (full Preview tab on /packages/{slug}/{component})
 * import from here so the tile is a faithful miniature of what the user
 * sees when they click into the detail page. The transition feels
 * continuous — "this is the same demo, just bigger."
 */

import type { Deck, SlideData } from "@particle-academy/fancy-slides";
import { defaultTheme } from "@particle-academy/fancy-slides";

// ── Real Fancy UI screenshots ─────────────────────────────────────────────
//
// Every screenshot is 1400×900 (~14:9, slightly taller than 16:9). Lives in
// `public/showcase-shots/`, served at /showcase-shots/*.png.

const SHOT = (name: string) => `/showcase-shots/${name}.png`;

// ── Slide 1 — title ───────────────────────────────────────────────────────

const TITLE_SLIDE: SlideData = {
    id: "fancy-title",
    layout: "title",
    elements: [
        {
            id: "logo",
            type: "image",
            x: 0.42, y: 0.18, w: 0.16, h: 0.16,
            src: "/showcase-assets/fancy-ui-logo.jpg",
            fit: "contain",
        },
        {
            id: "title",
            type: "text",
            x: 0.08, y: 0.4, w: 0.84, h: 0.18,
            content: "Fancy UI Kit",
            format: "plain",
            style: { fontSize: 96, weight: "bold", align: "center", color: "#0f172a" },
        },
        {
            id: "subtitle",
            type: "text",
            x: 0.08, y: 0.6, w: 0.84, h: 0.1,
            content: "Composable primitives for humans and agents",
            format: "plain",
            style: { fontSize: 28, weight: "normal", align: "center", color: "#64748b" },
        },
        {
            id: "version",
            type: "text",
            x: 0.08, y: 0.85, w: 0.84, h: 0.06,
            content: "v0.6.1 — 12 packages, one design system",
            format: "plain",
            style: { fontSize: 18, align: "center", color: "#94a3b8" },
        },
    ],
    background: { gradient: "radial-gradient(circle at 30% 20%, #ede9fe 0%, #ffffff 60%)" },
    notes: "Open with the kit's mission. Pause on the tagline — 'humans and agents' is the whole pitch. v0.6.1 is the current release.",
};

// ── Slide 2 — Why Human+ UX ───────────────────────────────────────────────

const WHY_SLIDE: SlideData = {
    id: "fancy-why",
    layout: "title-content",
    elements: [
        {
            id: "h",
            type: "text",
            x: 0.08, y: 0.08, w: 0.84, h: 0.14,
            content: "Why Human+ UX",
            format: "plain",
            style: { fontSize: 56, weight: "semibold", color: "#0f172a" },
        },
        {
            id: "body",
            type: "text",
            x: 0.08, y: 0.28, w: 0.84, h: 0.6,
            content:
                "- Agents and humans share the same UI surface\n- Components are **authorable** *and* **inhabitable**\n- Bridges expose typed tools — no Playwright scraping\n- Controlled state means humans + agents drive identical mutations\n- Trust-but-verify hooks for destructive actions",
            format: "markdown",
            style: { fontSize: 24, lineHeight: 1.7, color: "#1e293b" },
        },
    ],
    notes: "Walk through the bullets. Pause after 'inhabitable' — that's the new word. Bridges = MCP tools that wrap controlled state.",
};

// ── Slide 3 — Three-up package gallery ────────────────────────────────────

const GALLERY_SLIDE: SlideData = {
    id: "fancy-gallery",
    layout: "title-content",
    elements: [
        {
            id: "h",
            type: "text",
            x: 0.04, y: 0.06, w: 0.92, h: 0.12,
            content: "Twelve packages, one system",
            format: "plain",
            style: { fontSize: 44, weight: "semibold", align: "center", color: "#0f172a" },
        },
        // react-fancy
        {
            id: "rf-shot", type: "image",
            x: 0.04, y: 0.24, w: 0.3, h: 0.5,
            src: SHOT("react-fancy"), fit: "cover",
        },
        {
            id: "rf-label", type: "text",
            x: 0.04, y: 0.76, w: 0.3, h: 0.06,
            content: "react-fancy", format: "plain",
            style: { fontSize: 22, weight: "semibold", align: "center", color: "#0f172a" },
        },
        {
            id: "rf-tag", type: "text",
            x: 0.04, y: 0.82, w: 0.3, h: 0.06,
            content: "60+ components",
            format: "plain",
            style: { fontSize: 16, align: "center", color: "#64748b" },
        },
        // fancy-flow
        {
            id: "ff-shot", type: "image",
            x: 0.35, y: 0.24, w: 0.3, h: 0.5,
            src: SHOT("fancy-flow"), fit: "cover",
        },
        {
            id: "ff-label", type: "text",
            x: 0.35, y: 0.76, w: 0.3, h: 0.06,
            content: "fancy-flow", format: "plain",
            style: { fontSize: 22, weight: "semibold", align: "center", color: "#0f172a" },
        },
        {
            id: "ff-tag", type: "text",
            x: 0.35, y: 0.82, w: 0.3, h: 0.06,
            content: "Workflow editor",
            format: "plain",
            style: { fontSize: 16, align: "center", color: "#64748b" },
        },
        // fancy-3d
        {
            id: "f3-shot", type: "image",
            x: 0.66, y: 0.24, w: 0.3, h: 0.5,
            src: SHOT("fancy-3d"), fit: "cover",
        },
        {
            id: "f3-label", type: "text",
            x: 0.66, y: 0.76, w: 0.3, h: 0.06,
            content: "fancy-3d", format: "plain",
            style: { fontSize: 22, weight: "semibold", align: "center", color: "#0f172a" },
        },
        {
            id: "f3-tag", type: "text",
            x: 0.66, y: 0.82, w: 0.3, h: 0.06,
            content: "Engine-pluggable — DOM built in",
            format: "plain",
            style: { fontSize: 16, align: "center", color: "#64748b" },
        },
    ],
    background: { color: "#fafafa" },
    notes: "Three of twelve. The full list also includes fancy-echarts, fancy-sheets, fancy-code, fancy-whiteboard, fancy-screens, fancy-inertia, fancy-slides, holy-sheet, agent-integrations.",
};

// ── Slide 4 — react-fancy deep dive (image-heavy, used by ImageElement
// demo too via CANONICAL_IMAGE_* exports below) ──────────────────────────

const REACT_FANCY_SLIDE: SlideData = {
    id: "fancy-react-fancy",
    layout: "title-content",
    elements: [
        {
            id: "shot",
            type: "image",
            x: 0.04, y: 0.06, w: 0.56, h: 0.88,
            src: SHOT("react-fancy"),
            fit: "cover",
        },
        {
            id: "h",
            type: "text",
            x: 0.64, y: 0.1, w: 0.32, h: 0.14,
            content: "react-fancy",
            format: "plain",
            style: { fontSize: 44, weight: "semibold", color: "#0f172a" },
        },
        {
            id: "body",
            type: "text",
            x: 0.64, y: 0.28, w: 0.32, h: 0.62,
            content:
                "## The foundation\n\nKanban, Editor, Calendar, Composer, Pillbox, Toast, Modal — every primitive ships **controlled state** and **stable handles** so agents can drive it.\n\nPackaged for shadcn-style registry copy.",
            format: "markdown",
            style: { fontSize: 18, lineHeight: 1.6, color: "#1e293b" },
        },
    ],
    background: { color: "#ffffff" },
    notes: "react-fancy is the entry point for most consumers. Everything else composes on top.",
};

// ── Slide 5 — Agent integrations ──────────────────────────────────────────

const AGENT_SLIDE: SlideData = {
    id: "fancy-agents",
    layout: "title-content",
    elements: [
        {
            id: "h",
            type: "text",
            x: 0.04, y: 0.08, w: 0.4, h: 0.14,
            content: "Agents drive the same UI",
            format: "plain",
            style: { fontSize: 36, weight: "semibold", color: "#0f172a" },
        },
        {
            id: "body",
            type: "text",
            x: 0.04, y: 0.26, w: 0.4, h: 0.6,
            content:
                "- MCP server runs in the browser tab\n- Each package ships a **bridge** that registers typed tools\n- Whiteboard / Flow / Form / Sheets / Code / Charts / Scene\n- Per-agent undo stack + activity stream\n- One server, multiple transports — in-process or relay",
            format: "markdown",
            style: { fontSize: 18, lineHeight: 1.7, color: "#1e293b" },
        },
        {
            id: "shot",
            type: "image",
            x: 0.48, y: 0.08, w: 0.48, h: 0.84,
            src: SHOT("agent-integrations"),
            fit: "cover",
        },
    ],
    background: { color: "#f8fafc" },
    notes: "agent-integrations is the bridge layer. Each per-package bridge wraps the controlled state in MCP tools. Agents call those tools instead of poking the DOM.",
};

// ── Slide 6 — Thanks ──────────────────────────────────────────────────────

const THANKS_SLIDE: SlideData = {
    id: "fancy-thanks",
    layout: "title",
    elements: [
        {
            id: "thanks",
            type: "text",
            x: 0.1, y: 0.36, w: 0.8, h: 0.18,
            content: "Thanks",
            format: "plain",
            style: { fontSize: 96, weight: "bold", align: "center", color: "#0f172a" },
        },
        {
            id: "cta",
            type: "text",
            x: 0.1, y: 0.58, w: 0.8, h: 0.1,
            content: "particle.academy/fancy",
            format: "plain",
            style: { fontSize: 28, align: "center", color: "#8b5cf6" },
        },
    ],
    background: { gradient: "linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%)" },
    notes: "Q&A here. Common questions: yes the bridges are pluggable, no you don't need every package, license is MIT.",
};

// ── Exports ───────────────────────────────────────────────────────────────

export const CANONICAL_DECK: Deck = {
    id: "fancy-ui-pitch",
    title: "Fancy UI Kit",
    theme: defaultTheme,
    slides: [TITLE_SLIDE, WHY_SLIDE, GALLERY_SLIDE, REACT_FANCY_SLIDE, AGENT_SLIDE, THANKS_SLIDE],
};

/** Default slide for the `Slide` component demo (the deep-dive slide
 *  exercises text + image + headings — visually rich, agent-friendly). */
export const CANONICAL_SLIDE: SlideData = REACT_FANCY_SLIDE;

// ── TextElement canonical sample (markdown-heavy, no images) ──────────────

export const CANONICAL_TEXT_SLIDE: SlideData = {
    id: "canonical-text",
    elements: [
        {
            id: "t",
            type: "text",
            x: 0.06, y: 0.1, w: 0.88, h: 0.8,
            content:
                "## What ships in v0.6.1\n\n- Showcase chrome on **react-fancy** + Inertia\n- *fancy-slides* DeckEditor live in this preview\n- **dark-slide v0.3** — markdown headings + syntax-highlighted code\n- Per-package bridges for every interactive surface",
            format: "markdown",
            style: { fontSize: 22, lineHeight: 1.6, color: "#1e293b" },
        },
    ],
    background: { color: "#ffffff" },
};

// ── ImageElement canonical sample ─────────────────────────────────────────
//
// Real screenshot in a deliberately-tall box so the four `fit` modes look
// dramatically different. The source is 1400×900 (~14:9). The element box
// is roughly 0.45 × 0.85 (in a 16:9 slide → about 0.85:1 aspect, taller than
// wide). With the aspect mismatch:
//   contain    — preserves 14:9, big letterbox top + bottom
//   cover      — preserves 14:9 + crops left/right
//   fill       — stretches into a tall narrow distortion
//   scale-down — same as contain (source > box)

export const CANONICAL_IMAGE_SRC = SHOT("react-fancy");

/** Element box dimensions reused by both the tile and the detail demo. */
export const CANONICAL_IMAGE_BOX = { x: 0.275, y: 0.075, w: 0.45, h: 0.85 } as const;

export const CANONICAL_IMAGE_SLIDE: SlideData = {
    id: "canonical-image",
    elements: [
        {
            id: "img",
            type: "image",
            ...CANONICAL_IMAGE_BOX,
            src: CANONICAL_IMAGE_SRC,
            fit: "cover",
        },
    ],
    background: { color: "#f8fafc" },
};

// ── ShapeElement canonical sample ─────────────────────────────────────────

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

// ── dark-slide canonical sample code ──────────────────────────────────────
//
// Plain string — no template-literal interpolation tricks. Both the tile
// and the detail page render this exact string with the same color mapping.

export const CANONICAL_HIGHLIGHTED_CODE = "const greet = (name) => 'Hello, ' + name;\n// returns a friendly string";

/**
 * Pre-tokenized output of `CANONICAL_HIGHLIGHTED_CODE` for JS/TS. Each
 * token is `{ text, kind }` with `kind` matching the writer's color map.
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
