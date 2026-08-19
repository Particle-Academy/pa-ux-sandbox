import type { ComponentDoc } from "./types";
import { useState } from "react";
import { Drawing } from "@particle-academy/fancy-whiteboard";
import "@particle-academy/fancy-whiteboard/styles.css";

type Stroke = { id: string; points: { x: number; y: number }[]; color: string; size: number };

function DrawingDemo() {
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    return (
        <div className="relative h-44 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <Drawing
                strokes={strokes}
                onStrokeStart={(stroke) => setStrokes((s) => [...s, stroke as Stroke])}
                onStrokePoint={(id, point) =>
                    setStrokes((s) =>
                        s.map((str) => (str.id === id ? { ...str, points: [...str.points, point] } : str)),
                    )
                }
                color="#8b5cf6"
                size={3}
            />
        </div>
    );
}

export const whiteboardDrawingDoc: ComponentDoc = {
    intro: (
        <p>
            Freeform pen layer. Fully controlled — the parent owns the
            <code>strokes</code> array. The component invokes
            <code>onStrokeStart</code> when a new pointer-down begins,
            <code>onStrokePoint</code> for each sample during the stroke, and
            <code>onStrokeEnd</code> when the user lifts the pointer.
        </p>
    ),
    examples: [
        {
            name: "Click + drag to draw",
            description: "The parent stores strokes in state. This demo keeps it in memory; real apps would persist to the whiteboard's data layer.",
            render: () => <DrawingDemo />,
            code: `const [strokes, setStrokes] = useState<Stroke[]>([]);

<Drawing
    strokes={strokes}
    onStrokeStart={(stroke) => setStrokes((s) => [...s, stroke])}
    onStrokePoint={(id, point) =>
        setStrokes((s) =>
            s.map((str) => (str.id === id ? { ...str, points: [...str.points, point] } : str)),
        )
    }
    color="#8b5cf6"
    size={3}
/>`,
        },
        {
            name: "Custom color + thickness",
            description: "Drive `color` and `size` from your own toolbar selection.",
            render: () => (
                <div className="relative h-32 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                    <Drawing strokes={[]} color="#ef4444" size={6} />
                </div>
            ),
            code: `const [color, setColor] = useState("#ef4444");
const [size, setSize] = useState(6);

<Drawing strokes={strokes} color={color} size={size} … />`,
        },
        {
            name: "Disabled",
            description: "Set `enabled={false}` to render existing strokes but stop new input.",
            render: () => (
                <div className="relative h-24 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                    <Drawing strokes={[]} enabled={false} />
                </div>
            ),
            code: `<Drawing strokes={strokes} enabled={false} />`,
        },
    ],
    props: [
        { name: "strokes", type: `Stroke[]`, default: "—", description: "The full stroke list. Controlled — the parent owns this." },
        { name: "onStrokeStart", type: `(stroke: Stroke) => void`, default: "—", description: "Called when the user starts a new stroke." },
        { name: "onStrokePoint", type: `(id: string, point: Point) => void`, default: "—", description: "Called for every sample during a stroke. Append to the active stroke's points." },
        { name: "onStrokeEnd", type: `(stroke: Stroke) => void`, default: "—", description: "Called when the user lifts the pointer." },
        { name: "color", type: `string`, default: `"#3b82f6"`, description: "Default stroke color." },
        { name: "size", type: `number`, default: `3`, description: "Default stroke thickness in px." },
        { name: "width", type: `number`, default: `auto-measured`, description: "SVG canvas width." },
        { name: "height", type: `number`, default: `auto-measured`, description: "SVG canvas height." },
        { name: "enabled", type: `boolean`, default: `true`, description: "Accept new strokes. When false, existing strokes still render." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the SVG element." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles on the SVG element." },
    ],
};
