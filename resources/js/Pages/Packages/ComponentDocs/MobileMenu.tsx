import type { ComponentDoc } from "./types";
import { useState } from "react";
import { Button, Icon, MobileMenu } from "@particle-academy/react-fancy";

function FlyoutDemo() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button onClick={() => setOpen(true)}>Open flyout</Button>
            <MobileMenu>
                <MobileMenu.Flyout open={open} onClose={() => setOpen(false)} title="Navigation">
                    <MobileMenu.Item icon={<Icon name="home" />} active>Home</MobileMenu.Item>
                    <MobileMenu.Item icon={<Icon name="rocket" />}>Launches</MobileMenu.Item>
                    <MobileMenu.Item icon={<Icon name="users" />}>Team</MobileMenu.Item>
                    <MobileMenu.Item icon={<Icon name="cog" />}>Settings</MobileMenu.Item>
                </MobileMenu.Flyout>
            </MobileMenu>
        </>
    );
}

export const mobileMenuDoc: ComponentDoc = {
    intro: (
        <p>
            Mobile-specific navigation patterns — an off-canvas flyout (for primary nav) or a
            fixed bottom-bar (for app-shell tabs). The root <code>MobileMenu</code> sets the
            variant context; the child is either <code>Flyout</code> or <code>BottomBar</code>.
        </p>
    ),
    examples: [
        {
            name: "Flyout (off-canvas drawer)",
            description: "Slides in from the side. Toggled by your own state — pair with `Navbar.Toggle`.",
            render: () => <FlyoutDemo />,
            code: `const [open, setOpen] = useState(false);

<MobileMenu>
    <MobileMenu.Flyout open={open} onClose={() => setOpen(false)} title="Navigation">
        <MobileMenu.Item icon={<Icon name="home" />} active>Home</MobileMenu.Item>
        <MobileMenu.Item icon={<Icon name="rocket" />}>Launches</MobileMenu.Item>
        <MobileMenu.Item icon={<Icon name="users" />}>Team</MobileMenu.Item>
        <MobileMenu.Item icon={<Icon name="cog" />}>Settings</MobileMenu.Item>
    </MobileMenu.Flyout>
</MobileMenu>`,
        },
        {
            name: "Bottom bar",
            description: "Fixed-position tab bar at the screen bottom — good for app-shell navigation.",
            render: () => (
                <div className="relative h-32 w-full max-w-sm rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="absolute inset-x-0 bottom-0">
                        <MobileMenu variant="bottom-bar">
                            <MobileMenu.BottomBar>
                                <MobileMenu.Item icon={<Icon name="home" />} active>Home</MobileMenu.Item>
                                <MobileMenu.Item icon={<Icon name="rocket" />}>Launches</MobileMenu.Item>
                                <MobileMenu.Item icon={<Icon name="users" />}>Team</MobileMenu.Item>
                                <MobileMenu.Item icon={<Icon name="cog" />}>Settings</MobileMenu.Item>
                            </MobileMenu.BottomBar>
                        </MobileMenu>
                    </div>
                </div>
            ),
            code: `<MobileMenu variant="bottom-bar">
    <MobileMenu.BottomBar>
        <MobileMenu.Item icon={<Icon name="home" />} active>Home</MobileMenu.Item>
        <MobileMenu.Item icon={<Icon name="rocket" />}>Launches</MobileMenu.Item>
        <MobileMenu.Item icon={<Icon name="users" />}>Team</MobileMenu.Item>
        <MobileMenu.Item icon={<Icon name="cog" />}>Settings</MobileMenu.Item>
    </MobileMenu.BottomBar>
</MobileMenu>`,
        },
        {
            name: "Flyout from the right",
            description: "Set `side` to `\"right\"` for a right-anchored drawer.",
            render: () => {
                const [open, setOpen] = useState(false);
                return (
                    <>
                        <Button onClick={() => setOpen(true)}>Open right flyout</Button>
                        <MobileMenu>
                            <MobileMenu.Flyout open={open} onClose={() => setOpen(false)} side="right" title="Account">
                                <MobileMenu.Item>Profile</MobileMenu.Item>
                                <MobileMenu.Item>Settings</MobileMenu.Item>
                                <MobileMenu.Item>Sign out</MobileMenu.Item>
                            </MobileMenu.Flyout>
                        </MobileMenu>
                    </>
                );
            },
            code: `<MobileMenu.Flyout open={open} onClose={onClose} side="right" title="Account">
    <MobileMenu.Item>Profile</MobileMenu.Item>
    <MobileMenu.Item>Settings</MobileMenu.Item>
    <MobileMenu.Item>Sign out</MobileMenu.Item>
</MobileMenu.Flyout>`,
        },
    ],
    props: [
        { name: "variant", type: `"flyout" | "bottom-bar"`, default: `"flyout"`, description: "Which mobile pattern to use." },
        { name: "children", type: `ReactNode`, default: "—", description: "A `MobileMenu.Flyout` or `MobileMenu.BottomBar` (matching the variant)." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
    ],
    notes: (
        <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
            <p><strong>Flyout props:</strong> <code>open</code>, <code>onClose</code>, <code>side</code>, <code>title</code>.</p>
            <p><strong>Item props:</strong> <code>icon</code>, <code>active</code>, <code>disabled</code>, <code>badge</code>, <code>href</code>, <code>onClick</code>.</p>
        </div>
    ),
};
