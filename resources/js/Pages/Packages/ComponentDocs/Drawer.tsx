import type { ComponentDoc } from "./types";
import { useState } from "react";
import { Button, Drawer, Heading, Text } from "@particle-academy/react-fancy";
import type { DrawerSide, DrawerSize } from "@particle-academy/react-fancy";

function SideDemo({ side }: { side: DrawerSide }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button onClick={() => setOpen(true)}>{side}</Button>
            <Drawer open={open} onClose={() => setOpen(false)} side={side}>
                <Drawer.Header>
                    <Heading size="md">Drawer · {side}</Heading>
                </Drawer.Header>
                <Drawer.Body>
                    <Text size="sm">
                        Slides in from the <code>{side}</code> edge. Escape, the backdrop, and the
                        close button all call <code>onClose</code>.
                    </Text>
                </Drawer.Body>
                <Drawer.Footer>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button color="violet" onClick={() => setOpen(false)}>Save</Button>
                </Drawer.Footer>
            </Drawer>
        </>
    );
}

function SizeDemo({ side, size }: { side: DrawerSide; size: DrawerSize }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button onClick={() => setOpen(true)}>{size}</Button>
            <Drawer open={open} onClose={() => setOpen(false)} side={side} size={size}>
                <Drawer.Header>
                    <Heading size="md">{side} · {size}</Heading>
                </Drawer.Header>
                <Drawer.Body>
                    <Text size="sm">
                        On a {side === "left" || side === "right" ? "horizontal" : "vertical"} edge,
                        <code> size</code> sets the {side === "left" || side === "right" ? "width" : "height"}.
                    </Text>
                </Drawer.Body>
            </Drawer>
        </>
    );
}

/** The attached form — a drawer that stays inside its own box rather than the viewport. */
function AttachedDemo() {
    const [open, setOpen] = useState(false);
    return (
        <Drawer.Container className="h-64 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/40">
            <div className="flex h-full flex-col items-start gap-3 p-4">
                <Heading size="sm">A card, a layout pane, a prompt-input shell</Heading>
                <Text size="sm">
                    This drawer is scoped to the bordered box, not the page. No portal, no body
                    scroll lock, no focus trap — it is a panel, not a dialog.
                </Text>
                <Button onClick={() => setOpen(true)}>Open filters</Button>
            </div>

            <Drawer open={open} onClose={() => setOpen(false)} attach="container" side="bottom" size="sm">
                <Drawer.Header>Filters</Drawer.Header>
                <Drawer.Body>
                    <Text size="sm">Scoped to the container it was rendered in.</Text>
                </Drawer.Body>
            </Drawer>
        </Drawer.Container>
    );
}

export const drawerDoc: ComponentDoc = {
    intro: (
        <p>
            A panel that slides in from any edge. Always controlled — bind <code>open</code> and
            <code>onClose</code> to your own state. Compound: <code>Drawer.Header</code>,
            <code>Drawer.Body</code>, <code>Drawer.Footer</code>. Where <code>Modal</code> is
            always centered over the page, a Drawer anchors to an edge and can be scoped to a
            container instead of the viewport.
        </p>
    ),
    examples: [
        {
            name: "Four sides",
            description: "side takes left, right, top, or bottom. Default is right.",
            render: () => (
                <div className="flex flex-wrap gap-2">
                    <SideDemo side="left" />
                    <SideDemo side="right" />
                    <SideDemo side="top" />
                    <SideDemo side="bottom" />
                </div>
            ),
            code: `const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Open</Button>
<Drawer open={open} onClose={() => setOpen(false)} side="right">
    <Drawer.Header>
        <Heading size="md">Title</Heading>
    </Drawer.Header>
    <Drawer.Body>
        <Text size="sm">Body content.</Text>
    </Drawer.Body>
    <Drawer.Footer>
        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        <Button color="violet" onClick={() => setOpen(false)}>Save</Button>
    </Drawer.Footer>
</Drawer>`,
        },
        {
            name: "Size follows the drawer's own axis",
            description:
                "size sets WIDTH on the left/right edges and HEIGHT on top/bottom — one scale, so it reads the same whichever edge you attach to.",
            render: () => (
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="w-28 text-xs text-zinc-500">right (width)</span>
                        <SizeDemo side="right" size="sm" />
                        <SizeDemo side="right" size="md" />
                        <SizeDemo side="right" size="lg" />
                        <SizeDemo side="right" size="xl" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="w-28 text-xs text-zinc-500">bottom (height)</span>
                        <SizeDemo side="bottom" size="sm" />
                        <SizeDemo side="bottom" size="md" />
                        <SizeDemo side="bottom" size="lg" />
                        <SizeDemo side="bottom" size="xl" />
                    </div>
                </div>
            ),
            code: `// width, because the edge is horizontal
<Drawer side="right" size="lg" open={open} onClose={onClose}>…</Drawer>

// height, because the edge is vertical
<Drawer side="bottom" size="lg" open={open} onClose={onClose}>…</Drawer>`,
        },
        {
            name: "Attached to a container",
            description:
                "attach=\"container\" keeps the drawer inside its own box — a Card, a layout pane, or the shell around a prompt input.",
            render: () => <AttachedDemo />,
            code: `<Drawer.Container className="h-64 rounded-xl border">
    <YourContent />

    <Drawer open={open} onClose={close} attach="container" side="bottom" size="sm">
        <Drawer.Header>Filters</Drawer.Header>
        <Drawer.Body>Scoped to the container.</Drawer.Body>
    </Drawer>
</Drawer.Container>`,
        },
    ],
    props: [
        { name: "open", type: `boolean`, default: "—", description: "Controlled open state.", required: true },
        { name: "onClose", type: `() => void`, default: "—", description: "Called on Escape, backdrop click, or the close button.", required: true },
        { name: "side", type: `"left" | "right" | "top" | "bottom"`, default: `"right"`, description: "Edge the drawer anchors to and slides in from." },
        { name: "size", type: `"sm" | "md" | "lg" | "xl" | "full"`, default: `"md"`, description: "Extent along the drawer's own axis — width on left/right, height on top/bottom." },
        { name: "attach", type: `"viewport" | "container"`, default: `"viewport"`, description: "`viewport` portals and fixes to the screen; `container` stays inside the nearest positioned ancestor." },
        { name: "backdrop", type: `boolean`, default: `true`, description: "Render the scrim behind the panel." },
        { name: "dismissOnBackdrop", type: `boolean`, default: `true`, description: "Clicking the scrim calls `onClose`." },
        { name: "dismissOnEscape", type: `boolean`, default: `true`, description: "Escape calls `onClose`." },
        { name: "children", type: `ReactNode`, default: "—", description: "Compound parts: `Drawer.Header`, `Drawer.Body`, `Drawer.Footer`." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the drawer panel." },
    ],
    notes: (
        <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
            <p>
                <strong>Viewport vs container.</strong> Only the viewport form is a dialog: it
                portals, locks body scroll, traps focus, and sets <code>aria-modal</code>. The
                container form does none of those on purpose — trapping focus inside a card would
                strand keyboard users there.
            </p>
            <p>
                <strong>Container needs a positioned ancestor.</strong> An absolute drawer resolves
                against the nearest positioned parent, so without one it escapes to the viewport and
                looks like <code>attach</code> was ignored. <code>Drawer.Container</code> supplies
                the <code>relative overflow-hidden</code> anchor; any element with those classes
                works just as well.
            </p>
            <p>
                <strong>Reduced motion.</strong> The slide collapses to ~0 duration rather than being
                disabled, because unmount is driven by <code>animationend</code>.
            </p>
        </div>
    ),
};
