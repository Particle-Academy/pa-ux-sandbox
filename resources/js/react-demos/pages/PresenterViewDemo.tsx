import { useState } from "react";
import { Action, Badge, Card, Heading, Text } from "@particle-academy/react-fancy";
import { PresenterView, SlideViewer, defaultTheme, type Deck } from "@particle-academy/fancy-slides";
import "@particle-academy/fancy-slides/styles.css";

/**
 * Demo for `<PresenterView>` — the speaker-only second-monitor view.
 * Shown in a constrained card so the reader can see the whole layout
 * without going fullscreen; a "Pop out" button opens it standalone.
 */

const demoDeck: Deck = {
    id: "presenter-demo",
    title: "PresenterView demo",
    theme: defaultTheme,
    slides: [
        {
            id: "intro",
            layout: "title",
            elements: [
                {
                    id: "t",
                    type: "text",
                    x: 0.1,
                    y: 0.4,
                    w: 0.8,
                    h: 0.2,
                    content: "Welcome",
                    format: "plain",
                    style: { fontSize: 80, weight: "bold", align: "center" },
                },
            ],
            notes: "Open the second monitor. Audience sees SlideViewer, you see this.",
        },
        {
            id: "main",
            layout: "title-content",
            elements: [
                {
                    id: "h",
                    type: "text",
                    x: 0.08,
                    y: 0.08,
                    w: 0.84,
                    h: 0.14,
                    content: "Why presenter view matters",
                    format: "plain",
                    style: { fontSize: 36, weight: "semibold" },
                },
                {
                    id: "b",
                    type: "text",
                    x: 0.08,
                    y: 0.28,
                    w: 0.84,
                    h: 0.6,
                    content:
                        "- Speaker sees **current** + **next** slide together\n- Speaker notes always visible\n- Wall clock + elapsed timer reduce drift\n- Audience monitor stays clean",
                    format: "markdown",
                    style: { fontSize: 22, lineHeight: 1.7 },
                },
            ],
            notes:
                "Walk through the four bullets. Press → after the third to advance the audience slide; the upcoming preview lets you transition cleanly.",
        },
        {
            id: "demo",
            layout: "title-content",
            elements: [
                {
                    id: "title-d",
                    type: "text",
                    x: 0.08,
                    y: 0.08,
                    w: 0.84,
                    h: 0.14,
                    content: "Multi-window pattern",
                    format: "plain",
                    style: { fontSize: 36, weight: "semibold" },
                },
                {
                    id: "code",
                    type: "code",
                    x: 0.08,
                    y: 0.28,
                    w: 0.84,
                    h: 0.55,
                    code: `// Open the audience view in a second window:
const audience = window.open("", "_blank", "popup");
// Mount <SlideViewer> in audience; keep <PresenterView> here.
// Sync index across windows via BroadcastChannel.`,
                    language: "typescript",
                    codeTheme: "dark",
                },
            ],
            notes:
                "Sync the index between the two windows via BroadcastChannel, postMessage, or the existing relay protocol.",
        },
        {
            id: "outro",
            layout: "title",
            elements: [
                {
                    id: "thx",
                    type: "text",
                    x: 0.1,
                    y: 0.4,
                    w: 0.8,
                    h: 0.2,
                    content: "Q & A",
                    format: "plain",
                    style: { fontSize: 80, weight: "bold", align: "center" },
                },
            ],
            background: { gradient: "linear-gradient(135deg, #ede9fe 0%, #fce7f3 100%)" },
        },
    ],
};

export function PresenterViewDemo() {
    const [popout, setPopout] = useState(false);
    const [audience, setAudience] = useState(false);

    return (
        <div className="space-y-6 p-6">
            <header>
                <Heading as="h1" size="lg">
                    PresenterView
                </Heading>
                <Text className="mt-1 !text-zinc-600 dark:!text-zinc-300">
                    Speaker-only side view designed for a second monitor while the audience sees a `&lt;SlideViewer&gt;`. Current slide + next slide + speaker notes + clock + elapsed timer.
                </Text>
            </header>

            <div className="flex flex-wrap gap-2">
                <Action size="sm" color="violet" icon="presentation" onClick={() => setPopout(true)}>
                    Open presenter overlay
                </Action>
                <Action size="sm" variant="ghost" icon="play" onClick={() => setAudience(true)}>
                    Open audience view
                </Action>
                <Badge color="zinc" size="sm">{demoDeck.slides.length} slides</Badge>
            </div>

            <Card className="overflow-hidden">
                <div className="h-[560px] w-full">
                    <PresenterView deck={demoDeck} />
                </div>
                <Card.Body>
                    <Text size="sm" className="!text-zinc-500">
                        Embedded preview. Try ←/→/Space; the timer ticks once a second.
                    </Text>
                </Card.Body>
            </Card>

            {popout && (
                <div className="fixed inset-0 z-50 bg-black">
                    <PresenterView deck={demoDeck} onExit={() => setPopout(false)} />
                </div>
            )}
            {audience && (
                <div className="fixed inset-0 z-50 bg-black">
                    <SlideViewer deck={demoDeck} onExit={() => setAudience(false)} />
                </div>
            )}
        </div>
    );
}
