import type { ComponentDoc } from "./types";
import { SlideViewer, defaultTheme } from "@particle-academy/fancy-slides";
import "@particle-academy/fancy-slides/styles.css";

const tinyDeck = {
    id: "doc-deck",
    title: "Demo",
    theme: defaultTheme,
    slides: [
        {
            id: "s1",
            layout: "title" as const,
            elements: [
                {
                    id: "e1",
                    type: "text" as const,
                    x: 0.1,
                    y: 0.4,
                    w: 0.8,
                    h: 0.2,
                    content: "Welcome",
                    format: "plain" as const,
                    style: { fontSize: 64, weight: "bold" as const, align: "center" as const },
                },
            ],
        },
        {
            id: "s2",
            layout: "title-content" as const,
            elements: [
                {
                    id: "e2",
                    type: "text" as const,
                    x: 0.08,
                    y: 0.2,
                    w: 0.84,
                    h: 0.6,
                    content: "Slide two — keyboard ←/→ to advance",
                    format: "plain" as const,
                    style: { fontSize: 28, align: "center" as const },
                },
            ],
        },
    ],
};

export const slideViewerDoc: ComponentDoc = {
    intro: (
        <p>
            Read-only deck viewer. Renders one slide at a time at the maximum size that
            fits its container while preserving the theme's aspect ratio. Standard
            slideshow keyboard nav is built in; wrap in a fullscreen-ready container for
            the F11-style experience.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Pass a deck — `<SlideViewer>` does the rest. Keyboard: ←/→/Space/Esc/B/F/1-9.",
            render: () => (
                <div className="h-64 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <SlideViewer deck={tinyDeck} hideChrome={false} />
                </div>
            ),
            code: `import { SlideViewer } from "@particle-academy/fancy-slides";
import "@particle-academy/fancy-slides/styles.css";

<SlideViewer
    deck={deck}
    onExit={() => setPresenting(false)}
    onIndexChange={(i) => console.log("slide", i)}
/>`,
        },
        {
            name: "Auto-advance (kiosk)",
            description: "Set `autoAdvanceMs` to loop through slides on a timer.",
            render: () => (
                <div className="h-56 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <SlideViewer deck={tinyDeck} autoAdvanceMs={3000} />
                </div>
            ),
            code: `<SlideViewer deck={deck} autoAdvanceMs={5000} />`,
        },
        {
            name: "Custom element renderer",
            description: "Pass `renderElement` to plug in chart / code / table / embed renderers (or your own custom types).",
            render: () => (
                <div className="h-48 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <SlideViewer deck={tinyDeck} hideChrome />
                </div>
            ),
            code: `import { defaultElementRegistry } from "@particle-academy/fancy-slides/registry";

<SlideViewer
    deck={deck}
    renderElement={defaultElementRegistry}
/>`,
        },
    ],
    props: [
        { name: "deck", type: `Deck`, default: "—", description: "Deck to play. Required." },
        { name: "index", type: `number`, default: "—", description: "Controlled current slide index. Use with `onIndexChange`." },
        { name: "defaultIndex", type: `number`, default: `0`, description: "Default starting slide (uncontrolled)." },
        { name: "onIndexChange", type: `(index: number) => void`, default: "—", description: "Called whenever the viewer advances." },
        { name: "onExit", type: `() => void`, default: "—", description: "Called on Esc — typically exits fullscreen." },
        { name: "autoAdvanceMs", type: `number`, default: "—", description: "Auto-advance interval in ms. Omit to disable. Loops at the end." },
        { name: "hideChrome", type: `boolean`, default: `false`, description: "Hide the slide counter chip in the bottom-right." },
        { name: "renderElement", type: `(element, slideWidthPx) => ReactNode | undefined`, default: "—", description: "Custom renderer for chart / code / table / embed (or custom element types)." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the viewer wrapper." },
    ],
    notes: (
        <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
            <p><strong>Keyboard:</strong> ← / PageUp = prev, → / PageDown / Space = next, Home / End = first / last, Esc = onExit, B / . = blackout toggle, F = request fullscreen, 1-9 = jump to slide N.</p>
            <p><strong>Resolution-independent:</strong> the deck's elements use 0..1 fractions for x/y/w/h, so the same deck renders correctly at any viewport size.</p>
        </div>
    ),
};
