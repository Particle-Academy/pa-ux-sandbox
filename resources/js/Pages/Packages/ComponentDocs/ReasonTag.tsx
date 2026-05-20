import type { ComponentDoc } from "./types";
import { ReasonTag, Text } from "@particle-academy/react-fancy";

export const reasonTagDoc: ComponentDoc = {
    intro: (
        <p>
            Wrap an agent-produced value (number, label, short phrase) with its rationale.
            Hover the trigger to see the reason, confidence tier, optional sources, and the
            agent author. Set <code>pinned</code> to show the annotation inline instead. Use
            this anywhere an agent emits content that a human will want to interrogate.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Wraps any value. Hover the underlined value to read the rationale.",
            render: () => (
                <Text size="sm">
                    Last quarter's revenue was{" "}
                    <ReasonTag
                        value="$2.4M"
                        reason="Based on the latest finance roll-up plus reconciliation against the bank statement export. Excludes 2 disputed invoices."
                        confidence={0.85}
                        by="Researcher"
                    />.
                </Text>
            ),
            code: `<ReasonTag
    value="$2.4M"
    reason="Based on the latest finance roll-up plus reconciliation against the bank statement export."
    confidence={0.85}
    by="Researcher"
/>`,
        },
        {
            name: "Confidence tiers",
            description: "Confidence drives the trigger color — high (≥0.85) green, medium (≥0.6) amber, low red.",
            render: () => (
                <Text size="sm" className="space-x-3">
                    <ReasonTag value="High" reason="Strong reasoning." confidence={0.92} />
                    <ReasonTag value="Medium" reason="Some uncertainty." confidence={0.65} />
                    <ReasonTag value="Low" reason="Wide error bars." confidence={0.35} />
                </Text>
            ),
            code: `<ReasonTag value="High" reason="Strong reasoning." confidence={0.92} />
<ReasonTag value="Medium" reason="Some uncertainty." confidence={0.65} />
<ReasonTag value="Low" reason="Wide error bars." confidence={0.35} />`,
        },
        {
            name: "Sources",
            description: "List supporting sources (label + optional href) that the agent used.",
            render: () => (
                <Text size="sm">
                    Top exporter:{" "}
                    <ReasonTag
                        value="Vietnam"
                        reason="Highest export volume of coffee in 2024 based on USDA FAS data."
                        confidence={0.9}
                        by="Researcher"
                        sources={[
                            { label: "USDA FAS — Coffee World Markets 2024" },
                            { label: "ICO Statistics", href: "#" },
                        ]}
                    />
                </Text>
            ),
            code: `<ReasonTag
    value="Vietnam"
    reason="Highest export volume of coffee in 2024."
    confidence={0.9}
    by="Researcher"
    sources={[
        { label: "USDA FAS — Coffee World Markets 2024" },
        { label: "ICO Statistics", href: "https://ico.org/…" },
    ]}
/>`,
        },
        {
            name: "Pinned (always-visible annotation)",
            description: "Set `pinned` to swap the hover popover for an inline annotation under the value.",
            render: () => (
                <Text size="sm">
                    <ReasonTag
                        value="$2.4M"
                        reason="Reconciled against bank export."
                        confidence={0.85}
                        pinned
                    />
                </Text>
            ),
            code: `<ReasonTag
    value="$2.4M"
    reason="Reconciled against bank export."
    confidence={0.85}
    pinned
/>`,
        },
    ],
    props: [
        { name: "value", type: `ReactNode`, default: "—", description: "The value the tag wraps — usually a number, label, or short phrase. Required." },
        { name: "reason", type: `string`, default: "—", description: "Rationale shown in the popover / inline annotation. Required." },
        { name: "confidence", type: `number`, default: `1`, description: "0..1 confidence. Drives the tier color (high / medium / low)." },
        { name: "sources", type: `ReasonTagSource[]`, default: "—", description: "Optional list of `{ label, href? }` supporting sources." },
        { name: "by", type: `string`, default: "—", description: "Agent / author name shown in the popover header." },
        { name: "theme", type: `ReasonTagTheme`, default: `"subtle"`, description: "Visual treatment for the trigger." },
        { name: "pinned", type: `boolean`, default: `false`, description: "Replace the hover popover with an always-visible inline annotation under the value." },
        { name: "onFollowUp", type: `() => void`, default: "—", description: "Called when the user clicks the \"ask follow-up\" action in the popover." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the trigger element." },
    ],
};
