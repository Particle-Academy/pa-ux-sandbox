import type { ComponentDoc } from "./types";
import { Badge, Text } from "@particle-academy/react-fancy";

export const badgeDoc: ComponentDoc = {
    intro: (
        <p>
            A small status pill — counts, labels, ON/OFF chips, tags next to a heading.
            Three variants (<code>solid</code>, <code>outline</code>, <code>soft</code>) and seven preset
            colors. Inline-styled so it composes inside paragraphs, table rows, or buttons.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "A bare Badge with no props falls back to the soft variant in zinc.",
            render: () => <Badge>NEW</Badge>,
            code: `<Badge>NEW</Badge>`,
        },
        {
            name: "Colors",
            description: "Seven preset colors keyed to the Fancy UI palette.",
            render: () => (
                <div className="flex flex-wrap items-center gap-2">
                    <Badge color="zinc">zinc</Badge>
                    <Badge color="red">red</Badge>
                    <Badge color="blue">blue</Badge>
                    <Badge color="green">green</Badge>
                    <Badge color="amber">amber</Badge>
                    <Badge color="violet">violet</Badge>
                    <Badge color="rose">rose</Badge>
                </div>
            ),
            code: `<Badge color="zinc">zinc</Badge>
<Badge color="red">red</Badge>
<Badge color="blue">blue</Badge>
<Badge color="green">green</Badge>
<Badge color="amber">amber</Badge>
<Badge color="violet">violet</Badge>
<Badge color="rose">rose</Badge>`,
        },
        {
            name: "Variants",
            description: "Solid for loud (counts, alerts), outline for neutral, soft for inline tags.",
            render: () => (
                <div className="flex flex-wrap items-center gap-2">
                    <Badge color="violet" variant="solid">solid</Badge>
                    <Badge color="violet" variant="outline">outline</Badge>
                    <Badge color="violet" variant="soft">soft</Badge>
                </div>
            ),
            code: `<Badge color="violet" variant="solid">solid</Badge>
<Badge color="violet" variant="outline">outline</Badge>
<Badge color="violet" variant="soft">soft</Badge>`,
        },
        {
            name: "Sizes",
            description: "Three sizes — sm fits a table cell, md is the default, lg sits next to a Heading.",
            render: () => (
                <div className="flex flex-wrap items-center gap-3">
                    <Badge size="sm" color="blue">sm</Badge>
                    <Badge size="md" color="blue">md</Badge>
                    <Badge size="lg" color="blue">lg</Badge>
                </div>
            ),
            code: `<Badge size="sm" color="blue">sm</Badge>
<Badge size="md" color="blue">md</Badge>
<Badge size="lg" color="blue">lg</Badge>`,
        },
        {
            name: "Dot indicator",
            description: "A leading dot is handy for status (online/offline, ok/fail).",
            render: () => (
                <div className="flex flex-wrap items-center gap-2">
                    <Badge color="green" dot>online</Badge>
                    <Badge color="amber" dot>away</Badge>
                    <Badge color="red" dot>offline</Badge>
                </div>
            ),
            code: `<Badge color="green" dot>online</Badge>
<Badge color="amber" dot>away</Badge>
<Badge color="red" dot>offline</Badge>`,
        },
        {
            name: "Inline next to text",
            description: "Badge is an inline span — drop it inside a paragraph or heading.",
            render: () => (
                <Text>
                    User profile <Badge color="amber" size="sm">beta</Badge> launched yesterday.
                </Text>
            ),
            code: `<Text>
    User profile <Badge color="amber" size="sm">beta</Badge> launched yesterday.
</Text>`,
        },
    ],
    props: [
        { name: "color", type: `"zinc" | "red" | "blue" | "green" | "amber" | "violet" | "rose"`, default: `"zinc"`, description: "Color preset from the Fancy palette." },
        { name: "variant", type: `"solid" | "outline" | "soft"`, default: `"soft"`, description: "Visual treatment. `solid` for loud counts, `outline` for neutral, `soft` for inline tags." },
        { name: "size", type: `"sm" | "md" | "lg"`, default: `"md"`, description: "Pill size. `sm` fits a table cell, `lg` reads next to a `Heading`." },
        { name: "dot", type: `boolean`, default: `false`, description: "Show a leading colored dot — useful for online/away/offline indicators." },
        { name: "children", type: `ReactNode`, default: "—", description: "Badge content. Usually a short label or number." },
        { name: "...rest", type: `HTMLAttributes<HTMLSpanElement>`, default: "—", description: "All standard span attributes (`id`, `className`, `onClick`, ARIA, `data-*`)." },
    ],
};
