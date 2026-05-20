import type { ComponentDoc } from "./types";
import { Emoji, EmojiSelect, Text } from "@particle-academy/react-fancy";

export const emojiSelectDoc: ComponentDoc = {
    intro: (
        <p>
            Emoji picker — input that opens a categorized grid with search. Returns the
            kebab-case slug (<code>fire</code>, <code>red-heart</code>) so you can persist it
            and render later via <code>&lt;Emoji name=&#123;...&#125; /&gt;</code>.
        </p>
    ),
    examples: [
        {
            name: "Default",
            render: () => (
                <div className="w-full max-w-xs">
                    <EmojiSelect defaultValue="fire" onChange={() => {}} />
                </div>
            ),
            code: `const [emoji, setEmoji] = useState("fire");

<EmojiSelect value={emoji} onChange={setEmoji} />`,
        },
        {
            name: "Custom placeholder",
            render: () => (
                <div className="w-full max-w-xs">
                    <EmojiSelect placeholder="Reaction…" onChange={() => {}} />
                </div>
            ),
            code: `<EmojiSelect placeholder="Reaction…" onChange={setEmoji} />`,
        },
        {
            name: "Pair with Emoji",
            description: "Use the picked slug to render the emoji at any size in your UI.",
            render: () => (
                <div className="w-full max-w-xs space-y-2">
                    <EmojiSelect defaultValue="rocket" onChange={() => {}} />
                    <Text size="sm" className="flex items-center gap-2">
                        Selected: <Emoji name="rocket" size="lg" />
                    </Text>
                </div>
            ),
            code: `<EmojiSelect value={emoji} onChange={setEmoji} />
<Text>Selected: <Emoji name={emoji} size="lg" /></Text>`,
        },
    ],
    props: [
        { name: "value", type: `string`, default: "—", description: "Controlled emoji slug. Use with `onChange`." },
        { name: "defaultValue", type: `string`, default: "—", description: "Initial slug (uncontrolled)." },
        { name: "onChange", type: `(emoji: string) => void`, default: "—", description: "Called when the user picks an emoji." },
        { name: "placeholder", type: `string`, default: "—", description: "Placeholder shown in the input." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
    ],
};
