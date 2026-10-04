import type { ComponentDoc } from "./types";
import { Eyebrow, Heading, Section, Text } from "@particle-academy/react-fancy";

export const sectionDoc: ComponentDoc = {
    intro: (
        <p>
            Vertical rhythm between page sections, plus the optional opening hairline.
            Three spacing steps and one boolean — the rule is a <em>prop</em> rather than a
            border the caller draws, because half the gallery styles drew it and half
            forgot, and an inconsistent rule reads as a bug rather than a choice. Pairs
            with <code>Eyebrow</code>, which is what usually sits at the top of one.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "No props is the md step — py-16, no rule. The workhorse for a marketing page.",
            render: () => (
                <Section className="w-full bg-zinc-50 dark:bg-zinc-900">
                    <Heading as="h3" size="lg">A section</Heading>
                    <Text>Padded above and below by the md step.</Text>
                </Section>
            ),
            code: `<Section>
    <Heading as="h3" size="lg">A section</Heading>
    <Text>Padded above and below by the md step.</Text>
</Section>`,
        },
        {
            name: "Spacing steps",
            description:
                "sm (py-8) for dense app chrome, md (py-16) for a normal page band, lg (py-24) for a hero or a deliberate pause. The tint here only makes the padding visible.",
            render: () => (
                <div className="w-full space-y-2">
                    {(["sm", "md", "lg"] as const).map((space) => (
                        <Section
                            key={space}
                            space={space}
                            className="bg-zinc-100 text-center dark:bg-zinc-800"
                        >
                            <Text className="text-xs font-medium">
                                space="{space}"
                            </Text>
                        </Section>
                    ))}
                </div>
            ),
            code: `<Section space="sm">…</Section>
<Section space="md">…</Section>
<Section space="lg">…</Section>`,
        },
        {
            name: "Opening rule",
            description:
                "divider draws the hairline that opens the section. Set it on every section after the first and the page gets consistent separators without anyone hand-drawing a border.",
            render: () => (
                <div className="w-full">
                    <Section space="sm">
                        <Heading as="h4" size="md">First — no rule</Heading>
                        <Text>The opening section does not need one.</Text>
                    </Section>
                    <Section space="sm" divider>
                        <Heading as="h4" size="md">Second — divider</Heading>
                        <Text>A hairline above, from the prop rather than a border class.</Text>
                    </Section>
                    <Section space="sm" divider>
                        <Heading as="h4" size="md">Third — divider</Heading>
                        <Text>Consistent by construction.</Text>
                    </Section>
                </div>
            ),
            code: `<Section>…first, no rule…</Section>
<Section divider>…second…</Section>
<Section divider>…third…</Section>`,
        },
        {
            name: "With an Eyebrow",
            description:
                "The pairing the component was designed around: an Eyebrow labels the section, the Heading names it, the rule separates it from what came before.",
            render: () => (
                <Section space="sm" divider className="w-full">
                    <Eyebrow>Pricing</Eyebrow>
                    <Heading as="h3" size="lg">Pick a plan</Heading>
                    <Text>Every plan includes the full component kit.</Text>
                </Section>
            ),
            code: `<Section divider>
    <Eyebrow>Pricing</Eyebrow>
    <Heading as="h3" size="lg">Pick a plan</Heading>
    <Text>Every plan includes the full component kit.</Text>
</Section>`,
        },
        {
            name: "As a different element",
            description:
                "Defaults to <section>, which is right most of the time. Pass `as` for the cases where it is not — a <footer>, or a <div> when the content has no heading and would make an unlabelled landmark.",
            render: () => (
                <Section as="footer" space="sm" divider className="w-full text-center">
                    <Text className="text-xs text-zinc-500">
                        Rendered as &lt;footer&gt;
                    </Text>
                </Section>
            ),
            code: `<Section as="footer" divider>
    <Text>© Particle Academy</Text>
</Section>`,
        },
    ],
    props: [
        { name: "space", type: `"sm" | "md" | "lg"`, default: `"md"`, description: "Vertical rhythm — py-8 / py-16 / py-24." },
        { name: "divider", type: `boolean`, default: `false`, description: "Draw the hairline rule that opens the section." },
        { name: "as", type: `ElementType`, default: `"section"`, description: "Element to render. Use a `div` when the content has no heading, so no unlabelled landmark is created." },
        { name: "children", type: `ReactNode`, default: "—", description: "Section content." },
        { name: "...rest", type: `HTMLAttributes<HTMLElement>`, default: "—", description: "All standard attributes. `className` merges, so a background or text colour composes with the padding." },
    ],
    notes: (
        <ul>
            <li>
                Renders <code>data-react-fancy-section</code> and{" "}
                <code>data-space="&lt;space&gt;"</code>.
            </li>
            <li>
                The rule is <code>border-t</code> — top, not bottom — so it belongs to the
                section it opens. That is why the first section on a page omits it rather
                than the last.
            </li>
            <li>
                A <code>&lt;section&gt;</code> is only a useful landmark when it has an
                accessible name. If a section has no heading, either give it{" "}
                <code>aria-label</code> or render it as a <code>div</code>.
            </li>
        </ul>
    ),
};
