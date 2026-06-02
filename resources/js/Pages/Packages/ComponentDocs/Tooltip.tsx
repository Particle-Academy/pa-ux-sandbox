import type { ComponentDoc } from "./types";
import { Button, Icon, Tooltip } from "@particle-academy/react-fancy";

export const tooltipDoc: ComponentDoc = {
    intro: (
        <p>
            A small text bubble shown on hover/focus of any element. The tooltip wraps a single
            child (the trigger) and accepts arbitrary <code>content</code>. Use it for icon
            labels, keyboard shortcuts, and short hints — anything longer wants a
            <code>Popover</code>.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Hover or focus the child element to reveal the tooltip.",
            render: () => (
                <Tooltip content="Save changes (⌘S)">
                    <Button variant="ghost" iconTrailing="check">Save</Button>
                </Tooltip>
            ),
            code: `<Tooltip content="Save changes (⌘S)">
    <Button variant="ghost" iconTrailing="check">Save</Button>
</Tooltip>`,
        },
        {
            name: "Icon-only buttons",
            description: "The classic use case — icon buttons need accessible labels and visual hints.",
            render: () => (
                <div className="flex items-center gap-2">
                    <Tooltip content="Cut">
                        <Button variant="circle"><Icon name="scissors" /></Button>
                    </Tooltip>
                    <Tooltip content="Copy">
                        <Button variant="circle"><Icon name="copy" /></Button>
                    </Tooltip>
                    <Tooltip content="Paste">
                        <Button variant="circle"><Icon name="clipboard" /></Button>
                    </Tooltip>
                </div>
            ),
            code: `<Tooltip content="Cut"><Button variant="circle"><Icon name="scissors" /></Button></Tooltip>
<Tooltip content="Copy"><Button variant="circle"><Icon name="copy" /></Button></Tooltip>
<Tooltip content="Paste"><Button variant="circle"><Icon name="clipboard" /></Button></Tooltip>`,
        },
        {
            name: "Placement",
            description: "Hint a preferred side; the tooltip auto-flips if there isn't room.",
            render: () => (
                <div className="flex flex-wrap items-center gap-2">
                    <Tooltip content="Above" placement="top"><Button variant="ghost">top</Button></Tooltip>
                    <Tooltip content="To the right" placement="right"><Button variant="ghost">right</Button></Tooltip>
                    <Tooltip content="Below" placement="bottom"><Button variant="ghost">bottom</Button></Tooltip>
                    <Tooltip content="To the left" placement="left"><Button variant="ghost">left</Button></Tooltip>
                </div>
            ),
            code: `<Tooltip content="Above" placement="top">…</Tooltip>
<Tooltip content="To the right" placement="right">…</Tooltip>
<Tooltip content="Below" placement="bottom">…</Tooltip>
<Tooltip content="To the left" placement="left">…</Tooltip>`,
        },
        {
            name: "Delay",
            description: "Override the hover-open delay (default 200ms) when you want a faster or slower reveal.",
            render: () => (
                <div className="flex items-center gap-2">
                    <Tooltip content="Instant" delay={0}><Button variant="ghost">delay=0</Button></Tooltip>
                    <Tooltip content="One second" delay={1000}><Button variant="ghost">delay=1000</Button></Tooltip>
                </div>
            ),
            code: `<Tooltip content="Instant" delay={0}>…</Tooltip>
<Tooltip content="One second" delay={1000}>…</Tooltip>`,
        },
        {
            name: "Rich content",
            description: "`content` accepts any ReactNode — drop in a small layout if needed.",
            render: () => (
                <Tooltip
                    content={
                        <div className="space-y-1">
                            <div className="text-xs font-semibold">Keyboard shortcut</div>
                            <div className="font-mono text-[10px] opacity-80">⌘ + Shift + P</div>
                        </div>
                    }
                >
                    <Button variant="ghost">Command palette</Button>
                </Tooltip>
            ),
            code: `<Tooltip content={
    <div className="space-y-1">
        <div className="text-xs font-semibold">Keyboard shortcut</div>
        <div className="font-mono text-[10px] opacity-80">⌘ + Shift + P</div>
    </div>
}>
    <Button>Command palette</Button>
</Tooltip>`,
        },
    ],
    props: [
        { name: "children", type: `ReactElement`, default: "—", description: "The element to attach the tooltip to. Must be a single React element that forwards refs." },
        { name: "content", type: `ReactNode`, default: "—", description: "Tooltip content. Strings or JSX." },
        { name: "placement", type: `Placement`, default: `"top"`, description: "Preferred placement. Auto-flips on collision." },
        { name: "delay", type: `number`, default: `200`, description: "Milliseconds to wait before opening on hover-in." },
        { name: "offset", type: `number`, default: `6`, description: "Pixel gap between trigger and tooltip bubble." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the tooltip bubble." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Accessibility:</strong> use Tooltip for hints, not for primary content —
            screen reader users may not hover or focus the trigger. Always pair an icon-only
            button with an <code>aria-label</code> in addition to the tooltip.
        </p>
    ),
};
