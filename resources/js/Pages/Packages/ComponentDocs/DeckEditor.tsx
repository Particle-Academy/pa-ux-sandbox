import { useState } from "react";
import type { ComponentDoc } from "./types";
import { DeckEditor, defaultTheme, useDeckEditor, type Deck } from "@particle-academy/fancy-slides";
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

/**
 * An app panel that lives *beside* the editor and shares its controller via
 * `useDeckEditor()` — no props threaded in. It reads the live selection and
 * drives inserts straight through the shared op surface.
 */
function StudioAgentRail() {
    const { deck, slide, selectedElement, insert } = useDeckEditor();
    return (
        <div className="flex w-48 shrink-0 flex-col gap-2 border-r border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-xs font-semibold uppercase tracking-wider text-violet-500">Agent panel</div>
            <div className="text-xs text-zinc-500">
                {deck.slides.length} slide{deck.slides.length === 1 ? "" : "s"} · {slide?.elements.length ?? 0} on this one
            </div>
            <div className="rounded-md bg-white p-2 text-xs text-zinc-600 shadow-sm dark:bg-zinc-950 dark:text-zinc-300">
                {selectedElement ? (
                    <>
                        Selected <span className="font-mono text-violet-500">{selectedElement.type}</span>
                    </>
                ) : (
                    "Nothing selected"
                )}
            </div>
            <button
                className="rounded-md bg-violet-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-40"
                disabled={!slide}
                onClick={() => insert.text()}
            >
                + Add text (shared op)
            </button>
        </div>
    );
}

/** A bespoke top bar that reads + drives the deck title via the shared controller. */
function StudioTopBar() {
    const { toolbarApi } = useDeckEditor();
    return (
        <div className="flex items-center gap-3 border-b border-zinc-200 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-white dark:border-zinc-800">
            <span className="text-sm font-semibold">🎬 Studio</span>
            <input
                value={toolbarApi.title.value}
                onChange={(e) => toolbarApi.title.onChange(e.target.value)}
                className="min-w-0 flex-1 rounded bg-white/15 px-2 py-1 text-sm text-white placeholder:text-white/60 focus:bg-white/25 focus:outline-none"
                placeholder="Untitled"
                aria-label="Deck title"
            />
            <button
                className="rounded-md bg-white/20 px-3 py-1 text-xs font-medium hover:bg-white/30"
                onClick={toolbarApi.present}
            >
                Present
            </button>
        </div>
    );
}

/**
 * The new #11 capability: a bespoke editor composed from `DeckEditor.Provider` +
 * the slot parts + app panels, all sharing ONE controller. No fixed chrome —
 * the app arranges and styles the parts.
 */
function StudioEditor() {
    const [deck, setDeck] = useState<Deck>(seed);
    return (
        <div className="h-[560px] w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <DeckEditor.Provider value={deck} onChange={setDeck} renderElement={defaultElementRegistry}>
                <div className="flex h-full w-full flex-col bg-zinc-100 dark:bg-zinc-950">
                    <StudioTopBar />
                    <div className="flex min-h-0 flex-1">
                        <StudioAgentRail />
                        <DeckEditor.Rail className="!w-40" />
                        <DeckEditor.Canvas />
                        <DeckEditor.Inspector />
                    </div>
                    <DeckEditor.StatusBar className="!bg-violet-50 dark:!bg-violet-950/40">
                        {(ctx) => (
                            <span className="text-violet-700 dark:text-violet-300">
                                {ctx.slide
                                    ? `Editing slide ${ctx.deck.slides.findIndex((s) => s.id === ctx.slideId) + 1} of ${ctx.deck.slides.length}`
                                    : "No slide"}
                                {ctx.selectedElement &&
                                    ` — ${ctx.selectedElement.type} @ ${Math.round(ctx.selectedElement.x * 100)}%, ${Math.round(
                                        ctx.selectedElement.y * 100,
                                    )}%`}
                            </span>
                        )}
                    </DeckEditor.StatusBar>
                </div>
            </DeckEditor.Provider>
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
            {" "}
            <strong>Composable:</strong> the chrome is a thin default layout over a
            shared controller — drop <code>DeckEditor.Provider</code> + the slot parts
            (<code>.Rail</code> / <code>.Canvas</code> / <code>.Inspector</code> /{" "}
            <code>.StatusBar</code>) into your own arrangement and read the same
            controller from any app panel via <code>useDeckEditor()</code>.
        </p>
    ),
    examples: [
        {
            name: "Composed “Studio” (bespoke layout, one shared controller)",
            description:
                "The same editor parts, rearranged: a custom gradient top bar, an app-owned Agent panel sitting BESIDE the rail (sharing selection + the insert op surface via useDeckEditor), and a custom violet status bar via a render-prop. No hide-flags, no fork — DeckEditor.Provider runs the controller and the slots compose around it.",
            render: () => <StudioEditor />,
            code: `import { DeckEditor, useDeckEditor } from "@particle-academy/fancy-slides";

// An app panel beside the editor, sharing the controller — no props threaded in:
function AgentRail() {
    const { slide, selectedElement, insert } = useDeckEditor();
    return (
        <aside>
            <p>{selectedElement ? \`Selected \${selectedElement.type}\` : "Nothing selected"}</p>
            <button disabled={!slide} onClick={() => insert.text()}>+ Add text</button>
        </aside>
    );
}

function Studio({ deck, setDeck }) {
    return (
        <DeckEditor.Provider value={deck} onChange={setDeck}>
            <MyTopBar />
            <div className="studio-grid">
                <AgentRail />
                <DeckEditor.Rail className="!w-40" />
                <DeckEditor.Canvas />
                <DeckEditor.Inspector />
            </div>
            <DeckEditor.StatusBar>
                {(ctx) => <span>Slide {/* … */} · {ctx.selectedElement?.type}</span>}
            </DeckEditor.StatusBar>
        </DeckEditor.Provider>
    );
}`,
        },
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
