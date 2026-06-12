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
    ],
};
