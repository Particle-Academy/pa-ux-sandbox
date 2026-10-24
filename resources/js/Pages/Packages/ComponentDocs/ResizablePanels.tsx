import { useState } from "react";
import type { ComponentDoc } from "./types";
import { Card, ResizablePanels, Text } from "@particle-academy/react-fancy";

/** Panel body used by every example — a Fancy Card filling the panel. */
function Pane({ title, detail }: { title: string; detail?: string }) {
    return (
        <Card className="h-full">
            <Text size="sm" weight="semibold">{title}</Text>
            {detail ? <Text size="xs" className="mt-1 !text-zinc-500">{detail}</Text> : null}
        </Card>
    );
}

function ControlledDemo() {
    const [size, setSize] = useState(35);

    return (
        <div className="w-full max-w-xl space-y-2">
            <div className="h-48">
                <ResizablePanels value={size} onValueChange={setSize}>
                    <Pane title="Sidebar" detail="Drag the separator, or focus it and use the arrow keys." />
                    <Pane title="Content" />
                </ResizablePanels>
            </div>
            <Text size="xs" className="!text-zinc-500">Primary panel: {Math.round(size)}%</Text>
        </div>
    );
}

function CommitDemo() {
    const [size, setSize] = useState(50);
    const [saved, setSaved] = useState<number | null>(null);

    return (
        <div className="w-full max-w-xl space-y-2">
            <div className="h-48">
                <ResizablePanels value={size} onValueChange={setSize} onValueCommit={setSaved}>
                    <Pane title="Files" />
                    <Pane title="Editor" />
                </ResizablePanels>
            </div>
            <Text size="xs" className="!text-zinc-500">
                {saved === null ? "Nothing persisted yet — release a drag or a key." : `Persisted ${Math.round(saved)}% (once per gesture)`}
            </Text>
        </div>
    );
}

export const resizablePanelsDoc: ComponentDoc = {
    intro: (
        <p>
            Two panels with an accessible, draggable separator, following the W3C
            window-splitter pattern. <code>value</code> is the primary (first) panel's size
            as a <strong>percentage</strong> (0-100), controlled with
            <code>onValueChange</code> or uncontrolled with <code>defaultValue</code>.
            <code>onValueCommit</code> fires once per gesture, the moment to persist a
            per-user size; the host owns persistence.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Uncontrolled, side by side, starting at `defaultValue` (50).",
            render: () => (
                <div className="h-48 w-full max-w-xl">
                    <ResizablePanels defaultValue={50}>
                        <Pane title="Primary" />
                        <Pane title="Secondary" />
                    </ResizablePanels>
                </div>
            ),
            code: `<div className="h-48">
    <ResizablePanels defaultValue={50}>
        <div>Primary</div>
        <div>Secondary</div>
    </ResizablePanels>
</div>`,
        },
        {
            name: "Controlled",
            description: "`value` + `onValueChange` — fires on every change while dragging or pressing keys.",
            render: () => <ControlledDemo />,
            code: `const [size, setSize] = useState(35);

<ResizablePanels value={size} onValueChange={setSize}>
    <div>Sidebar</div>
    <div>Content</div>
</ResizablePanels>`,
        },
        {
            name: "Persist on commit",
            description: "`onValueCommit` fires once at pointer or key release, and only if the value changed — save it without writing on every frame.",
            render: () => <CommitDemo />,
            code: `const [size, setSize] = useState(() => Number(localStorage.getItem("split") ?? 50));

<ResizablePanels
    value={size}
    onValueChange={setSize}
    onValueCommit={(v) => localStorage.setItem("split", String(v))}
>
    <div>Files</div>
    <div>Editor</div>
</ResizablePanels>`,
        },
        {
            name: "Vertical",
            description: "`orientation=\"vertical\"` stacks the panels; the separator moves with ArrowUp / ArrowDown.",
            render: () => (
                <div className="h-64 w-full max-w-xl">
                    <ResizablePanels orientation="vertical" defaultValue={60}>
                        <Pane title="Preview" />
                        <Pane title="Console" />
                    </ResizablePanels>
                </div>
            ),
            code: `<ResizablePanels orientation="vertical" defaultValue={60}>
    <div>Preview</div>
    <div>Console</div>
</ResizablePanels>`,
        },
        {
            name: "Limits and steps",
            description: "`min` / `max` clamp the primary size; `step` is the arrow-key step, `largeStep` the Shift + Arrow step. Home / End jump to `min` / `max`.",
            render: () => (
                <div className="h-48 w-full max-w-xl">
                    <ResizablePanels min={25} max={75} step={1} largeStep={10} label="Resize navigation">
                        <Pane title="Navigation" detail="25% to 75%" />
                        <Pane title="Main" detail="Arrow: 1 point · Shift + Arrow: 10" />
                    </ResizablePanels>
                </div>
            ),
            code: `<ResizablePanels min={25} max={75} step={1} largeStep={10} label="Resize navigation">
    <div>Navigation</div>
    <div>Main</div>
</ResizablePanels>`,
        },
        {
            name: "Disabled",
            description: "`disabled` freezes the split: the separator leaves the tab order and ignores input.",
            render: () => (
                <div className="h-48 w-full max-w-xl">
                    <ResizablePanels disabled defaultValue={30}>
                        <Pane title="Fixed" />
                        <Pane title="Fixed" />
                    </ResizablePanels>
                </div>
            ),
            code: `<ResizablePanels disabled defaultValue={30}>
    <div>Fixed</div>
    <div>Fixed</div>
</ResizablePanels>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "Exactly two children: the primary panel (left / top), then the secondary. Further children are ignored.", required: true },
        { name: "value", type: `number`, default: "—", description: "Controlled primary size, a percentage. Clamped to `min` / `max`." },
        { name: "defaultValue", type: `number`, default: `50`, description: "Uncontrolled starting size, a percentage." },
        { name: "onValueChange", type: `(value: number) => void`, default: "—", description: "Fires on every change while dragging or pressing keys." },
        { name: "onValueCommit", type: `(value: number) => void`, default: "—", description: "Fires once when a gesture ends, only if the value changed. Persist here." },
        { name: "min", type: `number`, default: `10`, description: "Smallest primary size, a percentage." },
        { name: "max", type: `number`, default: `90`, description: "Largest primary size, a percentage." },
        { name: "orientation", type: `"horizontal" | "vertical"`, default: `"horizontal"`, description: "Panel layout: side by side, or stacked." },
        { name: "step", type: `number`, default: `5`, description: "Arrow-key step, in percentage points." },
        { name: "largeStep", type: `number`, default: `20`, description: "Shift + Arrow step, in percentage points." },
        { name: "label", type: `string`, default: `"Resize panels"`, description: "Accessible name of the separator." },
        { name: "disabled", type: `boolean`, default: `false`, description: "Freeze the split." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Accessibility:</strong> the separator is <code>role="separator"</code> with
            <code>aria-valuenow/min/max</code>, <code>aria-orientation</code>,
            <code>aria-controls</code> (the primary panel) and a tab stop. Pointer and touch drags
            use pointer capture. <strong>Handles:</strong> <code>data-react-fancy-resizable-panels</code>
            (with <code>data-orientation</code>, <code>data-dragging</code>,
            <code>data-disabled</code>), <code>data-react-fancy-resizable-panels-panel="first" | "second"</code>,
            and <code>data-react-fancy-resizable-panels-separator</code>. The container needs a
            height for the vertical orientation.
        </p>
    ),
};
