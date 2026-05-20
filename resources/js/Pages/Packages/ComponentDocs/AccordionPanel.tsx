import type { ComponentDoc } from "./types";
import { AccordionPanel, Icon, Text } from "@particle-academy/react-fancy";

export const accordionPanelDoc: ComponentDoc = {
    intro: (
        <p>
            A richer accordion for app shells and toolbars. Adds horizontal layout, pinned
            sections (that never collapse), render-prop triggers, and per-state class hooks.
            Use this when <code>Accordion</code> isn't expressive enough.
        </p>
    ),
    examples: [
        {
            name: "Vertical panel",
            description: "Vertical orientation. `id` is the stable identifier for each section.",
            render: () => (
                <AccordionPanel orientation="vertical" defaultValue={["overview"]} className="w-full max-w-md rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                    <AccordionPanel.Section id="overview" className="p-3">
                        <AccordionPanel.Trigger>Overview</AccordionPanel.Trigger>
                        <AccordionPanel.Content>
                            <Text size="sm">Summary of the entity.</Text>
                        </AccordionPanel.Content>
                    </AccordionPanel.Section>
                    <AccordionPanel.Section id="activity" className="p-3">
                        <AccordionPanel.Trigger>Activity</AccordionPanel.Trigger>
                        <AccordionPanel.Content>
                            <Text size="sm">Recent events for this entity.</Text>
                        </AccordionPanel.Content>
                    </AccordionPanel.Section>
                </AccordionPanel>
            ),
            code: `<AccordionPanel orientation="vertical" defaultValue={["overview"]}>
    <AccordionPanel.Section id="overview">
        <AccordionPanel.Trigger>Overview</AccordionPanel.Trigger>
        <AccordionPanel.Content>
            <Text size="sm">Summary of the entity.</Text>
        </AccordionPanel.Content>
    </AccordionPanel.Section>
    <AccordionPanel.Section id="activity">
        <AccordionPanel.Trigger>Activity</AccordionPanel.Trigger>
        <AccordionPanel.Content>
            <Text size="sm">Recent events.</Text>
        </AccordionPanel.Content>
    </AccordionPanel.Section>
</AccordionPanel>`,
        },
        {
            name: "Horizontal panel (toolbar)",
            description: "Lay sections out as a horizontal split-pane. Useful for editor sidebars / chat panels.",
            render: () => (
                <AccordionPanel orientation="horizontal" defaultValue={["docs"]} className="flex h-32 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <AccordionPanel.Section id="docs" className="p-3">
                        <AccordionPanel.Trigger>Docs</AccordionPanel.Trigger>
                        <AccordionPanel.Content><Text size="xs">Doc content</Text></AccordionPanel.Content>
                    </AccordionPanel.Section>
                    <AccordionPanel.Section id="logs" className="p-3">
                        <AccordionPanel.Trigger>Logs</AccordionPanel.Trigger>
                        <AccordionPanel.Content><Text size="xs">Log content</Text></AccordionPanel.Content>
                    </AccordionPanel.Section>
                    <AccordionPanel.Section id="chat" className="p-3">
                        <AccordionPanel.Trigger>Chat</AccordionPanel.Trigger>
                        <AccordionPanel.Content><Text size="xs">Chat content</Text></AccordionPanel.Content>
                    </AccordionPanel.Section>
                </AccordionPanel>
            ),
            code: `<AccordionPanel orientation="horizontal" defaultValue={["docs"]}>
    <AccordionPanel.Section id="docs">
        <AccordionPanel.Trigger>Docs</AccordionPanel.Trigger>
        <AccordionPanel.Content>…</AccordionPanel.Content>
    </AccordionPanel.Section>
    <AccordionPanel.Section id="logs">…</AccordionPanel.Section>
    <AccordionPanel.Section id="chat">…</AccordionPanel.Section>
</AccordionPanel>`,
        },
        {
            name: "Pinned section",
            description: "A pinned section never collapses — use it for an anchor item like Home.",
            render: () => (
                <AccordionPanel orientation="vertical" className="w-full max-w-md rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <AccordionPanel.Section id="home" pinned className="p-3">
                        <AccordionPanel.Trigger>
                            <span className="flex items-center gap-2"><Icon name="home" /> Home (pinned)</span>
                        </AccordionPanel.Trigger>
                        <AccordionPanel.Content><Text size="sm">Always visible.</Text></AccordionPanel.Content>
                    </AccordionPanel.Section>
                    <AccordionPanel.Section id="reports" className="p-3">
                        <AccordionPanel.Trigger>Reports</AccordionPanel.Trigger>
                        <AccordionPanel.Content><Text size="sm">Toggles normally.</Text></AccordionPanel.Content>
                    </AccordionPanel.Section>
                </AccordionPanel>
            ),
            code: `<AccordionPanel.Section id="home" pinned>
    <AccordionPanel.Trigger>Home</AccordionPanel.Trigger>
    <AccordionPanel.Content>Always visible.</AccordionPanel.Content>
</AccordionPanel.Section>`,
        },
        {
            name: "Render-prop trigger",
            description: "Trigger children may be a function — receive `{ open, toggle, orientation }` and render custom UI.",
            render: () => (
                <AccordionPanel orientation="vertical" defaultValue={["a"]} className="w-full max-w-md rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <AccordionPanel.Section id="a" className="p-3">
                        <AccordionPanel.Trigger>
                            {({ open }) => (
                                <span className="flex items-center justify-between">
                                    Section A
                                    <span className="font-mono text-[10px] opacity-70">{open ? "open" : "closed"}</span>
                                </span>
                            )}
                        </AccordionPanel.Trigger>
                        <AccordionPanel.Content>
                            <Text size="sm">Triggered by a render-prop.</Text>
                        </AccordionPanel.Content>
                    </AccordionPanel.Section>
                </AccordionPanel>
            ),
            code: `<AccordionPanel.Trigger>
    {({ open, toggle }) => (
        <span>
            Section A
            <span className="opacity-70">{open ? "open" : "closed"}</span>
        </span>
    )}
</AccordionPanel.Trigger>`,
        },
    ],
    props: [
        { name: "orientation", type: `"horizontal" | "vertical"`, default: `"horizontal"`, description: "Layout direction." },
        { name: "value", type: `string[]`, default: "—", description: "Controlled list of open section ids." },
        { name: "defaultValue", type: `string[]`, default: `[]`, description: "Default open ids when uncontrolled." },
        { name: "onValueChange", type: `(open: string[]) => void`, default: "—", description: "Fires whenever the open set changes." },
        { name: "children", type: `ReactNode`, default: "—", description: "One or more `AccordionPanel.Section` children." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root container." },
    ],
    notes: (
        <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
            <p><strong>Section props:</strong> <code>id</code> (required), <code>pinned</code>, <code>openClassName</code>, <code>closedClassName</code>, <code>unstyled</code>.</p>
            <p><strong>Trigger:</strong> <code>children</code> can be a node or a render-prop. Render-prop receives <code>&#123; id, open, orientation, toggle &#125;</code>.</p>
        </div>
    ),
};
