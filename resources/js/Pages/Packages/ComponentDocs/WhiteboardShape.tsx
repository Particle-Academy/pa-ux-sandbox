import type { ComponentDoc } from "./types";
import { useState } from "react";
import { Shape, type ShapeItem } from "@particle-academy/fancy-whiteboard";
import "@particle-academy/fancy-whiteboard/styles.css";

function ShapeDemo({ kind, x }: { kind: "rect" | "rounded-rect" | "ellipse" | "diamond" | "triangle"; x: number }) {
    const [item, setItem] = useState<ShapeItem>({
        id: kind,
        kind: "shape" as const,
        shape: kind,
        x,
        y: 20,
        width: 80,
        height: 60,
        fill: "rgba(139,92,246,0.15)",
        stroke: "#8b5cf6",
    });
    return <Shape item={item} onChange={setItem} />;
}

export const whiteboardShapeDoc: ComponentDoc = {
    intro: (
        <p>
            Basic whiteboard primitives — rectangles, ellipses, diamonds, triangles, lines,
            arrows, and text. All shapes share the same bounding-box model
            (<code>x, y, width, height</code>); the <code>shape</code> discriminator picks the
            renderer. Drag-to-move is built in.
        </p>
    ),
    examples: [
        {
            name: "Shape kinds",
            description: "Five common kinds — pass the discriminator via the `item.shape` field.",
            render: () => (
                <div className="relative h-32 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <ShapeDemo kind="rect" x={20} />
                    <ShapeDemo kind="rounded-rect" x={120} />
                    <ShapeDemo kind="ellipse" x={220} />
                    <ShapeDemo kind="diamond" x={320} />
                    <ShapeDemo kind="triangle" x={420} />
                </div>
            ),
            code: `<Shape
    item={{
        id: "s1",
        kind: "shape",
        shape: "rect", // or "rounded-rect", "ellipse", "diamond", "triangle", "line", "arrow", "text"
        x: 20, y: 20, width: 80, height: 60,
        fill: "rgba(139,92,246,0.15)",
        stroke: "#8b5cf6",
    }}
    onChange={setShape}
/>`,
        },
        {
            name: "Selected",
            description: "Drive the focus ring from your selection state.",
            render: () => {
                const [s, setS] = useState<ShapeItem>({
                    id: "sel",
                    kind: "shape" as const,
                    shape: "rounded-rect" as const,
                    x: 30,
                    y: 30,
                    width: 100,
                    height: 60,
                    fill: "rgba(16,185,129,0.2)",
                    stroke: "#10b981",
                });
                return (
                    <div className="relative h-32 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <Shape item={s} onChange={setS} selected onSelect={() => {}} />
                    </div>
                );
            },
            code: `<Shape
    item={shape}
    onChange={setShape}
    selected={selectedId === shape.id}
    onSelect={setSelectedId}
/>`,
        },
    ],
    props: [
        { name: "item", type: `ShapeItem`, default: "—", description: "The shape model — `{ id, type: \"shape\", shape, x, y, width, height, fill, stroke, strokeWidth, … }`. Required." },
        { name: "onChange", type: `(next: ShapeItem) => void`, default: "—", description: "Called after drag / resize." },
        { name: "onSelect", type: `(id: string) => void`, default: "—", description: "Called when the shape is clicked." },
        { name: "selected", type: `boolean`, default: `false`, description: "Draw the focus ring." },
        { name: "readOnly", type: `boolean`, default: `false`, description: "Disable drag and resize affordances." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the wrapper." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles on the wrapper." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Kinds:</strong> <code>rect</code>, <code>rounded-rect</code>,
            <code>ellipse</code>, <code>diamond</code>, <code>triangle</code>, <code>line</code>,
            <code>arrow</code>, <code>text</code>. See <code>SHAPE_KINDS</code> for the source-of-truth list.
        </p>
    ),
};
