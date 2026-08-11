import type { ComponentDoc } from "./types";
import { PromptInput, Text } from "@particle-academy/react-fancy";

export const promptInputDoc: ComponentDoc = {
    intro: (
        <p>
            The AI-chat composer. Token-budget meter, <code>/</code>-slash commands,
            <code>@</code>-mentions, attachments, ⌘+Enter to send. Pair with{" "}
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
        { name: "showHint", type: `boolean`, default: `false`, description: "Show the ⌘+Enter hint near the send button." },
        { name: "placeholder", type: `string`, default: "—", description: "Textarea placeholder." },
        { name: "charsPerToken", type: `number`, default: `4`, description: "Rough chars-per-token used by the meter estimator." },
        { name: "mentionColor", type: `Record<string, string>`, default: "—", description: "Map mention `kind` to a CSS color used by the chip." },
        { name: "maxHeight", type: `number`, default: `280`, description: "Max textarea height in px before scrolling." },
        { name: "aboveInput", type: `ReactNode`, default: "—", description: "Rendered inside the rounded shell, above the textarea — usually a `ChatDrawer`." },
    ],
};
