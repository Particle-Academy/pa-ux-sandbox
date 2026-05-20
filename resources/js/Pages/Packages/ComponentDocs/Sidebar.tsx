import type { ComponentDoc } from "./types";
import { Badge, Icon, Sidebar } from "@particle-academy/react-fancy";

export const sidebarDoc: ComponentDoc = {
    intro: (
        <p>
            Vertical app navigation. Compound: <code>Sidebar.Item</code>,
            <code>Sidebar.Group</code>, <code>Sidebar.Submenu</code>, and a
            <code>Sidebar.Toggle</code> for collapsing. When collapsed, items either show
            their icon or the first three letters of the label.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Flat list of items — pass `icon`, `active`, `badge` as needed.",
            render: () => (
                <div className="rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
                    <Sidebar className="w-56">
                        <Sidebar.Item icon={<Icon name="home" />} href="#" active>Dashboard</Sidebar.Item>
                        <Sidebar.Item icon={<Icon name="rocket" />} href="#">Launches</Sidebar.Item>
                        <Sidebar.Item icon={<Icon name="users" />} href="#" badge={<Badge size="sm" color="violet">3</Badge>}>Team</Sidebar.Item>
                        <Sidebar.Item icon={<Icon name="cog" />} href="#">Settings</Sidebar.Item>
                    </Sidebar>
                </div>
            ),
            code: `<Sidebar>
    <Sidebar.Item icon={<Icon name="home" />} href="/" active>Dashboard</Sidebar.Item>
    <Sidebar.Item icon={<Icon name="rocket" />} href="/launches">Launches</Sidebar.Item>
    <Sidebar.Item
        icon={<Icon name="users" />}
        href="/team"
        badge={<Badge size="sm" color="violet">3</Badge>}
    >
        Team
    </Sidebar.Item>
    <Sidebar.Item icon={<Icon name="cog" />} href="/settings">Settings</Sidebar.Item>
</Sidebar>`,
        },
        {
            name: "Groups",
            description: "Use `Sidebar.Group` to add a small uppercase section label.",
            render: () => (
                <div className="rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
                    <Sidebar className="w-56">
                        <Sidebar.Group label="Workspace">
                            <Sidebar.Item icon={<Icon name="home" />} href="#" active>Dashboard</Sidebar.Item>
                            <Sidebar.Item icon={<Icon name="rocket" />} href="#">Launches</Sidebar.Item>
                        </Sidebar.Group>
                        <Sidebar.Group label="Admin">
                            <Sidebar.Item icon={<Icon name="users" />} href="#">Team</Sidebar.Item>
                            <Sidebar.Item icon={<Icon name="cog" />} href="#">Settings</Sidebar.Item>
                        </Sidebar.Group>
                    </Sidebar>
                </div>
            ),
            code: `<Sidebar>
    <Sidebar.Group label="Workspace">
        <Sidebar.Item icon={<Icon name="home" />} active>Dashboard</Sidebar.Item>
        <Sidebar.Item icon={<Icon name="rocket" />}>Launches</Sidebar.Item>
    </Sidebar.Group>
    <Sidebar.Group label="Admin">
        <Sidebar.Item icon={<Icon name="users" />}>Team</Sidebar.Item>
        <Sidebar.Item icon={<Icon name="cog" />}>Settings</Sidebar.Item>
    </Sidebar.Group>
</Sidebar>`,
        },
        {
            name: "Submenu",
            description: "`Sidebar.Submenu` expands to show nested items.",
            render: () => (
                <div className="rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
                    <Sidebar className="w-56">
                        <Sidebar.Item icon={<Icon name="home" />} href="#" active>Dashboard</Sidebar.Item>
                        <Sidebar.Submenu label="Reports" icon={<Icon name="chart" />} defaultOpen>
                            <Sidebar.Item href="#">Daily</Sidebar.Item>
                            <Sidebar.Item href="#">Weekly</Sidebar.Item>
                            <Sidebar.Item href="#">Monthly</Sidebar.Item>
                        </Sidebar.Submenu>
                    </Sidebar>
                </div>
            ),
            code: `<Sidebar>
    <Sidebar.Item icon={<Icon name="home" />} active>Dashboard</Sidebar.Item>
    <Sidebar.Submenu label="Reports" icon={<Icon name="chart" />} defaultOpen>
        <Sidebar.Item>Daily</Sidebar.Item>
        <Sidebar.Item>Weekly</Sidebar.Item>
        <Sidebar.Item>Monthly</Sidebar.Item>
    </Sidebar.Submenu>
</Sidebar>`,
        },
        {
            name: "Collapsed (icons mode)",
            description: "When `collapsed`, items shrink to icons. Add `Sidebar.Toggle` to let the user flip it.",
            render: () => (
                <div className="rounded-md border border-zinc-200 p-2 dark:border-zinc-800">
                    <Sidebar collapsed>
                        <Sidebar.Item icon={<Icon name="home" />} href="#" active>Dashboard</Sidebar.Item>
                        <Sidebar.Item icon={<Icon name="rocket" />} href="#">Launches</Sidebar.Item>
                        <Sidebar.Item icon={<Icon name="users" />} href="#">Team</Sidebar.Item>
                        <Sidebar.Item icon={<Icon name="cog" />} href="#">Settings</Sidebar.Item>
                    </Sidebar>
                </div>
            ),
            code: `const [collapsed, setCollapsed] = useState(false);

<Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed}>
    <Sidebar.Toggle />
    <Sidebar.Item icon={<Icon name="home" />} active>Dashboard</Sidebar.Item>
    …
</Sidebar>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "Sidebar items — `Sidebar.Item`, `Sidebar.Group`, `Sidebar.Submenu`, `Sidebar.Toggle`." },
        { name: "collapsed", type: `boolean`, default: "—", description: "Controlled collapsed state. Use with `onCollapsedChange`." },
        { name: "defaultCollapsed", type: `boolean`, default: `false`, description: "Initial collapsed state when uncontrolled." },
        { name: "onCollapsedChange", type: `(collapsed: boolean) => void`, default: "—", description: "Called when the user collapses / expands via `Sidebar.Toggle`." },
        { name: "collapseMode", type: `"icons" | "letters"`, default: `"icons"`, description: "When collapsed: show icons (fallback to first 3 letters) or always show letters." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root aside element." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Item props:</strong> <code>icon</code>, <code>active</code>,
            <code>disabled</code>, <code>badge</code>, <code>href</code>, <code>onClick</code>.
            When the sidebar is collapsed and an item has no icon, the first 3 letters of the
            label are used.
        </p>
    ),
};
