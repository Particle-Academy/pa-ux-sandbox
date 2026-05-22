import type { ComponentDoc } from "./types";
import { Slide, defaultTheme, darkTheme } from "@particle-academy/fancy-slides";
import "@particle-academy/fancy-slides/styles.css";

const exampleSlide = {
    id: "demo",
    layout: "title-content" as const,
    elements: [
        {
            id: "h",
            type: "text" as const,
            x: 0.08,
            y: 0.1,
            w: 0.84,
            h: 0.18,
            content: "The shared Slide renderer",
            format: "plain" as const,
            style: { fontSize: 40, weight: "semibold" as const, color: "#0f172a" },
        },
        {
            id: "shape",
            type: "shape" as const,
            shape: "rounded-rect" as const,
            x: 0.1,
            y: 0.35,
            w: 0.8,
            h: 0.5,
            fill: "rgba(139,92,246,0.1)",
            stroke: "#8b5cf6",
            strokeWidth: 3,
            radius: 16,
        },
        {
            id: "body",
            type: "text" as const,
            x: 0.15,
            y: 0.42,
            w: 0.7,
            h: 0.36,
            content: "Same renderer powers the viewer, editor canvas, and thumbnails. Elements use 0..1 fractions so the layout scales perfectly.",
            format: "plain" as const,
            style: { fontSize: 22, align: "center" as const, lineHeight: 1.5, color: "#1e293b" },
        },
    ],
};

export const fancySlidesSlideDoc: ComponentDoc = {
    intro: (
        <p>
            The single-slide renderer used by every fancy-slides surface — viewer,
            editor canvas, thumbnails, presenter view, the agent bridge's preview tool.
            Resolution-independent: elements position via 0..1 fractions, the slide
            scales to its container while preserving aspect ratio.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Just pass a `slide` and a `theme`. The renderer fills its container at the theme's aspect ratio.",
            render: () => (
                <div className="w-full max-w-2xl rounded-lg shadow">
                    <Slide slide={exampleSlide} theme={defaultTheme} />
                </div>
            ),
            code: `import { Slide, defaultTheme } from "@particle-academy/fancy-slides";

<Slide
    slide={{
        id: "demo",
        layout: "title-content",
        elements: [
            { id: "h", type: "text", x: 0.08, y: 0.1, w: 0.84, h: 0.18, content: "Title" },
            { id: "shape", type: "shape", shape: "rounded-rect", x: 0.1, y: 0.35, w: 0.8, h: 0.5, fill: "#ede9fe" },
        ],
    }}
    theme={defaultTheme}
/>`,
        },
        {
            name: "Pinned width",
            description: "Set `width` to render at a specific size — useful for thumbnails.",
            render: () => (
                <div className="rounded-lg shadow">
                    <Slide slide={exampleSlide} theme={defaultTheme} width={320} />
                </div>
            ),
            code: `<Slide slide={slide} theme={defaultTheme} width={320} />`,
        },
        {
            name: "Dark theme",
            description: "Themes control fonts, colors, aspect ratio, and design width.",
            render: () => (
                <div className="w-full max-w-xl rounded-lg shadow">
                    <Slide slide={exampleSlide} theme={darkTheme} />
                </div>
            ),
            code: `import { Slide, darkTheme } from "@particle-academy/fancy-slides";

<Slide slide={slide} theme={darkTheme} />`,
        },
    ],
    props: [
        { name: "slide", type: `Slide`, default: "—", description: "The slide to render. Required." },
        { name: "theme", type: `Theme`, default: `defaultTheme`, description: "Theme — controls fonts / colors / aspect ratio / design width." },
        { name: "width", type: `number`, default: "auto-measured", description: "Pin the slide to this width in px. When omitted, fills the container and auto-measures." },
        { name: "aspectRatio", type: `number`, default: `theme.aspectRatio`, description: "Override the theme's aspect ratio. Falls back to 16:9." },
        { name: "editing", type: `boolean`, default: `false`, description: "Pass to element renderers — text elements show an editable textarea when true." },
        { name: "onElementContentChange", type: `(elementId, content) => void`, default: "—", description: "Called when a text element's content changes (only when `editing`)." },
        { name: "onElementSelect", type: `(elementId: string | null) => void`, default: "—", description: "Called when an element is clicked — host-driven selection." },
        { name: "selectedElementId", type: `string | null`, default: "—", description: "Element id to render with a focus ring." },
        { name: "renderElement", type: `(element, slideWidthPx) => ReactNode | undefined`, default: "—", description: "Custom renderer for non-built-in element types (or to override built-ins)." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the slide root." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles on the slide root." },
    ],
};
