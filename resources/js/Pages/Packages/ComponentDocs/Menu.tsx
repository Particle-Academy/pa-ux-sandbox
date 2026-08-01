import type { ComponentDoc } from "./types";
import { Badge, Icon, Menu } from "@particle-academy/react-fancy";

export const menuDoc: ComponentDoc = {
    intro: (
        <p>
            Generic inline menu list — vertical (sidebars) or horizontal (toolbars). Distinct
            from <code>Dropdown</code> in that <code>Menu</code> is always-visible, not floating.
            Compound: <code>Menu.Item</code>, <code>Menu.Group</code>, <code>Menu.Submenu</code>.
        </p>
    ),
    examples: [
        {
            name: "Vertical (default)",
            description: "Useful inside sidebars / pickers / settings sections.",
            render: () => (
                <div className="rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
                    <Menu className="w-56">
                        <Menu.Item icon={<Icon name="home" />} active>Dashboard</Menu.Item>
                        <Menu.Item icon={<Icon name="rocket" />}>Launches</Menu.Item>
                        <Menu.Item icon={<Icon name="users" />} badge={<Badge size="sm" color="violet">3</Badge>}>Team</Menu.Item>
                        <Menu.Item icon={<Icon name="cog" />}>Settings</Menu.Item>
                    </Menu>
                </div>
            ),
            code: `<Menu>
    <Menu.Item icon={<Icon name="home" />} active>Dashboard</Menu.Item>
    <Menu.Item icon={<Icon name="rocket" />}>Launches</Menu.Item>
    <Menu.Item
        icon={<Icon name="users" />}
        badge={<Badge size="sm" color="violet">3</Badge>}
    >
        Team
    </Menu.Item>
    <Menu.Item icon={<Icon name="cog" />}>Settings</Menu.Item>
</Menu>`,
        },
        {
            name: "Horizontal",
            description: "Good for toolbar-style menus.",
            render: () => (
                <Menu orientation="horizontal">
                    <Menu.Item active>Edit</Menu.Item>
                    <Menu.Item>View</Menu.Item>
                    <Menu.Item>Insert</Menu.Item>
                    <Menu.Item>Help</Menu.Item>
                </Menu>
            ),
            code: `<Menu orientation="horizontal">
    <Menu.Item active>Edit</Menu.Item>
    <Menu.Item>View</Menu.Item>
    <Menu.Item>Insert</Menu.Item>
    <Menu.Item>Help</Menu.Item>
</Menu>`,
        },
        {
            name: "Groups",
            description: "`Menu.Group` adds a small uppercase section header.",
            render: () => (
                <div className="rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
                    <Menu className="w-56">
                        <Menu.Group label="Workspace">
                            <Menu.Item icon={<Icon name="home" />} active>Dashboard</Menu.Item>
                            <Menu.Item icon={<Icon name="rocket" />}>Launches</Menu.Item>
                        </Menu.Group>
                        <Menu.Group label="Admin">
                            <Menu.Item icon={<Icon name="users" />}>Team</Menu.Item>
                            <Menu.Item icon={<Icon name="cog" />}>Settings</Menu.Item>
                        </Menu.Group>
                    </Menu>
                </div>
            ),
            code: `<Menu>
    <Menu.Group label="Workspace">
        <Menu.Item icon={<Icon name="home" />} active>Dashboard</Menu.Item>
        <Menu.Item icon={<Icon name="rocket" />}>Launches</Menu.Item>
    </Menu.Group>
    <Menu.Group label="Admin">…</Menu.Group>
</Menu>`,
        },
        {
            name: "Submenu",
            description: "Expandable submenus nest inside any vertical menu.",
            render: () => (
                <div className="rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
                    <Menu className="w-56">
                        <Menu.Item icon={<Icon name="home" />} active>Dashboard</Menu.Item>
                        <Menu.Submenu label="Reports" icon={<Icon name="chart-column" />} defaultOpen>
                            <Menu.Item>Daily</Menu.Item>
                            <Menu.Item>Weekly</Menu.Item>
                            <Menu.Item>Monthly</Menu.Item>
                        </Menu.Submenu>
                    </Menu>
                </div>
            ),
            code: `<Menu>
    <Menu.Item icon={<Icon name="home" />} active>Dashboard</Menu.Item>
    <Menu.Submenu label="Reports" icon={<Icon name="chart-column" />} defaultOpen>
        <Menu.Item>Daily</Menu.Item>
        <Menu.Item>Weekly</Menu.Item>
        <Menu.Item>Monthly</Menu.Item>
    </Menu.Submenu>
</Menu>`,
        },
    ],
    props: [
        { name: "orientation", type: `"horizontal" | "vertical"`, default: `"vertical"`, description: "Layout direction. Horizontal is good for toolbar-style menus." },
        { name: "children", type: `ReactNode`, default: "—", description: "Items — `Menu.Item`, `Menu.Group`, `Menu.Submenu`." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Item props:</strong> <code>icon</code>, <code>active</code>,
            <code>disabled</code>, <code>badge</code>, <code>href</code>, <code>onClick</code>.
            Submenus aren't supported in horizontal mode.
        </p>
    ),
};
