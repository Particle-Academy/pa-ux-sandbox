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
import type { PageDoc, PerBreakpoint, StyleProps } from "@particle-academy/fancy-cms-ui";

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

// ── Slide 6 — Native element types (chart + code + table + shapes) ─────────
//
// Demonstrates every non-text/-image element type the DeckEditor renders out
// of the box via `defaultElementRegistry` — a chart (fancy-echarts), a code
// block (fancy-code), a table, and vector shapes. This is what makes the
// Preview a *complete* editor rather than a text/image-only one.

const DATA_SLIDE: SlideData = {
    id: "fancy-data",
    layout: "title-content",
    elements: [
        {
            id: "h",
            type: "text",
            x: 0.04, y: 0.06, w: 0.92, h: 0.1,
            content: "Charts, code, tables — rendered natively",
            format: "plain",
            style: { fontSize: 36, weight: "semibold", align: "center", color: "#0f172a" },
        },
        // decorative accent shape behind the chart
        {
            id: "accent",
            type: "shape",
            shape: "rect",
            x: 0.04, y: 0.2, w: 0.46, h: 0.74,
            fill: "rgba(139,92,246,0.06)",
            radius: 16,
        },
        {
            id: "chart",
            type: "chart",
            x: 0.07, y: 0.24, w: 0.4, h: 0.46,
            option: {
                tooltip: { trigger: "axis" },
                legend: { data: ["Humans", "Agents"], textStyle: { color: "#475569" } },
                xAxis: { type: "category", data: ["Q1", "Q2", "Q3", "Q4"], axisLabel: { color: "#475569" } },
                yAxis: { type: "value", axisLabel: { color: "#475569" } },
                series: [
                    { name: "Humans", type: "bar", data: [38, 42, 50, 61], itemStyle: { color: "#8b5cf6" } },
                    { name: "Agents", type: "bar", data: [12, 24, 40, 58], itemStyle: { color: "#22c55e" } },
                ],
            },
        },
        {
            id: "table",
            type: "table",
            x: 0.07, y: 0.74, w: 0.4, h: 0.2,
            columns: [
                { key: "surface", label: "Surface" },
                { key: "type", label: "Element" },
            ],
            rows: [
                { surface: "Analytics", type: "chart" },
                { surface: "Snippet", type: "code" },
            ],
        },
        {
            id: "code",
            type: "code",
            x: 0.52, y: 0.24, w: 0.44, h: 0.7,
            code: `import { DeckEditor } from "@particle-academy/fancy-slides";
import "@particle-academy/fancy-slides/styles.css";

// Full editor out of the box — chart / code /
// table / shape all render with no extra wiring.
<DeckEditor value={deck} onChange={setDeck} />`,
            language: "typescript",
            codeTheme: "dark",
        },
    ],
    background: { color: "#ffffff" },
    notes: "The DeckEditor renders chart (fancy-echarts), code (fancy-code), table, and vector shapes natively via defaultElementRegistry — no renderElement wiring required. Agents drive these through the same DeckOp stream.",
};

// ── Exports ───────────────────────────────────────────────────────────────

export const CANONICAL_DECK: Deck = {
    id: "fancy-ui-pitch",
    title: "Fancy UI Kit",
    theme: defaultTheme,
    slides: [TITLE_SLIDE, WHY_SLIDE, GALLERY_SLIDE, REACT_FANCY_SLIDE, AGENT_SLIDE, DATA_SLIDE, THANKS_SLIDE],
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

// ── fancy-cms-ui canonical PageDoc (used by tile + detail) ────────────────
//
// One small Stages document — a hero section (heading + copy + CTA button)
// over a three-stat band — authored against the real PageDoc/Node types.
// The flat node map + StyleProps are the package's whole point: the SAME
// JSON drives the Editor demo, the CmsPage render, and the CmsRegion
// subtree extraction, so the grid tile is a faithful miniature of the
// detail-page demos.

export const CMS_HERO_ID = "hero";
export const CMS_STATS_ID = "stats";

const CMS_STAT_STYLE: PerBreakpoint<StyleProps> = {
    base: {
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        radius: { value: 10, unit: "px" },
        padding: { value: 14, unit: "px" },
        textAlign: "center",
        fontSize: { value: 13, unit: "px" },
        fontWeight: 600,
        color: "#334155",
    },
};

export const CMS_DEMO_DOC: PageDoc = {
    id: "showcase-landing",
    seq: 0,
    meta: { title: "Fancy Launch", slug: "/launch", scrollMode: "smooth" },
    theme: { name: "default" },
    breakpoints: ["base", "md", "lg"],
    sections: [CMS_HERO_ID, CMS_STATS_ID],
    nodes: {
        [CMS_HERO_ID]: {
            id: CMS_HERO_ID,
            type: "section",
            parent: null,
            order: "a0",
            props: {},
            layout: "stack",
            style: {
                base: {
                    direction: "column",
                    align: "center",
                    gap: { value: 14, unit: "px" },
                    padding: { value: 44, unit: "px" },
                    background: "linear-gradient(135deg, #ede9fe 0%, #e0f2fe 100%)",
                    textAlign: "center",
                },
            },
        },
        "hero-heading": {
            id: "hero-heading",
            type: "heading",
            parent: CMS_HERO_ID,
            order: "a0",
            props: { content: "Pages humans and agents edit together" },
            style: {
                base: {
                    color: "#0f172a",
                    fontSize: { value: 30, unit: "px" },
                    fontWeight: 800,
                    lineHeight: 1.15,
                    letterSpacing: { value: -0.5, unit: "px" },
                },
            },
        },
        "hero-copy": {
            id: "hero-copy",
            type: "text",
            parent: CMS_HERO_ID,
            order: "a1",
            props: {
                content:
                    "One Stages document — a flat node map with StyleProps — renders in React and PHP, and every edit is a single reducible op.",
            },
            style: {
                base: {
                    color: "#475569",
                    fontSize: { value: 15, unit: "px" },
                    lineHeight: 1.6,
                },
            },
        },
        "hero-cta": {
            id: "hero-cta",
            type: "button",
            parent: CMS_HERO_ID,
            order: "a2",
            props: { label: "Start building", variant: "primary" },
            style: { base: {} },
        },
        [CMS_STATS_ID]: {
            id: CMS_STATS_ID,
            type: "section",
            parent: null,
            order: "a1",
            props: {},
            layout: "grid",
            style: {
                base: {
                    columns: 3,
                    gap: { value: 12, unit: "px" },
                    padding: { value: 24, unit: "px" },
                    background: "#ffffff",
                },
            },
        },
        "stat-ops": {
            id: "stat-ops",
            type: "text",
            parent: CMS_STATS_ID,
            order: "a0",
            props: { content: "Every edit = one PageOp" },
            style: CMS_STAT_STYLE,
        },
        "stat-parity": {
            id: "stat-parity",
            type: "text",
            parent: CMS_STATS_ID,
            order: "a1",
            props: { content: "JS + PHP CSS parity" },
            style: CMS_STAT_STYLE,
        },
        "stat-ids": {
            id: "stat-ids",
            type: "text",
            parent: CMS_STATS_ID,
            order: "a2",
            props: { content: "Flat map, stable ids" },
            style: CMS_STAT_STYLE,
        },
    },
};

// The same document with the hero's content props swapped for { $bind }
// bindings — the cms-page demo renders it twice with two data payloads to
// show the binding swap. Node ids (and therefore the emitted CSS) are
// identical to CMS_DEMO_DOC.

export const CMS_BOUND_DOC: PageDoc = {
    ...CMS_DEMO_DOC,
    id: "showcase-landing-bound",
    nodes: {
        ...CMS_DEMO_DOC.nodes,
        "hero-heading": {
            ...CMS_DEMO_DOC.nodes["hero-heading"],
            props: { content: { $bind: "hero.title" } },
        },
        "hero-copy": {
            ...CMS_DEMO_DOC.nodes["hero-copy"],
            props: { content: { $bind: "hero.tagline" } },
        },
        "hero-cta": {
            ...CMS_DEMO_DOC.nodes["hero-cta"],
            props: { label: { $bind: "hero.cta" }, variant: "primary" },
        },
    },
};

export const CMS_DATA_LAUNCH = {
    hero: {
        title: "Ship day: Fancy CMS is live",
        tagline: "The launch page, filled from the product's own data context.",
        cta: "Read the announcement",
    },
};

export const CMS_DATA_STUDIO = {
    hero: {
        title: "Aurora Studio — spring collection",
        tagline: "Same document, different tenant: only the data payload changed.",
        cta: "Book a visit",
    },
};
