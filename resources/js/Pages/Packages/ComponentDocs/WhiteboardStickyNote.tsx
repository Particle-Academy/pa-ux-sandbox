import type { ComponentDoc } from "./types";
import { useState } from "react";
import { StickyNote, type StickyNoteItem } from "@particle-academy/fancy-whiteboard";
import "@particle-academy/fancy-whiteboard/styles.css";

function StickyDemo() {
    const [note, setNote] = useState<StickyNoteItem>({
        id: "n1",
        kind: "sticky",
        x: 20,
        y: 20,
        width: 160,
        height: 100,
        text: "Double-click to edit.",
        color: "#fef3c7",
    });
    return (
        <div className="relative h-44 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <StickyNote item={note} onChange={setNote} />
        </div>
    );
}

export const whiteboardStickyNoteDoc: ComponentDoc = {
    intro: (
        <p>
            Draggable, resizable, editable note. The <code>item</code> prop is the full note
            model from your data store; the component fires <code>onChange</code> after every
            move / resize / edit. Drop them inside a <code>&lt;Board&gt;</code> for world-space
            positioning, or anywhere absolutely-positioned for an off-board use.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Drag the note body to move; drag a corner to resize; double-click to edit.",
            render: () => <StickyDemo />,
            code: `const [note, setNote] = useState<StickyNoteItem>({
    id: "n1",
    kind: "sticky",
    x: 20, y: 20, width: 160, height: 100,
    text: "Double-click to edit.",
    color: "#fef3c7",
});

<StickyNote item={note} onChange={setNote} />`,
        },
        {
            name: "Selected",
            description: "Set `selected` to add the focus ring (typically driven by your selection model).",
            render: () => {
                const [n, setN] = useState<StickyNoteItem>({
                    id: "n2",
                    kind: "sticky",
                    x: 20,
                    y: 20,
                    width: 160,
                    height: 100,
                    text: "Selected note.",
                    color: "#dbeafe",
                });
                return (
                    <div className="relative h-44 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <StickyNote item={n} onChange={setN} selected />
                    </div>
                );
            },
            code: `<StickyNote
    item={note}
    onChange={setNote}
    selected={selectedId === note.id}
    onSelect={setSelectedId}
/>`,
        },
        {
            name: "Read-only",
            description: "Skip drag/edit affordances. Useful for snapshot views.",
            render: () => {
                const [n, setN] = useState<StickyNoteItem>({
                    id: "n3",
                    kind: "sticky",
                    x: 20,
                    y: 20,
                    width: 200,
                    height: 80,
                    text: "Read-only — no drag, no edit.",
                    color: "#fce7f3",
                });
                return (
                    <div className="relative h-32 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <StickyNote item={n} onChange={setN} readOnly />
                    </div>
                );
            },
            code: `<StickyNote item={note} readOnly />`,
        },
    ],
    props: [
        { name: "item", type: `StickyNoteItem`, default: "—", description: "The note model — `{ id, type, x, y, width, height, text, color, … }`. Required." },
        { name: "onChange", type: `(next: StickyNoteItem) => void`, default: "—", description: "Called after move / resize / text edit." },
        { name: "onSelect", type: `(id: string) => void`, default: "—", description: "Called when the note is clicked — your selection model owns the current id." },
        { name: "selected", type: `boolean`, default: `false`, description: "Draw the focus ring." },
        { name: "readOnly", type: `boolean`, default: `false`, description: "Disable drag, resize, edit affordances." },
        { name: "minWidth", type: `number`, default: `80`, description: "Smallest width resize allows." },
        { name: "minHeight", type: `number`, default: `60`, description: "Smallest height resize allows." },
        { name: "children", type: `ReactNode`, default: "—", description: "When present, replaces the default editable textarea — render custom note content." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the wrapper." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles on the wrapper." },
    ],
};
