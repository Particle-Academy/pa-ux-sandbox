import type { ComponentDoc } from "./types";
import { ContextMenu, Text } from "@particle-academy/react-fancy";

export const contextMenuDoc: ComponentDoc = {
    intro: (
        <p>
            Right-click menu (or long-press on touch). Wraps a region; right-clicking inside
            opens a floating menu at the cursor. Compound: <code>ContextMenu.Trigger</code>,
            <code>ContextMenu.Content</code>, <code>ContextMenu.Item</code>,
            <code>ContextMenu.Separator</code>, plus <code>Sub</code> / <code>SubTrigger</code> /
            <code>SubContent</code> for nested menus.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Right-click inside the bordered area to open the menu.",
            render: () => (
                <ContextMenu>
                    <ContextMenu.Trigger>
                        <div className="grid h-24 w-full max-w-sm place-items-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
                            Right-click me
                        </div>
                    </ContextMenu.Trigger>
                    <ContextMenu.Content>
                        <ContextMenu.Item>Cut</ContextMenu.Item>
                        <ContextMenu.Item>Copy</ContextMenu.Item>
                        <ContextMenu.Item>Paste</ContextMenu.Item>
                        <ContextMenu.Separator />
                        <ContextMenu.Item danger>Delete</ContextMenu.Item>
                    </ContextMenu.Content>
                </ContextMenu>
            ),
            code: `<ContextMenu>
    <ContextMenu.Trigger>
        <div>Right-click me</div>
    </ContextMenu.Trigger>
    <ContextMenu.Content>
        <ContextMenu.Item>Cut</ContextMenu.Item>
        <ContextMenu.Item>Copy</ContextMenu.Item>
        <ContextMenu.Item>Paste</ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item danger>Delete</ContextMenu.Item>
    </ContextMenu.Content>
</ContextMenu>`,
        },
        {
            name: "Submenu",
            description: "Use `Sub` + `SubTrigger` + `SubContent` for nested groups.",
            render: () => (
                <ContextMenu>
                    <ContextMenu.Trigger>
                        <div className="grid h-24 w-full max-w-sm place-items-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
                            Right-click for submenu
                        </div>
                    </ContextMenu.Trigger>
                    <ContextMenu.Content>
                        <ContextMenu.Item>New file</ContextMenu.Item>
                        <ContextMenu.Sub>
                            <ContextMenu.SubTrigger>Share with…</ContextMenu.SubTrigger>
                            <ContextMenu.SubContent>
                                <ContextMenu.Item>Team</ContextMenu.Item>
                                <ContextMenu.Item>Public</ContextMenu.Item>
                                <ContextMenu.Item>Specific people…</ContextMenu.Item>
                            </ContextMenu.SubContent>
                        </ContextMenu.Sub>
                        <ContextMenu.Separator />
                        <ContextMenu.Item danger>Delete</ContextMenu.Item>
                    </ContextMenu.Content>
                </ContextMenu>
            ),
            code: `<ContextMenu.Content>
    <ContextMenu.Item>New file</ContextMenu.Item>
    <ContextMenu.Sub>
        <ContextMenu.SubTrigger>Share with…</ContextMenu.SubTrigger>
        <ContextMenu.SubContent>
            <ContextMenu.Item>Team</ContextMenu.Item>
            <ContextMenu.Item>Public</ContextMenu.Item>
            <ContextMenu.Item>Specific people…</ContextMenu.Item>
        </ContextMenu.SubContent>
    </ContextMenu.Sub>
    <ContextMenu.Separator />
    <ContextMenu.Item danger>Delete</ContextMenu.Item>
</ContextMenu.Content>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "Should contain a `ContextMenu.Trigger` and a `ContextMenu.Content`." },
    ],
    notes: (
        <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
            <p><strong>Item props:</strong> <code>onClick</code>, <code>disabled</code>, <code>danger</code>.</p>
            <p><strong>Nesting:</strong> a <code>Sub</code> contains a <code>SubTrigger</code> + <code>SubContent</code>, mirroring the top-level shape.</p>
        </div>
    ),
};
