import type { ComponentDoc } from "./types";
import { Composer, Input } from "@particle-academy/react-fancy";

export const pastePillsDoc: ComponentDoc = {
    intro: (
        <p>
            The paste-pill core that <code>Composer</code>, <code>PromptInput</code> and{" "}
            <code>Input</code> share: a long paste or a pasted image held as a pill in the field,
            expanded where it sits when the field is sent, and pasted files posted with the form.
            It is one folder so there is one implementation, and{" "}
            <code>npx fancy-cli add composer</code> (or <code>prompt-input</code>, or{" "}
            <code>input</code>) copies it once, as a dependency, rather than a copy per component.
            Reach for it directly only to build a pill-holding field of your own.
        </p>
    ),
    examples: [
        {
            name: "The same pill in three components",
            description:
                "Paste a long passage into either field. Both pills come from the same code, so what a pill holds and what a send carries cannot differ between them.",
            render: () => (
                <div className="w-full max-w-md space-y-3">
                    <Input name="title" placeholder="An Input — paste a long passage" pasteThreshold={120} />
                    <Composer pastePlacement="inline" pasteThreshold={120} placeholder="A Composer — the same pill" />
                </div>
            ),
            code: `<Input name="title" pasteThreshold={500} />
<Composer pastePlacement="inline" pasteThreshold={500} />
<PromptInput pasteThreshold={500} onSubmit={send} />`,
        },
        {
            name: "Your own field",
            description:
                "useInlinePaste holds the pastes and images and renders the pills; InlinePasteEditor is the surface that can hold them; PastedFilesInput is the hidden file input that posts pasted files with a form. usePastePills is the state alone, for a host that renders its own surface.",
            render: () => (
                <div className="w-full max-w-md">
                    <Input name="note" placeholder="Built from the same three pieces" pasteThreshold={120} pasteImages />
                </div>
            ),
            code: `import {
    InlinePasteEditor,
    PastedFilesInput,
    useInlinePaste,
    type InlinePasteEditorHandle,
} from "@particle-academy/react-fancy/paste-pills";

const editorRef = useRef<InlinePasteEditorHandle>(null);
const paste = useInlinePaste({ pasteThreshold: 500, pasteImages: true, previewChars: 20, disabled: false, editorRef });

<InlinePasteEditor
    ref={editorRef}
    value={value}
    known={paste.known}
    onChange={(next) => { setValue(next); paste.prune(next); }}
    onSubmit={() => send(paste.expand(value))}
    onPaste={paste.decidePaste}
    onHostsChange={paste.onHostsChange}
    placeholder="Ask…"
    disabled={false}
/>
{paste.portals}
<PastedFilesInput name="files[]" files={paste.imagesIn(value).map((i) => i.file)} />`,
        },
    ],
    props: [
        { name: "usePastePills", type: `({ threshold, heldPastes, onHeldPastesChange }) => { heldPastes, handlePaste, hold, expand, remove, clear }`, default: "—", description: "The held-paste state, owning no DOM." },
        { name: "useInlinePaste", type: `(options) => { known, decidePaste, prune, expand, imagesIn, clear, portals, … }`, default: "—", description: "Pastes, images and pills for an inline editor." },
        { name: "InlinePasteEditor", type: `component`, default: "—", description: "The editable surface that holds pills. `multiline={false}` makes it a single-line field." },
        { name: "PastedFilesInput", type: `{ name, files, form? }`, default: "—", description: "A hidden `<input type=\"file\" multiple>` kept in step with the pasted files, so a form posts them." },
        { name: "pasteMarker", type: `(id: string) => string`, default: "—", description: "The marker a pill has in `value`, for a host or agent writing the value itself." },
    ],
};
