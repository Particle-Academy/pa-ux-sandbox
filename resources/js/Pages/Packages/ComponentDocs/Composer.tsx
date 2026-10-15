import { useState } from "react";
import type { ComponentDoc } from "./types";
import { Button, Composer } from "@particle-academy/react-fancy";

export const composerDoc: ComponentDoc = {
    intro: (
        <p>
            A textarea-style input with a send button and an optional action row. The basic
            building block for chat and comment inputs — for full agent tooling
            (mentions, slash commands, token budgets), reach for <code>PromptInput</code>.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "`onSubmit` fires on Enter or the send button; Shift+Enter is a newline. The composer clears itself after a send.",
            render: () => (
                <div className="w-full max-w-md">
                    <Composer placeholder="Write a message…" onSubmit={() => {}} />
                </div>
            ),
            code: `const [message, setMessage] = useState("");

<Composer
    value={message}
    onChange={setMessage}
    onSubmit={(text) => sendMessage(text)}
    placeholder="Write a message…"
/>`,
        },
        {
            name: "With trailing actions",
            description: "Drop additional controls (attach, emoji, mention) via `actions`.",
            render: () => (
                <div className="w-full max-w-md">
                    <Composer
                        placeholder="Comment…"
                        onSubmit={() => {}}
                        actions={
                            <div className="flex items-center gap-1">
                                <Button variant="circle" size="sm" icon="paperclip" />
                                <Button variant="circle" size="sm" icon="face-smile" />
                            </div>
                        }
                    />
                </div>
            ),
            code: `<Composer
    value={comment}
    onChange={setComment}
    onSubmit={postComment}
    placeholder="Comment…"
    actions={
        <>
            <Button variant="circle" icon="paperclip" />
            <Button variant="circle" icon="face-smile" />
        </>
    }
/>`,
        },
        {
            name: "Disabled",
            render: () => (
                <div className="w-full max-w-md">
                    <Composer placeholder="Read-only" defaultValue="You can't reply yet." disabled />
                </div>
            ),
            code: `<Composer value={text} onChange={setText} disabled />`,
        },
        {
            name: "pasteThreshold — holding a large paste",
            description:
                "A paste of at least this many characters is held beside the composer as a pill instead of turning the input into a scrolling wall. Try 500 — about a long paragraph. There is NO default on purpose: paste is a fundamental interaction, so holding one is something a host asks for rather than something it discovers. Below the threshold nothing changes at all — no prevented event, no pill, no ceremony for an address or a name.",
            render: () => (
                <Composer
                    className="w-full"
                    pasteThreshold={120}
                    placeholder="Paste more than 120 characters here…"
                />
            ),
            code: `{/* About a long paragraph. */}
<Composer pasteThreshold={500} />`,
        },
        {
            name: "pastePlacement=\"inline\" — the pill sits where you pasted",
            description:
                "With inline placement the pill goes INTO the message, at the caret. A text pill gets a line to itself; click it and its full text replaces it, right there. With pasteImages, a pasted image becomes an inline pill too — hover it for a thumbnail. Backspace deletes a pill like a character. A send expands every text pill where it sits, marks each image as [Pasted image N], and hands the images to onSubmit's second argument. Paste a long passage or a screenshot below.",
            render: () => {
                function Inline() {
                    const [sent, setSent] = useState<string | null>(null);

                    return (
                        <div className="w-full space-y-2">
                            <Composer
                                pasteThreshold={120}
                                pastePlacement="inline"
                                pasteImages
                                previewChars={30}
                                placeholder="Type, then paste a long passage or an image…"
                                onSubmit={(text, { images }) =>
                                    setSent(images.length ? `${text}  (+ ${images.length} image(s))` : text)
                                }
                            />
                            {sent !== null && (
                                <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-md bg-zinc-100 p-2 text-xs dark:bg-zinc-800">
                                    {sent}
                                </pre>
                            )}
                        </div>
                    );
                }

                return <Inline />;
            },
            code: `<Composer
    pasteThreshold={500}
    pastePlacement="inline"
    pasteImages
    previewChars={30}
    onSubmit={(text, { images }) => send(text, images)}
/>`,
        },
        {
            name: "Restyling the pills and their popover",
            description:
                "classNames merges onto the defaults — pill, textPill, imagePill, preview (the hover popover), remove and input — so a restyle can be one class or a whole new look. renderPastePreview replaces what the popover shows.",
            render: () => (
                <Composer
                    className="w-full"
                    pasteThreshold={120}
                    pastePlacement="inline"
                    placeholder="Paste more than 120 characters here…"
                    classNames={{
                        textPill: "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-500/20 dark:text-violet-200",
                        preview: "bg-violet-950 text-violet-50",
                    }}
                    renderPastePreview={(p) =>
                        p.kind === "text" ? `${p.paste.text.length} characters held` : p.image.label
                    }
                />
            ),
            code: `<Composer
    pasteThreshold={500}
    pastePlacement="inline"
    classNames={{
        textPill: "bg-violet-100 text-violet-700",
        preview: "bg-violet-950 text-violet-50",
    }}
    renderPastePreview={(p) =>
        p.kind === "text" ? \`\${p.paste.text.length} characters held\` : p.image.label
    }
/>`,
        },
        {
            name: "Controlled held pastes",
            description:
                "heldPastes and onHeldPastesChange hand the list to you. Controllable rather than internal because the component contract forbids internal-only state for anything an agent might read or write — an agent driving this surface has to be able to SEE that a paste is attached, and to attach one itself.",
            render: () => {
                function Controlled() {
                    const [held, setHeld] = useState<{ id: string; text: string }[]>([]);

                    return (
                        <div className="w-full space-y-2">
                            <Composer
                                pasteThreshold={120}
                                heldPastes={held}
                                onHeldPastesChange={setHeld}
                                placeholder="Paste a long passage…"
                            />
                            <p className="text-xs text-zinc-500">
                                {held.length} held paste(s)
                                {held.length > 0 && ` — ${held[0].text.length} characters`}
                            </p>
                            <Button
                                size="sm"
                                color="zinc"
                                onClick={() =>
                                    setHeld([{ id: "agent-1", text: "Attached by an agent.".repeat(20) }])
                                }
                            >
                                Attach one as an agent would
                            </Button>
                        </div>
                    );
                }

                return <Controlled />;
            },
            code: `const [held, setHeld] = useState([]);

<Composer
    pasteThreshold={500}
    heldPastes={held}
    onHeldPastesChange={setHeld}
/>

{/* An agent attaches one through a bridge: */}
setHeld([...held, { id, text }]);`,
        },
    ],
    props: [
        { name: "value", type: `string`, default: "—", description: "Controlled value. Use with `onChange`." },
        { name: "defaultValue", type: `string`, default: "—", description: "Initial value (uncontrolled)." },
        { name: "onChange", type: `(value: string) => void`, default: "—", description: "Called on every keystroke." },
        { name: "onSubmit", type: `(value: string, extras: { images: HeldImage[] }) => void`, default: "—", description: "Called on Enter or the send button; the composer then clears itself. Pills are expanded — never a marker. `images` is only ever non-empty with `pasteImages`." },
        { name: "placeholder", type: `string`, default: "—", description: "Placeholder text." },
        { name: "actions", type: `ReactNode`, default: "—", description: "Element(s) rendered on the trailing edge — usually `Button` buttons." },
        { name: "disabled", type: `boolean`, default: `false`, description: "Disable the textarea + send button." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
        { name: "pasteThreshold", type: `number`, default: "— (no default, on purpose)", description: "Hold a paste of at least this many characters as a pill. Omit and paste behaves normally." },
        { name: "pastePlacement", type: `"above" | "inline"`, default: `"above"`, description: "Where a pill goes: a row above the input, or IN the message at the caret. Inline, `value` carries a `pasteMarker(id)` per pill." },
        { name: "pasteImages", type: `boolean`, default: `false`, description: "Hold a pasted image as an inline pill (inline only). Turning it on is a promise to read `onSubmit`'s second argument." },
        { name: "previewChars", type: `number`, default: `20`, description: "Characters of a held paste shown at each end of the hover preview." },
        { name: "classNames", type: `{ pill?, textPill?, imagePill?, preview?, remove?, input? }`, default: "—", description: "Classes merged onto the pills, the hover popover, the × and the input." },
        { name: "renderPastePreview", type: `(p: ComposerPastePreview) => ReactNode`, default: "—", description: "Replace what the hover popover shows." },
        { name: "heldImages", type: `HeldImage[]`, default: "—", description: "Controlled list of held images." },
        { name: "onHeldImagesChange", type: `(images: HeldImage[]) => void`, default: "—", description: "Called when the held image list changes." },
        { name: "heldPastes", type: `HeldPaste[]`, default: "—", description: "Controlled list of held pastes, so an agent can read and write what is attached." },
        { name: "onHeldPastesChange", type: `(pastes: HeldPaste[]) => void`, default: "—", description: "Called when the held list changes." },
    ],
};
