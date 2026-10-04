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
            description: "`onSubmit` fires on ⌘/Ctrl+Enter or the send button.",
            render: () => (
                <div className="w-full max-w-md">
                    <Composer placeholder="Write a message…" onSubmit={() => {}} />
                </div>
            ),
            code: `const [message, setMessage] = useState("");

<Composer
    value={message}
    onChange={setMessage}
    onSubmit={(text) => {
        sendMessage(text);
        setMessage("");
    }}
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
        { name: "onSubmit", type: `(value: string) => void`, default: "—", description: "Called on ⌘/Ctrl+Enter or the send button. Clear the input yourself afterward." },
        { name: "placeholder", type: `string`, default: "—", description: "Placeholder text." },
        { name: "actions", type: `ReactNode`, default: "—", description: "Element(s) rendered on the trailing edge — usually `Button` buttons." },
        { name: "disabled", type: `boolean`, default: `false`, description: "Disable the textarea + send button." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
        { name: "pasteThreshold", type: `number`, default: "— (no default, on purpose)", description: "Hold a paste of at least this many characters as a pill. Omit and paste behaves normally." },
        { name: "heldPastes", type: `HeldPaste[]`, default: "—", description: "Controlled list of held pastes, so an agent can read and write what is attached." },
        { name: "onHeldPastesChange", type: `(pastes: HeldPaste[]) => void`, default: "—", description: "Called when the held list changes." },
    ],
};
