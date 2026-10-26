import { useState } from "react";
import type { ComponentDoc } from "./types";
import { Badge, FullScreen, Text } from "@particle-academy/react-fancy";

function FullScreenControlledDemo() {
    const [fullScreen, setFullScreen] = useState(false);
    return (
        <FullScreen
            fullScreen={fullScreen}
            onFullScreenChange={setFullScreen}
            className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
        >
            <div className="flex items-center justify-between gap-2">
                <Badge color="violet" variant="soft">{`fullScreen={${fullScreen}}`}</Badge>
                <FullScreen.Toggle />
            </div>
            <Text size="sm" className="mt-3 !text-zinc-500">
                Press the toggle, then Escape. Focus goes back to the toggle and the page scroll is restored.
            </Text>
        </FullScreen>
    );
}

export const fullScreenDoc: ComponentDoc = {
    intro: (
        <p>
            One full-screen behaviour for every surface that can take over the viewport.
            <code>Editor</code> uses it, and any surface can adopt it through
            <code>useFullScreen</code>. It is controlled (<code>fullScreen</code> +
            <code>onFullScreenChange</code>), exits on Escape, locks body scroll, and on exit
            restores focus and every scroll offset. The element is not moved, so nothing inside
            it remounts.
        </p>
    ),
    examples: [
        {
            name: "A box with a toggle",
            description: "Put a `FullScreen.Toggle` anywhere inside. Give the box a background: while active it covers the page.",
            render: () => (
                <FullScreen className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                        <Text size="sm">Quarterly report</Text>
                        <FullScreen.Toggle />
                    </div>
                </FullScreen>
            ),
            code: `<FullScreen className="rounded-xl border bg-white dark:bg-zinc-900">
    <FullScreen.Toggle />
    <Chart … />
</FullScreen>`,
        },
        {
            name: "Controlled",
            description: "Own the flag with `fullScreen` + `onFullScreenChange`. The callback fires for the toggle, Escape and the browser's own exit, and only on a real change.",
            render: () => <FullScreenControlledDemo />,
            code: `const [fullScreen, setFullScreen] = useState(false);

<FullScreen fullScreen={fullScreen} onFullScreenChange={setFullScreen}>
    <FullScreen.Toggle />
    …
</FullScreen>`,
        },
        {
            name: "A surface that owns its root",
            description: "Use the hook when the component already has a root element. `targetProps` carries the ref, `data-fullscreen`, the overlay style and the Escape handler. `FullScreenProvider` makes the toggle work inside and keeps descendant portals visible.",
            render: () => (
                <Text size="sm" className="!text-zinc-500">
                    This is how DeckEditor and SheetWorkbook adopt the same behaviour.
                </Text>
            ),
            code: `const fs = useFullScreen<HTMLDivElement>({ fullScreen, defaultFullScreen, onFullScreenChange, mode });

<FullScreenProvider value={fs}>
    <div {...fs.targetProps} className="flex flex-col bg-white dark:bg-zinc-900">
        <Toolbar><FullScreen.Toggle /></Toolbar>
        <Canvas className="min-h-0 flex-1" />
    </div>
</FullScreenProvider>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "Content of the surface. Place a `FullScreen.Toggle` anywhere inside." },
        { name: "fullScreen", type: `boolean`, default: "—", description: "Controlled flag. Pair with `onFullScreenChange`." },
        { name: "defaultFullScreen", type: `boolean`, default: `false`, description: "Initial flag when uncontrolled." },
        { name: "onFullScreenChange", type: `(fullScreen: boolean) => void`, default: "—", description: "Requested state, from the toggle, Escape, `setFullScreen` or the browser." },
        { name: "mode", type: `"overlay" | "native"`, default: `"overlay"`, description: "`overlay` covers the viewport in place and is never refused. `native` also calls `requestFullscreen()` and falls back to the overlay. `data-fullscreen-mode` says which is active." },
        { name: "closeOnEscape", type: `boolean`, default: `true`, description: "Leave on Escape. An Escape a child already handled is left to the child." },
        { name: "lockScroll", type: `boolean`, default: `true`, description: "Lock body scroll while active (reference-counted)." },
        { name: "zIndex", type: `number`, default: `50`, description: "Stacking order of the overlay, the same as Modal." },
        { name: "labels", type: `{ enter?: string; exit?: string }`, default: `"Enter full screen" / "Exit full screen"`, description: "Accessible names of the toggle." },
        { name: "FullScreen.Toggle", type: `component`, default: "—", description: "The toggle button. `enterIcon` / `exitIcon` take Lucide names (defaults `maximize-2` / `minimize-2`); `children` may be a function of the flag." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>One limit of the overlay:</strong> an ancestor with <code>transform</code>,
            <code>filter</code>, <code>perspective</code> or <code>contain: paint</code> confines a
            fixed element to that ancestor. react-fancy's <code>Modal</code> is not affected. Stable
            handles: <code>data-react-fancy-fullscreen</code>, <code>data-fullscreen</code>,
            <code>data-fullscreen-mode</code> and <code>data-react-fancy-fullscreen-toggle</code>.
        </p>
    ),
};
