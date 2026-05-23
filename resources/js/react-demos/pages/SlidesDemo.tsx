import { useMemo, useState } from "react";
import { Action, Badge, Card, Heading, Tabs, Text, Toast, useToast } from "@particle-academy/react-fancy";
import {
    DeckEditor,
    PresenterView,
    SlideViewer,
    defaultTheme,
    type Deck,
    type DeckOp,
} from "@particle-academy/fancy-slides";
import { defaultElementRegistry } from "@particle-academy/fancy-slides/registry";
import "@particle-academy/fancy-slides/styles.css";

/**
 * Live demo of @particle-academy/fancy-slides. Editor + viewer + activity
 * stream side-by-side, driven by a single controlled `deck` state. Every
 * mutation flows through DeckEditor → useDeckState → reduce(); the activity
 * panel tails the same op stream the agent bridge would receive.
 */

const sampleDeck: Deck = {
    id: "demo-deck",
    title: "Fancy Slides — Sample Deck",
    theme: defaultTheme,
    slides: [
        {
            id: "s-intro",
            layout: "title",
            elements: [
                {
                    id: "e-title",
                    type: "text",
                    x: 0.08,
                    y: 0.36,
                    w: 0.84,
                    h: 0.18,
                    content: "Fancy Slides",
                    format: "plain",
                    style: { fontSize: 96, weight: "bold", align: "center", color: "#0f172a" },
                },
                {
                    id: "e-subtitle",
                    type: "text",
                    x: 0.08,
                    y: 0.58,
                    w: 0.84,
                    h: 0.1,
                    content: "Presentations, but Human+",
                    format: "plain",
                    style: { fontSize: 32, weight: "normal", align: "center", color: "#64748b" },
                },
            ],
            notes: "Welcome the audience. Set up the story: this is a presentation tool agents can drive.",
            background: { gradient: "radial-gradient(circle at 30% 20%, #ede9fe 0%, #ffffff 60%)" },
        },
        {
            id: "s-why",
            layout: "title-content",
            elements: [
                {
                    id: "e-why-h",
                    type: "text",
                    x: 0.08,
                    y: 0.1,
                    w: 0.84,
                    h: 0.12,
                    content: "Why Fancy Slides?",
                    format: "plain",
                    style: { fontSize: 48, weight: "semibold", color: "#0f172a" },
                },
                {
                    id: "e-why-list",
                    type: "text",
                    x: 0.08,
                    y: 0.28,
                    w: 0.84,
                    h: 0.6,
                    content: "- **JSON-friendly** deck schema\n- **Agent bridge** — LLMs build slides directly\n- Dogfoods every Fancy UI primitive\n- Resolution-independent canvas (`0..1` coords)\n- Same renderer for editor, viewer, thumbnails",
                    format: "markdown",
                    style: { fontSize: 28, weight: "normal", lineHeight: 1.6, color: "#1e293b" },
                },
            ],
        },
        {
            id: "s-chart",
            layout: "title-content",
            elements: [
                {
                    id: "e-chart-h",
                    type: "text",
                    x: 0.08,
                    y: 0.08,
                    w: 0.84,
                    h: 0.1,
                    content: "Quarterly results",
                    format: "plain",
                    style: { fontSize: 40, weight: "semibold", color: "#0f172a" },
                },
                {
                    id: "e-chart",
                    type: "chart",
                    x: 0.1,
                    y: 0.22,
                    w: 0.8,
                    h: 0.68,
                    option: {
                        tooltip: { trigger: "axis" },
                        legend: { data: ["Free", "Pro"], textStyle: { color: "#475569" } },
                        xAxis: { type: "category", data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"], axisLabel: { color: "#475569" } },
                        yAxis: { type: "value", axisLabel: { color: "#475569" } },
                        series: [
                            { name: "Free", type: "line", smooth: true, data: [12, 18, 22, 28, 35, 42], lineStyle: { color: "#8b5cf6" }, itemStyle: { color: "#8b5cf6" } },
                            { name: "Pro", type: "line", smooth: true, data: [4, 6, 10, 16, 24, 30], lineStyle: { color: "#22c55e" }, itemStyle: { color: "#22c55e" } },
                        ],
                    },
                },
            ],
            notes: "ECharts series rendered by fancy-echarts.",
        },
        {
            id: "s-code",
            layout: "title-content",
            elements: [
                {
                    id: "e-code-h",
                    type: "text",
                    x: 0.08,
                    y: 0.08,
                    w: 0.84,
                    h: 0.1,
                    content: "Code element",
                    format: "plain",
                    style: { fontSize: 40, weight: "semibold", color: "#0f172a" },
                },
                {
                    id: "e-code",
                    type: "code",
                    x: 0.1,
                    y: 0.22,
                    w: 0.8,
                    h: 0.66,
                    code: `import { SlideViewer } from "@particle-academy/fancy-slides";
import { defaultElementRegistry } from "@particle-academy/fancy-slides/registry";

<SlideViewer
    deck={deck}
    renderElement={defaultElementRegistry}
    onExit={() => setPresenting(false)}
/>`,
                    language: "typescript",
                    codeTheme: "dark",
                },
            ],
            notes: "Code rendered by fancy-code's CodeEditor in read-only mode.",
        },
        {
            id: "s-table",
            layout: "title-content",
            elements: [
                {
                    id: "e-table-h",
                    type: "text",
                    x: 0.08,
                    y: 0.08,
                    w: 0.84,
                    h: 0.1,
                    content: "Tabular data",
                    format: "plain",
                    style: { fontSize: 40, weight: "semibold", color: "#0f172a" },
                },
                {
                    id: "e-table",
                    type: "table",
                    x: 0.1,
                    y: 0.22,
                    w: 0.8,
                    h: 0.6,
                    columns: [
                        { key: "feature", label: "Feature" },
                        { key: "status", label: "Status" },
                        { key: "owner", label: "Owner" },
                    ],
                    rows: [
                        { feature: "JSON schema", status: "shipped", owner: "Glenn" },
                        { feature: "Agent bridge", status: "shipped", owner: "Researcher" },
                        { feature: "Drag handles", status: "v0.2", owner: "Glenn" },
                        { feature: "PDF export", status: "v0.3", owner: "—" },
                    ],
                },
            ],
        },
        {
            id: "s-shape",
            layout: "blank",
            elements: [
                {
                    id: "e-shape-bg",
                    type: "shape",
                    shape: "rounded-rect",
                    x: 0.1,
                    y: 0.15,
                    w: 0.8,
                    h: 0.7,
                    fill: "rgba(139,92,246,0.08)",
                    stroke: "#8b5cf6",
                    strokeWidth: 3,
                    radius: 16,
                },
                {
                    id: "e-shape-arrow",
                    type: "shape",
                    shape: "arrow",
                    x: 0.2,
                    y: 0.5,
                    w: 0.6,
                    h: 0.1,
                    stroke: "#8b5cf6",
                    strokeWidth: 4,
                },
                {
                    id: "e-shape-h",
                    type: "text",
                    x: 0.1,
                    y: 0.2,
                    w: 0.8,
                    h: 0.16,
                    content: "Shapes + arrows",
                    format: "plain",
                    style: { fontSize: 48, weight: "bold", align: "center", color: "#581c87" },
                },
                {
                    id: "e-shape-sub",
                    type: "text",
                    x: 0.1,
                    y: 0.62,
                    w: 0.8,
                    h: 0.18,
                    content: "Pure SVG, no extra deps. Rect, rounded-rect, ellipse, triangle, line, arrow.",
                    format: "plain",
                    style: { fontSize: 24, align: "center", color: "#6b21a8" },
                },
            ],
        },
        {
            id: "s-thanks",
            layout: "title",
            elements: [
                {
                    id: "e-thanks-h",
                    type: "text",
                    x: 0.08,
                    y: 0.4,
                    w: 0.84,
                    h: 0.2,
                    content: "Thanks 🎉",
                    format: "plain",
                    style: { fontSize: 96, weight: "bold", align: "center", color: "#0f172a" },
                },
                {
                    id: "e-thanks-sub",
                    type: "text",
                    x: 0.08,
                    y: 0.62,
                    w: 0.84,
                    h: 0.1,
                    content: "@particle-academy/fancy-slides · 0.1.0",
                    format: "plain",
                    style: { fontSize: 24, align: "center", color: "#64748b", fontFamily: "ui-monospace, monospace" },
                },
            ],
            background: { gradient: "linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%)" },
        },
    ],
    metadata: { author: "Fancy UI Team", createdAt: new Date().toISOString() },
};

function SlidesDemoBody() {
    const [deck, setDeck] = useState<Deck>(sampleDeck);
    const [presenting, setPresenting] = useState(false);
    const [presenterView, setPresenterView] = useState(false);
    const [activity, setActivity] = useState<Array<{ at: number; op: DeckOp }>>([]);
    const { toast } = useToast();

    const counts = useMemo(() => {
        const elements = deck.slides.reduce((sum, s) => sum + s.elements.length, 0);
        return { slides: deck.slides.length, elements };
    }, [deck.slides]);

    return (
        <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center gap-3">
                    <Heading as="h1" size="md">
                        Fancy Slides
                    </Heading>
                    <Badge color="violet" size="sm">
                        live demo
                    </Badge>
                    <Text size="sm" className="!text-zinc-500">
                        {counts.slides} slides · {counts.elements} elements
                    </Text>
                </div>
                <div className="flex items-center gap-2">
                    <Action
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                            setDeck(sampleDeck);
                            setActivity([]);
                            toast({ title: "Deck reset", variant: "info" });
                        }}
                    >
                        Reset deck
                    </Action>
                    <Action
                        size="sm"
                        variant="ghost"
                        icon="presentation"
                        onClick={() => setPresenterView(true)}
                    >
                        Presenter view
                    </Action>
                    <Action
                        size="sm"
                        color="violet"
                        icon="play"
                        onClick={() => setPresenting(true)}
                    >
                        Present
                    </Action>
                </div>
            </div>

            {/* Main editor area */}
            <div className="flex min-h-0 flex-1">
                <div className="flex min-w-0 flex-1">
                    <DeckEditor
                        value={deck}
                        onChange={setDeck}
                        onOp={(op) => setActivity((a) => [...a.slice(-49), { at: Date.now(), op }])}
                        onPresent={() => setPresenting(true)}
                        renderElement={defaultElementRegistry}
                    />
                </div>

                {/* Activity panel — feeds the same op stream the agent bridge would emit */}
                <div className="w-80 shrink-0 overflow-y-auto border-l border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <Tabs defaultTab="activity" variant="pills">
                        <Tabs.List>
                            <Tabs.Tab value="activity">Activity</Tabs.Tab>
                            <Tabs.Tab value="json">Deck JSON</Tabs.Tab>
                        </Tabs.List>
                        <Tabs.Panels>
                            <Tabs.Panel value="activity">
                                <Text size="xs" className="!text-zinc-500">
                                    Every mutation flows through useDeckState's reducer — the agent bridge sends the same ops.
                                </Text>
                                <div className="mt-3 space-y-1 font-mono text-[11px]">
                                    {activity.length === 0 ? (
                                        <Text size="xs" className="!italic !text-zinc-400">
                                            No edits yet — click a slide, add an element, or drag in the rail.
                                        </Text>
                                    ) : (
                                        [...activity].reverse().map((entry, i) => (
                                            <Card key={i} padding="sm" className="!bg-zinc-50 dark:!bg-zinc-900">
                                                <div className="flex items-center justify-between">
                                                    <Text size="xs" className="!font-mono !font-semibold !text-violet-600 dark:!text-violet-300">
                                                        {entry.op.kind}
                                                    </Text>
                                                    <Text size="xs" className="!font-mono !text-zinc-400">
                                                        {timeAgo(entry.at)}
                                                    </Text>
                                                </div>
                                                <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-[10px] text-zinc-600 dark:text-zinc-300">
                                                    {summarizeOp(entry.op)}
                                                </pre>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </Tabs.Panel>
                            <Tabs.Panel value="json">
                                <Text size="xs" className="!text-zinc-500">
                                    The whole deck is plain JSON — exactly what an LLM tool call would emit.
                                </Text>
                                <pre className="mt-2 max-h-[calc(100vh-220px)] overflow-auto rounded bg-zinc-100 p-2 text-[10px] dark:bg-zinc-900">
                                    {JSON.stringify(deck, null, 2)}
                                </pre>
                            </Tabs.Panel>
                        </Tabs.Panels>
                    </Tabs>
                </div>
            </div>

            {/* SlideViewer overlay — the audience view */}
            {presenting && (
                <div className="fixed inset-0 z-50 bg-black">
                    <SlideViewer
                        deck={deck}
                        onExit={() => setPresenting(false)}
                        renderElement={defaultElementRegistry}
                    />
                </div>
            )}

            {/* PresenterView overlay — the speaker's monitor */}
            {presenterView && (
                <div className="fixed inset-0 z-50">
                    <PresenterView
                        deck={deck}
                        onExit={() => setPresenterView(false)}
                        renderElement={defaultElementRegistry}
                    />
                </div>
            )}
        </div>
    );
}

export function SlidesDemo() {
    return (
        <Toast.Provider position="bottom-right">
            <SlidesDemoBody />
        </Toast.Provider>
    );
}

function timeAgo(at: number): string {
    const sec = Math.max(0, Math.round((Date.now() - at) / 1000));
    if (sec < 60) return `${sec}s`;
    return `${Math.round(sec / 60)}m`;
}

function summarizeOp(op: DeckOp): string {
    switch (op.kind) {
        case "deck_set_title":
            return `title: "${op.title}"`;
        case "deck_apply_theme":
            return `theme: ${op.theme.name}`;
        case "slide_add":
            return `slide: ${op.slide.id} @ ${op.index}`;
        case "slide_remove":
            return `slide: ${op.id}`;
        case "slide_reorder":
            return `slide: ${op.id} → ${op.toIndex}`;
        case "slide_set_layout":
            return `slide: ${op.id} → ${op.layout}`;
        case "slide_set_notes":
            return `slide: ${op.id} notes (${op.notes.length} chars)`;
        case "slide_set_background":
            return `slide: ${op.id} bg`;
        case "element_add":
            return `+ ${op.element.type} on ${op.slideId}`;
        case "element_remove":
            return `− element on ${op.slideId}`;
        case "element_update":
            return `~ ${op.elementId}: ${Object.keys(op.patch).join(", ")}`;
        case "element_move":
            return `→ ${op.elementId} (${op.x.toFixed(2)}, ${op.y.toFixed(2)})`;
        case "element_resize":
            return `□ ${op.elementId} (${op.w.toFixed(2)} × ${op.h.toFixed(2)})`;
    }
}
