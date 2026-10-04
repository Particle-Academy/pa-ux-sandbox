import type { ComponentDoc } from "./types";
import { Badge, Eyebrow, Heading, Text } from "@particle-academy/react-fancy";

export const eyebrowDoc: ComponentDoc = {
    intro: (
        <p>
            The small label that opens a section — a number, an em dash, a name, and
            optionally something pushed to the far end of the line. It is the
            editorial-layout counterpart to <code>Section</code>: that one owns the
            rhythm, this one owns the marker. Pass <code>num</code> and{" "}
            <code>label</code> for the standard arrangement, or <code>children</code> when
            you need to replace the pair entirely and keep the line.
        </p>
    ),
    examples: [
        {
            name: "Number and label",
            description:
                "The common case. The number is emphasised, the label follows an em dash.",
            render: () => <Eyebrow num="01" label="Introduction" />,
            code: `<Eyebrow num="01" label="Introduction" />`,
        },
        {
            name: "Label only",
            description:
                "Both halves are optional. A bare label is the right choice when the page has no numbered structure to refer to.",
            render: () => <Eyebrow label="Pricing" />,
            code: `<Eyebrow label="Pricing" />`,
        },
        {
            name: "With a rule",
            description:
                "rule draws the hairline under the head, which separates the marker from the heading it introduces. Use it consistently or not at all — a rule on some sections and not others reads as an accident.",
            render: () => (
                <div className="space-y-6">
                    <Eyebrow num="02" label="Without a rule" />
                    <Eyebrow num="03" label="With a rule" rule />
                </div>
            ),
            code: `<Eyebrow num="02" label="Without a rule" />
<Eyebrow num="03" label="With a rule" rule />`,
        },
        {
            name: "An aside at the far end",
            description:
                "aside is pushed to the opposite end of the line — a count, a date, a status. It is the slot that stops a caller from building their own flex row beside the eyebrow and getting the baseline slightly wrong.",
            render: () => (
                <div className="space-y-6">
                    <Eyebrow num="04" label="Changelog" aside="2026" rule />
                    <Eyebrow
                        num="05"
                        label="Components"
                        aside={<Badge color="violet">70 shipped</Badge>}
                        rule
                    />
                </div>
            ),
            code: `<Eyebrow num="04" label="Changelog" aside="2026" rule />

<Eyebrow
    num="05"
    label="Components"
    aside={<Badge color="violet">70 shipped</Badge>}
    rule
/>`,
        },
        {
            name: "Replacing the pair with children",
            description:
                "children replaces the num/label pair while keeping the arrangement — the type treatment, the rule and the aside slot all still apply. For when the marker is not a number-and-name at all.",
            render: () => (
                <Eyebrow rule aside="4 min read">
                    Field notes
                </Eyebrow>
            ),
            code: `<Eyebrow rule aside="4 min read">
    Field notes
</Eyebrow>`,
        },
        {
            name: "Opening a section",
            description:
                "What the component is for: the marker, the heading it introduces, and the body beneath.",
            render: () => (
                <div>
                    <Eyebrow num="06" label="Human+ UX" rule />
                    <Heading as="h3" size="lg" className="mt-4">
                        Agents as first-class participants
                    </Heading>
                    <Text className="mt-2">
                        Humans and agents share one surface and trade control through MCP
                        bridges rather than DOM scraping.
                    </Text>
                </div>
            ),
            code: `<Eyebrow num="06" label="Human+ UX" rule />
<Heading as="h3" size="lg">Agents as first-class participants</Heading>
<Text>Humans and agents share one surface…</Text>`,
        },
    ],
    props: [
        { name: "num", type: `ReactNode`, default: "—", description: "The section marker — `\"01\"`, a roman numeral. Emphasised." },
        { name: "label", type: `ReactNode`, default: "—", description: "The section name. Rendered after `num` and an em dash." },
        { name: "aside", type: `ReactNode`, default: "—", description: "A second item pushed to the far end of the line." },
        { name: "rule", type: `boolean`, default: `false`, description: "Draw the hairline rule under the head." },
        { name: "children", type: `ReactNode`, default: "—", description: "Full control — replaces the `num`/`label` pair, keeping the arrangement." },
        { name: "...rest", type: `HTMLAttributes<HTMLDivElement>`, default: "—", description: "All standard div attributes." },
    ],
    notes: (
        <ul>
            <li>
                An eyebrow is a <em>label</em>, not a heading. It renders no{" "}
                <code>h*</code> element, so it never competes with the real heading beneath
                it in the document outline or in a screen reader's heading list.
            </li>
            <li>
                <code>children</code> and the <code>num</code>/<code>label</code> pair are
                alternatives. Passing both means <code>children</code> wins.
            </li>
        </ul>
    ),
};
