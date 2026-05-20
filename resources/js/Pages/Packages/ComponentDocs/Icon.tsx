import type { ComponentDoc } from "./types";
import { Icon, Text } from "@particle-academy/react-fancy";

export const iconDoc: ComponentDoc = {
    intro: (
        <p>
            A thin wrapper around a pluggable icon registry — pass <code>name</code> and the icon
            resolves from the registered set. Use the configured default set, or specify
            <code>iconSet</code> per call. Composes inside Action, Callout, Badge, Menu items.
        </p>
    ),
    examples: [
        {
            name: "Sizes",
            description: "Five preset sizes — xs for chip-density, xl for hero illustrations.",
            render: () => (
                <div className="flex items-end gap-4">
                    <Icon name="rocket" size="xs" />
                    <Icon name="rocket" size="sm" />
                    <Icon name="rocket" size="md" />
                    <Icon name="rocket" size="lg" />
                    <Icon name="rocket" size="xl" />
                </div>
            ),
            code: `<Icon name="rocket" size="xs" />
<Icon name="rocket" size="sm" />
<Icon name="rocket" size="md" />
<Icon name="rocket" size="lg" />
<Icon name="rocket" size="xl" />`,
        },
        {
            name: "Common names",
            description: "Icon names are kebab-case slugs that the registered icon set resolves.",
            render: () => (
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1"><Icon name="rocket" /> rocket</div>
                    <div className="flex items-center gap-1"><Icon name="arrow-right" /> arrow-right</div>
                    <div className="flex items-center gap-1"><Icon name="check" /> check</div>
                    <div className="flex items-center gap-1"><Icon name="x" /> x</div>
                    <div className="flex items-center gap-1"><Icon name="pencil" /> pencil</div>
                </div>
            ),
            code: `<Icon name="rocket" />
<Icon name="arrow-right" />
<Icon name="check" />
<Icon name="x" />
<Icon name="pencil" />`,
        },
        {
            name: "Color via utility classes",
            description: "Icons inherit currentColor. Add a text color class to recolor.",
            render: () => (
                <div className="flex items-center gap-3">
                    <Icon name="rocket" className="text-violet-500" />
                    <Icon name="rocket" className="text-emerald-500" />
                    <Icon name="rocket" className="text-rose-500" />
                    <Icon name="rocket" className="text-amber-500" />
                </div>
            ),
            code: `<Icon name="rocket" className="text-violet-500" />
<Icon name="rocket" className="text-emerald-500" />`,
        },
        {
            name: "Switching icon sets",
            description: "If your app registers multiple icon sets, target a specific one with `iconSet`.",
            render: () => (
                <Text size="sm">
                    Default set: <Icon name="rocket" /> · Lucide set: <Icon name="rocket" iconSet="lucide" />
                </Text>
            ),
            code: `<Icon name="rocket" iconSet="heroicons" />
<Icon name="rocket" iconSet="lucide" />`,
        },
    ],
    props: [
        { name: "name", type: `string`, default: "—", description: "Kebab-case icon slug to look up in the registered icon set (e.g. `\"rocket\"`, `\"arrow-right\"`)." },
        { name: "size", type: `"xs" | "sm" | "md" | "lg" | "xl"`, default: `"md"`, description: "Bounding-box size for the icon glyph." },
        { name: "iconSet", type: `string`, default: "the configured default", description: "Name of a registered icon set. Useful when your app mixes multiple sets." },
        { name: "className", type: `string`, default: "—", description: "Extra classes — usually a text color (`text-violet-500`) since icons inherit `currentColor`." },
        { name: "...rest", type: `HTMLAttributes<HTMLSpanElement>`, default: "—", description: "All standard span attributes." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Set up:</strong> register your icon set once at app startup (typically in your
            providers tree) with the set's name. Icons are SVG sprites, not network requests,
            so they ship with the bundle.
        </p>
    ),
};
