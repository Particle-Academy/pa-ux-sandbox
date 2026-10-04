import { useState } from "react";
import type { ComponentDoc } from "./types";
import { StickyNote } from "@particle-academy/react-fancy";

export const stickyNoteDoc: ComponentDoc = {
    intro: (
        <p>
            A paper note with inline editing. Five preset colours — or any CSS colour —
            plus rotation, so a wall of them looks hand-placed rather than gridded. It is
            controlled or uncontrolled, and it commits{" "}
            <strong>on blur rather than on keystroke</strong>, which is the behaviour a note
            wants: the edit is finished when you look away from it.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description:
                "Uncontrolled, editable, yellow. Click the text and type — the change commits when focus leaves.",
            render: () => <StickyNote defaultValue="Click me and type." />,
            code: `<StickyNote defaultValue="Click me and type." />`,
        },
        {
            name: "Colours",
            description:
                "Five presets. The prop also takes any CSS colour string, so a brand palette does not need a fork.",
            render: () => (
                <div className="flex flex-wrap items-start gap-3">
                    {(["yellow", "blue", "green", "pink", "violet"] as const).map((color) => (
                        <StickyNote
                            key={color}
                            color={color}
                            width={120}
                            defaultValue={color}
                            editable={false}
                        />
                    ))}
                    <StickyNote
                        color="#d4f1d4"
                        width={120}
                        defaultValue="#d4f1d4"
                        editable={false}
                    />
                </div>
            ),
            code: `<StickyNote color="yellow" />
<StickyNote color="blue" />

{/* Any CSS colour works too. */}
<StickyNote color="#d4f1d4" />`,
        },
        {
            name: "Rotation and size",
            description:
                "rotate in degrees, width and height as px numbers or CSS lengths. A couple of degrees either way is what stops a board reading as a spreadsheet.",
            render: () => (
                <div className="flex flex-wrap items-start gap-6 py-4">
                    <StickyNote rotate={-4} width={140} defaultValue="Tilted left" editable={false} />
                    <StickyNote rotate={0} width={140} defaultValue="Square" editable={false} />
                    <StickyNote rotate={3} width={140} defaultValue="Tilted right" editable={false} />
                    <StickyNote
                        width="12rem"
                        height={120}
                        defaultValue="Fixed height, CSS width"
                        editable={false}
                    />
                </div>
            ),
            code: `<StickyNote rotate={-4} width={140} />
<StickyNote width="12rem" height={120} />`,
        },
        {
            name: "Controlled",
            description:
                "value + onChange hand the text to you. onChange fires on blur, not on every keystroke — so this counter updates when you click away, which is the commit the component promises.",
            render: () => {
                function Controlled() {
                    const [text, setText] = useState("Edit me, then click outside.");

                    return (
                        <div className="flex flex-col items-start gap-2">
                            <StickyNote value={text} onChange={setText} color="blue" />
                            <p className="text-xs text-zinc-500">
                                committed value: <code>{text}</code>
                            </p>
                        </div>
                    );
                }

                return <Controlled />;
            },
            code: `const [text, setText] = useState("");

{/* onChange fires on blur — the edit is done when you look away. */}
<StickyNote value={text} onChange={setText} />`,
        },
        {
            name: "Selected, and read-only",
            description:
                "selected draws the focus ring a board uses to show the active note. editable={false} freezes the text — for a published board, or a note someone else owns.",
            render: () => (
                <div className="flex flex-wrap items-start gap-6">
                    <StickyNote defaultValue="Selected" selected width={140} />
                    <StickyNote defaultValue="Read-only" editable={false} width={140} color="green" />
                </div>
            ),
            code: `<StickyNote value={text} onChange={setText} selected={id === activeId} />
<StickyNote value={note.text} editable={false} />`,
        },
        {
            name: "autoFocus — dropping straight into typing",
            description:
                "Focuses the editable region with the caret at the end when it becomes editable. The point is a host's own \"edit this note\" gesture: flip editable on and the user is already typing, rather than having to click the text a second time.",
            render: () => {
                function Gesture() {
                    const [editing, setEditing] = useState(false);

                    return (
                        <div className="flex flex-col items-start gap-2">
                            <button
                                type="button"
                                onClick={() => setEditing((e) => !e)}
                                className="rounded-md border border-zinc-200 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                            >
                                {editing ? "Done" : "Edit note"}
                            </button>
                            <StickyNote
                                defaultValue="Press Edit note — the caret lands here."
                                editable={editing}
                                autoFocus={editing}
                                selected={editing}
                            />
                        </div>
                    );
                }

                return <Gesture />;
            },
            code: `<StickyNote
    value={note.text}
    onChange={save}
    editable={editing}
    autoFocus={editing}
/>`,
        },
        {
            name: "A stable handle",
            description:
                "id is emitted as the element id, so an agent or a selector can address one note without walking the DOM. On a board where notes move, this is the difference between \"the third note\" and \"this note\".",
            render: () => (
                <StickyNote
                    id="note-retro-blockers"
                    defaultValue="Addressable as #note-retro-blockers"
                    color="pink"
                    width={200}
                />
            ),
            code: `<StickyNote id={\`note-\${note.id}\`} value={note.text} onChange={save} />`,
        },
        {
            name: "Static children",
            description:
                "children overrides the editable text entirely — for a note that holds markup rather than a string. It is the escape hatch, not the normal path: a note with children is no longer something an agent can write a value into.",
            render: () => (
                <StickyNote color="violet" width={200} rotate={-2}>
                    <strong>Ship list</strong>
                    <ul className="mt-1 list-disc pl-4 text-sm">
                        <li>react-fancy</li>
                        <li>fancy-flow</li>
                    </ul>
                </StickyNote>
            ),
            code: `<StickyNote color="violet">
    <strong>Ship list</strong>
    <ul>…</ul>
</StickyNote>`,
        },
    ],
    props: [
        { name: "value", type: `string`, default: "—", description: "Note text. Controlled." },
        { name: "defaultValue", type: `string`, default: "—", description: "Initial text when uncontrolled." },
        { name: "onChange", type: `(text: string) => void`, default: "—", description: "Fires when the edited text is committed — on blur, not per keystroke." },
        { name: "color", type: `StickyNoteColor | string`, default: `"yellow"`, description: "Paper colour — a preset, or any CSS colour string." },
        { name: "rotate", type: `number`, default: `0`, description: "Rotation in degrees." },
        { name: "width", type: `number | string`, default: `180`, description: "Width as px number or CSS length." },
        { name: "height", type: `number | string`, default: `"auto"`, description: "Height as px number or CSS length." },
        { name: "selected", type: `boolean`, default: `false`, description: "Selected styling — the focus ring a board uses for the active note." },
        { name: "editable", type: `boolean`, default: `true`, description: "Allow inline editing of the text." },
        { name: "autoFocus", type: `boolean`, default: `false`, description: "Focus the editable region, caret at end, when it becomes editable." },
        { name: "id", type: `string`, default: "—", description: "Stable handle, also emitted as the element `id`." },
        { name: "children", type: `ReactNode`, default: "—", description: "Static content. Overrides the editable text." },
        { name: "className", type: `string`, default: "—", description: "Additional classes." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles." },
    ],
    notes: (
        <ul>
            <li>
                <strong>Commit is on blur.</strong> If you need every keystroke — a live
                collaborative board, say — this is not the component for it; drive your own
                contenteditable, or hold the note in <code>fancy-whiteboard</code>, which
                owns the transport.
            </li>
            <li>
                <code>children</code> and <code>value</code> are alternatives.{" "}
                <code>children</code> wins, and a note rendered that way has no text an agent
                can set — which is the trade you are making.
            </li>
            <li>
                <code>fancy-whiteboard</code> ships its own <code>StickyNote</code> as a
                board item type. This one is the standalone paper note; that one is a node on
                a collaborative canvas. In the install registry they are{" "}
                <code>react-fancy-sticky-note</code> and{" "}
                <code>fancy-whiteboard-sticky-note</code>.
            </li>
        </ul>
    ),
};
