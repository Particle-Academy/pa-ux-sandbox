import type { ComponentDoc } from "./types";
import { ShapeElementRenderer, defaultTheme, type ShapeKind } from "@particle-academy/fancy-slides";

const shapes: ShapeKind[] = ["rect", "rounded-rect", "ellipse", "triangle", "line", "arrow"];

export const fancySlidesShapeElementDoc: ComponentDoc = {
    intro: (
        <p>
            SVG-rendered shape primitive — rectangles, rounded rectangles, ellipses,
            triangles, lines, arrows. No deps, no canvas. Stroke width scales with the
            rendered slide width so a 2px line stays at 2px relative to the slide
            regardless of viewport size.
        </p>
    ),
    examples: [
        {
            name: "Shape kinds",
            render: () => (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {shapes.map((shape) => (
                        <div key={shape} className="h-20 rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
                            <ShapeElementRenderer
                                element={{
                                    id: shape,
                                    type: "shape",
                                    shape,
                                    x: 0,
                                    y: 0,
                                    w: 1,
                                    h: 1,
                                    fill: shape === "line" || shape === "arrow" ? "none" : "rgba(139,92,246,0.15)",
                                    stroke: "#8b5cf6",
                                    strokeWidth: 2,
                                }}
                                theme={defaultTheme}
                                slideWidthPx={1920}
                            />
                        </div>
                    ))}
                </div>
            ),
            code: `<ShapeElementRenderer
    element={{
        id: "s",
        type: "shape",
        shape: "rounded-rect",  // or rect, ellipse, triangle, line, arrow
        x: 0.1, y: 0.1, w: 0.8, h: 0.8,
        fill: "rgba(139,92,246,0.15)",
        stroke: "#8b5cf6",
        strokeWidth: 2,
        radius: 16,
    }}
    theme={theme}
    slideWidthPx={slideWidthPx}
/>`,
        },
        {
            name: "Dashed stroke",
            render: () => (
                <div className="grid grid-cols-2 gap-3">
                    <div className="h-24 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                        <ShapeElementRenderer
                            element={{
                                id: "d1",
                                type: "shape",
                                shape: "rect",
                                x: 0,
                                y: 0,
                                w: 1,
                                h: 1,
                                fill: "none",
                                stroke: "#8b5cf6",
                                strokeWidth: 2,
                                dashed: true,
                            }}
                            theme={defaultTheme}
                            slideWidthPx={1920}
                        />
                    </div>
                    <div className="h-24 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
                        <ShapeElementRenderer
                            element={{
                                id: "d2",
                                type: "shape",
                                shape: "ellipse",
                                x: 0,
                                y: 0,
                                w: 1,
                                h: 1,
                                fill: "rgba(34,197,94,0.1)",
                                stroke: "#22c55e",
                                strokeWidth: 3,
                                dashed: true,
                            }}
                            theme={defaultTheme}
                            slideWidthPx={1920}
                        />
                    </div>
                </div>
            ),
            code: `<ShapeElementRenderer
    element={{ ..., dashed: true }}
    theme={theme}
    slideWidthPx={slideWidthPx}
/>`,
        },
    ],
    props: [
        { name: "element", type: `ShapeElement`, default: "—", description: "Shape element model — `{ shape, fill?, stroke?, strokeWidth?, dashed?, radius? }` plus positioning." },
        { name: "theme", type: `Theme`, default: `defaultTheme`, description: "Theme — provides accent-color fallback for `stroke` when absent." },
        { name: "slideWidthPx", type: `number`, default: "—", description: "Rendered slide width in px. Stroke widths scale relative to the theme's design width." },
    ],
};
