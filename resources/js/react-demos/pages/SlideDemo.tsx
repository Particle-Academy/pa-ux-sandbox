import { Badge, Card, Heading, Text } from "@particle-academy/react-fancy";
import { Slide, defaultTheme, darkTheme, vividTheme, type SlideData } from "@particle-academy/fancy-slides";
import "@particle-academy/fancy-slides/styles.css";

/**
 * Demo for `<Slide>` — the shared single-slide renderer. Shows three things:
 *
 *   1. Resolution independence — the same slide renders identically at
 *      every container size (thumbnail / half / full).
 *   2. Theme-driven typography — the same slide takes on the active
 *      theme's fonts + colors.
 *   3. Mixed-element rendering — text + shape + bullet markdown all
 *      compose inside one Slide.
 */

const showcaseSlide: SlideData = {
    id: "showcase",
    layout: "title-content",
    elements: [
        {
            id: "h",
            type: "text",
            x: 0.08,
            y: 0.08,
            w: 0.84,
            h: 0.16,
            content: "The shared Slide renderer",
            format: "plain",
            style: { fontSize: 48, weight: "semibold" },
        },
        {
            id: "list",
            type: "text",
            x: 0.08,
            y: 0.3,
            w: 0.55,
            h: 0.55,
            content:
                "- Same renderer for **viewer**, **editor**, and **thumbnails**\n- Coords are `0..1` fractions — resolution-independent\n- Themes swap fonts, colors, aspect ratio\n- Markdown gets parsed via `ContentRenderer`",
            format: "markdown",
            style: { fontSize: 22, lineHeight: 1.6 },
        },
        {
            id: "shape",
            type: "shape",
            shape: "rounded-rect",
            x: 0.68,
            y: 0.32,
            w: 0.24,
            h: 0.48,
            fill: "rgba(139,92,246,0.12)",
            stroke: "#8B5CF6",
            strokeWidth: 3,
            radius: 16,
        },
        {
            id: "shape-label",
            type: "text",
            x: 0.68,
            y: 0.5,
            w: 0.24,
            h: 0.12,
            content: "0..1",
            format: "plain",
            style: { fontSize: 56, weight: "bold", align: "center", color: "#581c87" },
        },
    ],
    background: { gradient: "linear-gradient(135deg, #faf5ff 0%, #ffffff 60%)" },
};

export function SlideDemo() {
    return (
        <div className="space-y-8 p-6">
            <header>
                <Heading as="h1" size="lg">
                    Slide
                </Heading>
                <Text className="mt-1 !text-zinc-600 dark:!text-zinc-300">
                    The shared single-slide renderer. The exact same `slide` JSON below is rendered three times — at full width, half width, and thumbnail size — with no rendering tricks. The 0..1 coordinate system handles the scaling.
                </Text>
            </header>

            <section>
                <Heading as="h2" size="sm" className="!uppercase !tracking-wider !text-zinc-500">
                    Full width
                </Heading>
                <Card className="mt-2 overflow-hidden">
                    <Slide slide={showcaseSlide} theme={defaultTheme} />
                </Card>
            </section>

            <section>
                <Heading as="h2" size="sm" className="!uppercase !tracking-wider !text-zinc-500">
                    Half width — identical layout
                </Heading>
                <div className="mt-2 grid gap-4 lg:grid-cols-2">
                    <Card className="overflow-hidden">
                        <Slide slide={showcaseSlide} theme={defaultTheme} />
                    </Card>
                    <Card className="overflow-hidden">
                        <Slide slide={showcaseSlide} theme={darkTheme} />
                    </Card>
                </div>
                <Text size="xs" className="mt-2 !text-zinc-500">
                    Same slide, two themes — fonts and colors are theme-driven; layout doesn't change.
                </Text>
            </section>

            <section>
                <Heading as="h2" size="sm" className="!uppercase !tracking-wider !text-zinc-500">
                    Thumbnails — pinned width
                </Heading>
                <div className="mt-2 flex flex-wrap gap-4">
                    <Card className="overflow-hidden">
                        <Slide slide={showcaseSlide} theme={defaultTheme} width={320} />
                    </Card>
                    <Card className="overflow-hidden">
                        <Slide slide={showcaseSlide} theme={darkTheme} width={240} />
                    </Card>
                    <Card className="overflow-hidden">
                        <Slide slide={showcaseSlide} theme={vividTheme} width={160} />
                    </Card>
                </div>
                <Text size="xs" className="mt-2 !text-zinc-500">
                    `width` pins the slide to a pixel size; bullets, shapes, and typography stay legible because every coord scales together.
                </Text>
            </section>

            <Card padding="md">
                <div className="flex items-center gap-2">
                    <Badge color="violet">Tip</Badge>
                    <Text size="sm">
                        {"`<Slide>` is the building block under `<SlideViewer>`, `<DeckEditor>`'s canvas, `<SlideThumbnail>`, and `<PresenterView>` — one renderer powers all four."}
                    </Text>
                </div>
            </Card>
        </div>
    );
}
