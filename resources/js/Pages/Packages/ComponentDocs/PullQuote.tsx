import type { ComponentDoc } from "./types";
import { PullQuote, Text } from "@particle-academy/react-fancy";

export const pullQuoteDoc: ComponentDoc = {
    intro: (
        <p>
            A quotation lifted out of the body text, with its attribution and source
            arranged beneath. It renders a real <code>&lt;blockquote&gt;</code> wrapping a{" "}
            <code>&lt;cite&gt;</code>, so the structure a reader mode or screen reader looks
            for is actually there rather than approximated with styled divs.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Just the quote. Attribution is optional.",
            render: () => (
                <PullQuote>
                    A feature nobody can see is, for every consumer who reads the docs to find
                    out what exists, identical to one that was never built.
                </PullQuote>
            ),
            code: `<PullQuote>
    A feature nobody can see is identical to one that was never built.
</PullQuote>`,
        },
        {
            name: "With attribution",
            description: "Who said it, rendered inside a <cite>.",
            render: () => (
                <PullQuote attribution="Fancy UI component contract">
                    Agents read and write component state via MCP bridges and stable handles —
                    not via Playwright or DOM scraping.
                </PullQuote>
            ),
            code: `<PullQuote attribution="Fancy UI component contract">
    Agents read and write component state via MCP bridges and stable handles.
</PullQuote>`,
        },
        {
            name: "Attribution and source",
            description:
                "source follows the attribution — a publication, a page, a role. Two slots rather than one string, so the type treatment can differ between the person and the place.",
            render: () => (
                <PullQuote
                    attribution="Human+ UX whitepaper"
                    source="Particle Academy, 2026"
                >
                    The component itself is the agent's affordance, not an external target.
                </PullQuote>
            ),
            code: `<PullQuote
    attribution="Human+ UX whitepaper"
    source="Particle Academy, 2026"
>
    The component itself is the agent's affordance, not an external target.
</PullQuote>`,
        },
        {
            name: "Rule-bracketed",
            description:
                "rule draws hairlines above and below, which gives the quote a hard edge against surrounding prose. The treatment to reach for when the quote sits mid-article rather than opening a section.",
            render: () => (
                <div className="space-y-4">
                    <Text>
                        Plausible is the dangerous state, because it does not feel like
                        guessing.
                    </Text>
                    <PullQuote rule attribution="Workspace rules">
                        Say the words in the sentence — &ldquo;I believe X, I have not verified
                        it&rdquo; — then verify it, or hand it over with the label still
                        attached.
                    </PullQuote>
                    <Text>
                        A bare assertion is believed. A sourced one can be checked.
                    </Text>
                </div>
            ),
            code: `<PullQuote rule attribution="Workspace rules">
    Say the words in the sentence — "I believe X, I have not verified it".
</PullQuote>`,
        },
        {
            name: "Linked to its source",
            description:
                "citeUrl becomes the blockquote's cite attribute — machine-readable provenance, which is not the same thing as a visible link and is what the HTML attribute is actually for. Add a visible link in the attribution too if readers should be able to click through.",
            render: () => (
                <PullQuote
                    rule
                    citeUrl="https://keepachangelog.com/en/1.1.0/"
                    attribution={
                        <a
                            href="https://keepachangelog.com/en/1.1.0/"
                            className="underline decoration-dotted"
                        >
                            Keep a Changelog
                        </a>
                    }
                    source="1.1.0"
                >
                    Don&rsquo;t let your friends dump git logs into changelogs.
                </PullQuote>
            ),
            code: `<PullQuote
    rule
    citeUrl="https://keepachangelog.com/en/1.1.0/"
    attribution={<a href="https://keepachangelog.com/en/1.1.0/">Keep a Changelog</a>}
    source="1.1.0"
>
    Don't let your friends dump git logs into changelogs.
</PullQuote>`,
        },
    ],
    props: [
        { name: "attribution", type: `ReactNode`, default: "—", description: "Who said it. Rendered in a `<cite>`." },
        { name: "source", type: `ReactNode`, default: "—", description: "Where it is from — publication, page, role. Follows the attribution." },
        { name: "citeUrl", type: `string`, default: "—", description: "URL the quote came from. Becomes the `<blockquote cite>` attribute." },
        { name: "rule", type: `boolean`, default: `false`, description: "Rule-bracketed treatment: hairlines above and below." },
        { name: "children", type: `ReactNode`, default: "—", description: "The quotation itself." },
        { name: "...rest", type: `Omit<HTMLAttributes<HTMLQuoteElement>, "cite">`, default: "—", description: "All standard attributes except `cite`, which `citeUrl` owns." },
    ],
    notes: (
        <ul>
            <li>
                <code>cite</code> is deliberately removed from the passthrough props:{" "}
                <code>citeUrl</code> owns that attribute, and two props writing one attribute
                is a disagreement waiting to happen.
            </li>
            <li>
                The <code>cite</code> attribute is <em>not</em> a visible link and browsers do
                not surface it. If a reader should be able to follow the quote to its source,
                put an anchor in <code>attribution</code> as well.
            </li>
            <li>
                Purely presentational — no state, so it owes only the authoring half of the
                component contract.
            </li>
        </ul>
    ),
};
