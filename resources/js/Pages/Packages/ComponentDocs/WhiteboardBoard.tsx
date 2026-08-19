import type { ComponentDoc } from "./types";
import { Board, StickyNote, type StickyNoteItem} from "@particle-academy/fancy-whiteboard";
import "@particle-academy/fancy-whiteboard/styles.css";
import { useState } from "react";

function BoardDemo() {
    const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
    const [note, setNote] = useState<StickyNoteItem>({
        id: "n1",
        kind: "sticky" as const,
        z: 0,
        x: 80,
        y: 50,
        width: 140,
        height: 90,
        text: "Drag me. Pan/zoom the board.",
        color: "#fef3c7",
    });
    return (
        <div className="h-56 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <Board className="h-full w-full" viewport={viewport} onViewportChange={setViewport} minZoom={0.25} maxZoom={3}>
                <StickyNote item={note} onChange={setNote} />
            </Board>
        </div>
    );
}

export const whiteboardBoardDoc: ComponentDoc = {
    intro: (
        <p>
            The pan-zoom canvas of <code>fancy-whiteboard</code>. Drop any positioned item
            (sticky notes, shapes, drawings, agent cursors) as children — the Board handles
            world-space scrolling and the wheel-zoom gesture. Controlled
            (<code>viewport</code> + <code>onViewportChange</code>) or uncontrolled
            (<code>defaultViewport</code>).
        </p>
    ),
    examples: [
        {
            name: "With a sticky note",
            description: "Pan with click-and-drag, zoom with the mouse wheel.",
            render: () => <BoardDemo />,
            code: `const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });

<Board viewport={viewport} onViewportChange={setViewport}>
    <StickyNote item={note} onChange={setNote} />
</Board>`,
        },
        {
            name: "Uncontrolled",
            description: "Skip the viewport plumbing — the Board manages its own state.",
            render: () => (
                <div className="h-40 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <Board className="h-full w-full" defaultViewport={{ x: 0, y: 0, zoom: 1 }} />
                </div>
            ),
            code: `<Board defaultViewport={{ x: 0, y: 0, zoom: 1 }}>
    <StickyNote item={note} onChange={setNote} />
</Board>`,
        },
        {
            name: "Zoom limits",
            description: "Constrain how far the user can scale.",
            render: () => (
                <div className="h-40 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <Board className="h-full w-full" defaultViewport={{ x: 0, y: 0, zoom: 1 }} minZoom={0.5} maxZoom={2} />
                </div>
            ),
            code: `<Board minZoom={0.5} maxZoom={2}>…</Board>`,
        },
    ],
    props: [
        { name: "viewport", type: `Viewport`, default: "—", description: "Controlled `{ x, y, zoom }`. Use with `onViewportChange`." },
        { name: "defaultViewport", type: `Viewport`, default: `{ x: 0, y: 0, zoom: 1 }`, description: "Initial viewport (uncontrolled)." },
        { name: "onViewportChange", type: `(v: Viewport) => void`, default: "—", description: "Called on every pan / zoom." },
        { name: "minZoom", type: `number`, default: `0.1`, description: "Smallest allowed scale." },
        { name: "maxZoom", type: `number`, default: `4`, description: "Largest allowed scale." },
        { name: "children", type: `ReactNode`, default: "—", description: "Positioned items — `StickyNote`, `Shape`, `Drawing`, `Connector`, `CursorLayer`, etc." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root div." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles on the root div." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Coordinate system:</strong> children position themselves in world space (the
            same coordinates as the items in your data store). The Board applies the viewport
            transform once at the root — no per-item math required.
        </p>
    ),
};
