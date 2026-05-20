import type { ComponentDoc } from "./types";
import { Text } from "@particle-academy/react-fancy";

export const textDoc: ComponentDoc = {
    intro: (
        <p>
            Body copy — paragraphs, helper text, labels. Decouples element (<code>as</code>) from
            visual size, weight, and color so a <code>label</code> can render at xs while a
            <code>span</code> can render at lg.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "A bare Text renders as a `p` at md, normal weight, default color.",
            render: () => <Text>The quick brown fox jumps over the lazy dog.</Text>,
            code: `<Text>The quick brown fox jumps over the lazy dog.</Text>`,
        },
        {
            name: "Sizes",
            description: "Four sizes — xs for helper text under inputs, lg for hero copy.",
            render: () => (
                <div className="space-y-1">
                    <Text size="xs">xs — small helper text</Text>
                    <Text size="sm">sm — secondary content</Text>
                    <Text size="md">md — body default</Text>
                    <Text size="lg">lg — lead paragraph</Text>
                </div>
            ),
            code: `<Text size="xs">xs — small helper text</Text>
<Text size="sm">sm — secondary content</Text>
<Text size="md">md — body default</Text>
<Text size="lg">lg — lead paragraph</Text>`,
        },
        {
            name: "Weights",
            description: "Four font weights. Default is `normal`.",
            render: () => (
                <div className="space-y-1">
                    <Text weight="normal">Normal — body weight.</Text>
                    <Text weight="medium">Medium — slightly emphasized.</Text>
                    <Text weight="semibold">Semibold — strong emphasis.</Text>
                    <Text weight="bold">Bold — loudest.</Text>
                </div>
            ),
            code: `<Text weight="normal">Normal — body weight.</Text>
<Text weight="medium">Medium — slightly emphasized.</Text>
<Text weight="semibold">Semibold — strong emphasis.</Text>
<Text weight="bold">Bold — loudest.</Text>`,
        },
        {
            name: "Color presets",
            description: "Five semantic color tokens — `muted` for helper text, `danger` for errors.",
            render: () => (
                <div className="space-y-1">
                    <Text color="default">Default body color.</Text>
                    <Text color="muted">Muted — for helper text under inputs.</Text>
                    <Text color="accent">Accent — for emphasized links / callouts.</Text>
                    <Text color="danger">Danger — for inline errors.</Text>
                    <Text color="success">Success — for inline confirmations.</Text>
                </div>
            ),
            code: `<Text color="default">Default body color.</Text>
<Text color="muted">Muted — for helper text under inputs.</Text>
<Text color="accent">Accent — for emphasized links / callouts.</Text>
<Text color="danger">Danger — for inline errors.</Text>
<Text color="success">Success — for inline confirmations.</Text>`,
        },
        {
            name: "Polymorphic `as`",
            description: "Render as a span (inline), div (block), or label — useful for form layouts.",
            render: () => (
                <div className="space-y-2">
                    <label className="flex items-center gap-2">
                        <input type="checkbox" className="size-4 rounded border-zinc-300" />
                        <Text as="span" size="sm">A label using <code>Text as="span"</code></Text>
                    </label>
                    <Text as="label" size="xs" color="muted">A label using <code>Text as="label"</code></Text>
                </div>
            ),
            code: `<Text as="span" size="sm">Inline span text</Text>
<Text as="label" size="xs" color="muted">Helper label</Text>
<Text as="div">Block-level div</Text>
<Text as="p">Default paragraph</Text>`,
        },
    ],
    props: [
        { name: "as", type: `"p" | "span" | "div" | "label"`, default: `"p"`, description: "Which element to render. `span` is inline, the others are block-level (except inside `<p>`)." },
        { name: "size", type: `"xs" | "sm" | "md" | "lg"`, default: `"md"`, description: "Visual text size. Independent of `as`." },
        { name: "weight", type: `"normal" | "medium" | "semibold" | "bold"`, default: `"normal"`, description: "Font weight." },
        { name: "color", type: `"default" | "muted" | "accent" | "danger" | "success"`, default: `"default"`, description: "Semantic color token. `muted` is the most common — use it for helper text." },
        { name: "children", type: `ReactNode`, default: "—", description: "Text content." },
        { name: "...rest", type: `HTMLAttributes<HTMLElement>`, default: "—", description: "All standard HTML attributes for the chosen element." },
    ],
};
