import { useState } from "react";
import type { ComponentDoc } from "./types";
import { DeckEditor, defaultTheme, type Deck } from "@particle-academy/fancy-slides";
import { defaultElementRegistry } from "@particle-academy/fancy-slides/registry";
import "@particle-academy/fancy-slides/styles.css";
import { PptxExportControl } from "../PptxExportControl";

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
        {
            id: "s2",
            layout: "title-content",
            elements: [
                {
                    id: "e2",
                    type: "text",
                    x: 0.08,
                    y: 0.08,
                    w: 0.84,
                    h: 0.12,
                    content: "# Code element",
                    format: "markdown",
                },
                {
                    id: "e3",
                    type: "code",
                    x: 0.08,
                    y: 0.26,
                    w: 0.84,
                    h: 0.5,
                    code: "function hello(name: string) {\n  return `Hello, ${name}!`;\n}",
                    language: "typescript",
                    codeTheme: "dark",
                    lineNumbers: true,
                },
            ],
        },
    ],
};

function MiniEditor() {
    const [deck, setDeck] = useState<Deck>(seed);
    return (
        <div className="h-[560px] w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <DeckEditor
                value={deck}
                onChange={setDeck}
                renderElement={defaultElementRegistry}
                toolbarExtra={<PptxExportControl deck={deck as unknown as { title?: string } & Record<string, unknown>} />}
            />
        </div>
    );
}

export const deckEditorDoc: ComponentDoc = {
    intro: (
        <p>
            Full presentation editor. Composes a top toolbar, a left slide rail with
            drag-to-reorder + context menu, a center canvas with click-to-select +
            <strong> drag-to-move</strong> + <strong>8 resize handles</strong>, a right
            inspector with per-element-type controls (the code element edits in a live
            fancy-code editor), and a bottom speaker-notes panel. Fully controlled — pass
            a <code>Deck</code> in, get one back via <code>onChange</code>. Extend the
            toolbar with <code>toolbarExtra</code>.
        </p>
    ),
    examples: [
        {
            name: "Editor + custom export control",
            description:
                "The real editor. Open slide 2 to see the code element; select it to edit in a live code editor. The toolbar's “Export .pptx” dropdown is injected via toolbarExtra — pick the Node (browser) or PHP (server) writer; both produce byte-identical pptx.",
            render: () => <MiniEditor />,
            code: `import { useState } from "react";
import { DeckEditor, defaultTheme } from "@particle-academy/fancy-slides";
import { defaultElementRegistry } from "@particle-academy/fancy-slides/registry";
import { Agent as NodeDarkSlide } from "@particle-academy/dark-slide";
import "@particle-academy/fancy-slides/styles.css";

const [deck, setDeck] = useState({ /* … */ });

// Inject a custom export-writer picker into the toolbar via toolbarExtra:
<DeckEditor
    value={deck}
    onChange={setDeck}
    renderElement={defaultElementRegistry}
    toolbarExtra={
        <button onClick={() => downloadPptx(NodeDarkSlide.toBytes(deck))}>
            Export .pptx (browser)
        </button>
    }
/>`,
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
        { name: "toolbarExtra", type: `ReactNode`, default: "—", description: "Host-injected content on the toolbar's trailing edge (left of Present). Use it to add custom actions like an export-writer picker." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the editor root." },
    ],
    notes: (
        <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
            <p><strong>Extensible toolbar:</strong> <code>toolbarExtra</code> renders custom React into the toolbar's trailing edge — the demo above injects a PHP/Node pptx-writer picker without forking the editor.</p>
            <p><strong>Canvas interactions:</strong> single click selects, drag the element body moves it (slide-relative 0..1 coords clamped to fit), 8 handles (4 corners + 4 edges) resize. Locked elements skip drag/resize.</p>
            <p><strong>Mutation funnel:</strong> every change — humans dragging, agents calling MCP tools, undo — flows through the same `reduce(deck, op)` pure function. One source of truth.</p>
        </div>
    ),
};
