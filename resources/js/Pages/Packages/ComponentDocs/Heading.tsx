import type { ComponentDoc } from "./types";
import { Heading } from "@particle-academy/react-fancy";

export const headingDoc: ComponentDoc = {
    intro: (
        <p>
            Page and section titles. Decouples the semantic level (<code>as</code>) from the
            visual size (<code>size</code>) so an h2 can render at xl and an h1 can render at md
            without overriding utilities.
        </p>
    ),
    examples: [
        {
            name: "Semantic levels",
            description: "Use `as` to render the correct HTML element for the outline. Default is h2.",
            render: () => (
                <div className="space-y-1">
                    <Heading as="h1">h1 — Page title</Heading>
                    <Heading as="h2">h2 — Section title</Heading>
                    <Heading as="h3">h3 — Subsection</Heading>
                    <Heading as="h4">h4 — Sub-subsection</Heading>
                    <Heading as="h5">h5</Heading>
                    <Heading as="h6">h6</Heading>
                </div>
            ),
            code: `<Heading as="h1">h1 — Page title</Heading>
<Heading as="h2">h2 — Section title</Heading>
<Heading as="h3">h3 — Subsection</Heading>`,
        },
        {
            name: "Sizes",
            description: "Visual size is independent of the semantic level — pick the size that looks right, pick `as` for accessibility.",
            render: () => (
                <div className="space-y-1">
                    <Heading size="xs">xs heading</Heading>
                    <Heading size="sm">sm heading</Heading>
                    <Heading size="md">md heading</Heading>
                    <Heading size="lg">lg heading</Heading>
                    <Heading size="xl">xl heading</Heading>
                    <Heading size="2xl">2xl heading</Heading>
                </div>
            ),
            code: `<Heading size="xs">xs heading</Heading>
<Heading size="sm">sm heading</Heading>
<Heading size="md">md heading</Heading>
<Heading size="lg">lg heading</Heading>
<Heading size="xl">xl heading</Heading>
<Heading size="2xl">2xl heading</Heading>`,
        },
        {
            name: "Weights",
            description: "Four font weights. Default is `semibold`.",
            render: () => (
                <div className="space-y-1">
                    <Heading weight="normal">normal weight</Heading>
                    <Heading weight="medium">medium weight</Heading>
                    <Heading weight="semibold">semibold weight</Heading>
                    <Heading weight="bold">bold weight</Heading>
                </div>
            ),
            code: `<Heading weight="normal">normal weight</Heading>
<Heading weight="medium">medium weight</Heading>
<Heading weight="semibold">semibold weight</Heading>
<Heading weight="bold">bold weight</Heading>`,
        },
        {
            name: "Decoupled — h2 at xl",
            description: "Semantic h2 (good for screen readers + outline) rendered at the xl visual size.",
            render: () => <Heading as="h2" size="xl" weight="bold">Welcome back, Glenn</Heading>,
            code: `<Heading as="h2" size="xl" weight="bold">
    Welcome back, Glenn
</Heading>`,
        },
    ],
    props: [
        { name: "as", type: `"h1" | "h2" | "h3" | "h4" | "h5" | "h6"`, default: `"h2"`, description: "Which heading element to render. Choose for outline / accessibility, not for size." },
        { name: "size", type: `"xs" | "sm" | "md" | "lg" | "xl" | "2xl"`, default: `"lg"`, description: "Visual text size. Independent of `as`." },
        { name: "weight", type: `"normal" | "medium" | "semibold" | "bold"`, default: `"semibold"`, description: "Font weight." },
        { name: "children", type: `ReactNode`, default: "—", description: "Heading content." },
        { name: "...rest", type: `HTMLAttributes<HTMLHeadingElement>`, default: "—", description: "All standard heading attributes (`id`, `className`, etc.)." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Accessibility:</strong> a page should have exactly one <code>h1</code>, with
            subsequent sections starting at <code>h2</code>. Don't skip levels — going from
            <code>h2</code> directly to <code>h4</code> breaks the document outline.
        </p>
    ),
};
