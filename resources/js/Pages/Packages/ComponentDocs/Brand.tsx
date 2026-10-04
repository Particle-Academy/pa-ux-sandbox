import type { ComponentDoc } from "./types";
import { Brand, Card } from "@particle-academy/react-fancy";

const Logo = (
    <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 font-mono text-sm font-bold text-white shadow">
        FX
    </div>
);

export const brandDoc: ComponentDoc = {
    intro: (
        <p>
            The product wordmark — a name (and optional logo + tagline) you drop in a navbar
            or auth screen. Three sizes; bring your own logo as any <code>ReactNode</code>.
        </p>
    ),
    examples: [
        {
            name: "Name only",
            description: "The most minimal form — just a name.",
            render: () => <Brand name="Fancy UI" />,
            code: `<Brand name="Fancy UI" />`,
        },
        {
            name: "With logo",
            description: "Logo accepts any ReactNode — an SVG, an img, or a styled div.",
            render: () => <Brand logo={Logo} name="Fancy UI" />,
            code: `const Logo = (
    <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 text-white">
        FX
    </div>
);

<Brand logo={Logo} name="Fancy UI" />`,
        },
        {
            name: "With tagline",
            description: "Tagline sits under the name. Great for auth screens.",
            render: () => <Brand logo={Logo} name="Fancy UI" tagline="Compose beautiful apps fast" />,
            code: `<Brand logo={Logo} name="Fancy UI" tagline="Compose beautiful apps fast" />`,
        },
        {
            name: "Sizes",
            description: "sm in a footer, md in a navbar, lg on a marketing hero.",
            render: () => (
                <div className="flex flex-wrap items-center gap-8">
                    <Brand logo={Logo} name="Fancy" size="sm" />
                    <Brand logo={Logo} name="Fancy" size="md" />
                    <Brand logo={Logo} name="Fancy" size="lg" />
                </div>
            ),
            code: `<Brand logo={Logo} name="Fancy" size="sm" />
<Brand logo={Logo} name="Fancy" size="md" />
<Brand logo={Logo} name="Fancy" size="lg" />`,
        },
        {
            name: "Inside a Card",
            description: "Drop into any container — the brand has no margins of its own.",
            render: () => (
                <Card className="w-full max-w-xs">
                    <Card.Body>
                        <Brand logo={Logo} name="Fancy UI" tagline="Welcome back" />
                    </Card.Body>
                </Card>
            ),
            code: `<Card className="max-w-xs">
    <Card.Body>
        <Brand logo={Logo} name="Fancy UI" tagline="Welcome back" />
    </Card.Body>
</Card>`,
        },
        {
            name: "Brand.Mark — glyph",
            description:
                "What sits in the square: a letter, an initial, an icon node. It is a node rather than a string so a real logo mark drops in without a second prop for it.",
            render: () => (
                <div className="flex flex-wrap items-center gap-6">
                    <Brand.Mark glyph="F" />
                    <Brand.Mark glyph="PA" />
                    <Brand.Mark
                        glyph={
                            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
                                <path d="M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5z" fill="currentColor" />
                            </svg>
                        }
                    />
                </div>
            ),
            code: `<Brand.Mark glyph="F" />
<Brand.Mark glyph={<Logo className="h-4 w-4" />} />`,
        },
    ],
    props: [
        { name: "logo", type: `ReactNode`, default: "—", description: "Logo element. Any ReactNode — img, SVG, styled div." },
        { name: "name", type: `string`, default: "—", description: "Product or company name. Rendered bold beside the logo." },
        { name: "tagline", type: `string`, default: "—", description: "Subtext under the name. Use for short product positioning." },
        { name: "size", type: `"sm" | "md" | "lg"`, default: `"md"`, description: "Overall scale. Affects logo box, name size, and tagline size together." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
        { name: "Brand.Mark — glyph", type: `ReactNode`, default: "—", description: "What sits in the square — a letter, an initial, an icon." },
    ],
};
