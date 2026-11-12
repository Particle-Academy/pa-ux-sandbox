import { useState } from "react";
import type { ComponentDoc } from "./types";
import { Card, ContentReaction, Text, toggleReaction } from "@particle-academy/react-fancy";
import type { ContentReactionItem } from "@particle-academy/react-fancy";

const TEAM_REACTIONS: ContentReactionItem[] = [
    { key: "ship", emoji: "🚀", label: "Ship it" },
    { key: "eyes", emoji: "👀", label: "Looking" },
    { key: "done", emoji: "✅", label: "Done" },
];

function MultiDemo() {
    const [value, setValue] = useState<string[]>(["like"]);
    const [last, setLast] = useState<string>("—");

    return (
        <Card className="w-full max-w-md p-4">
            <Text size="sm">Shipped the release notes for 6.21.0.</Text>
            <div className="mt-3 flex items-center gap-3">
                <ContentReaction
                    value={value}
                    onChange={(next, meta) => {
                        setValue(next);
                        setLast(`${meta.key} ${meta.on ? "on" : "off"}`);
                    }}
                />
                <Text size="xs" className="ml-auto">value: [{value.join(", ")}] · last: {last}</Text>
            </div>
        </Card>
    );
}

function CountsDemo() {
    const [mine, setMine] = useState<string[]>(["insightful"]);
    const base = { like: 17, insightful: 6, love: 4 } as Record<string, number>;
    const counts: Record<string, number> = { ...base };

    for (const key of mine) {
        counts[key] = (counts[key] ?? 0) + 1;
    }

    return (
        <Card className="w-full max-w-md p-4">
            <Text size="sm">Proposal: move the docs site to the new layout primitives.</Text>
            <div className="mt-3">
                <ContentReaction value={mine} mine={mine} counts={counts} onChange={setMine} size="sm" />
            </div>
        </Card>
    );
}

function SingleDemo() {
    const [value, setValue] = useState<string[]>([]);

    return (
        <div className="flex w-full max-w-md items-center gap-3">
            <ContentReaction
                mode="single"
                reactions={TEAM_REACTIONS}
                value={value}
                onChange={setValue}
                placement="bottom-start"
                triggerLabel="Status"
                size="lg"
            />
            <Text size="xs">mode="single": choosing one replaces the other; choosing the active one clears it.</Text>
        </div>
    );
}

export const contentReactionDoc: ComponentDoc = {
    intro: (
        <p>
            Emoji reactions on a comment, post or message. The host owns <code>value</code>, the
            active reaction keys, and gets <code>onChange(next, {"{ key, on }"})</code>. A compact
            trigger shows what is active, or a "React" placeholder, and opens a picker. The picker
            is portalled, so an overflow container cannot clip it, and it has no hover behaviour:
            it never closes on mouse-leave, so there is no dead zone between trigger and picker. It
            closes on an outside click, on Escape (focus returns to the trigger), or after a select
            when <code>closeOnSelect</code> is on.
        </p>
    ),
    examples: [
        {
            name: "Multi (default)",
            description:
                "Any number of reactions can be active. The picker stays open while you toggle, because closeOnSelect defaults off in multi mode. The default set is DEFAULT_CONTENT_REACTIONS.",
            render: () => <MultiDemo />,
            code: `const [value, setValue] = useState<string[]>(["like"]);

<ContentReaction
    value={value}
    onChange={(next, { key, on }) => setValue(next)}
/>`,
        },
        {
            name: "Aggregate counts",
            description:
                "For a multi-user app, counts holds every user's totals by key and mine the current user's keys (it defaults to value). The trigger then shows every reaction with a count above 0, and the current user's are highlighted.",
            render: () => <CountsDemo />,
            code: `<ContentReaction
    value={mine}
    mine={mine}
    counts={{ like: 17, insightful: 7, love: 4 }}   // every user's totals, yours included
    onChange={(next, { key, on }) => api.react(postId, key, on)}
    size="sm"
/>`,
        },
        {
            name: "Single mode, your own reactions",
            description:
                "reactions replaces the set; each item is { key, emoji, label }. placement sets where the picker opens (it flips when there is no room), triggerLabel names the placeholder, and closeOnSelect defaults on in single mode.",
            render: () => <SingleDemo />,
            code: `<ContentReaction
    mode="single"
    reactions={[
        { key: "ship", emoji: "🚀", label: "Ship it" },
        { key: "eyes", emoji: "👀", label: "Looking" },
        { key: "done", emoji: "✅", label: "Done" },
    ]}
    value={value}
    onChange={setValue}
    placement="bottom-start"
    triggerLabel="Status"
/>`,
        },
        {
            name: "Custom trigger, translated, disabled",
            description:
                "renderTrigger replaces the trigger's content; the button and its ARIA stay. labels carries every word for translation. disabled keeps the trigger visible and inert.",
            render: () => (
                <div className="flex w-full max-w-md flex-wrap items-center gap-4">
                    <ContentReaction
                        value={["love"]}
                        closeOnSelect
                        renderTrigger={(state) => (
                            <span className="text-sm">
                                {state.active.length ? state.active.map((r) => r.emoji).join(" ") : "+"} ({state.mine.length})
                            </span>
                        )}
                        labels={{ trigger: "Reagieren", menu: "Reaktionen", triggerActive: "{trigger}: {reactions}", triggerCounts: "{counts}, {trigger}", itemCount: "{label} ({count})" }}
                    />
                    <ContentReaction value={["like"]} disabled />
                </div>
            ),
            code: `<ContentReaction
    value={value}
    onChange={setValue}
    closeOnSelect
    renderTrigger={(state) => <span>{state.active.map((r) => r.emoji).join(" ")}</span>}
    labels={{ trigger: "Reagieren", menu: "Reaktionen" }}
/>
<ContentReaction value={["like"]} disabled />`,
        },
        {
            name: "The toggle rule, without the UI",
            description:
                "toggleReaction(value, key, mode) is the same rule as a pure function, returning { next, on }, for a server, an agent tool or an optimistic update.",
            render: () => (
                <Text size="sm" className="font-mono">
                    toggleReaction(["like"], "love", "single") → {JSON.stringify(toggleReaction(["like"], "love", "single"))}
                </Text>
            ),
            code: `import { toggleReaction } from "@particle-academy/react-fancy/content-reaction";

toggleReaction(["like"], "love", "multi");  // { next: ["like", "love"], on: true }
toggleReaction(["like"], "love", "single"); // { next: ["love"], on: true }
toggleReaction(["love"], "love", "single"); // { next: [], on: false }`,
        },
    ],
    props: [
        { name: "value", type: `readonly string[]`, default: "—", description: "Active reaction keys.", required: true },
        { name: "onChange", type: `(next: string[], meta: { key, on }) => void`, default: "—", description: "Called with the next value and what changed. The host owns the state." },
        { name: "reactions", type: `ContentReactionItem[]`, default: "DEFAULT_CONTENT_REACTIONS", description: "The reactions offered, each `{ key, emoji, label }`." },
        { name: "mode", type: `"multi" | "single"`, default: `"multi"`, description: "`single`: at most one; choosing another replaces it." },
        { name: "counts", type: `Record<string, number>`, default: "—", description: "Aggregate counts by key. The trigger shows every reaction with a count above 0." },
        { name: "mine", type: `readonly string[]`, default: "value", description: "The current user's keys, highlighted among the counts." },
        { name: "size", type: `"sm" | "md" | "lg"`, default: `"md"`, description: "Trigger and picker size." },
        { name: "disabled", type: `boolean`, default: `false`, description: "Trigger shown, picker unavailable." },
        { name: "placement", type: `Placement`, default: `"top-start"`, description: "Where the picker opens. Flips when there is no room." },
        { name: "closeOnSelect", type: `boolean`, default: "false (multi) / true (single)", description: "Close the picker after a select." },
        { name: "triggerLabel", type: `string`, default: `"React"`, description: "Placeholder and accessible name when nothing is active." },
        { name: "renderTrigger", type: `(state: ContentReactionTriggerState) => ReactNode`, default: "—", description: "Replaces the trigger's content; the button and its ARIA stay." },
        { name: "labels", type: `ContentReactionLabels`, default: "English", description: "`trigger`, `menu`, `triggerActive`, `triggerCounts`, `itemCount`." },
    ],
    notes: (
        <p>
            Keyboard: Enter, Space or ArrowDown opens the picker; arrow keys move between items,
            Home and End jump, Enter and Space toggle. The trigger has{" "}
            <code>aria-haspopup="menu"</code> and <code>aria-expanded</code>; the picker is{" "}
            <code>role="menu"</code> with <code>menuitemcheckbox</code> items. Handles:{" "}
            <code>data-react-fancy-content-reaction</code> (root), <code>-trigger</code>,{" "}
            <code>-chip</code>, <code>-menu</code> and <code>-item</code> with{" "}
            <code>data-reaction-key</code> and <code>data-state="on|off"</code>. An agent drives
            it through <code>registerContentReactionBridge</code> in{" "}
            <code>@particle-academy/agent-integrations</code>.
        </p>
    ),
};
