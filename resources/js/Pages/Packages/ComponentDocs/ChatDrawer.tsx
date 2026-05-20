import type { ComponentDoc } from "./types";
import { useState } from "react";
import { ChatDrawer, Text } from "@particle-academy/react-fancy";

function ChatDrawerDemo() {
    const [tab, setTab] = useState("files");
    const [open, setOpen] = useState(true);
    return (
        <ChatDrawer
            tabs={[
                { id: "files", label: "Files" },
                { id: "tools", label: "Tools" },
                { id: "prompts", label: "Prompts" },
            ]}
            activeTabId={tab}
            onTabChange={setTab}
            open={open}
            onToggle={setOpen}
            minBodyHeight={120}
            className="w-full max-w-md rounded-lg border border-zinc-200 dark:border-zinc-800"
        >
            <div className="p-3">
                <Text size="sm" weight="semibold">{tab}</Text>
                <Text size="xs" className="mt-1">Active tab body — drop file picker, tools list, prompt library, etc.</Text>
            </div>
        </ChatDrawer>
    );
}

export const chatDrawerDoc: ComponentDoc = {
    intro: (
        <p>
            Tabbed expandable panel — the surface above a <code>PromptInput</code> that holds
            file pickers, prompt libraries, tool toggles. Tabs flip the body content; the
            chevron collapses the body without losing the tab strip.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Three tabs + a collapsible body. The active tab's content goes in `children`.",
            render: () => <ChatDrawerDemo />,
            code: `const [tab, setTab] = useState("files");
const [open, setOpen] = useState(true);

<ChatDrawer
    tabs={[
        { id: "files", label: "Files" },
        { id: "tools", label: "Tools" },
        { id: "prompts", label: "Prompts" },
    ]}
    activeTabId={tab}
    onTabChange={setTab}
    open={open}
    onToggle={setOpen}
>
    {tab === "files" && <FilesPanel />}
    {tab === "tools" && <ToolsPanel />}
    {tab === "prompts" && <PromptsPanel />}
</ChatDrawer>`,
        },
        {
            name: "Inside PromptInput",
            description: "ChatDrawer is designed to slot into PromptInput's `aboveInput` so the drawer and composer share one visual panel.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    See the <code>PromptInput</code> component page for the integration recipe.
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
        { name: "tabs", type: `ChatDrawerTab[]`, default: "—", description: "Tab definitions — `{ id, label }`." },
        { name: "activeTabId", type: `string`, default: "—", description: "Currently active tab id. Controlled — pair with `onTabChange`." },
        { name: "onTabChange", type: `(id: string) => void`, default: "—", description: "Called when the user picks a different tab." },
        { name: "open", type: `boolean`, default: `true`, description: "Whether the body is expanded." },
        { name: "onToggle", type: `(open: boolean) => void`, default: "—", description: "Called when the user clicks the chevron." },
        { name: "children", type: `ReactNode`, default: "—", description: "Body content for the active tab — render conditionally based on `activeTabId`." },
        { name: "minBodyHeight", type: `number`, default: `140`, description: "Min height of the body (px) when open." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
    ],
};
