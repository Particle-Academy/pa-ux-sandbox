import { useState } from "react";
import type { ComponentDoc } from "./types";
import { Accordion, Button, Text } from "@particle-academy/react-fancy";

function ControlledAccordion() {
    const [open, setOpen] = useState<string | null>("billing");

    return (
        <div className="w-full max-w-md space-y-3">
            <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setOpen("profile")}>Open profile</Button>
                <Button size="sm" variant="ghost" onClick={() => setOpen(null)}>Close all</Button>
                <Text size="xs" className="ml-auto">value: {open === null ? "null" : `"${open}"`}</Text>
            </div>
            <Accordion type="single" value={open} onChange={setOpen}>
                <Accordion.Item value="profile">
                    <Accordion.Trigger>Profile</Accordion.Trigger>
                    <Accordion.Content><Text size="sm">Name, avatar and time zone.</Text></Accordion.Content>
                </Accordion.Item>
                <Accordion.Item value="billing">
                    <Accordion.Trigger>Billing</Accordion.Trigger>
                    <Accordion.Content><Text size="sm">Plan, invoices and payment method.</Text></Accordion.Content>
                </Accordion.Item>
            </Accordion>
        </div>
    );
}

export const accordionDoc: ComponentDoc = {
    intro: (
        <p>
            Collapsible sections — FAQs, settings groups, nested panels. Compound:
            <code>Accordion.Item</code> wraps an <code>Accordion.Trigger</code> and
            <code>Accordion.Content</code>. By default only one section opens at a time
            (single mode); switch to <code>multiple</code> for independent toggles.
        </p>
    ),
    examples: [
        {
            name: "Single (default)",
            description: "Only one section open at a time — opening another closes the previous.",
            render: () => (
                <Accordion type="single" defaultOpen={["item-1"]} className="w-full max-w-md">
                    <Accordion.Item value="item-1">
                        <Accordion.Trigger>What is Fancy UI?</Accordion.Trigger>
                        <Accordion.Content>
                            <Text size="sm">A React + Blade component library built around the Human+ UX contract.</Text>
                        </Accordion.Content>
                    </Accordion.Item>
                    <Accordion.Item value="item-2">
                        <Accordion.Trigger>Is it open source?</Accordion.Trigger>
                        <Accordion.Content>
                            <Text size="sm">Yes — MIT-licensed and published to npm under <code>@particle-academy/*</code>.</Text>
                        </Accordion.Content>
                    </Accordion.Item>
                    <Accordion.Item value="item-3">
                        <Accordion.Trigger>How do agents drive it?</Accordion.Trigger>
                        <Accordion.Content>
                            <Text size="sm">Each interactive component has a bridge that exposes MCP tools.</Text>
                        </Accordion.Content>
                    </Accordion.Item>
                </Accordion>
            ),
            code: `<Accordion type="single" defaultOpen={["item-1"]}>
    <Accordion.Item value="item-1">
        <Accordion.Trigger>What is Fancy UI?</Accordion.Trigger>
        <Accordion.Content>
            <Text size="sm">A React + Blade component library…</Text>
        </Accordion.Content>
    </Accordion.Item>
    <Accordion.Item value="item-2">
        <Accordion.Trigger>Is it open source?</Accordion.Trigger>
        <Accordion.Content>
            <Text size="sm">Yes — MIT-licensed…</Text>
        </Accordion.Content>
    </Accordion.Item>
</Accordion>`,
        },
        {
            name: "Multiple (independent)",
            description: "Each section toggles independently.",
            render: () => (
                <Accordion type="multiple" defaultOpen={["a", "c"]} className="w-full max-w-md">
                    <Accordion.Item value="a">
                        <Accordion.Trigger>Section A</Accordion.Trigger>
                        <Accordion.Content><Text size="sm">Body for A.</Text></Accordion.Content>
                    </Accordion.Item>
                    <Accordion.Item value="b">
                        <Accordion.Trigger>Section B</Accordion.Trigger>
                        <Accordion.Content><Text size="sm">Body for B.</Text></Accordion.Content>
                    </Accordion.Item>
                    <Accordion.Item value="c">
                        <Accordion.Trigger>Section C</Accordion.Trigger>
                        <Accordion.Content><Text size="sm">Body for C.</Text></Accordion.Content>
                    </Accordion.Item>
                </Accordion>
            ),
            code: `<Accordion type="multiple" defaultOpen={["a", "c"]}>
    <Accordion.Item value="a">…</Accordion.Item>
    <Accordion.Item value="b">…</Accordion.Item>
    <Accordion.Item value="c">…</Accordion.Item>
</Accordion>`,
        },
        {
            name: "Controlled (value + onChange)",
            description:
                "The host owns which section is open, so an agent or another control can open one. With type=\"single\" the value is the open item's value or null; with type=\"multiple\" it is a string[]. defaultValue is the uncontrolled starting point in the same shape.",
            render: () => <ControlledAccordion />,
            code: `const [open, setOpen] = useState<string | null>("billing");

<Accordion type="single" value={open} onChange={setOpen}>
    <Accordion.Item value="profile">…</Accordion.Item>
    <Accordion.Item value="billing">…</Accordion.Item>
</Accordion>

// Uncontrolled, multiple:
<Accordion type="multiple" defaultValue={["a", "c"]}>…</Accordion>`,
        },
    ],
    props: [
        { name: "type", type: `"single" | "multiple"`, default: `"single"`, description: "Allow only one open section at a time, or multiple independent ones." },
        { name: "value", type: `string | null | string[]`, default: "—", description: "Controlled open section(s): the open item's `value` or `null` in single mode, a `string[]` in multiple mode." },
        { name: "defaultValue", type: `string | null | string[]`, default: "—", description: "Uncontrolled starting value, in the same shape as `value`." },
        { name: "onChange", type: `(value) => void`, default: "—", description: "Called with the next value when a section opens or closes." },
        { name: "defaultOpen", type: `string[]`, default: `[]`, description: "Section `value`s that start open. Still supported; `defaultValue` is the same idea in the controlled shape." },
        { name: "children", type: `ReactNode`, default: "—", description: "A list of `Accordion.Item` children." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Note:</strong> for richer panel layouts (horizontal accordions, pinned
            sections, render-prop triggers), see the separate <code>AccordionPanel</code> component.
        </p>
    ),
};
