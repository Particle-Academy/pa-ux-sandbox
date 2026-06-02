import { useState } from "react";
import { Button, Badge, Card, Heading, Text } from "@particle-academy/react-fancy";
import { SlideViewer, defaultTheme, type Deck } from "@particle-academy/fancy-slides";
import "@particle-academy/fancy-slides/styles.css";

/**
 * Demo for `<SlideViewer>` — the read-only deck player. Two modes side
 * by side: an embedded viewer (constrained area, kiosk-style) and a
 * fullscreen overlay (typical presentation use).
 */

const demoDeck: Deck = {
    id: "viewer-demo",
    title: "SlideViewer demo",
    theme: defaultTheme,
    slides: [
        {
            id: "s1",
            layout: "title",
            elements: [
                {
                    id: "t",
                    type: "text",
                    x: 0.1,
                    y: 0.4,
                    w: 0.8,
                    h: 0.2,
                    content: "SlideViewer",
                    format: "plain",
                    style: { fontSize: 80, weight: "bold", align: "center" },
                },
                {
                    id: "sub",
                    type: "text",
                    x: 0.1,
                    y: 0.6,
                    w: 0.8,
                    h: 0.1,
                    content: "Read-only playback for a deck",
                    format: "plain",
                    style: { fontSize: 24, align: "center", color: "#64748b" },
                },
            ],
            background: { gradient: "linear-gradient(135deg, #ede9fe 0%, #ffffff 60%)" },
        },
        {
            id: "s2",
            layout: "title-content",
            elements: [
                {
                    id: "k",
                    type: "text",
                    x: 0.08,
                    y: 0.08,
                    w: 0.84,
                    h: 0.12,
                    content: "Keyboard",
                    format: "plain",
                    style: { fontSize: 40, weight: "semibold" },
                },
                {
                    id: "keys",
                    type: "text",
                    x: 0.08,
                    y: 0.25,
                    w: 0.84,
                    h: 0.65,
                    content:
                        "- `←` / `PageUp` — previous slide\n- `→` / `PageDown` / `Space` — next slide\n- `Home` / `End` — first / last\n- `1..9` — jump to slide N\n- `B` / `.` — blackout toggle\n- `F` — request fullscreen\n- `Esc` — exit",
                    format: "markdown",
                    style: { fontSize: 22, lineHeight: 1.7 },
                },
            ],
        },
        {
            id: "s3",
            layout: "title-content",
            elements: [
                {
                    id: "title3",
                    type: "text",
                    x: 0.08,
                    y: 0.08,
                    w: 0.84,
                    h: 0.12,
                    content: "Auto-advance",
                    format: "plain",
                    style: { fontSize: 40, weight: "semibold" },
                },
                {
                    id: "body3",
                    type: "text",
                    x: 0.08,
                    y: 0.25,
                    w: 0.84,
                    h: 0.6,
                    content:
                        "Pass `autoAdvanceMs={5000}` to loop through slides on a timer — kiosk mode.",
                    format: "plain",
                    style: { fontSize: 22, lineHeight: 1.6 },
                },
            ],
            background: { color: "#0f172a" },
        },
        {
            id: "s4",
            layout: "title",
            elements: [
                {
                    id: "thanks",
                    type: "text",
                    x: 0.1,
                    y: 0.4,
                    w: 0.8,
                    h: 0.2,
                    content: "Thanks",
                    format: "plain",
                    style: { fontSize: 80, weight: "bold", align: "center" },
                },
            ],
            background: { gradient: "linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%)" },
        },
    ],
};

export function SlideViewerDemo() {
    const [fullscreen, setFullscreen] = useState(false);
    const [auto, setAuto] = useState(false);

    return (
        <div className="space-y-6 p-6">
            <header>
                <Heading as="h1" size="lg">
                    SlideViewer
                </Heading>
                <Text className="mt-1 !text-zinc-600 dark:!text-zinc-300">
                    Full-keyboard read-only deck player. Embed in a container, drop into a fullscreen overlay, or run in kiosk mode. Click into the embedded viewer below and try the keyboard shortcuts.
                </Text>
            </header>

            <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" color="violet" icon="play" onClick={() => setFullscreen(true)}>
                    Fullscreen
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAuto((a) => !a)}>
                    Auto-advance: {auto ? "on" : "off"}
                </Button>
                <Badge color="zinc" size="sm">{demoDeck.slides.length} slides</Badge>
            </div>

            <Card className="overflow-hidden">
                <div className="h-[480px] w-full bg-black">
                    <SlideViewer
                        deck={demoDeck}
                        autoAdvanceMs={auto ? 3000 : undefined}
                    />
                </div>
                <Card.Body>
                    <Text size="sm" className="!text-zinc-500">
                        Click into the player above, then use ←/→ / Space / Home / End / 1-4 / B / F / Esc.
                    </Text>
                </Card.Body>
            </Card>

            {fullscreen && (
                <div className="fixed inset-0 z-50 bg-black">
                    <SlideViewer deck={demoDeck} onExit={() => setFullscreen(false)} />
                </div>
            )}
        </div>
    );
}
