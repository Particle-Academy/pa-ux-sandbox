import type { ComponentDoc } from "./types";
import { Accordion, Text } from "@particle-academy/react-fancy";

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
    ],
    props: [
        { name: "type", type: `"single" | "multiple"`, default: `"single"`, description: "Allow only one open section at a time, or multiple independent ones." },
        { name: "defaultOpen", type: `string[]`, default: `[]`, description: "Section `value`s that start open." },
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
