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

const WORKSPACES = ["fancy", "tynn", "moic", "prism"];
const ACTIONS = ["Open settings", "New terminal", "Toggle theme"];

/**
 * A palette that filters for itself: "w> " narrows to workspaces, anything else
 * searches actions. The built-in filter would hide every item, because no item's
 * text contains "w> ".
 */
function PrefixPaletteDemo() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const workspaceMode = query.startsWith("w> ");
    const term = (workspaceMode ? query.slice(3) : query).toLowerCase();
    const shown = (workspaceMode ? WORKSPACES : ACTIONS).filter((x) => x.toLowerCase().includes(term));

    return (
        <>
            <Button onClick={() => setOpen(true)} iconTrailing="search">
                Open a prefix palette
            </Button>
            <Command
                open={open}
                onClose={() => setOpen(false)}
                shouldFilter={false}
                query={query}
                onQueryChange={setQuery}
            >
                <Command.Input placeholder='Search actions, or "w> " for workspaces…' />
                <Command.List>
                    <Command.Group heading={workspaceMode ? "Workspaces" : "Actions"}>
                        {shown.map((x) => (
                            <Command.Item key={x} onSelect={() => setOpen(false)}>
                                {x}
                            </Command.Item>
                        ))}
                    </Command.Group>
                    {shown.length === 0 && <Command.Empty>No matches.</Command.Empty>}
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
        {
            name: "shouldFilter={false} — your own matching",
            description:
                "Turn off the built-in filter when the palette matches for itself, for example type-ahead prefixes where w> narrows to workspaces. Every Command.Item you render shows; you decide which to render. query and onQueryChange hand you the search text. The input, keyboard navigation and Escape work as usual. Try typing w> mo.",
            render: () => <PrefixPaletteDemo />,
            code: `const [query, setQuery] = useState("");
const workspaceMode = query.startsWith("w> ");
const term = workspaceMode ? query.slice(3) : query;
const shown = (workspaceMode ? workspaces : actions).filter((x) => x.includes(term));

<Command open={open} onClose={close} shouldFilter={false} query={query} onQueryChange={setQuery}>
    <Command.Input />
    <Command.List>
        {shown.map((x) => <Command.Item key={x} onSelect={() => run(x)}>{x}</Command.Item>)}
    </Command.List>
</Command>`,
        },
    ],
    props: [
        { name: "open", type: `boolean`, default: "—", description: "Controlled open state. Required." },
        { name: "onClose", type: `() => void`, default: "—", description: "Called when Escape or backdrop click dismisses the palette. Required." },
        { name: "children", type: `ReactNode`, default: "—", description: "Should contain a `Command.Input` and a `Command.List`." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the palette panel." },
        { name: "shouldFilter", type: `boolean`, default: `true`, description: "`false` turns off the built-in filter: every item renders and you decide which to render. Same name as cmdk's." },
        { name: "query", type: `string`, default: "—", description: "The search text, if you want to own it — which filtering yourself needs." },
        { name: "onQueryChange", type: `(query: string) => void`, default: "—", description: "Called as the search text changes." },
    ],
    notes: (
        <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
            <p><strong>Item props:</strong> <code>onSelect</code>, <code>value</code> (used for filter matching when children isn't a string).</p>
            <p><strong>Group props:</strong> <code>heading</code> renders a small uppercase section label.</p>
            <p><strong>Empty:</strong> always renders what you give it — it does not count the visible items itself. Render it only when your results are empty, as the shouldFilter example does.</p>
            <p><strong>Keyboard:</strong> focus stays in the input. Up/Down move the active item (announced via <code>aria-activedescendant</code>); Enter picks it, or the first visible item when none is active.</p>
        </div>
    ),
};
