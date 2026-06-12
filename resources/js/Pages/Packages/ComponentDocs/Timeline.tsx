import type { ComponentDoc } from "./types";
import { Timeline } from "@particle-academy/react-fancy";

const events = [
    { date: "Jan 2024", title: "Project started", description: "First commit hits the repo. Caffeine consumed.", emoji: "🚀", color: "violet" as const },
    { date: "Mar 2024", title: "0.1 shipped", description: "Initial set of primitives — Button, Card, Modal, Tabs, Toast.", emoji: "🎉", color: "emerald" as const },
    { date: "Jun 2024", title: "Agent integrations", description: "MCP bridges land — agents can drive every interactive primitive.", emoji: "🤖", color: "blue" as const },
    { date: "Today", title: "Component docs", description: "Every primitive becomes its own documentation page.", emoji: "📚", color: "amber" as const, active: true },
];

export const timelineDoc: ComponentDoc = {
    intro: (
        <p>
            Vertical or horizontal series of events. Two ways to populate — pass an
            <code>events</code> array (data-driven) or hand-write <code>Timeline.Item</code>{" "}
            children (full control). Each event has a date, title, body, dot color, and an
            optional emoji or icon.
        </p>
    ),
    examples: [
        {
            name: "Stacked (default)",
            description: "Data-driven via the `events` prop.",
            render: () => (
                <Timeline events={events} heading="Roadmap" description="Major milestones on the Fancy UI roadmap." />
            ),
            code: `const events = [
    { date: "Jan 2024", title: "Project started", emoji: "🚀", color: "violet" },
    { date: "Mar 2024", title: "0.1 shipped", emoji: "🎉", color: "emerald" },
    { date: "Jun 2024", title: "Agent integrations", emoji: "🤖", color: "blue" },
    { date: "Today", title: "Component docs", emoji: "📚", color: "amber", active: true },
];

<Timeline
    events={events}
    heading="Roadmap"
    description="Major milestones on the Fancy UI roadmap."
/>`,
        },
        {
            name: "Alternating",
            description: "Items zigzag left + right of the spine.",
            render: () => <Timeline variant="alternating" events={events} />,
            code: `<Timeline variant="alternating" events={events} />`,
        },
        {
            name: "Hand-written items",
            description: "When `events` isn't expressive enough, use `Timeline.Item` children directly.",
            render: () => (
                <Timeline>
                    <Timeline.Item date="Step 1" emoji="📥" color="blue">
                        <strong>Collect inputs.</strong> Read prompts + tool definitions.
                    </Timeline.Item>
                    <Timeline.Item date="Step 2" emoji="🧠" color="violet">
                        <strong>Plan.</strong> Decompose the request into ordered tool calls.
                    </Timeline.Item>
                    <Timeline.Item date="Step 3" emoji="🛠" color="emerald" active>
                        <strong>Execute.</strong> Run tools, accumulate results.
                    </Timeline.Item>
                </Timeline>
            ),
            code: `<Timeline>
    <Timeline.Item date="Step 1" emoji="📥" color="blue">
        <strong>Collect inputs.</strong> Read prompts + tool definitions.
    </Timeline.Item>
    <Timeline.Item date="Step 2" emoji="🧠" color="violet">
        <strong>Plan.</strong> Decompose the request into ordered tool calls.
    </Timeline.Item>
    <Timeline.Item date="Step 3" emoji="🛠" color="emerald" active>
        <strong>Execute.</strong> Run tools, accumulate results.
    </Timeline.Item>
</Timeline>`,
        },
    ],
    props: [
        { name: "events", type: `TimelineEvent[]`, default: "—", description: "Data-driven events. Each: `{ date, title, description?, emoji?, icon?, color?, active? }`." },
        { name: "children", type: `ReactNode`, default: "—", description: "Alternative to `events` — hand-written `Timeline.Item` / `Timeline.Block` children." },
        { name: "variant", type: `"stacked" | "alternating" | "horizontal"`, default: `"stacked"`, description: "Layout. Alternating zigzags items; horizontal runs the timeline left to right." },
        { name: "heading", type: `ReactNode`, default: "—", description: "Heading rendered above the timeline." },
        { name: "description", type: `ReactNode`, default: "—", description: "Description rendered below the heading." },
        { name: "animated", type: `boolean`, default: `true`, description: "Scroll-reveal animation as the timeline enters the viewport." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the root wrapper." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Item props:</strong> <code>date</code>, <code>emoji</code>,
            <code>icon</code>, <code>color</code>, <code>active</code>. The <code>active</code>
            item gets an emphasized dot — useful for "current step" timelines.
        </p>
    ),
};
