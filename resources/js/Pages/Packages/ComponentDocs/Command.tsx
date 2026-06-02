import type { ComponentDoc } from "./types";
import { useState } from "react";
import { Button, Command } from "@particle-academy/react-fancy";

function CommandDemo() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button onClick={() => setOpen(true)} iconTrailing="search">
                Open command palette
            </Button>
            <Command open={open} onClose={() => setOpen(false)}>
                <Command.Input placeholder="Type a command…" />
                <Command.List>
                    <Command.Group heading="Workspace">
                        <Command.Item onSelect={() => setOpen(false)}>Go to Dashboard</Command.Item>
                        <Command.Item onSelect={() => setOpen(false)}>Create launch</Command.Item>
                    </Command.Group>
                    <Command.Group heading="Account">
                        <Command.Item onSelect={() => setOpen(false)}>Settings</Command.Item>
                        <Command.Item onSelect={() => setOpen(false)}>Sign out</Command.Item>
                    </Command.Group>
                    <Command.Empty>No commands match.</Command.Empty>
                </Command.List>
            </Command>
        </>
    );
}

export const commandDoc: ComponentDoc = {
    intro: (
        <p>
            Quick-search command palette — the ⌘+K experience. Controlled; bind
            <code>open</code> + <code>onClose</code> to your global keyboard shortcut.
            Items are filtered against <code>Command.Input</code> automatically.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Click to open. Type to filter. Up/Down/Enter to navigate; Esc to close.",
            render: () => <CommandDemo />,
            code: `const [open, setOpen] = useState(false);

// Wire ⌘+K globally:
useHotkey("mod+k", () => setOpen(true));

<Command open={open} onClose={() => setOpen(false)}>
    <Command.Input placeholder="Type a command…" />
    <Command.List>
        <Command.Group heading="Workspace">
            <Command.Item onSelect={() => router.visit("/")}>Go to Dashboard</Command.Item>
            <Command.Item onSelect={() => createLaunch()}>Create launch</Command.Item>
        </Command.Group>
        <Command.Group heading="Account">
            <Command.Item onSelect={() => router.visit("/settings")}>Settings</Command.Item>
            <Command.Item onSelect={() => signOut()}>Sign out</Command.Item>
        </Command.Group>
        <Command.Empty>No commands match.</Command.Empty>
    </Command.List>
</Command>`,
        },
    ],
    props: [
        { name: "open", type: `boolean`, default: "—", description: "Controlled open state. Required." },
        { name: "onClose", type: `() => void`, default: "—", description: "Called when Escape or backdrop click dismisses the palette. Required." },
        { name: "children", type: `ReactNode`, default: "—", description: "Should contain a `Command.Input` and a `Command.List`." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the palette panel." },
    ],
    notes: (
        <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
            <p><strong>Item props:</strong> <code>onSelect</code>, <code>value</code> (used for filter matching when children isn't a string).</p>
            <p><strong>Group props:</strong> <code>heading</code> renders a small uppercase section label.</p>
            <p><strong>Empty:</strong> shows when no items match the current query.</p>
        </div>
    ),
};
