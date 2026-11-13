import type { ComponentDoc } from "./types";
import { Card, SkipLink, Text } from "@particle-academy/react-fancy";

/**
 * A page in miniature: the skip link, a nav worth skipping, and the target.
 * Tab into the card and the link appears, fixed at the window's top-start
 * corner (its real look); Enter moves focus to the content, past the nav.
 */
function MiniPage({ targetId, label }: { targetId: string; label?: string }) {
    return (
        <Card className="relative w-full max-w-md overflow-hidden p-4">
            <SkipLink targetId={targetId} label={label} />
            <Text size="xs" className="!text-zinc-500">
                Click here, then press Tab: the link appears at the top-start corner of the window. Press Enter to skip the nav.
            </Text>
            <nav aria-label="Demo navigation" className="mt-2 flex flex-wrap gap-2 text-sm">
                <a href="#skip-link-demo-1" onClick={(e) => e.preventDefault()} className="underline">Home</a>
                <a href="#skip-link-demo-2" onClick={(e) => e.preventDefault()} className="underline">Pricing</a>
                <a href="#skip-link-demo-3" onClick={(e) => e.preventDefault()} className="underline">Docs</a>
            </nav>
            <section id={targetId} aria-label="Demo content" className="mt-3 rounded-md border border-dashed border-zinc-300 p-3 text-sm focus:outline-2 dark:border-zinc-700">
                The content. Focus lands here, not on the nav.
            </section>
        </Card>
    );
}

export const skipLinkDoc: ComponentDoc = {
    intro: (
        <p>
            A &quot;Skip to content&quot; link (WCAG 2.4.1, Bypass Blocks). Render it first in the
            page. It stays visually hidden until it takes keyboard focus, but it is clipped rather
            than <code>display: none</code>, so it is still in the tab order and the accessibility
            tree. Activating it moves focus to the target, giving a target that cannot take focus a{" "}
            <code>tabIndex=-1</code> of its own, and handles the click itself, so a hash router never
            sees the fragment.
        </p>
    ),
    examples: [
        {
            name: "With no props",
            description:
                "targetId defaults to \"main\", so <main id=\"main\"> plus a bare <SkipLink /> is the whole setup. The demo below uses its own id so it does not jump out of this page.",
            render: () => <MiniPage targetId="skip-link-demo-main" />,
            code: `<SkipLink />
<nav>…</nav>
<main id="main">…</main>`,
        },
        {
            name: "Another target and your own words",
            description:
                "targetId names the element to skip to, without #. label is the link text, for translation. href wins over targetId when you need a full fragment.",
            render: () => <MiniPage targetId="skip-link-demo-content" label="Saltar al contenido" />,
            code: `<SkipLink targetId="content" label="Saltar al contenido" />
<SkipLink href="#results" label="Skip to results" />`,
        },
        {
            name: "Before a consent banner",
            description:
                "A cookie banner that renders first would take the first tab stop. fancy-compliance-ui's ConsentBanner has a skipLink slot (0.4.0) that renders before the banner, whether or not the banner shows, so the skip link stays first.",
            render: () => <MiniPage targetId="skip-link-demo-consent" />,
            code: `import { ConsentBanner } from "@particle-academy/fancy-compliance-ui";

<ConsentBanner skipLink={<SkipLink />} … />`,
        },
    ],
    props: [
        { name: "targetId", type: `string`, default: `"main"`, description: "The id of the element to skip to, without `#`." },
        { name: "href", type: `string`, default: "—", description: "The fragment to link to. Wins over `targetId`. A non-fragment href is left to the browser." },
        { name: "label", type: `ReactNode`, default: `"Skip to content"`, description: "The link text." },
        { name: "…anchor attributes", type: `AnchorHTMLAttributes`, default: "—", description: "Every other anchor attribute, and a `ref`. A `className` wins over the shipped hidden and focused looks." },
    ],
    notes: (
        <p>
            Handles: <code>data-skip-link</code> and <code>data-react-fancy-skip-link</code>. Its
            hidden and focused looks ship in <code>styles.css</code> in the <code>base</code> layer,
            so it is hidden even without the kit <code>@source</code>d. Covered by touch density.
            Also at <code>@particle-academy/react-fancy/skip-link</code>.
        </p>
    ),
};
