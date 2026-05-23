import { useState } from "react";
import type { ComponentDoc } from "./types";
import { DeckEditor, defaultTheme, type Deck } from "@particle-academy/fancy-slides";
import "@particle-academy/fancy-slides/styles.css";

const seed: Deck = {
    id: "doc",
    title: "Untitled",
    theme: defaultTheme,
    slides: [
        {
            id: "s1",
            layout: "title",
            elements: [
                {
                    id: "e1",
                    type: "text",
                    x: 0.1,
                    y: 0.4,
                    w: 0.8,
                    h: 0.2,
                    content: "Title slide",
                    format: "plain",
                    style: { fontSize: 56, weight: "bold", align: "center" },
                },
            ],
        },
    ],
};

function MiniEditor() {
    const [deck, setDeck] = useState<Deck>(seed);
    return (
        <div className="h-[520px] w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <DeckEditor value={deck} onChange={setDeck} />
        </div>
    );
}

export const deckEditorDoc: ComponentDoc = {
    intro: (
        <p>
            Full presentation editor. Composes a top toolbar, a left slide rail with
            drag-to-reorder + context menu, a center canvas with click-to-select +
            <strong> drag-to-move</strong> + <strong>8 resize handles</strong>, a right
            inspector with per-element-type controls, and a bottom speaker-notes panel.
            Fully controlled — pass a <code>Deck</code> in, get one back via
            <code>onChange</code>.
        </p>
    ),
    examples: [
        {
            name: "Mini editor",
            description: "Click an element to select it (8 resize handles appear); drag the body to move; right-click a slide in the rail for actions.",
            render: () => <MiniEditor />,
            code: `import { useState } from "react";
import { DeckEditor, defaultTheme } from "@particle-academy/fancy-slides";
import "@particle-academy/fancy-slides/styles.css";

const [deck, setDeck] = useState({
    id: "demo",
    title: "My deck",
    theme: defaultTheme,
    slides: [
        {
            id: "s1",
            layout: "title",
            elements: [
                { id: "e1", type: "text", x: 0.1, y: 0.4, w: 0.8, h: 0.2,
                  content: "Title slide", format: "plain",
                  style: { fontSize: 56, weight: "bold", align: "center" } },
            ],
        },
    ],
});

<DeckEditor value={deck} onChange={setDeck} />`,
        },
        {
            name: "With activity stream",
            description: "Pass `onOp` to tail every mutation as a typed `DeckOp` — feed an AgentPanel or audit log.",
            render: () => (
                <div className="rounded-md border border-dashed border-zinc-300 p-3 text-xs text-zinc-500 dark:border-zinc-700">
                    See <code>/react-demos/slides</code> for the full editor + activity stream side-by-side.
                </div>
            ),
            code: `<DeckEditor
    value={deck}
    onChange={setDeck}
    onOp={(op) => {
        // op is a typed DeckOp — same shape the agent bridge emits
        analytics.track("deck.edit", { op });
    }}
/>`,
        },
        {
            name: "With element registry (chart / code / table)",
            description: "Pass `renderElement` from the default registry to enable chart / code / table / embed elements.",
            render: () => (
                <div className="rounded-md border border-dashed border-zinc-300 p-3 text-xs text-zinc-500 dark:border-zinc-700">
                    The registry pulls fancy-echarts / fancy-code / react-fancy Table behind dynamic imports — only loaded when a deck actually uses them.
                </div>
            ),
            code: `import { defaultElementRegistry } from "@particle-academy/fancy-slides/registry";

<DeckEditor
    value={deck}
    onChange={setDeck}
    renderElement={defaultElementRegistry}
/>`,
        },
        {
            name: "Hide chrome (embedded use)",
            description: "Toggle off rail / inspector / notes / toolbar when embedding in a smaller surface.",
            render: () => (
                <div className="rounded-md border border-dashed border-zinc-300 p-3 text-xs text-zinc-500 dark:border-zinc-700">
                    Pass any subset of `hideRail`, `hideInspector`, `hideNotes`, `hideToolbar`.
                </div>
            ),
            code: `<DeckEditor
    value={deck}
    onChange={setDeck}
    hideRail
    hideNotes
/>`,
        },
    ],
    props: [
        { name: "value", type: `Deck`, default: "—", description: "Controlled deck. Required." },
        { name: "onChange", type: `(next: Deck) => void`, default: "—", description: "Called after every mutation with the new deck. Required." },
        { name: "onOp", type: `(op: DeckOp) => void`, default: "—", description: "Called with the typed op that produced the mutation. Same shape the agent bridge emits." },
        { name: "onPresent", type: `() => void`, default: "—", description: "Called when the user clicks Present. Host decides how to open the SlideViewer." },
        { name: "selectedSlideId", type: `string | null`, default: "—", description: "Controlled selected slide id. Uncontrolled by default." },
        { name: "onSelectedSlideChange", type: `(id: string | null) => void`, default: "—", description: "Called when selection changes." },
        { name: "renderElement", type: `(element, slideWidthPx) => ReactNode | undefined`, default: "—", description: "Custom renderer for chart / code / table / embed (or custom types)." },
        { name: "hideRail", type: `boolean`, default: `false`, description: "Hide the slide rail." },
        { name: "hideToolbar", type: `boolean`, default: `false`, description: "Hide the top toolbar." },
        { name: "hideInspector", type: `boolean`, default: `false`, description: "Hide the right inspector." },
        { name: "hideNotes", type: `boolean`, default: `false`, description: "Hide the speaker notes panel." },
        { name: "toolbarExtra", type: `ReactNode`, default: "—", description: "Extra content on the toolbar's trailing edge." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the editor root." },
    ],
    notes: (
        <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
            <p><strong>Canvas interactions:</strong> single click selects, drag the element body moves it (slide-relative 0..1 coords clamped to fit), 8 handles (4 corners + 4 edges) resize. Locked elements skip drag/resize. Text elements get an interactive textarea only after selection — first click selects, subsequent click focuses the textarea.</p>
            <p><strong>Dogfooded react-fancy:</strong> Sidebar, Card, Tabs, Action, Dropdown, ContextMenu, Tooltip, Separator, Badge, Heading, Text, Input, Textarea, Select, Slider, ColorPicker.</p>
            <p><strong>Mutation funnel:</strong> every change — humans dragging, agents calling MCP tools, undo — flows through the same `reduce(deck, op)` pure function. One source of truth.</p>
        </div>
    ),
};
