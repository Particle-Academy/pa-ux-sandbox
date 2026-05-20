import type { ComponentDoc } from "./types";
import { Action, Card, Separator, Text } from "@particle-academy/react-fancy";

export const separatorDoc: ComponentDoc = {
    intro: (
        <p>
            A horizontal or vertical divider with an optional centered label. Use between
            grouped form fields, between auth methods ("or sign in with"), or inline between
            menu items.
        </p>
    ),
    examples: [
        {
            name: "Horizontal (default)",
            render: () => (
                <div className="w-full max-w-md space-y-3">
                    <Text>Above the line.</Text>
                    <Separator />
                    <Text>Below the line.</Text>
                </div>
            ),
            code: `<Text>Above the line.</Text>
<Separator />
<Text>Below the line.</Text>`,
        },
        {
            name: "With label",
            description: "A short label sits centered on the line — classic auth-screen pattern.",
            render: () => (
                <div className="w-full max-w-md space-y-3">
                    <Action className="w-full" variant="ghost">Continue with email</Action>
                    <Separator label="or" />
                    <Action className="w-full" variant="ghost">Continue with Google</Action>
                </div>
            ),
            code: `<Action className="w-full">Continue with email</Action>
<Separator label="or" />
<Action className="w-full">Continue with Google</Action>`,
        },
        {
            name: "Vertical",
            description: "Vertical separators are great between toolbar groups.",
            render: () => (
                <div className="flex h-10 items-center gap-3">
                    <Action size="sm" variant="ghost">Bold</Action>
                    <Action size="sm" variant="ghost">Italic</Action>
                    <Separator orientation="vertical" />
                    <Action size="sm" variant="ghost">Left</Action>
                    <Action size="sm" variant="ghost">Center</Action>
                    <Separator orientation="vertical" />
                    <Action size="sm" variant="ghost">Link</Action>
                </div>
            ),
            code: `<div className="flex h-10 items-center gap-3">
    <Action size="sm" variant="ghost">Bold</Action>
    <Action size="sm" variant="ghost">Italic</Action>
    <Separator orientation="vertical" />
    <Action size="sm" variant="ghost">Left</Action>
    …
</div>`,
        },
        {
            name: "Inside a Card",
            description: "Use to split the body — pairs well with `padding=\"none\"` for full-bleed lines.",
            render: () => (
                <Card padding="none" className="w-full max-w-md">
                    <div className="p-4"><Text weight="semibold">Section A</Text></div>
                    <Separator />
                    <div className="p-4"><Text weight="semibold">Section B</Text></div>
                    <Separator />
                    <div className="p-4"><Text weight="semibold">Section C</Text></div>
                </Card>
            ),
            code: `<Card padding="none">
    <div className="p-4">Section A</div>
    <Separator />
    <div className="p-4">Section B</div>
    <Separator />
    <div className="p-4">Section C</div>
</Card>`,
        },
    ],
    props: [
        { name: "orientation", type: `"horizontal" | "vertical"`, default: `"horizontal"`, description: "Direction. Vertical separators need a fixed-height parent." },
        { name: "label", type: `string`, default: "—", description: "Optional centered label text. Only honored for horizontal orientation." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root div." },
    ],
};
