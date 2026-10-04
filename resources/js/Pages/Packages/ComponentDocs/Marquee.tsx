import type { ComponentDoc } from "./types";
import { Badge, Marquee, Text } from "@particle-academy/react-fancy";

const LOGOS = ["react-fancy", "fancy-flow", "fancy-sheets", "holy-sheet", "fancy-map", "last-word"];

export const marqueeDoc: ComponentDoc = {
    intro: (
        <p>
            An endlessly scrolling strip. Speed is given in <strong>px/s</strong> rather
            than seconds-per-loop, so the perceived pace stays the same whether the strip
            holds four items or forty — a duration-based marquee speeds up as you add
            content, which is why the same band looks right on one page and frantic on the
            next. Pass items as data or as children.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description:
                "items as data, scrolling left at 40px/s with the edge fade on. Each item is one strip entry.",
            render: () => <Marquee className="w-full" items={LOGOS} />,
            code: `<Marquee items={["react-fancy", "fancy-flow", "fancy-sheets"]} />`,
        },
        {
            name: "Children instead of items",
            description:
                "Each child is one strip item — the alternative when the entries are composed rather than plain text.",
            render: () => (
                <Marquee className="w-full">
                    <Badge color="violet">Human+ UX</Badge>
                    <Badge color="blue">MCP bridges</Badge>
                    <Badge color="green">Headless engines</Badge>
                    <Badge color="amber">Agentic documents</Badge>
                </Marquee>
            ),
            code: `<Marquee>
    <Badge color="violet">Human+ UX</Badge>
    <Badge color="blue">MCP bridges</Badge>
    <Badge color="green">Headless engines</Badge>
</Marquee>`,
        },
        {
            name: "Speed, and direction",
            description:
                "speed is px/s. direction reverses the travel — a pair of strips running opposite ways is the standard logo-wall treatment.",
            render: () => (
                <div className="w-full space-y-3">
                    <Marquee items={LOGOS} speed={20} />
                    <Marquee items={LOGOS} speed={70} direction="right" />
                </div>
            ),
            code: `<Marquee items={logos} speed={20} />
<Marquee items={logos} speed={70} direction="right" />`,
        },
        {
            name: "duration overrides speed",
            description:
                "duration pins seconds-per-loop instead, which is what you want when two strips must stay in lockstep regardless of their content. It ignores speed when both are set.",
            render: () => (
                <div className="w-full space-y-3">
                    <Marquee items={LOGOS} duration={12} />
                    <Marquee items={LOGOS.slice(0, 3)} duration={12} direction="right" />
                </div>
            ),
            code: `{/* Both loop in 12s even though one holds half as many items. */}
<Marquee items={logos} duration={12} />
<Marquee items={logos.slice(0, 3)} duration={12} direction="right" />`,
        },
        {
            name: "Pausing",
            description:
                "pauseOnHover freezes the strip under the cursor, which makes a logo wall readable. paused is the controlled form — drive it from state when something else on the page decides.",
            render: () => (
                <div className="w-full space-y-4">
                    <div>
                        <Text className="mb-1 text-xs text-zinc-500">
                            pauseOnHover — hover the strip
                        </Text>
                        <Marquee items={LOGOS} pauseOnHover />
                    </div>
                    <div>
                        <Text className="mb-1 text-xs text-zinc-500">paused — frozen</Text>
                        <Marquee items={LOGOS} paused />
                    </div>
                </div>
            ),
            code: `<Marquee items={logos} pauseOnHover />

{/* Controlled: freeze while a modal is open, say. */}
<Marquee items={logos} paused={isModalOpen} />`,
        },
        {
            name: "Gap and separator",
            description:
                "gap is the space between items — a number is px, or pass any CSS length. separator renders a node between them, which is how you get the dot-delimited ticker look.",
            render: () => (
                <div className="w-full space-y-3">
                    <Marquee items={LOGOS} gap={16} />
                    <Marquee items={LOGOS} gap="4rem" />
                    <Marquee
                        items={LOGOS}
                        gap={24}
                        separator={<span className="text-violet-500">◆</span>}
                    />
                </div>
            ),
            code: `<Marquee items={logos} gap={16} />
<Marquee items={logos} gap="4rem" />
<Marquee items={logos} separator={<span>◆</span>} />`,
        },
        {
            name: "Edge fade",
            description:
                "fade masks the strip edges so items dissolve rather than clipping mid-letter. true is 48px; pass a number or a CSS length to tune it, or false to turn it off when the strip sits inside a hard-edged container.",
            render: () => (
                <div className="w-full space-y-3">
                    <div>
                        <Text className="mb-1 text-xs text-zinc-500">fade (default, 48px)</Text>
                        <Marquee items={LOGOS} />
                    </div>
                    <div>
                        <Text className="mb-1 text-xs text-zinc-500">fade={"{"}120{"}"}</Text>
                        <Marquee items={LOGOS} fade={120} />
                    </div>
                    <div>
                        <Text className="mb-1 text-xs text-zinc-500">fade off</Text>
                        <Marquee items={LOGOS} fade={false} />
                    </div>
                </div>
            ),
            code: `<Marquee items={logos} />
<Marquee items={logos} fade={120} />
<Marquee items={logos} fade="10%" />
<Marquee items={logos} fade={false} />`,
        },
        {
            name: "Tilted band",
            description:
                "angle tilts the whole strip, and it widens itself slightly so the ends still reach the container edges — the torn, off-axis band that a lot of editorial layouts want and that is fiddly to get right by hand.",
            render: () => (
                <div className="w-full space-y-6 overflow-hidden py-4">
                    <Marquee items={LOGOS} angle={-2} speed={30} />
                    <Marquee items={LOGOS} angle={2} speed={30} direction="right" />
                </div>
            ),
            code: `<Marquee items={logos} angle={-2} />
<Marquee items={logos} angle={2} direction="right" />`,
        },
        {
            name: "Exposing it to assistive tech",
            description:
                "A strip is aria-hidden by default, because a looping band of logos read aloud twice is noise. Set decorative={false} when the content is genuinely informative — the duplicated loop copy stays hidden either way, so nothing is announced twice.",
            render: () => (
                <Marquee
                    className="w-full"
                    decorative={false}
                    items={["Shipping now:", "react-fancy 5.32", "fancy-flow 0.79", "kit 0.5"]}
                    speed={30}
                />
            ),
            code: `<Marquee
    decorative={false}
    items={["Shipping now:", "react-fancy 5.32", "kit 0.5"]}
/>`,
        },
    ],
    props: [
        { name: "items", type: `ReactNode[]`, default: "—", description: "Data-driven items. The JSON-friendly alternative to children." },
        { name: "children", type: `ReactNode`, default: "—", description: "Each child is one strip item." },
        { name: "speed", type: `number`, default: `40`, description: "px/s — keeps perceived speed constant regardless of content width. Ignored when `duration` is set." },
        { name: "duration", type: `number`, default: "—", description: "Explicit seconds per loop. Overrides `speed`." },
        { name: "direction", type: `"left" | "right"`, default: `"left"`, description: "Scroll direction." },
        { name: "pauseOnHover", type: `boolean`, default: `false`, description: "Freeze while hovered." },
        { name: "paused", type: `boolean`, default: `false`, description: "Controlled pause — `true` freezes the strip." },
        { name: "gap", type: `number | string`, default: `40`, description: "Space between items. A number is px." },
        { name: "separator", type: `ReactNode`, default: "—", description: "Node rendered between items." },
        { name: "fade", type: `boolean | number | string`, default: `true`, description: "Masked edge fade. `true` is 48px; a number or CSS length tunes it." },
        { name: "angle", type: `number`, default: `0`, description: "Tilt the strip in degrees. It widens slightly to stay edge-to-edge." },
        { name: "decorative", type: `boolean`, default: `true`, description: "Hide from assistive tech. Set `false` when the content is informative." },
        { name: "...rest", type: `HTMLAttributes<HTMLDivElement>`, default: "—", description: "All standard div attributes." },
    ],
    notes: (
        <ul>
            <li>
                <code>speed</code> and <code>duration</code> answer different questions.{" "}
                <code>speed</code> keeps the pace constant as content changes;{" "}
                <code>duration</code> keeps two strips synchronised. Setting both is not an
                error — <code>duration</code> simply wins.
            </li>
            <li>
                The strip renders a duplicated copy of its content to make the loop seamless.
                That copy is always <code>aria-hidden</code>, so turning{" "}
                <code>decorative</code> off exposes the content once rather than twice.
            </li>
            <li>
                Continuous motion is a vestibular trigger for some readers. Where a strip is
                large or central, gate it on{" "}
                <code>prefers-reduced-motion</code> and pass <code>paused</code>.
            </li>
        </ul>
    ),
};
