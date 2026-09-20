import type { ComponentDoc } from "./types";
import { Avatar } from "@particle-academy/react-fancy";

export const avatarDoc: ComponentDoc = {
    intro: (
        <p>
            User / agent thumbnail. Renders an image when <code>src</code> is provided, or a
            colored fallback with initials. Five sizes and an optional status dot for
            online / away / busy presence.
        </p>
    ),
    examples: [
        {
            name: "With image",
            render: () => (
                <Avatar src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&s=80" alt="User" />
            ),
            code: `<Avatar src="/me.jpg" alt="Avery" />`,
        },
        {
            name: "Initials fallback",
            description: "When no `src` is set, the `fallback` string renders inside a tinted circle.",
            render: () => (
                <div className="flex items-center gap-2">
                    <Avatar fallback="AC" />
                    <Avatar fallback="AB" />
                    <Avatar fallback="CL" />
                    <Avatar fallback="MM" />
                </div>
            ),
            code: `<Avatar fallback="AC" />
<Avatar fallback="AB" />
<Avatar fallback="CL" />
<Avatar fallback="MM" />`,
        },
        {
            name: "Sizes",
            description: "Five preset sizes — xs for chip-density lists, xl for hero / profile.",
            render: () => (
                <div className="flex items-end gap-3">
                    <Avatar fallback="AC" size="xs" />
                    <Avatar fallback="AC" size="sm" />
                    <Avatar fallback="AC" size="md" />
                    <Avatar fallback="AC" size="lg" />
                    <Avatar fallback="AC" size="xl" />
                </div>
            ),
            code: `<Avatar fallback="AC" size="xs" />
<Avatar fallback="AC" size="sm" />
<Avatar fallback="AC" size="md" />
<Avatar fallback="AC" size="lg" />
<Avatar fallback="AC" size="xl" />`,
        },
        {
            name: "Status indicator",
            description: "A small dot in the bottom-right shows presence — online / away / busy / offline.",
            render: () => (
                <div className="flex items-center gap-3">
                    <Avatar fallback="AC" status="online" />
                    <Avatar fallback="AC" status="away" />
                    <Avatar fallback="AC" status="busy" />
                    <Avatar fallback="AC" status="offline" />
                </div>
            ),
            code: `<Avatar fallback="AC" status="online" />
<Avatar fallback="AC" status="away" />
<Avatar fallback="AC" status="busy" />
<Avatar fallback="AC" status="offline" />`,
        },
        {
            name: "Stacked group",
            description: "Negative margin overlaps avatars — classic team / collaborator pattern.",
            render: () => (
                <div className="flex -space-x-2">
                    <Avatar fallback="AC" className="ring-2 ring-white dark:ring-zinc-950" />
                    <Avatar fallback="AB" className="ring-2 ring-white dark:ring-zinc-950" />
                    <Avatar fallback="CL" className="ring-2 ring-white dark:ring-zinc-950" />
                    <Avatar fallback="+4" className="ring-2 ring-white dark:ring-zinc-950" />
                </div>
            ),
            code: `<div className="flex -space-x-2">
    <Avatar fallback="AC" className="ring-2 ring-white" />
    <Avatar fallback="AB" className="ring-2 ring-white" />
    <Avatar fallback="CL" className="ring-2 ring-white" />
    <Avatar fallback="+4" className="ring-2 ring-white" />
</div>`,
        },
    ],
    props: [
        { name: "src", type: `string`, default: "—", description: "Image URL. When missing or fails to load, `fallback` is shown." },
        { name: "alt", type: `string`, default: "—", description: "Accessible alt text for the image." },
        { name: "fallback", type: `string`, default: "—", description: "Initials shown when no `src`. 1–2 characters look best." },
        { name: "size", type: `"xs" | "sm" | "md" | "lg" | "xl"`, default: `"md"`, description: "Avatar diameter." },
        { name: "status", type: `"online" | "offline" | "busy" | "away"`, default: "—", description: "Presence indicator dot." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root span." },
    ],
};
