import type { ComponentDoc } from "./types";
import { Connector } from "@particle-academy/fancy-whiteboard";

export const whiteboardConnectorDoc: ComponentDoc = {
    intro: (
        <p>
            An SVG edge between two world-space points. Connectors don't know about items —
            the host app resolves <code>itemId → point</code>. This keeps the renderer minimal
            and lets you pick the anchor logic that fits (item centers, port locations,
            magnetic edges, …).
        </p>
    ),
    examples: [
        {
            name: "Default",
            render: () => (
                <svg className="h-32 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <Connector from={{ x: 40, y: 40 }} to={{ x: 240, y: 80 }} />
                    <circle cx={40} cy={40} r={6} fill="#64748b" />
                    <circle cx={240} cy={80} r={6} fill="#64748b" />
                </svg>
            ),
            code: `<svg>
    <Connector from={{ x: 40, y: 40 }} to={{ x: 240, y: 80 }} />
</svg>`,
        },
        {
            name: "Styled (color + width + dash)",
            render: () => (
                <svg className="h-32 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <Connector from={{ x: 40, y: 40 }} to={{ x: 240, y: 40 }} color="#8b5cf6" width={3} />
                    <Connector from={{ x: 40, y: 80 }} to={{ x: 240, y: 80 }} color="#ef4444" width={2} dashed />
                </svg>
            ),
            code: `<Connector from={a} to={b} color="#8b5cf6" width={3} />
<Connector from={a} to={b} color="#ef4444" width={2} dashed />`,
        },
    ],
    props: [
        { name: "from", type: `Point`, default: "—", description: "Start point `{ x, y }` in world space. Required." },
        { name: "to", type: `Point`, default: "—", description: "End point `{ x, y }` in world space. Required." },
        { name: "color", type: `string`, default: `"#64748b"`, description: "Stroke color (any CSS color)." },
        { name: "width", type: `number`, default: `2`, description: "Stroke thickness in px." },
        { name: "dashed", type: `boolean`, default: `false`, description: "Render as a dashed line." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the line element." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles on the line element." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Container:</strong> Connector is an SVG element — wrap multiple in a single
            <code>&lt;svg&gt;</code> for batching, or use them inside a Board's existing SVG layer.
        </p>
    ),
};
