import { Button } from "@particle-academy/react-fancy";
import type { ComponentDoc } from "./types";

export const buttonDoc: ComponentDoc = {
    intro: (
        <>
            <code>Button</code> is the one-and-only button primitive in
            react-fancy. It bundles every reasonable button affordance —
            standalone color, behavioral states, icons, emojis, avatars,
            badges, sort order, shapes — behind a single typed prop surface,
            so apps stop accumulating four-flavored button components that
            mostly agree.
        </>
    ),

    examples: [
        {
            name: "Default",
            description: "Plain Button — neutral surface, label only. Everything else is opt-in.",
            render: () => (
                <div className="flex flex-wrap gap-2">
                    <Button>Save</Button>
                    <Button>Cancel</Button>
                    <Button>Edit profile</Button>
                </div>
            ),
            code: `<Button>Save</Button>
<Button>Cancel</Button>
<Button>Edit profile</Button>`,
        },
        {
            name: "Variants",
            description:
                "Three shape variants. `default` (rounded rectangle), `circle` (perfect circle for icon-only toolbars), `ghost` (subtle, no border / no fill — for low-emphasis actions in dense rows).",
            render: () => (
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="default">Default</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="circle" icon="bell" />
                    <Button variant="circle" icon="trash" color="red" />
                </div>
            ),
            code: `<Button variant="default">Default</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="circle" icon="bell" />
<Button variant="circle" icon="trash" color="red" />`,
        },
        {
            name: "All colors",
            description:
                "Ten standalone colors. Use them when you want a specific brand tone regardless of behavioral state.",
            render: () => (
                <div className="flex flex-wrap gap-2">
                    <Button color="violet">Violet</Button>
                    <Button color="indigo">Indigo</Button>
                    <Button color="blue">Blue</Button>
                    <Button color="sky">Sky</Button>
                    <Button color="emerald">Emerald</Button>
                    <Button color="amber">Amber</Button>
                    <Button color="orange">Orange</Button>
                    <Button color="red">Red</Button>
                    <Button color="rose">Rose</Button>
                    <Button color="zinc">Zinc</Button>
                </div>
            ),
            code: `<Button color="violet">Violet</Button>
<Button color="indigo">Indigo</Button>
<Button color="blue">Blue</Button>
<Button color="sky">Sky</Button>
<Button color="emerald">Emerald</Button>
<Button color="amber">Amber</Button>
<Button color="orange">Orange</Button>
<Button color="red">Red</Button>
<Button color="rose">Rose</Button>
<Button color="zinc">Zinc</Button>`,
        },
        {
            name: "Sizes",
            description: "Five sizes from `xs` to `xl`. Default is `md`.",
            render: () => (
                <div className="flex flex-wrap items-center gap-2">
                    <Button size="xs">xs</Button>
                    <Button size="sm">sm</Button>
                    <Button size="md">md</Button>
                    <Button size="lg">lg</Button>
                    <Button size="xl">xl</Button>
                </div>
            ),
            code: `<Button size="xs">xs</Button>
<Button size="sm">sm</Button>
<Button size="md">md</Button>
<Button size="lg">lg</Button>
<Button size="xl">xl</Button>`,
        },
        {
            name: "Behavioral states",
            description:
                "Four boolean states with default colors when no `color` prop is set: `active` → blue, `checked` → emerald, `warn` → amber, `alert` → pulse animation (no color shift). Combine freely with `color` if you want to keep the visual tone but signal state.",
            render: () => (
                <div className="flex flex-wrap items-center gap-2">
                    <Button active>Active</Button>
                    <Button checked icon="check">Checked</Button>
                    <Button warn icon="exclamation-triangle">Warning</Button>
                    <Button alert icon="bell">Alert</Button>
                    <Button color="red" alert icon="bell">Red + alert</Button>
                </div>
            ),
            code: `<Button active>Active</Button>
<Button checked icon="check">Checked</Button>
<Button warn icon="exclamation-triangle">Warning</Button>
<Button alert icon="bell">Alert</Button>
<Button color="red" alert icon="bell">Red + alert</Button>`,
        },
        {
            name: "Icons — leading & trailing",
            description: "Icons resolve via the Heroicon registry. Use `icon` for the leading slot, `iconTrailing` for the right side.",
            render: () => (
                <div className="flex flex-wrap items-center gap-2">
                    <Button icon="pencil">Edit</Button>
                    <Button icon="trash" color="red">Delete</Button>
                    <Button iconTrailing="arrow-right" color="violet">Continue</Button>
                    <Button iconTrailing="chevron-down">More</Button>
                </div>
            ),
            code: `<Button icon="pencil">Edit</Button>
<Button icon="trash" color="red">Delete</Button>
<Button iconTrailing="arrow-right" color="violet">Continue</Button>
<Button iconTrailing="chevron-down">More</Button>`,
        },
        {
            name: "Icon placement",
            description: "`iconPlace` overrides the default left placement. Useful for stacked icon+label layouts in toolbars.",
            render: () => (
                <div className="flex flex-wrap items-center gap-2">
                    <Button icon="bars-3" iconPlace="top">Menu</Button>
                    <Button icon="adjustments-horizontal" iconPlace="top">Filters</Button>
                    <Button icon="bookmark" iconPlace="bottom">Save</Button>
                    <Button icon="information-circle" iconPlace="right">Info</Button>
                </div>
            ),
            code: `<Button icon="bars-3" iconPlace="top">Menu</Button>
<Button icon="adjustments-horizontal" iconPlace="top">Filters</Button>
<Button icon="bookmark" iconPlace="bottom">Save</Button>
<Button icon="information-circle" iconPlace="right">Info</Button>`,
        },
        {
            name: "Emoji",
            description: "Add emoji on either side via `emoji` / `emojiTrailing`. Slugs are resolved through the emoji utility (`fire`, `rocket`, `thumbs-up`, `sparkles`, etc.).",
            render: () => (
                <div className="flex flex-wrap items-center gap-2">
                    <Button emoji="fire" color="red">Hot</Button>
                    <Button emoji="rocket" color="violet">Launch</Button>
                    <Button emojiTrailing="thumbs-up">Like</Button>
                    <Button emoji="party-popper" emojiTrailing="sparkles">Celebrate</Button>
                </div>
            ),
            code: `<Button emoji="fire" color="red">Hot</Button>
<Button emoji="rocket" color="violet">Launch</Button>
<Button emojiTrailing="thumbs-up">Like</Button>
<Button emoji="party-popper" emojiTrailing="sparkles">Celebrate</Button>`,
        },
        {
            name: "Avatar",
            description: "Replace the leading slot with a small circular avatar from a URL.",
            render: () => (
                <div className="flex flex-wrap items-center gap-2">
                    <Button avatar="https://github.com/anthropic.png">Anthropic</Button>
                    <Button avatar="https://github.com/vercel.png" variant="ghost">Vercel</Button>
                    <Button avatar="https://github.com/laravel.png" avatarTrailing color="red">Laravel</Button>
                </div>
            ),
            code: `<Button avatar="https://github.com/anthropic.png">Anthropic</Button>
<Button avatar="https://github.com/vercel.png" variant="ghost">Vercel</Button>
<Button avatar="https://github.com/laravel.png" avatarTrailing color="red">Laravel</Button>`,
        },
        {
            name: "Badge",
            description: "Decorative pill — counts, status labels, version chips. Sits on the trailing side by default; flip with `badgeTrailing={false}`.",
            render: () => (
                <div className="flex flex-wrap items-center gap-2">
                    <Button icon="bell" badge="3">Notifications</Button>
                    <Button icon="inbox" badge="12" color="violet">Inbox</Button>
                    <Button badge="NEW" color="emerald">Featured</Button>
                    <Button icon="cog" badge="beta" color="amber">Settings</Button>
                </div>
            ),
            code: `<Button icon="bell" badge="3">Notifications</Button>
<Button icon="inbox" badge="12" color="violet">Inbox</Button>
<Button badge="NEW" color="emerald">Featured</Button>
<Button icon="cog" badge="beta" color="amber">Settings</Button>`,
        },
        {
            name: "Sort order",
            description: "When multiple decorations stack, `sort` controls the rendering order. Default is `eiab` (emoji, icon, avatar, badge). Reorder freely — e.g. `iabe` puts emoji last.",
            render: () => (
                <div className="flex flex-wrap items-center gap-2">
                    <Button icon="star" emoji="fire" badge="HOT" sort="eib">Default eib</Button>
                    <Button icon="star" emoji="fire" badge="HOT" sort="bie">Reversed bie</Button>
                    <Button icon="star" emoji="fire" badge="HOT" sort="ibe">Icon first</Button>
                </div>
            ),
            code: `<Button icon="star" emoji="fire" badge="HOT" sort="eib">Default eib</Button>
<Button icon="star" emoji="fire" badge="HOT" sort="bie">Reversed bie</Button>
<Button icon="star" emoji="fire" badge="HOT" sort="ibe">Icon first</Button>`,
        },
        {
            name: "Loading",
            description: "Replaces the leading icon (or first slot) with a spinner. The button stays interactive unless you also pass `disabled`.",
            render: () => (
                <div className="flex flex-wrap items-center gap-2">
                    <Button loading>Saving…</Button>
                    <Button loading color="violet">Uploading</Button>
                    <Button loading variant="circle" />
                    <Button loading disabled>Working</Button>
                </div>
            ),
            code: `<Button loading>Saving…</Button>
<Button loading color="violet">Uploading</Button>
<Button loading variant="circle" />
<Button loading disabled>Working</Button>`,
        },
        {
            name: "Disabled",
            description: "Greys out the surface and blocks pointer events. Pair with `loading` for the most common async pattern.",
            render: () => (
                <div className="flex flex-wrap items-center gap-2">
                    <Button disabled>Submit</Button>
                    <Button disabled color="violet" icon="rocket">Launch</Button>
                    <Button disabled variant="ghost">Cancel</Button>
                </div>
            ),
            code: `<Button disabled>Submit</Button>
<Button disabled color="violet" icon="rocket">Launch</Button>
<Button disabled variant="ghost">Cancel</Button>`,
        },
        {
            name: "As an anchor",
            description: "Pass `href` and the Button renders as `<a>` instead of `<button>` — drop-in replacement for nav links that want button styling. Combine with `iconTrailing` for the canonical \"learn more →\" pattern.",
            render: () => (
                <div className="flex flex-wrap items-center gap-2">
                    <Button href="#" iconTrailing="arrow-right">Read the docs</Button>
                    <Button href="#" color="violet" icon="arrow-down-tray">Download zip</Button>
                    <Button href="#" variant="ghost" iconTrailing="arrow-top-right-on-square">View on GitHub</Button>
                </div>
            ),
            code: `<Button href="/docs" iconTrailing="arrow-right">Read the docs</Button>
<Button href="/download" color="violet" icon="arrow-down-tray">Download zip</Button>
<Button href="https://github.com/..." variant="ghost" iconTrailing="arrow-top-right-on-square">View on GitHub</Button>`,
        },
        {
            name: "Kitchen sink",
            description: "Everything stacks. Real Inbox-style button: emoji, leading icon, label, trailing badge, alert pulse, custom color, large size.",
            render: () => (
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        emoji="rocket"
                        icon="bell"
                        badge="12"
                        color="violet"
                        size="lg"
                        alert
                        sort="eib"
                    >
                        Inbox
                    </Button>
                    <Button
                        avatar="https://github.com/anthropic.png"
                        iconTrailing="chevron-down"
                        badge="pro"
                        variant="ghost"
                    >
                        anthropic
                    </Button>
                </div>
            ),
            code: `<Button
  emoji="rocket"
  icon="bell"
  badge="12"
  color="violet"
  size="lg"
  alert
  sort="eib"
>
  Inbox
</Button>

<Button
  avatar="https://github.com/anthropic.png"
  iconTrailing="chevron-down"
  badge="pro"
  variant="ghost"
>
  anthropic
</Button>`,
        },
    ],

    props: [
        {
            name: "children",
            type: "ReactNode",
            description: "Button label. Pass any text or nested nodes.",
        },
        {
            name: "variant",
            type: `"default" | "circle" | "ghost"`,
            default: `"default"`,
            description: "Shape and fill style. `circle` is for icon-only toolbar buttons.",
        },
        {
            name: "color",
            type: `"blue" | "emerald" | "amber" | "red" | "violet" | "indigo" | "sky" | "rose" | "orange" | "zinc"`,
            default: "—",
            description: "Standalone color. Wins over the default colors from behavioral states.",
        },
        {
            name: "size",
            type: `"xs" | "sm" | "md" | "lg" | "xl"`,
            default: `"md"`,
            description: "Overall button size — affects padding, font size, and icon size.",
        },
        {
            name: "active",
            type: "boolean",
            default: "false",
            description: "Active/selected state. Defaults to blue tone when no `color` prop is set.",
        },
        {
            name: "checked",
            type: "boolean",
            default: "false",
            description: "Toggle/checkbox state. Defaults to emerald tone.",
        },
        {
            name: "warn",
            type: "boolean",
            default: "false",
            description: "Warning state. Defaults to amber tone.",
        },
        {
            name: "alert",
            type: "boolean",
            default: "false",
            description: "Pulse animation effect. No color change; combine with `color` for tone.",
        },
        {
            name: "icon",
            type: "string",
            default: "—",
            description: "Leading-slot Heroicon slug (e.g. `pencil`, `trash`, `bell`).",
        },
        {
            name: "iconTrailing",
            type: "string",
            default: "—",
            description: "Trailing-slot Heroicon slug. Common: `arrow-right`, `chevron-down`.",
        },
        {
            name: "iconPlace",
            type: `"left" | "right" | "top" | "bottom" | "top left" | …`,
            default: `"left"`,
            description: "Position the icon vertically/horizontally. Useful for stacked toolbar buttons.",
        },
        {
            name: "alertIcon",
            type: "string",
            default: "—",
            description: "Pulsing alert icon slug. Independent of the regular `icon`.",
        },
        {
            name: "alertIconTrailing",
            type: "boolean",
            default: "false",
            description: "Place the alert icon on the trailing side.",
        },
        {
            name: "emoji",
            type: "string",
            default: "—",
            description: "Leading emoji slug (`fire`, `rocket`, `sparkles`, …).",
        },
        {
            name: "emojiTrailing",
            type: "string",
            default: "—",
            description: "Trailing emoji slug.",
        },
        {
            name: "avatar",
            type: "string",
            default: "—",
            description: "Image URL rendered as a circular avatar in the leading slot.",
        },
        {
            name: "avatarTrailing",
            type: "boolean",
            default: "false",
            description: "Move the avatar to the trailing side.",
        },
        {
            name: "badge",
            type: "string",
            default: "—",
            description: "Decorative pill — counts, version chips, status labels.",
        },
        {
            name: "badgeTrailing",
            type: "boolean",
            default: "true",
            description: "Position the badge on the trailing side. Set `false` for leading.",
        },
        {
            name: "sort",
            type: "string",
            default: `"eiab"`,
            description: "Order of decorations: `e` emoji, `i` icon, `a` avatar, `b` badge. Reorder freely.",
        },
        {
            name: "loading",
            type: "boolean",
            default: "false",
            description: "Replace the leading slot with a spinner.",
        },
        {
            name: "disabled",
            type: "boolean",
            default: "false",
            description: "Greys out the button and blocks pointer events.",
        },
        {
            name: "href",
            type: "string",
            default: "—",
            description: "When set, the button renders as an `<a>` anchor instead of `<button>`.",
        },
        {
            name: "onClick",
            type: "(e: MouseEvent) => void",
            default: "—",
            description: "Standard React click handler. Works on both `<button>` and `<a>` renders.",
        },
    ],

    notes: (
        <>
            <strong>Accessibility:</strong> Button renders a real{" "}
            <code>&lt;button&gt;</code> (or <code>&lt;a&gt;</code> when{" "}
            <code>href</code> is passed) — keyboard focus, Enter / Space
            activation, and disabled semantics all come from the browser.
            For icon-only circle buttons, set <code>aria-label</code>{" "}
            explicitly so screen readers can announce the action.
            <br /><br />
            <strong>Agent-driveable:</strong> stable handles are required.
            Either pass <code>id</code> directly or rely on the host
            assigning one — the MCP form bridge in agent-integrations
            walks Buttons by id when applying click instructions.
        </>
    ),
};
