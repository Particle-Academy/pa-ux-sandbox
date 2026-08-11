import type { ComponentDoc } from "./types";
import { Button, Heading, Popover, Text } from "@particle-academy/react-fancy";

export const popoverDoc: ComponentDoc = {
    intro: (
        <p>
            A floating panel anchored to a trigger — like a richer cousin of <code>Tooltip</code>
            that can hold any content (forms, lists, actions). Click-to-open by default;
            opt-in <code>hover</code> mode is available. Floating UI handles flipping.
        </p>
    ),
    examples: [
        {
            name: "Click (uncontrolled)",
            description: "The simplest form — Popover manages its own open state.",
            render: () => (
                <Popover>
                    <Popover.Trigger>
                        <Button variant="ghost">Show details</Button>
                    </Popover.Trigger>
                    <Popover.Content className="w-64 p-3">
                        <Heading size="sm">Details</Heading>
                        <Text size="xs" className="mt-1">Floating panel anchored to the trigger. Click outside to dismiss.</Text>
                    </Popover.Content>
                </Popover>
            ),
            code: `<Popover>
    <Popover.Trigger>
        <Button variant="ghost">Show details</Button>
    </Popover.Trigger>
    <Popover.Content className="w-64 p-3">
        <Heading size="sm">Details</Heading>
        <Text size="xs">Floating panel anchored to the trigger.</Text>
    </Popover.Content>
</Popover>`,
        },
        {
            name: "Hover",
            description: "Set `hover` to open on hover. Pair with `hoverDelay` / `hoverCloseDelay` to tune the open/close feel.",
            render: () => (
                <Popover hover hoverDelay={150} hoverCloseDelay={250}>
                    <Popover.Trigger>
                        <Button variant="ghost">Hover me</Button>
                    </Popover.Trigger>
                    <Popover.Content className="w-56 p-2">
                        <Text size="xs">Opens on hover with a short delay.</Text>
                    </Popover.Content>
                </Popover>
            ),
            code: `<Popover hover hoverDelay={150} hoverCloseDelay={250}>
    <Popover.Trigger><Button>Hover me</Button></Popover.Trigger>
    <Popover.Content className="w-56 p-2">
        <Text size="xs">Opens on hover.</Text>
    </Popover.Content>
</Popover>`,
        },
        {
            name: "Placement",
            description: "Hint a preferred placement; Floating UI flips automatically if there isn't room.",
            render: () => (
                <Popover placement="right" offset={8}>
                    <Popover.Trigger>
                        <Button variant="ghost">Open to the right</Button>
                    </Popover.Trigger>
                    <Popover.Content className="w-48 p-2">
                        <Text size="xs">Placement: right-start.</Text>
                    </Popover.Content>
                </Popover>
            ),
            code: `<Popover placement="right-start" offset={8}>
    <Popover.Trigger>…</Popover.Trigger>
    <Popover.Content>…</Popover.Content>
</Popover>`,
        },
        {
            name: "Controlled",
            description: "Bind `open` + `onOpenChange` when other UI needs to drive the popover.",
            render: () => (
                <Popover open onOpenChange={() => {}}>
                    <Popover.Trigger>
                        <Button variant="ghost">Always open</Button>
                    </Popover.Trigger>
                    <Popover.Content className="w-56 p-2">
                        <Text size="xs">Externally controlled.</Text>
                    </Popover.Content>
                </Popover>
            ),
            code: `const [open, setOpen] = useState(false);

<Popover open={open} onOpenChange={setOpen}>
    <Popover.Trigger>…</Popover.Trigger>
    <Popover.Content>…</Popover.Content>
</Popover>`,
        },
    ],
    props: [
        { name: "open", type: `boolean`, default: "—", description: "Controlled open state. Use with `onOpenChange`." },
        { name: "defaultOpen", type: `boolean`, default: `false`, description: "Initial open state when uncontrolled." },
        { name: "onOpenChange", type: `(open: boolean) => void`, default: "—", description: "Called when the open state changes." },
        { name: "placement", type: `Placement`, default: `"bottom"`, description: "Preferred placement (`top`, `bottom`, `left`, `right` + `-start` / `-end`). Auto-flips on collision." },
        { name: "offset", type: `number`, default: `8`, description: "Pixel gap between trigger and floating panel." },
        { name: "hover", type: `boolean`, default: `false`, description: "Open on hover instead of click." },
        { name: "hoverDelay", type: `number`, default: `200`, description: "Milliseconds to wait before opening on hover-in." },
        { name: "hoverCloseDelay", type: `number`, default: `300`, description: "Milliseconds to wait before closing on hover-out — keeps the popover navigable." },
        { name: "children", type: `ReactNode`, default: "—", description: "Should contain a `Popover.Trigger` and a `Popover.Content`." },
    ],
};
