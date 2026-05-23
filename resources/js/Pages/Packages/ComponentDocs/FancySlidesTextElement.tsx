import type { ComponentDoc } from "./types";
import { TextElementRenderer, defaultTheme } from "@particle-academy/fancy-slides";

export const fancySlidesTextElementDoc: ComponentDoc = {
    intro: (
        <p>
            Renderer for the <code>text</code> element type. Theme-aware: font size
            scales with the rendered slide width so a 48px font on a design-width
            slide stays at 48px relative to the slide regardless of how big the slide
            is on screen. Read mode renders the content as-is; edit mode swaps in a
            textarea so the host can drive inline editing.
        </p>
    ),
    examples: [
        {
            name: "Markdown (default)",
            description: "`format: \"markdown\"` parses bullets, bold/italic, code spans, links via react-fancy's ContentRenderer.",
            render: () => (
                <div className="h-44 w-full max-w-lg rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <TextElementRenderer
                        element={{
                            id: "demo-md",
                            type: "text",
                            x: 0,
                            y: 0,
                            w: 1,
                            h: 1,
                            content: "**Markdown** renders here.\n\n- Bullets work\n- `inline code` works\n- *emphasis* too",
                            format: "markdown",
                            style: { fontSize: 22, lineHeight: 1.5 },
                        }}
                        theme={defaultTheme}
                        slideWidthPx={1920}
                    />
                </div>
            ),
            code: `<TextElementRenderer
    element={{
        id: "t",
        type: "text",
        x: 0.1, y: 0.2, w: 0.8, h: 0.6,
        content: "**Markdown** renders here.\\n\\n- Bullets work\\n- \\\`inline code\\\` works\\n- *emphasis* too",
        format: "markdown",  // default
        style: { fontSize: 22, lineHeight: 1.5 },
    }}
    theme={theme}
    slideWidthPx={slideWidthPx}
/>`,
        },
        {
            name: "Plain text",
            description: "`format: \"plain\"` skips parsing — newlines preserved via `white-space: pre-wrap`.",
            render: () => (
                <div className="h-24 w-full max-w-lg rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <TextElementRenderer
                        element={{
                            id: "demo-plain",
                            type: "text",
                            x: 0,
                            y: 0,
                            w: 1,
                            h: 1,
                            content: "Theme-aware typography",
                            format: "plain",
                            style: { fontSize: 32, weight: "semibold", align: "center" },
                        }}
                        theme={defaultTheme}
                        slideWidthPx={1920}
                    />
                </div>
            ),
            code: `<TextElementRenderer
    element={{
        id: "t",
        type: "text",
        x: 0.1, y: 0.4, w: 0.8, h: 0.2,
        content: "Theme-aware typography",
        format: "plain",
        style: { fontSize: 32, weight: "semibold", align: "center" },
    }}
    theme={defaultTheme}
    slideWidthPx={slideWidthInPixels}
/>`,
        },
        {
            name: "Style variants",
            render: () => (
                <div className="grid grid-cols-3 gap-3">
                    {([
                        { weight: "normal" as const, label: "normal" },
                        { weight: "semibold" as const, label: "semibold" },
                        { weight: "bold" as const, label: "bold" },
                    ]).map((s) => (
                        <div key={s.label} className="h-20 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                            <TextElementRenderer
                                element={{
                                    id: s.label,
                                    type: "text",
                                    x: 0,
                                    y: 0,
                                    w: 1,
                                    h: 1,
                                    content: s.label,
                                    format: "plain",
                                    style: { fontSize: 28, weight: s.weight, align: "center" },
                                }}
                                theme={defaultTheme}
                                slideWidthPx={1920}
                            />
                        </div>
                    ))}
                </div>
            ),
            code: `// style.weight: "normal" | "medium" | "semibold" | "bold" | number
<TextElementRenderer
    element={{ ..., style: { weight: "bold" } }}
    theme={theme}
    slideWidthPx={slideWidthPx}
/>`,
        },
        {
            name: "Editable",
            description: "Pass `editing` + `onContentChange` to swap in a textarea.",
            render: () => (
                <div className="h-32 w-full max-w-lg rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <TextElementRenderer
                        element={{
                            id: "edit",
                            type: "text",
                            x: 0,
                            y: 0,
                            w: 1,
                            h: 1,
                            content: "Click to edit me",
                            format: "plain",
                            style: { fontSize: 24, align: "left" },
                        }}
                        theme={defaultTheme}
                        slideWidthPx={1920}
                        editing
                        onContentChange={() => {}}
                    />
                </div>
            ),
            code: `<TextElementRenderer
    element={element}
    theme={theme}
    slideWidthPx={slideWidthPx}
    editing
    onContentChange={(c) => ops.updateElement(slideId, element.id, { content: c })}
/>`,
        },
    ],
    props: [
        { name: "element", type: `TextElement`, default: "—", description: "The text element model. Required." },
        { name: "theme", type: `Theme`, default: `defaultTheme`, description: "Theme — provides font-family + base color fallbacks." },
        { name: "slideWidthPx", type: `number`, default: "—", description: "Rendered slide width in px. Used to scale `style.fontSize` relative to the theme's design width." },
        { name: "editing", type: `boolean`, default: `false`, description: "Edit mode — renders a textarea." },
        { name: "onContentChange", type: `(content: string) => void`, default: "—", description: "Called when the user edits content (only in edit mode)." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Format detection:</strong> the default is <code>"markdown"</code>;
            <code>"html"</code> goes through ContentRenderer's sanitized HTML path
            (scripts / iframes / event handlers stripped); <code>"plain"</code> bypasses
            parsing entirely and just renders the raw string with newlines preserved.
        </p>
    ),
};
