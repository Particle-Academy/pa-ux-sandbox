import type { ComponentDoc } from "./types";
import { PromptInput, Text } from "@particle-academy/react-fancy";

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
    ],
};
