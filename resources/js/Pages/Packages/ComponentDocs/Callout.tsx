import type { ComponentDoc } from "./types";
import { Callout } from "@particle-academy/react-fancy";

export const calloutDoc: ComponentDoc = {
    intro: (
        <p>
            A colored notice card — for warnings, info banners, tips, or "your trial expires in
            3 days" reminders. Five colors, optional leading icon, optional dismiss button.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Plain blue info callout.",
            render: () => <Callout>Heads up — the dashboard refreshes every 30 seconds.</Callout>,
            code: `<Callout>Heads up — the dashboard refreshes every 30 seconds.</Callout>`,
        },
        {
            name: "Colors",
            description: "Five colors map to common semantic categories — info / success / warning / danger / neutral.",
            render: () => (
                <div className="flex w-full flex-col gap-2">
                    <Callout color="blue">Info — sync just completed.</Callout>
                    <Callout color="green">Success — your changes were saved.</Callout>
                    <Callout color="amber">Warning — your trial expires in 3 days.</Callout>
                    <Callout color="red">Danger — this action cannot be undone.</Callout>
                    <Callout color="zinc">Note — drag a column header to reorder.</Callout>
                </div>
            ),
            code: `<Callout color="blue">Info — sync just completed.</Callout>
<Callout color="green">Success — your changes were saved.</Callout>
<Callout color="amber">Warning — your trial expires in 3 days.</Callout>
<Callout color="red">Danger — this action cannot be undone.</Callout>
<Callout color="zinc">Note — drag a column header to reorder.</Callout>`,
        },
        {
            name: "With icon",
            description: "Pass any ReactNode as the icon. Pair the icon with the right color.",
            render: () => (
                <Callout
                    color="amber"
                    icon={
                        <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
                            <path d="M12 2L1 21h22L12 2zm0 6l7.53 13H4.47L12 8zm-1 5v3h2v-3h-2zm0 4v2h2v-2h-2z" />
                        </svg>
                    }
                >
                    Your usage is at <strong>92%</strong> — consider upgrading.
                </Callout>
            ),
            code: `<Callout
    color="amber"
    icon={<WarningTriangleIcon />}
>
    Your usage is at <strong>92%</strong> — consider upgrading.
</Callout>`,
        },
        {
            name: "Dismissible",
            description: "Pass `onDismiss` and the close button appears on the trailing edge.",
            render: () => (
                <Callout color="green" dismissible onDismiss={() => alert("dismissed")}>
                    Tip — press <kbd className="rounded border border-zinc-300 bg-white px-1 text-[10px] dark:border-zinc-700 dark:bg-zinc-900">/</kbd> anywhere to open the command bar.
                </Callout>
            ),
            code: `<Callout color="green" dismissible onDismiss={() => setShown(false)}>
    Tip — press <kbd>/</kbd> anywhere to open the command bar.
</Callout>`,
        },
        {
            name: "Rich content",
            description: "Children is arbitrary — drop in headings, lists, buttons.",
            render: () => (
                <Callout color="violet" dismissible onDismiss={() => {}}>
                    <div className="font-medium">What's new in 0.6</div>
                    <div className="mt-1 text-xs opacity-90">3D screen surface, MCP undo stack, agent presence indicators in every Fancy primitive.</div>
                </Callout>
            ),
            code: `<Callout color="violet" dismissible onDismiss={() => {}}>
    <div className="font-medium">What's new in 0.6</div>
    <div className="mt-1 text-xs opacity-90">3D screen surface, MCP undo stack, ...</div>
</Callout>`,
        },
    ],
    props: [
        { name: "children", type: `ReactNode`, default: "—", description: "Callout body. Strings, JSX, anything." },
        { name: "color", type: `"blue" | "green" | "amber" | "red" | "zinc"`, default: `"blue"`, description: "Semantic color — info / success / warning / danger / neutral." },
        { name: "icon", type: `ReactNode`, default: "—", description: "Optional leading icon. Any element — usually an SVG sized via `className=\"size-5\"`." },
        { name: "dismissible", type: `boolean`, default: `false`, description: "Show a close (×) button on the trailing edge." },
        { name: "onDismiss", type: `() => void`, default: "—", description: "Called when the user clicks the close button. Required when `dismissible` is true." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
    ],
};
