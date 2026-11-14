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
        {
            name: "When the tooltip repeats the name",
            description:
                "While shown, the trigger's aria-describedby names the tooltip, so a screen reader reads it after the trigger's name. When the tooltip only repeats words the name already carries, set describe={false} so they are not read twice.",
            render: () => (
                <div className="flex items-center gap-2">
                    <Tooltip content="Archive" describe={false}>
                        <Button variant="ghost" aria-label="Archive">Archive</Button>
                    </Tooltip>
                    <Tooltip content="Moves the thread out of your inbox; nothing is deleted">
                        <Button variant="ghost">Archive (described)</Button>
                    </Tooltip>
                </div>
            ),
            code: `<Tooltip content="Archive" describe={false}>
    <Button aria-label="Archive" icon="archive" />
</Tooltip>
<Tooltip content="Moves the thread out of your inbox; nothing is deleted">
    <Button>Archive</Button>
</Tooltip>`,
        },
        {
            name: "Styling the trigger, not the bubble",
            description:
                "className styles the bubble. triggerClassName styles the child, joined in front of the child's own classes. A Popover.Trigger or Dropdown.Trigger wrapped around a Tooltip routes its className here, so the class reaches the button.",
            render: () => (
                <Tooltip content="Ring on the button, not the bubble" triggerClassName="ring-2 ring-violet-500">
                    <Button variant="ghost">triggerClassName</Button>
                </Tooltip>
            ),
            code: `<Tooltip content="Settings" triggerClassName="[-webkit-app-region:no-drag]">
    <Button variant="ghost" icon="settings" aria-label="Settings" />
</Tooltip>`,
        },
    ],
    props: [
        { name: "children", type: `ReactElement`, default: "—", description: "The element to attach the tooltip to. Must be a single React element that forwards refs." },
        { name: "describe", type: `boolean`, default: `true`, description: "Whether the trigger's `aria-describedby` names the tooltip while it is shown. Turn off only when the tooltip repeats the trigger's accessible name." },
        { name: "content", type: `ReactNode`, default: "—", description: "Tooltip content. Strings or JSX." },
        { name: "placement", type: `Placement`, default: `"top"`, description: "Preferred placement. Auto-flips on collision." },
        { name: "delay", type: `number`, default: `200`, description: "Milliseconds to wait before opening on hover-in." },
        { name: "offset", type: `number`, default: `6`, description: "Pixel gap between trigger and tooltip bubble." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the tooltip bubble." },
        { name: "triggerClassName", type: `string`, default: "—", description: "Extra classes on the child (the trigger), joined in front of its own. `Popover.Trigger` / `Dropdown.Trigger` pass their `className` here." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Accessibility:</strong> use Tooltip for hints, not for primary content —
            screen reader users may not hover or focus the trigger. Always pair an icon-only
            button with an <code>aria-label</code> in addition to the tooltip.
        </p>
    ),
};
