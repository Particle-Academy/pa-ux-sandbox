import type { ComponentDoc } from "./types";
import { Portal, Text } from "@particle-academy/react-fancy";

export const portalDoc: ComponentDoc = {
    intro: (
        <p>
            Render children outside the current DOM tree — typically to{" "}
            <code>document.body</code> — so floating elements (modals, tooltips, dropdowns,
            toasts) escape parent overflow/transform issues. The Fancy version also propagates
            the <code>dark</code> class so Tailwind <code>dark:</code> utilities work in the
            portal subtree.
        </p>
    ),
    examples: [
        {
            name: "Default (renders to body)",
            description: "Anything inside `Portal` is mounted at `document.body`, regardless of where Portal sits in the tree.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    A `&lt;Portal&gt;` only makes sense when something needs to escape its parent — try inspecting the DOM of any open Modal / Tooltip / Toast to see it in action.
                </Text>
            ),
            code: `<div className="overflow-hidden">
    {/* without Portal, this would be clipped by the parent's overflow */}
    <Portal>
        <Modal open={open} onClose={onClose}>…</Modal>
    </Portal>
</div>`,
        },
        {
            name: "Custom container",
            description: "Pass `container` to mount somewhere other than `document.body` — useful for testing or for scoping styles.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    Common pattern: render Portals into a dedicated `&lt;div id=&quot;portal-root&quot; /&gt;` near the bottom of your app shell.
                </Text>
            ),
            code: `const root = document.getElementById("portal-root");

<Portal container={root}>
    <Tooltip />
</Portal>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "Content to portal." },
        { name: "container", type: `HTMLElement`, default: `document.body`, description: "Target DOM node. Falls back to body when omitted." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Used by:</strong> <code>Modal</code>, <code>Popover</code>,
            <code>Dropdown</code>, <code>Tooltip</code>, <code>Toast</code>, <code>Command</code>,
            <code>ContextMenu</code>. You usually don't need to use <code>Portal</code> directly
            unless you're building a new floating primitive.
        </p>
    ),
};
