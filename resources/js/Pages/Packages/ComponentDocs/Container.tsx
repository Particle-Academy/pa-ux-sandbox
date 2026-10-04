import type { ComponentDoc } from "./types";
import { Container, Heading, Text } from "@particle-academy/react-fancy";

/** A visible edge, so a centred measure is actually legible in an example. */
function Measure({ label }: { label: string }) {
    return (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-3 text-center text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            {label}
        </div>
    );
}

export const containerDoc: ComponentDoc = {
    intro: (
        <p>
            The page's horizontal measure — centred, capped, with gutters. It owns one
            decision: <em>how wide the page reads</em>. Every Swiss-family gallery style
            hand-rolled this, and what they were repeating was not <code>mx-auto</code> but
            that decision — twenty copies of which drift. Four measures
            (<code>sm</code>, <code>md</code>, <code>lg</code>, <code>full</code>), a
            polymorphic <code>as</code>, and nothing else.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description:
                "No props is the md measure — max-w-5xl, centred, with 1rem gutters that grow to 1.5rem at the sm breakpoint.",
            render: () => (
                <Container className="w-full">
                    <Measure label="md — max-w-5xl" />
                </Container>
            ),
            code: `<Container>
    <p>Body content at the default reading measure.</p>
</Container>`,
        },
        {
            name: "Sizes",
            description:
                "sm suits long-form prose, md is the default body measure, lg is for dashboards and wide tables, and full removes the cap entirely while keeping the gutters.",
            render: () => (
                <div className="w-full space-y-3">
                    <Container size="sm">
                        <Measure label="sm — max-w-3xl" />
                    </Container>
                    <Container size="md">
                        <Measure label="md — max-w-5xl (default)" />
                    </Container>
                    <Container size="lg" className="w-full">
                        <Measure label="lg — max-w-7xl" />
                    </Container>
                    <Container size="full">
                        <Measure label="full — max-w-none" />
                    </Container>
                </div>
            ),
            code: `<Container size="sm">…</Container>
<Container size="md">…</Container>
<Container size="lg">…</Container>
<Container size="full">…</Container>`,
        },
        {
            name: "As a landmark element",
            description:
                "A container is usually a real landmark, not a div. Pass `as` to render <main>, <header> or <footer> and keep the document outline honest for screen readers.",
            render: () => (
                <Container as="main" size="sm" className="w-full">
                    <Heading as="h3" size="lg">Rendered as &lt;main&gt;</Heading>
                    <Text>
                        The measure is unchanged; only the tag differs. Inspect the element to
                        confirm it is a <code>main</code>.
                    </Text>
                </Container>
            ),
            code: `<Container as="main" size="sm">
    <Heading as="h3" size="lg">Page title</Heading>
    <Text>Body copy at the sm measure.</Text>
</Container>`,
        },
        {
            name: "full, for an edge-to-edge band",
            description:
                "A full container keeps the gutters but drops the cap — the shape you want for a coloured band whose background runs edge to edge while its content still aligns to the page.",
            render: () => (
                <div className="-mx-4 w-full bg-violet-600 py-6 sm:-mx-6">
                    <Container size="full">
                        <Text className="text-center text-sm font-medium text-white">
                            Background bleeds; content stays on the page's gutters.
                        </Text>
                    </Container>
                </div>
            ),
            code: `<div className="bg-violet-600 py-6">
    <Container size="full">
        <Text>Background bleeds; content stays on the gutters.</Text>
    </Container>
</div>`,
        },
        {
            name: "Nested measures",
            description:
                "A wide outer container with a narrow inner one is the standard article shape: a full-bleed figure can escape the prose measure without leaving the page.",
            render: () => (
                <Container size="lg" className="w-full">
                    <div className="w-full space-y-3">
                        <Measure label="lg — figures, tables, media" />
                        <Container size="sm">
                            <Measure label="sm — the prose column" />
                        </Container>
                    </div>
                </Container>
            ),
            code: `<Container size="lg">
    <figure>…wide media…</figure>

    <Container size="sm">
        <p>Prose at a comfortable reading measure.</p>
    </Container>
</Container>`,
        },
    ],
    props: [
        { name: "size", type: `"sm" | "md" | "lg" | "full"`, default: `"md"`, description: "Reading measure — max-w-3xl / 5xl / 7xl / none. `full` keeps the gutters." },
        { name: "as", type: `ElementType`, default: `"div"`, description: "Element to render. Use a landmark (`main`, `header`, `footer`) where one is meant." },
        { name: "children", type: `ReactNode`, default: "—", description: "Page content." },
        { name: "...rest", type: `HTMLAttributes<HTMLElement>`, default: "—", description: "All standard attributes (`id`, `className`, ARIA, `data-*`). `className` merges rather than replaces." },
    ],
    notes: (
        <ul>
            <li>
                Renders <code>data-react-fancy-container</code> and{" "}
                <code>data-size="&lt;size&gt;"</code> — stable handles, so an agent can find
                the page measure and read which one is in effect without guessing at classes.
            </li>
            <li>
                Gutters are <code>px-4 sm:px-6</code> and are applied at every size, including{" "}
                <code>full</code>. A container never lets content touch the viewport edge.
            </li>
            <li>
                Purely visual, so it owes only the authoring half of the component contract —
                there is no state for an agent to inhabit.
            </li>
        </ul>
    ),
};
