import type { ComponentDoc } from "./types";
import { Profile } from "@particle-academy/react-fancy";

export const profileDoc: ComponentDoc = {
    intro: (
        <p>
            Avatar + name + subtitle — the canonical user/agent row. Same image/fallback /
            status story as <code>Avatar</code>, but composes the label inline so you can drop
            a Profile into a header, list item, or hover card without writing the flex
            wrapper yourself.
        </p>
    ),
    examples: [
        {
            name: "Default",
            render: () => <Profile name="Glenn Watson" subtitle="glenn@impactivism.net" fallback="GW" />,
            code: `<Profile
    name="Glenn Watson"
    subtitle="glenn@impactivism.net"
    fallback="GW"
/>`,
        },
        {
            name: "With image",
            render: () => (
                <Profile
                    src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=identicon&s=80"
                    alt="Glenn"
                    name="Glenn Watson"
                    subtitle="Engineer · Anthropic"
                />
            ),
            code: `<Profile
    src="/me.jpg"
    alt="Glenn Watson"
    name="Glenn Watson"
    subtitle="Engineer · Anthropic"
/>`,
        },
        {
            name: "Sizes",
            description: "Three preset sizes — sm for chip rows, lg for hero / profile.",
            render: () => (
                <div className="flex flex-col gap-3">
                    <Profile name="Glenn" subtitle="online" fallback="GW" size="sm" status="online" />
                    <Profile name="Glenn Watson" subtitle="online" fallback="GW" size="md" status="online" />
                    <Profile name="Glenn Watson" subtitle="online · last seen 2m ago" fallback="GW" size="lg" status="online" />
                </div>
            ),
            code: `<Profile name="Glenn" fallback="GW" size="sm" status="online" />
<Profile name="Glenn Watson" fallback="GW" size="md" status="online" />
<Profile name="Glenn Watson" fallback="GW" size="lg" status="online" />`,
        },
        {
            name: "Status indicator",
            description: "Pass `status` to render a presence dot — same values as `Avatar`.",
            render: () => (
                <div className="flex flex-col gap-2">
                    <Profile name="Amy" subtitle="online" fallback="AB" status="online" />
                    <Profile name="Tomas" subtitle="away" fallback="TM" status="away" />
                    <Profile name="Liz" subtitle="busy" fallback="LZ" status="busy" />
                    <Profile name="Carl" subtitle="offline" fallback="CL" status="offline" />
                </div>
            ),
            code: `<Profile name="Amy" subtitle="online" fallback="AB" status="online" />
<Profile name="Tomas" subtitle="away" fallback="TM" status="away" />`,
        },
    ],
    props: [
        { name: "name", type: `string`, default: "—", description: "Primary label. Required." },
        { name: "subtitle", type: `string`, default: "—", description: "Secondary label rendered under the name." },
        { name: "src", type: `string`, default: "—", description: "Image URL for the avatar. Falls back to `fallback` when missing." },
        { name: "alt", type: `string`, default: "—", description: "Accessible alt text for the image." },
        { name: "fallback", type: `string`, default: "—", description: "Initials shown when no image — usually 1–2 letters." },
        { name: "size", type: `"sm" | "md" | "lg"`, default: `"md"`, description: "Overall scale — affects avatar + text size." },
        { name: "status", type: `"online" | "offline" | "busy" | "away"`, default: "—", description: "Presence indicator dot, same as `Avatar`." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
    ],
};
