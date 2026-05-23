import type { ComponentDoc } from "./types";
import { PresenterView, defaultTheme } from "@particle-academy/fancy-slides";
import "@particle-academy/fancy-slides/styles.css";

const demoDeck = {
    id: "presenter-doc",
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
                    content: "Speaker mode",
                    format: "plain" as const,
                    style: { fontSize: 56, weight: "bold" as const, align: "center" as const },
                },
            ],
            notes: "Open this view on your second monitor. The audience sees <SlideViewer> on the main display.",
        },
        {
            id: "s2",
            layout: "title-content" as const,
            elements: [
                {
                    id: "e2",
                    type: "text" as const,
                    x: 0.1,
                    y: 0.3,
                    w: 0.8,
                    h: 0.4,
                    content: "Up next is just the next slide in the deck",
                    format: "plain" as const,
                    style: { fontSize: 32, align: "center" as const },
                },
            ],
            notes: "Quick mental cue for what's coming so the talk transitions feel less abrupt.",
        },
        {
            id: "s3",
            layout: "title" as const,
            elements: [
                {
                    id: "e3",
                    type: "text" as const,
                    x: 0.1,
                    y: 0.4,
                    w: 0.8,
                    h: 0.2,
                    content: "Thanks 🎉",
                    format: "plain" as const,
                    style: { fontSize: 64, weight: "bold" as const, align: "center" as const },
                },
            ],
        },
    ],
};

export const presenterViewDoc: ComponentDoc = {
    intro: (
        <p>
            Speaker-only side view designed to live on a second monitor while the
            audience sees a <code>&lt;SlideViewer&gt;</code> on the main display. Large
            current slide left; next slide + speaker notes right; status bar with slide
            counter, elapsed timer, wall clock, and prev/next nav along the bottom.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description: "Same keyboard set as the SlideViewer — ←/→/Space/Esc/Home/End/B/F/1-9.",
            render: () => (
                <div className="h-96 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <PresenterView deck={demoDeck} />
                </div>
            ),
            code: `import { PresenterView, SlideViewer } from "@particle-academy/fancy-slides";

// Open a second window for the audience:
const audienceWindow = window.open("", "_blank", "popup");
// ...mount SlideViewer in that window with shared deck state...

// Mount the PresenterView locally:
<PresenterView
    deck={deck}
    onIndexChange={syncToAudience}  // broadcast through your transport
    onExit={() => exitPresenting()}
/>`,
        },
        {
            name: "Last slide — 'End of deck' placeholder",
            description: "When the current slide is the last one, the Up Next pane renders an end-of-deck placeholder.",
            render: () => (
                <div className="h-80 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <PresenterView deck={demoDeck} defaultIndex={demoDeck.slides.length - 1} />
                </div>
            ),
            code: `<PresenterView deck={deck} defaultIndex={deck.slides.length - 1} />`,
        },
        {
            name: "Controlled",
            description: "Bind index to your own state when multiple windows / agents share a slide pointer.",
            render: () => (
                <div className="rounded-md border border-dashed border-zinc-300 p-3 text-xs text-zinc-500 dark:border-zinc-700">
                    Wire `index` + `onIndexChange` to a shared store / BroadcastChannel / relay session for multi-window or multi-presenter syncing.
                </div>
            ),
            code: `const [index, setIndex] = useState(0);

// Share the current index across windows via BroadcastChannel:
const ch = new BroadcastChannel("slides:" + deck.id);
const sync = (i: number) => { setIndex(i); ch.postMessage({ index: i }); };
useEffect(() => {
    ch.onmessage = (e) => setIndex(e.data.index);
    return () => ch.close();
}, []);

<PresenterView deck={deck} index={index} onIndexChange={sync} />`,
        },
    ],
    props: [
        { name: "deck", type: `Deck`, default: "—", description: "Deck being presented. Required." },
        { name: "index", type: `number`, default: "—", description: "Controlled current slide index. Use with `onIndexChange`." },
        { name: "defaultIndex", type: `number`, default: `0`, description: "Default starting slide (uncontrolled)." },
        { name: "onIndexChange", type: `(index: number) => void`, default: "—", description: "Called whenever the presenter advances." },
        { name: "onExit", type: `() => void`, default: "—", description: "Called on Esc — typically exits fullscreen or closes the window." },
        { name: "startedAt", type: `number`, default: "mount time", description: "Reset the elapsed timer to this `Date.now()` value. Useful to resume from a paused state." },
        { name: "renderElement", type: `(element, slideWidthPx) => ReactNode | undefined`, default: "—", description: "Custom renderer for chart / code / table / embed (or custom element types) — passed through to the inner <Slide>." },
        { name: "className", type: `string`, default: "—", description: "Extra classes on the wrapper." },
    ],
    notes: (
        <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
            <p><strong>Multi-window pattern:</strong> open a second window with the audience view (<code>SlideViewer</code>), keep <code>PresenterView</code> on the primary monitor, and sync their <code>index</code> via BroadcastChannel / postMessage / your existing relay protocol.</p>
            <p><strong>Status bar:</strong> tick once per second to update both the elapsed timer and the wall clock; no work happens between ticks so the timer can't drift.</p>
            <p><strong>Notes pane:</strong> renders the current slide's <code>notes</code> string as preformatted text. Markdown rendering arrives with the ContentRenderer integration in 0.2.</p>
        </div>
    ),
};
