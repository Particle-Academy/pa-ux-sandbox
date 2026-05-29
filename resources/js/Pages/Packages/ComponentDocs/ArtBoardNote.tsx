import type { ComponentDoc } from "./types";
import { ArtBoard } from "@particle-academy/fancy-artboard";
import "@particle-academy/fancy-artboard/styles.css";
import { useState } from "react";

function ArtBoardNoteDemo() {
    const [note, setNote] = useState("Try the dusk gradient on the hero?");
    return (
        <div className="h-64 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <ArtBoard defaultViewport={{ x: 0, y: 0, zoom: 1 }} style={{ height: "100%", width: "100%" }}>
                <ArtBoard.Note top={40} left={60} rotate={-3} value={note} onChange={setNote} editable />
                <ArtBoard.Note top={60} left={300} rotate={2} color="violet">
                    Static notes take children instead of value/onChange.
                </ArtBoard.Note>
            </ArtBoard>
        </div>
    );
}

export const artBoardNoteDoc: ComponentDoc = {
    intro: (
        <p>
            An absolutely-positioned react-fancy <code>StickyNote</code> placed in the canvas
            world. Use it for callouts, review comments, or agent suggestions floating beside
            your pieces. The wrapper owns position + rotation; the paper and editable text are
            react-fancy's <code>StickyNote</code>.
        </p>
    ),
    examples: [
        {
            name: "Editable + static notes",
            description:
                "Pass value + onChange for an editable note, or children for static content (which overrides the editable text). Position with top/left/right/bottom and rotate.",
            render: () => <ArtBoardNoteDemo />,
            code: `const [note, setNote] = useState("Try the dusk gradient on the hero?");

<ArtBoard style={{ height: "100%" }}>
  <ArtBoard.Note top={40} left={60} rotate={-3}
    value={note} onChange={setNote} editable />

  <ArtBoard.Note top={60} left={300} rotate={2} color="violet">
    Static notes take children instead of value/onChange.
  </ArtBoard.Note>
</ArtBoard>`,
        },
    ],
    props: [
        { name: "top / left / right / bottom", type: `number | string`, default: "—", description: "World-space position of the note." },
        { name: "rotate", type: `number`, default: `-2`, description: "Rotation in degrees." },
        { name: "width", type: `number | string`, default: `180`, description: "Note width." },
        { name: "color", type: `string`, default: `"yellow"`, description: "Paper color — a react-fancy StickyNote preset or any CSS color." },
        { name: "value", type: `string`, default: "—", description: "Controlled note text. Use with `onChange`." },
        { name: "onChange", type: `(text: string) => void`, default: "—", description: "Fires as the note text is edited." },
        { name: "editable", type: `boolean`, default: `false`, description: "Allow inline text editing." },
        { name: "selected", type: `boolean`, default: `false`, description: "Render the note in a selected state." },
        { name: "children", type: `ReactNode`, default: "—", description: "Static content; overrides editable text." },
    ],
};
