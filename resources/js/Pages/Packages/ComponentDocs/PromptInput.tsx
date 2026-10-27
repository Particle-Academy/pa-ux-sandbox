import type { ComponentDoc } from "./types";
import { useRef, useState } from "react";
import {
    Button,
    PromptInput,
    Text,
    promptDataUrlToFile,
    promptFileToDataUrl,
} from "@particle-academy/react-fancy";
import type { PromptDraft, PromptDraftFile, PromptInputHandle } from "@particle-academy/react-fancy";

function ControlledTextDemo() {
    const [text, setText] = useState("Summarise the last three commits");

    return (
        <div className="flex w-full max-w-md flex-col gap-4">
            <div>
                <div className="mb-1 text-[11px] uppercase tracking-wider text-zinc-400">
                    value + onChange (controlled)
                </div>
                <PromptInput budgetTokens={8000} value={text} onChange={setText} onSubmit={() => {}} />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setText("Draft a release note for 5.65.0")}>
                        Set from outside
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setText("")}>
                        Clear from outside
                    </Button>
                    <Text size="xs" className="ml-auto !text-zinc-500">
                        host sees {text.length} chars
                    </Text>
                </div>
            </div>
            <div>
                <div className="mb-1 text-[11px] uppercase tracking-wider text-zinc-400">
                    defaultValue (uncontrolled)
                </div>
                <PromptInput budgetTokens={8000} defaultValue="Start from this text" onSubmit={() => {}} />
            </div>
        </div>
    );
}

const SAVED_DRAFT: PromptDraft = { v: 1, text: "Pick up where you left off", pills: [], attachments: [] };

/** Keep each attached file inline, as a data: URL. A real host may upload it and return a key. */
function persistInline(file: File): Promise<string> {
    return promptFileToDataUrl(file);
}

function restoreInline(entry: PromptDraftFile): File | undefined {
    return entry.ref ? promptDataUrlToFile(entry.ref, entry.name, entry.type) : undefined;
}

/** Shorten data: URLs so the JSON stays readable. */
function shortRefs(key: string, value: unknown): unknown {
    return key === "ref" && typeof value === "string" && value.length > 48 ? value.slice(0, 48) + "…" : value;
}

function DraftDemo() {
    const composer = useRef<PromptInputHandle>(null);
    const [saved, setSaved] = useState<PromptDraft>(SAVED_DRAFT);
    const [mount, setMount] = useState(0);

    return (
        <div className="flex w-full max-w-xl flex-col gap-2">
            <PromptInput
                key={mount}
                ref={composer}
                budgetTokens={200000}
                pasteThreshold={200}
                pasteImages
                defaultDraft={saved}
                onDraftChange={setSaved}
                persistAttachment={persistInline}
                restoreAttachment={restoreInline}
                placeholder="Type, paste or attach, then remount…"
                onSubmit={() => {}}
            />
            <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setMount((n) => n + 1)}>
                    Remount from the saved draft
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                        composer.current?.setDraft({
                            v: 1,
                            text: "Set by setDraft. Focus did not move.",
                            pills: [],
                            attachments: [],
                        })
                    }
                >
                    Replace with setDraft
                </Button>
            </div>
            <pre className="max-h-48 overflow-auto rounded-md bg-zinc-50 p-2 text-[11px] leading-relaxed text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                {JSON.stringify(saved, shortRefs, 2)}
            </pre>
        </div>
    );
}

export const promptInputDoc: ComponentDoc = {
    intro: (
        <p>
            The AI-chat composer. Token-budget meter, <code>/</code>-slash commands,
            <code>@</code>-mentions, attachments, ⌘/Ctrl+Enter to send. Pair with{" "}
            <code>ChatDrawer</code> via <code>aboveInput</code> for a single visually-unified
            chat panel.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Type freely. Try `/` and `@` to see the command + mention pickers — when wired.",
            render: () => (
                <div className="w-full max-w-md">
                    <PromptInput
                        budgetTokens={8000}
                        onSubmit={() => {}}
                        placeholder="Ask anything…"
                        showHint
                    />
                </div>
            ),
            code: `<PromptInput
    budgetTokens={8000}
    onSubmit={(text, attachments) => sendMessage(text, attachments)}
    placeholder="Ask anything…"
    showHint
/>`,
        },
        {
            name: "Slash commands + mentions",
            description: "Pass `commands` and `mentions` arrays — pickers open as the user types `/` or `@`.",
            render: () => (
                <div className="w-full max-w-md">
                    <PromptInput
                        budgetTokens={8000}
                        onSubmit={() => {}}
                        placeholder="Try typing / or @"
                        commands={[
                            { name: "/summarize", hint: "Summarize the current document" },
                            { name: "/translate", hint: "Translate selected text" },
                            { name: "/explain", hint: "Explain the highlighted code" },
                        ]}
                        mentions={[
                            { id: "agent:researcher", name: "Researcher", kind: "agent" },
                            { id: "agent:coder", name: "Coder", kind: "agent" },
                            { id: "file:README.md", name: "README.md", kind: "file" },
                        ]}
                    />
                </div>
            ),
            code: `<PromptInput
    budgetTokens={8000}
    onSubmit={handleSubmit}
    commands={[
        { name: "/summarize", hint: "Summarize the current document" },
        { name: "/translate", hint: "Translate selected text" },
    ]}
    mentions={[
        { id: "agent:researcher", name: "Researcher", kind: "agent" },
        { id: "agent:coder", name: "Coder", kind: "agent" },
        { id: "file:README.md", name: "README.md", kind: "file" },
    ]}
/>`,
        },
        {
            name: "The hint names a key the reader HAS",
            description:
                "Both branches render here on one machine, which is the point: `platform` is a prop rather than a global read, so the platform you are not sitting on is still reachable — by a test, by this page, and by an Electron host that knows the real platform better than `navigator` does. The hint shipped hardcoded to Command, so every Windows and Linux user was told to press a key their keyboard does not have. The keys themselves never changed: `⌘+Enter` and `Ctrl+Enter` both submit, everywhere.",
            render: () => (
                <div className="flex w-full max-w-md flex-col gap-4">
                    <div>
                        <div className="mb-1 text-[11px] uppercase tracking-wider text-zinc-400">
                            platform="generic" — Windows, Linux, unknown
                        </div>
                        <PromptInput budgetTokens={8000} onSubmit={() => {}} platform="generic" showHint />
                    </div>
                    <div>
                        <div className="mb-1 text-[11px] uppercase tracking-wider text-zinc-400">
                            platform="apple"
                        </div>
                        <PromptInput budgetTokens={8000} onSubmit={() => {}} platform="apple" showHint />
                    </div>
                </div>
            ),
            code: `// Omit it in an ordinary web app — the platform is read after mount.
<PromptInput budgetTokens={8000} onSubmit={handleSubmit} showHint />

// Pass it when the host knows better than navigator: an Electron renderer
// forwarding process.platform, or a remote session where the keyboard is not
// the one running the browser.
<PromptInput budgetTokens={8000} onSubmit={handleSubmit} platform="apple" showHint />`,
        },
        {
            name: "With ChatDrawer above",
            description: "Mount `ChatDrawer` in the `aboveInput` slot so it shares the same rounded panel.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    See <code>ChatDrawer</code> for the full recipe.
                </Text>
            ),
            code: `<PromptInput
    budgetTokens={8000}
    onSubmit={handleSubmit}
    aboveInput={
        <ChatDrawer
            tabs={tabs}
            activeTabId={tab}
            onTabChange={setTab}
            open={drawerOpen}
            onToggle={setDrawerOpen}
        >
            <Panel for={tab} />
        </ChatDrawer>
    }
/>`,
        },
        {
            name: "Inline paste pills",
            description:
                "With pasteThreshold, a big paste becomes a pill IN the message where you pasted it, on a line of its own; click it and its full text comes back right there, hover for the first and last previewChars. With pasteImages, a pasted screenshot sits in the sentence as Pasted image N and still reaches onSubmit as an attachment with its File. onSubmit gets the text with every pill expanded where it sat. Ctrl/⌘+Enter still sends, plain Enter is a newline, and / and @ still work. pasteClassNames and renderPastePreview restyle the pills and their popover.",
            render: () => (
                <div className="w-full max-w-xl">
                    <PromptInput
                        budgetTokens={200000}
                        pasteThreshold={200}
                        pasteImages
                        previewChars={30}
                        pasteClassNames={{ textPill: "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-500/20 dark:text-violet-200 dark:hover:bg-violet-500/30" }}
                        renderPastePreview={(p) =>
                            p.kind === "text" ? `${p.paste.text.slice(0, 60)} …` : p.image.label
                        }
                        placeholder="Type, then paste a long passage or a screenshot…"
                        onSubmit={() => {}}
                    />
                </div>
            ),
            code: `<PromptInput
    budgetTokens={200_000}
    pasteThreshold={500}
    pasteImages
    previewChars={30}
    pasteClassNames={{ textPill: "bg-violet-100 text-violet-700" }}
    renderPastePreview={(p) => (p.kind === "text" ? p.paste.text.slice(0, 60) : p.image.label)}
    onSubmit={(text, attachments) => send(text, attachments)}
/>

{/* Inside a <form>, pasteFilesName also posts the pasted images: */}
<PromptInput pasteImages pasteFilesName="screenshots[]" onSubmit={send} />`,
        },
        {
            name: "A quieter footer",
            description:
                "attachButton and sendButton set to icon trade the labels for icons, and the send shortcut moves into the send button's tooltip. usedTokens is your REAL usage (an agent's context, say) and the meter adds the draft to it. meter near-limit keeps the meter out of sight until usage passes meterShowAt, muted until meterWarnAt, then in the warning colour. This one sits at 92% so you can see it; meter hidden removes it entirely.",
            render: () => (
                <div className="w-full max-w-xl">
                    <PromptInput
                        budgetTokens={200000}
                        usedTokens={184000}
                        meter="near-limit"
                        meterShowAt={0.75}
                        meterWarnAt={0.9}
                        attachButton="icon"
                        sendButton="icon"
                        placeholder="Ask anything…"
                        onSubmit={() => {}}
                    />
                </div>
            ),
            code: `<PromptInput
    budgetTokens={200_000}
    usedTokens={agent.contextTokens}
    meter="near-limit"
    meterShowAt={0.75}
    meterWarnAt={0.9}
    attachButton="icon"
    sendButton="icon"
    onSubmit={send}
/>`,
        },
        {
            name: "Controlled text",
            description:
                "value and onChange make the text the host's state, so it can be read, set or cleared from outside. onChange fires when the person edits, and with an empty string after a send. defaultValue sets the starting text and leaves the composer in charge after that. With paste pills on, value carries a pasteMarker(id) for each pill, the same as Composer's value.",
            render: () => <ControlledTextDemo />,
            code: `const [text, setText] = useState("");

<PromptInput budgetTokens={8000} value={text} onChange={setText} onSubmit={send} />

// Uncontrolled, with a starting text:
<PromptInput budgetTokens={8000} defaultValue="Start from this text" onSubmit={send} />`,
        },
        {
            name: "Save and restore a draft",
            description:
                "A PromptDraft is plain JSON: { v: 1, text, pills, attachments }. onDraftChange gets the whole draft whenever the person changes any part of it, so the host can save it anywhere; defaultDraft starts a new composer from it. The file bytes are not in the draft. persistAttachment stores each attached or pasted file and returns a handle that becomes the entry's ref; restoreAttachment gets the File back from that ref. This demo keeps the bytes inline with promptFileToDataUrl and promptDataUrlToFile. Attach or paste an image, then remount: the chip comes back with its file. The setDraft button uses the ref handle. It does not move focus and does not fire onDraftChange, so the saved JSON below does not change until you type again.",
            render: () => <DraftDemo />,
            code: `const composer = useRef<PromptInputHandle>(null);
const saved = JSON.parse(localStorage.getItem("draft") ?? "null") ?? undefined;

<PromptInput
    ref={composer}
    budgetTokens={200_000}
    pasteImages
    defaultDraft={saved}
    onDraftChange={(draft) => localStorage.setItem("draft", JSON.stringify(draft))}
    // The draft carries a handle, not the bytes. Inline data: URLs are the
    // simplest option. For large files, upload them and return the key.
    persistAttachment={(file) => promptFileToDataUrl(file)}
    restoreAttachment={(entry) =>
        entry.ref ? promptDataUrlToFile(entry.ref, entry.name, entry.type) : undefined
    }
    onSubmit={send}
/>

// Restore later. Does not call onChange / onDraftChange, does not take focus:
composer.current?.setDraft(savedDraft);
// ...unless you ask it to:
composer.current?.setDraft(savedDraft, { focus: true });`,
        },
    ],
    props: [
        { name: "budgetTokens", type: `number`, default: "—", description: "Token budget shown by the meter. Required." },
        { name: "onSubmit", type: `(text, attachments) => void`, default: "—", description: "Called on ⌘/Ctrl+Enter or the send button. Required." },
        { name: "commands", type: `PromptCmd[]`, default: "—", description: "Slash-command list. Names must start with `/`." },
        { name: "mentions", type: `PromptMention[]`, default: "—", description: "`@`-mention sources — agents, files, people. Each has `{ id, label, kind }`." },
        { name: "showHint", type: `boolean`, default: `true`, description: "Show the submit-shortcut hint near the send button." },
        { name: "platform", type: `"apple" | "generic"`, default: "detected after mount", description: "Which modifier the hint and the default placeholder NAME. The keys accepted are unaffected — `⌘/Ctrl+Enter` submits on every platform." },
        { name: "placeholder", type: `string`, default: "derived from the platform", description: "Textarea placeholder. Leave it unset and it names the modifier this platform actually has." },
        { name: "charsPerToken", type: `number`, default: `4`, description: "Rough chars-per-token used by the meter estimator." },
        { name: "mentionColor", type: `Record<string, string>`, default: "—", description: "Map mention `kind` to a CSS color used by the chip." },
        { name: "maxHeight", type: `number`, default: `280`, description: "Max textarea height in px before scrolling." },
        { name: "aboveInput", type: `ReactNode`, default: "—", description: "Rendered inside the rounded shell, above the textarea — usually a `ChatDrawer`." },
        { name: "pasteThreshold", type: `number`, default: "— (off)", description: "Hold a paste of at least this many characters as a pill IN the message, where it was pasted. Swaps the textarea for an inline editor; `/`, `@` and Ctrl/⌘+Enter keep working." },
        { name: "pasteImages", type: `boolean`, default: `false`, description: "A pasted image becomes an inline `Pasted image N` pill and reaches `onSubmit`'s attachments with its File. Off: a pasted image is an ordinary attachment chip." },
        { name: "pasteFilesName", type: `string`, default: "—", description: "Post pasted images with an enclosing `<form>` under this name: a hidden `<input type=\"file\" multiple>` holds the images still in the message. Needs `pasteImages`." },
        { name: "previewChars", type: `number`, default: `20`, description: "Characters of a held paste shown at each end of the preview popover (opens on hover or focus)." },
        { name: "renderPastePreview", type: `(p: ComposerPastePreview) => ReactNode`, default: "—", description: "Replace what a pill's hover popover shows." },
        { name: "pasteClassNames", type: `{ pill?, textPill?, imagePill?, preview?, input? }`, default: "—", description: "Classes merged onto the pills, their popover and the inline editor." },
        { name: "attachButton", type: `"label" | "icon"`, default: `"label"`, description: "`icon`: paperclip only, with an accessible name and a tooltip." },
        { name: "sendButton", type: `"label" | "icon"`, default: `"label"`, description: "`icon`: a compact send button whose tooltip carries the shortcut, replacing the inline hint." },
        { name: "usedTokens", type: `number`, default: "—", description: "Tokens already used — your real value. The meter shows it plus the draft's estimate." },
        { name: "meter", type: `"always" | "near-limit" | "hidden"`, default: `"always"`, description: "`near-limit`: hidden until `meterShowAt`, muted until `meterWarnAt`, warning colour past it." },
        { name: "meterShowAt", type: `number`, default: `0.75`, description: "Fraction of the budget at which a `near-limit` meter appears." },
        { name: "meterWarnAt", type: `number`, default: `0.9`, description: "Fraction of the budget past which a `near-limit` meter turns the warning colour." },
        { name: "value", type: `string`, default: "—", description: "The text, controlled. With paste pills on it carries a `pasteMarker(id)` per pill. Use `draft` to control pills and attachments too." },
        { name: "defaultValue", type: `string`, default: "—", description: "The starting text, uncontrolled. Ignored when `value` or `draft` is given." },
        { name: "onChange", type: `(value: string) => void`, default: "—", description: "Called with the new text when the person edits it, and with `\"\"` after a send. Not called by `setDraft`." },
        { name: "draft", type: `PromptDraft`, default: "—", description: "The whole draft, controlled: text, paste pills and attachments, as JSON. Wins over `value`." },
        { name: "defaultDraft", type: `PromptDraft`, default: "—", description: "The starting draft, uncontrolled. Wins over `defaultValue`." },
        { name: "onDraftChange", type: `(draft: PromptDraft) => void`, default: "—", description: "Called with the whole draft on any change the person makes, and when `persistAttachment` resolves a `ref`. Not called by `setDraft`." },
        { name: "persistAttachment", type: `(file, entry) => string | undefined | Promise<…>`, default: "—", description: "Store an attached or pasted file and return a handle; it becomes the entry's `ref`. Omit it and a draft carries file metadata only." },
        { name: "restoreAttachment", type: `(entry) => File | undefined | Promise<…>`, default: "—", description: "Get a File back for a restored entry. Return `undefined` and the chip still shows; `onSubmit` gets its `ref` and no `file`." },
    ],
    notes: (
        <p>
            A <code>ref</code> resolves to a <code>PromptInputHandle</code>: <code>getDraft()</code>,{" "}
            <code>setDraft(draft, {"{ focus?: false }"})</code> and <code>focus()</code>. A draft whose{" "}
            <code>v</code> is unknown is refused with a console warning. Each attachment chip carries a
            stable <code>data-react-fancy-prompt-input-attachment="&lt;id&gt;"</code> handle.
        </p>
    ),
};
