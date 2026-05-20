import type { ComponentDoc } from "./types";
import { Action, Dropdown, Icon } from "@particle-academy/react-fancy";

export const dropdownDoc: ComponentDoc = {
    intro: (
        <p>
            A floating menu anchored to a trigger. Compound: <code>Dropdown.Trigger</code>
            wraps any element (usually a button), <code>Dropdown.Items</code> holds
            <code>Dropdown.Item</code> children. Floating UI handles flipping + collisions
            automatically.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Click the trigger to open. Items close the menu on click.",
            render: () => (
                <Dropdown>
                    <Dropdown.Trigger>
                        <Action variant="ghost" iconTrailing="chevron-down">Account</Action>
                    </Dropdown.Trigger>
                    <Dropdown.Items>
                        <Dropdown.Item>Profile</Dropdown.Item>
                        <Dropdown.Item>Settings</Dropdown.Item>
                        <Dropdown.Item>Sign out</Dropdown.Item>
                    </Dropdown.Items>
                </Dropdown>
            ),
            code: `<Dropdown>
    <Dropdown.Trigger>
        <Action variant="ghost" iconTrailing="chevron-down">Account</Action>
    </Dropdown.Trigger>
    <Dropdown.Items>
        <Dropdown.Item>Profile</Dropdown.Item>
        <Dropdown.Item>Settings</Dropdown.Item>
        <Dropdown.Item>Sign out</Dropdown.Item>
    </Dropdown.Items>
</Dropdown>`,
        },
        {
            name: "With separator + danger item",
            description: "Use `Dropdown.Separator` to group items. The `danger` prop reds out an item — typically destructive actions.",
            render: () => (
                <Dropdown>
                    <Dropdown.Trigger>
                        <Action variant="ghost" iconTrailing="chevron-down">More</Action>
                    </Dropdown.Trigger>
                    <Dropdown.Items>
                        <Dropdown.Item>Open</Dropdown.Item>
                        <Dropdown.Item>Rename</Dropdown.Item>
                        <Dropdown.Item>Duplicate</Dropdown.Item>
                        <Dropdown.Separator />
                        <Dropdown.Item danger>Delete</Dropdown.Item>
                    </Dropdown.Items>
                </Dropdown>
            ),
            code: `<Dropdown>
    <Dropdown.Trigger><Action>More</Action></Dropdown.Trigger>
    <Dropdown.Items>
        <Dropdown.Item>Open</Dropdown.Item>
        <Dropdown.Item>Rename</Dropdown.Item>
        <Dropdown.Item>Duplicate</Dropdown.Item>
        <Dropdown.Separator />
        <Dropdown.Item danger>Delete</Dropdown.Item>
    </Dropdown.Items>
</Dropdown>`,
        },
        {
            name: "Placement",
            description: "Floating UI auto-flips, but you can hint the preferred side.",
            render: () => (
                <Dropdown placement="top-start">
                    <Dropdown.Trigger>
                        <Action variant="ghost">Open above</Action>
                    </Dropdown.Trigger>
                    <Dropdown.Items>
                        <Dropdown.Item>One</Dropdown.Item>
                        <Dropdown.Item>Two</Dropdown.Item>
                    </Dropdown.Items>
                </Dropdown>
            ),
            code: `<Dropdown placement="top-start" offset={8}>
    <Dropdown.Trigger>…</Dropdown.Trigger>
    <Dropdown.Items>…</Dropdown.Items>
</Dropdown>`,
        },
        {
            name: "Disabled item",
            description: "Disabled items stay visible but unfocusable and don't fire `onClick`.",
            render: () => (
                <Dropdown>
                    <Dropdown.Trigger>
                        <Action variant="ghost">Actions</Action>
                    </Dropdown.Trigger>
                    <Dropdown.Items>
                        <Dropdown.Item>Available</Dropdown.Item>
                        <Dropdown.Item disabled>Locked (pro only)</Dropdown.Item>
                    </Dropdown.Items>
                </Dropdown>
            ),
            code: `<Dropdown.Item disabled>Locked (pro only)</Dropdown.Item>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "Should contain a `Dropdown.Trigger` and a `Dropdown.Items`." },
        { name: "placement", type: `Placement`, default: `"bottom-start"`, description: "Preferred placement (`top`, `bottom`, `left`, `right` plus `-start` / `-end` modifiers). Auto-flips on collision." },
        { name: "offset", type: `number`, default: `4`, description: "Pixel gap between the trigger and the floating menu." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Item props:</strong> <code>onClick</code> fires when the item is activated.
            <code>disabled</code> stops focus + clicks. <code>danger</code> styles the item red
            for destructive actions. Items close the menu by default on click.
        </p>
    ),
};
