import type { ComponentDoc } from "./types";
import { Badge, Button, Card, Heading, Switch, Table, Text } from "@particle-academy/react-fancy";

/*
 * Card's page, rewritten 2026-10-04.
 *
 * It had four examples and demonstrated NONE of these: `Card.Media`,
 * `Card.Bleed`, `sections`, `dividerInset`, `highlight`, `interactive`, `edges`,
 * or any of CardMedia's eleven props. All of that shipped in react-fancy 5.30.0 —
 * built, published, and invisible to anyone reading the page to find out what
 * Card can do.
 *
 * Its props table was worse than thin, it was WRONG: `variant` was listed as three
 * values when there are five, and `padding` was documented as defaulting to
 * `"none"` when it actually defaults to the step implied by `size`. A missing row
 * is a gap; a wrong default is a reader doing the wrong thing on purpose.
 *
 * Structure follows what makes Flux's page readable rather than its API: every
 * variant and every size gets its OWN caption instead of being dumped in one grid,
 * because "here are five tiles" does not tell you when to reach for `soft`. Section
 * treatments are named examples. Bleed is shown twice — an image and a table —
 * since those are the two cases it exists for and they look nothing alike.
 *
 * `ComponentDocsCoverageTest` now fails if a public prop stops appearing here.
 */

const MEDIA_SRC = "/showcase-assets/fancy-ui-logo.jpg";

export const cardDoc: ComponentDoc = {
    intro: (
        <p>
            The workhorse container. <code>Card</code> alone is a bordered surface; the compound
            parts (<code>Card.Header</code>, <code>Card.Body</code>, <code>Card.Footer</code>,{" "}
            <code>Card.Media</code>, <code>Card.Bleed</code>) cover the layouts that would otherwise
            be hand-rolled in every consumer — a titlebar with actions, an image that reaches the
            card's edge, a table with no double border.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "A bare Card is a bordered surface. Content goes anywhere you want.",
            render: () => (
                <Card className="w-full max-w-md">
                    <Heading size="md">Card</Heading>
                    <Text size="sm" className="mt-1 !text-zinc-600 dark:!text-zinc-300">
                        Drop content straight in when you do not need header, body or footer.
                    </Text>
                </Card>
            ),
            code: `<Card className="max-w-md">
    <Heading size="md">Card</Heading>
    <Text size="sm">Drop content straight in.</Text>
</Card>`,
        },

        /* ── variants ─────────────────────────────────────────────────────── */
        {
            name: "outlined",
            description: "The default. A border and no tint — the right choice for most UI.",
            render: () => (
                <Card variant="outlined" className="w-full max-w-sm">
                    <Text size="sm" weight="semibold">outlined</Text>
                    <Text size="xs" className="mt-1 !text-zinc-500">Bordered, no shadow, no tint.</Text>
                </Card>
            ),
            code: `<Card variant="outlined">…</Card>`,
        },
        {
            name: "elevated",
            description: "Adds a drop shadow. For a surface that should read as lifted off the page — a hero panel, a modal body.",
            render: () => (
                <Card variant="elevated" className="w-full max-w-sm">
                    <Text size="sm" weight="semibold">elevated</Text>
                    <Text size="xs" className="mt-1 !text-zinc-500">Shadow, for a surface above the page.</Text>
                </Card>
            ),
            code: `<Card variant="elevated">…</Card>`,
        },
        {
            name: "muted",
            description: "A tint step between outlined and flat. Use it for a secondary panel beside a primary one, where a border alone does not separate them enough.",
            render: () => (
                <Card variant="muted" className="w-full max-w-sm">
                    <Text size="sm" weight="semibold">muted</Text>
                    <Text size="xs" className="mt-1 !text-zinc-500">A quieter tint for secondary panels.</Text>
                </Card>
            ),
            code: `<Card variant="muted">…</Card>`,
        },
        {
            name: "soft",
            description: "The faintest tint. For grouping related rows inside a larger surface without drawing a box around them.",
            render: () => (
                <Card variant="soft" className="w-full max-w-sm">
                    <Text size="sm" weight="semibold">soft</Text>
                    <Text size="xs" className="mt-1 !text-zinc-500">The lightest grouping available.</Text>
                </Card>
            ),
            code: `<Card variant="soft">…</Card>`,
        },
        {
            name: "flat",
            description: "No border, no shadow. For a card inside another container that already has an edge — nesting two borders is the most common way a layout starts to look busy.",
            render: () => (
                <Card variant="outlined" padding="sm" className="w-full max-w-sm">
                    <Card variant="flat">
                        <Text size="sm" weight="semibold">flat, inside an outlined card</Text>
                        <Text size="xs" className="mt-1 !text-zinc-500">One edge, not two.</Text>
                    </Card>
                </Card>
            ),
            code: `<Card variant="outlined" padding="sm">
    <Card variant="flat">…</Card>
</Card>`,
        },

        /* ── size + padding ───────────────────────────────────────────────── */
        {
            name: "Sizes",
            description: "size scales padding and corner radius TOGETHER, which is why a small card does not look like a big one shrunk. xs for dense lists, sm for widgets, md (the default) for most content, lg for forms and settings.",
            render: () => (
                <div className="grid w-full gap-3 sm:grid-cols-2">
                    {(["xs", "sm", "md", "lg"] as const).map((size) => (
                        <Card key={size} size={size} variant="muted">
                            <Text size="sm" weight="semibold">size="{size}"</Text>
                            <Text size="xs" className="mt-1 !text-zinc-500">
                                {size === "xs" && "Compact — dense lists, sidebars."}
                                {size === "sm" && "Tight — small widgets, stats."}
                                {size === "md" && "The default — most content."}
                                {size === "lg" && "Roomy — forms, settings."}
                            </Text>
                        </Card>
                    ))}
                </div>
            ),
            code: `<Card size="xs">…</Card>
<Card size="sm">…</Card>
<Card size="md">…</Card>   {/* default */}
<Card size="lg">…</Card>`,
        },
        {
            name: "padding override",
            description: 'padding defaults to the step implied by size — pass it to override that, including "none" when the content should reach the edge itself.',
            render: () => (
                <div className="grid w-full gap-3 sm:grid-cols-2">
                    <Card padding="none" variant="outlined">
                        <div className="bg-amber-100 px-3 py-2 text-xs dark:bg-amber-950">
                            padding="none" — this strip reaches the card's edge
                        </div>
                    </Card>
                    <Card padding="lg" size="xs" variant="outlined">
                        <Text size="xs">size="xs" with padding="lg" — radius stays small, inset grows</Text>
                    </Card>
                </div>
            ),
            code: `<Card padding="none">
    <div className="px-3 py-2">Reaches the edge.</div>
</Card>

{/* padding and size are separate keys on purpose */}
<Card size="xs" padding="lg">…</Card>`,
        },

        /* ── header / body / footer ───────────────────────────────────────── */
        {
            name: "Header, Body and Footer",
            description: "The standard composition. Header takes heading / description / actions directly, so the common titlebar needs no layout wrapper from you.",
            render: () => (
                <Card className="w-full max-w-md">
                    <Card.Header
                        heading="Delete project?"
                        description="This cannot be undone."
                        actions={<Badge color="red" variant="soft" size="sm">danger</Badge>}
                    />
                    <Card.Body>
                        <Text size="sm">
                            Removes the project and everything in it, including deploy history.
                        </Text>
                    </Card.Body>
                    <Card.Footer>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost">Cancel</Button>
                            <Button color="red">Delete</Button>
                        </div>
                    </Card.Footer>
                </Card>
            ),
            code: `<Card>
    <Card.Header
        heading="Delete project?"
        description="This cannot be undone."
        actions={<Badge color="red" variant="soft" size="sm">danger</Badge>}
    />
    <Card.Body>
        <Text size="sm">Removes the project and everything in it…</Text>
    </Card.Body>
    <Card.Footer>
        <div className="flex justify-end gap-2">
            <Button variant="ghost">Cancel</Button>
            <Button color="red">Delete</Button>
        </div>
    </Card.Footer>
</Card>`,
        },
        {
            name: "headingLevel",
            description: "The header renders an h3 by default. Set headingLevel so the page's outline is correct — a card inside a section under an h2 usually wants h3, but a card that IS the page wants h1. Visual size is controlled separately, so changing this does not resize anything.",
            render: () => (
                <Card className="w-full max-w-md">
                    <Card.Header heading="Rendered as an h2" headingLevel="h2" description="Same size, different element." />
                    <Card.Body>
                        <Text size="sm">Screen readers and outline tools read the element, not the font size.</Text>
                    </Card.Body>
                </Card>
            ),
            code: `<Card.Header heading="Rendered as an h2" headingLevel="h2" />`,
        },

        /* ── section treatments ───────────────────────────────────────────── */
        {
            name: 'sections="divided"',
            description: "The default: rules between header, body and footer. It is the default because it is what Card has always rendered — seamless is arguably nicer, and making it the default would have restyled every card in every consumer.",
            render: () => (
                <Card sections="divided" className="w-full max-w-md">
                    <Card.Header heading="Divided" />
                    <Card.Body><Text size="sm">Rules run the full width of the card.</Text></Card.Body>
                    <Card.Footer><Text size="xs" className="!text-zinc-500">Footer</Text></Card.Footer>
                </Card>
            ),
            code: `<Card sections="divided">…</Card>   {/* default */}`,
        },
        {
            name: 'sections="plain"',
            description: "No rules at all. The quietest option, and the right one when the content already separates itself.",
            render: () => (
                <Card sections="plain" className="w-full max-w-md">
                    <Card.Header heading="Plain" />
                    <Card.Body><Text size="sm">No rules. Spacing does the work.</Text></Card.Body>
                    <Card.Footer><Text size="xs" className="!text-zinc-500">Footer</Text></Card.Footer>
                </Card>
            ),
            code: `<Card sections="plain">…</Card>`,
        },
        {
            name: 'sections="banded"',
            description: "Header and footer take a faint tint instead of a rule. Reads well when the body is busy — a table or a chart — and another horizontal line would add to the noise.",
            render: () => (
                <Card sections="banded" className="w-full max-w-md">
                    <Card.Header heading="Banded" />
                    <Card.Body><Text size="sm">Tinted bands instead of rules.</Text></Card.Body>
                    <Card.Footer><Text size="xs" className="!text-zinc-500">Footer</Text></Card.Footer>
                </Card>
            ),
            code: `<Card sections="banded">…</Card>`,
        },
        {
            name: "dividerInset",
            description: "With divided sections, stop the rules at the content's edge instead of running them across the card. Keyed to padding rather than size, so the rule lines up with the text even when you override the inset.",
            render: () => (
                <Card sections="divided" dividerInset className="w-full max-w-md">
                    <Card.Header heading="Inset dividers" />
                    <Card.Body><Text size="sm">The rule starts where the text starts.</Text></Card.Body>
                    <Card.Footer><Text size="xs" className="!text-zinc-500">Footer</Text></Card.Footer>
                </Card>
            ),
            code: `<Card sections="divided" dividerInset>…</Card>`,
        },

        /* ── surface detail ───────────────────────────────────────────────── */
        {
            name: "highlight",
            description: "A faint hairline inside the top edge, so a tinted or elevated surface reads as lit from above. White at 70% in light mode and 10% in dark, which is why it survives both. Off by default, because turning a decorative hairline on for everyone would change the look of every card already in use.",
            render: () => (
                <div className="grid w-full gap-3 sm:grid-cols-2">
                    <Card variant="elevated"><Text size="sm">without highlight</Text></Card>
                    <Card variant="elevated" highlight><Text size="sm">with highlight</Text></Card>
                </div>
            ),
            code: `<Card variant="elevated" highlight>…</Card>`,
        },
        {
            name: "interactive",
            description: "For a card that is a link or a grid tile: adds the hover lift and border response, and clips children to the rounded corners so a Card.Media sits flush instead of overhanging.",
            render: () => (
                <Card interactive padding="none" className="w-full max-w-xs">
                    <Card.Media src={MEDIA_SRC} alt="" ratio="16/9" />
                    <div className="p-3">
                        <Text size="sm" weight="semibold">Hover me</Text>
                        <Text size="xs" className="mt-1 !text-zinc-500">Lifts, and the media stays inside the corners.</Text>
                    </div>
                </Card>
            ),
            code: `<Card interactive padding="none">
    <Card.Media src="/cover.jpg" alt="" ratio="16/9" />
    <div className="p-3">…</div>
</Card>`,
        },

        /* ── media ────────────────────────────────────────────────────────── */
        {
            name: "Card.Media",
            description: "An image that fills the card's width. ratio sets the aspect box (16/9 by default), height overrides it with a fixed one, objectPosition picks the part of the image that survives the crop, and loading controls eagerness — pass eager for an image above the fold.",
            render: () => (
                <div className="grid w-full gap-3 sm:grid-cols-2">
                    <Card padding="none">
                        <Card.Media src={MEDIA_SRC} alt="Fancy UI" ratio="4/3" loading="lazy" />
                        <div className="p-3"><Text size="xs">ratio="4/3"</Text></div>
                    </Card>
                    <Card padding="none">
                        <Card.Media src={MEDIA_SRC} alt="Fancy UI" height={120} objectPosition="top" />
                        <div className="p-3"><Text size="xs">height={"{120}"} · objectPosition="top"</Text></div>
                    </Card>
                </div>
            ),
            code: `<Card padding="none">
    <Card.Media src="/cover.jpg" alt="Fancy UI" ratio="4/3" loading="lazy" />
</Card>

{/* a fixed height instead of a ratio, cropped from the top */}
<Card.Media src="/cover.jpg" alt="" height={120} objectPosition="top" />`,
        },
        {
            name: "Card.Media background",
            description: "background renders UNDER the image — visible while it loads, and permanently if it never arrives. Any CSS background value works, so a gradient is a legitimate tile on its own with no src at all.",
            render: () => (
                <div className="grid w-full gap-3 sm:grid-cols-2">
                    <Card padding="none">
                        <Card.Media background="linear-gradient(135deg,#6366f1,#ec4899)" ratio="16/9" />
                        <div className="p-3"><Text size="xs">no src — gradient only</Text></div>
                    </Card>
                    <Card padding="none">
                        <Card.Media src="/deliberately-missing.jpg" alt="" background="linear-gradient(135deg,#0ea5e9,#22c55e)" ratio="16/9" />
                        <div className="p-3"><Text size="xs">broken src — the background still holds the shape</Text></div>
                    </Card>
                </div>
            ),
            code: `{/* a tile with no image at all */}
<Card.Media background="linear-gradient(135deg,#6366f1,#ec4899)" />

{/* and the same value as a fallback behind one that may not load */}
<Card.Media src={cover} background="linear-gradient(...)" />`,
        },
        {
            name: "Card.Media corners",
            description: "Four slots pinned to the media's corners — a number chip, a duration pill, a status badge. They sit above the image without you positioning anything.",
            render: () => (
                <Card padding="none" className="w-full max-w-sm">
                    <Card.Media
                        src={MEDIA_SRC}
                        alt=""
                        ratio="16/9"
                        topLeft={<Badge size="sm" variant="soft">01</Badge>}
                        topRight={<Badge size="sm" color="red" variant="soft">live</Badge>}
                        bottomLeft={<Badge size="sm" variant="soft">4K</Badge>}
                        bottomRight={<Badge size="sm" variant="soft">12:04</Badge>}
                    />
                    <div className="p-3"><Text size="sm" weight="semibold">All four corners</Text></div>
                </Card>
            ),
            code: `<Card.Media
    src={cover}
    alt=""
    topLeft={<Badge size="sm" variant="soft">01</Badge>}
    topRight={<Badge size="sm" color="red" variant="soft">live</Badge>}
    bottomLeft={<Badge size="sm" variant="soft">4K</Badge>}
    bottomRight={<Badge size="sm" variant="soft">12:04</Badge>}
/>`,
        },

        /* ── bleed ────────────────────────────────────────────────────────── */
        {
            name: "Card.Bleed — an image",
            description: 'Reaches past the card\'s padding to its edge. edges="top" is what a cover image wants: flush with the top and sides, with the padded content continuing below it.',
            render: () => (
                <Card className="w-full max-w-sm">
                    <Card.Bleed edges="top">
                        <Card.Media src={MEDIA_SRC} alt="" ratio="16/9" />
                    </Card.Bleed>
                    <Heading size="sm" className="mt-3">Flush to the top</Heading>
                    <Text size="xs" className="mt-1 !text-zinc-500">
                        The card keeps its padding; only the bleed escapes it.
                    </Text>
                </Card>
            ),
            code: `<Card>
    <Card.Bleed edges="top">
        <Card.Media src={cover} alt="" ratio="16/9" />
    </Card.Bleed>
    <Heading size="sm" className="mt-3">Flush to the top</Heading>
</Card>`,
        },
        {
            name: "Card.Bleed — a table",
            description: 'The other case it exists for. A table inside a padded card leaves a gutter its own borders cannot fill, so the rows look inset and the header rule stops short. edges="x" (the default) takes it to both sides.',
            render: () => (
                <Card sections="divided" padding="none" className="w-full max-w-md">
                    <Card.Header heading="Recent transactions" />
                    <Card.Body>
                        <Card.Bleed edges="x">
                            <Table>
                                <Table.Head>
                                    <Table.Row>
                                        <Table.Column label="Date" />
                                        <Table.Column label="Description" />
                                        <Table.Column label="Amount" className="text-right" />
                                    </Table.Row>
                                </Table.Head>
                                <Table.Body>
                                    <Table.Row>
                                        <Table.Cell>Oct 1</Table.Cell>
                                        <Table.Cell>Registry hosting</Table.Cell>
                                        <Table.Cell className="text-right">£12.00</Table.Cell>
                                    </Table.Row>
                                    <Table.Row>
                                        <Table.Cell>Sep 28</Table.Cell>
                                        <Table.Cell>CI minutes</Table.Cell>
                                        <Table.Cell className="text-right">£4.80</Table.Cell>
                                    </Table.Row>
                                </Table.Body>
                            </Table>
                        </Card.Bleed>
                    </Card.Body>
                </Card>
            ),
            code: `<Card sections="divided" padding="none">
    <Card.Header heading="Recent transactions" />
    <Card.Body>
        <Card.Bleed edges="x">
            <Table>…</Table>
        </Card.Bleed>
    </Card.Body>
</Card>`,
        },
        {
            name: "Card.Bleed — every edge",
            description: 'edges takes "x" (the sides, the default), "top", "bottom" or "all". Use "all" when the bleed is the whole card — a full-bleed image tile with the caption overlaid rather than below.',
            render: () => (
                <Card padding="none" className="w-full max-w-sm">
                    <Card.Bleed edges="all">
                        <Card.Media
                            src={MEDIA_SRC}
                            alt=""
                            height={140}
                            bottomLeft={<Badge size="sm" variant="soft">edges="all"</Badge>}
                        />
                    </Card.Bleed>
                </Card>
            ),
            code: `<Card padding="none">
    <Card.Bleed edges="all">
        <Card.Media src={cover} alt="" height={140} />
    </Card.Bleed>
</Card>`,
        },

        /* ── a real composition ───────────────────────────────────────────── */
        {
            name: "A settings card",
            description: "Everything together, and the shape most of the showcase actually uses: a titlebar with an action, rows in the body, and the primary control anchored in the footer.",
            render: () => (
                <Card className="w-full max-w-md" size="lg" sections="divided" dividerInset>
                    <Card.Header
                        heading="Notifications"
                        headingLevel="h2"
                        description="How this project reaches you."
                        actions={<Badge size="sm" variant="soft">3 active</Badge>}
                    />
                    <Card.Body>
                        <div className="space-y-3">
                            {[
                                ["Deploy finished", true],
                                ["Deploy failed", true],
                                ["Weekly digest", false],
                            ].map(([label, on]) => (
                                <div key={String(label)} className="flex items-center justify-between gap-4">
                                    <Text size="sm">{label}</Text>
                                    <Switch defaultChecked={Boolean(on)} />
                                </div>
                            ))}
                        </div>
                    </Card.Body>
                    <Card.Footer>
                        <div className="flex items-center justify-between gap-3">
                            <Text size="xs" className="!text-zinc-500">Saved automatically</Text>
                            <Button variant="ghost">Reset</Button>
                        </div>
                    </Card.Footer>
                </Card>
            ),
            code: `<Card size="lg" sections="divided" dividerInset>
    <Card.Header
        heading="Notifications"
        headingLevel="h2"
        description="How this project reaches you."
        actions={<Badge size="sm" variant="soft">3 active</Badge>}
    />
    <Card.Body>{/* rows of Switch */}</Card.Body>
    <Card.Footer>
        <div className="flex items-center justify-between gap-3">
            <Text size="xs">Saved automatically</Text>
            <Button variant="ghost">Reset</Button>
        </div>
    </Card.Footer>
</Card>`,
        },
    ],
    props: [
        { name: "variant", type: `"outlined" | "elevated" | "flat" | "muted" | "soft"`, default: `"outlined"`, description: "Surface treatment. `muted` and `soft` are tint steps between `outlined` (no tint) and `flat`." },
        { name: "size", type: `"xs" | "sm" | "md" | "lg"`, default: `"md"`, description: "Scales padding and corner radius together." },
        { name: "padding", type: `"none" | "xs" | "sm" | "md" | "lg"`, default: "the step implied by `size`", description: "Inset on the card's direct children. Pass it to override what `size` implies, including `\"none\"`. Anything that must meet the content's edge — an inset divider, a `Card.Bleed` — is keyed to this and never to `size`." },
        { name: "sections", type: `"divided" | "plain" | "banded"`, default: `"divided"`, description: "How Header / Body / Footer are set apart: rules, nothing, or tinted bands." },
        { name: "dividerInset", type: "boolean", default: "false", description: "With `sections=\"divided\"`, stop the rules at the content's edge instead of running them across the card." },
        { name: "highlight", type: "boolean", default: "false", description: "A faint hairline inside the top edge so a tinted or elevated surface reads as lit from above. Works in both colour modes." },
        { name: "interactive", type: "boolean", default: "false", description: "Hover lift and border response for a card that is a link or a tile, and clips children to the rounded corners so a `Card.Media` sits flush." },
        { name: "children", type: "ReactNode", default: "—", description: "Usually the compound parts, but free-form content is fine." },
        { name: "...rest", type: "HTMLAttributes<HTMLDivElement>", default: "—", description: "All standard div attributes." },
    ],
    notes: (
        <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
            <p>
                <strong>Compound parts.</strong> <code>Card.Header</code>, <code>Card.Body</code>,{" "}
                <code>Card.Footer</code>, <code>Card.Media</code> and <code>Card.Bleed</code> hang off
                the root, and are also importable as <code>CardHeader</code>, <code>CardBody</code>,{" "}
                <code>CardFooter</code>, <code>CardMedia</code>, <code>CardBleed</code>.
            </p>
            <p>
                <strong>Header and Footer take content two ways.</strong>{" "}
                <code>heading</code> / <code>description</code> / <code>actions</code> lay out the
                common titlebar for you; <code>children</code> is the escape hatch and it{" "}
                <em>wins</em> — pass both and the three props are ignored rather than rendered
                alongside, so you get one title instead of two.
            </p>
            <p>
                <strong>Bleed is keyed to padding, not size.</strong> A{" "}
                <code>Card.Bleed</code> cancels exactly the inset its card applies, so it stays flush
                when you override <code>padding</code>. That is why the two are separate props.
            </p>
        </div>
    ),
};
