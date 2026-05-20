import type { ComponentDoc } from "./types";
import { Emoji, Text } from "@particle-academy/react-fancy";

export const emojiDoc: ComponentDoc = {
    intro: (
        <p>
            Render an emoji from a kebab-case slug (<code>fire</code>, <code>thumbs-up</code>,
            <code>red-heart</code>) or from the raw glyph. Same registry the Action and
            EmojiSelect components use — so a user-picked emoji in one place renders identically
            everywhere.
        </p>
    ),
    examples: [
        {
            name: "By slug",
            description: "The canonical way — slugs are stable across emoji datasets and skin tones.",
            render: () => (
                <div className="flex items-center gap-3 text-2xl">
                    <Emoji name="fire" />
                    <Emoji name="rocket" />
                    <Emoji name="thumbs-up" />
                    <Emoji name="party-popper" />
                    <Emoji name="red-heart" />
                </div>
            ),
            code: `<Emoji name="fire" />
<Emoji name="rocket" />
<Emoji name="thumbs-up" />
<Emoji name="party-popper" />
<Emoji name="red-heart" />`,
        },
        {
            name: "By raw glyph",
            description: "If you already have the character, pass it via `emoji`.",
            render: () => (
                <div className="flex items-center gap-3 text-2xl">
                    <Emoji emoji="🔥" />
                    <Emoji emoji="🚀" />
                    <Emoji emoji="🎉" />
                </div>
            ),
            code: `<Emoji emoji="🔥" />
<Emoji emoji="🚀" />
<Emoji emoji="🎉" />`,
        },
        {
            name: "Sizes",
            description: "Four sizes — sm for inline chips, xl for hero / empty-state messaging.",
            render: () => (
                <div className="flex items-end gap-3">
                    <Emoji name="rocket" size="sm" />
                    <Emoji name="rocket" size="md" />
                    <Emoji name="rocket" size="lg" />
                    <Emoji name="rocket" size="xl" />
                </div>
            ),
            code: `<Emoji name="rocket" size="sm" />
<Emoji name="rocket" size="md" />
<Emoji name="rocket" size="lg" />
<Emoji name="rocket" size="xl" />`,
        },
        {
            name: "Skin tone",
            description: "Slugs that support skin tones (hands, people) honor the `tone` prop.",
            render: () => (
                <div className="flex items-center gap-3 text-2xl">
                    <Emoji name="thumbs-up" tone={1} />
                    <Emoji name="thumbs-up" tone={2} />
                    <Emoji name="thumbs-up" tone={3} />
                    <Emoji name="thumbs-up" tone={4} />
                    <Emoji name="thumbs-up" tone={5} />
                </div>
            ),
            code: `<Emoji name="thumbs-up" tone={1} />
<Emoji name="thumbs-up" tone={2} />
<Emoji name="thumbs-up" tone={3} />
<Emoji name="thumbs-up" tone={4} />
<Emoji name="thumbs-up" tone={5} />`,
        },
        {
            name: "Inline with text",
            description: "Emoji is an inline span — slot it into any string.",
            render: () => (
                <Text>
                    Shipped <Emoji name="rocket" size="sm" /> — celebrate <Emoji name="party-popper" size="sm" />
                </Text>
            ),
            code: `<Text>
    Shipped <Emoji name="rocket" size="sm" /> — celebrate <Emoji name="party-popper" size="sm" />
</Text>`,
        },
    ],
    props: [
        { name: "name", type: `string`, default: "—", description: "Kebab-case slug from the emoji registry (e.g., `\"fire\"`, `\"red-heart\"`). Mutually exclusive with `emoji`." },
        { name: "emoji", type: `string`, default: "—", description: "Raw glyph (e.g., `\"🔥\"`). Use when you already have the character." },
        { name: "tone", type: `1 | 2 | 3 | 4 | 5`, default: "—", description: "Skin tone (1 = lightest, 5 = darkest). Only applies to slugs that support tones." },
        { name: "size", type: `"sm" | "md" | "lg" | "xl"`, default: `"md"`, description: "Display size." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the wrapping span." },
    ],
};
