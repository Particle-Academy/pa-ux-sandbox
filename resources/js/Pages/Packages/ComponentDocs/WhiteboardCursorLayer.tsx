import type { ComponentDoc } from "./types";
import { Cursor, CursorLayer } from "@particle-academy/fancy-whiteboard";

const cursors = [
    { userId: "u1", name: "Glenn", color: "#8b5cf6", x: 80, y: 40 },
    { userId: "u2", name: "Amy", color: "#10b981", x: 220, y: 80 },
    { userId: "u3", name: "Researcher", color: "#a855f7", x: 360, y: 110 },
];

export const whiteboardCursorLayerDoc: ComponentDoc = {
    intro: (
        <p>
            Multi-user presence layer. <code>CursorLayer</code> takes an array of remote-user
            cursors and renders one <code>Cursor</code> per entry. Drop it inside a
            <code>&lt;Board&gt;</code> (or any absolutely-positioned container) at the same
            world coordinates the agents / collaborators report.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Three remote pointers + name tags.",
            render: () => (
                <div className="relative h-44 w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                    <CursorLayer cursors={cursors} />
                </div>
            ),
            code: `<Board viewport={viewport} onViewportChange={setViewport}>
    {/* sticky notes, shapes, drawings… */}
    <CursorLayer cursors={remoteCursors} />
</Board>`,
        },
        {
            name: "Single Cursor",
            description: "Use the lower-level `Cursor` when you only need one (e.g. an agent's pointer).",
            render: () => (
                <div className="relative h-24 w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                    <Cursor cursor={{ userId: "agent", name: "Researcher", color: "#a855f7", x: 80, y: 30 }} />
                </div>
            ),
            code: `<Cursor cursor={{ userId: "agent", name: "Researcher", color: "#a855f7", x, y }} />`,
        },
    ],
    props: [
        { name: "cursors", type: `RemoteCursor[]`, default: "—", description: "List of cursors to render — each `{ userId, x, y, name?, color? }`." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the layer wrapper." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles on the layer wrapper." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Coordinates:</strong> the layer is absolutely positioned with
            <code>inset: 0</code> and <code>pointerEvents: none</code> — cursors don't intercept
            clicks. Hosts feed it positions in the same coordinate system the rest of the
            Board uses.
        </p>
    ),
};
