import { Card, Heading, Text } from "@particle-academy/react-fancy";
import { Slide, defaultTheme, type SlideData, type ShapeElement, type ShapeKind } from "@particle-academy/fancy-slides";
import "@particle-academy/fancy-slides/styles.css";

/**
 * Demo for the `shape` element type. Shows every supported kind + a
 * second grid demonstrating fill / stroke / dash / radius variations.
 */

const kinds: ShapeKind[] = ["rect", "rounded-rect", "ellipse", "triangle", "line", "arrow"];

function slide(...elements: Array<Omit<ShapeElement, "id" | "type">>): SlideData {
    return {
        id: "demo",
        elements: elements.map((e, i) => ({
            id: `shape-${i}`,
            type: "shape",
            ...e,
        })),
    };
}

function shapeTile(shape: ShapeKind, overrides: Partial<ShapeElement> = {}) {
    return slide({
        shape,
        x: 0.15,
        y: 0.15,
        w: 0.7,
        h: 0.7,
        fill: shape === "line" || shape === "arrow" ? "none" : "rgba(139,92,246,0.15)",
        stroke: "#8B5CF6",
        strokeWidth: 2,
        ...overrides,
    });
}

export function ShapeElementDemo() {
    return (
        <div className="space-y-6 p-6">
            <header>
                <Heading as="h1" size="lg">
                    ShapeElement
                </Heading>
                <Text className="mt-1 !text-zinc-600 dark:!text-zinc-300">
                    Pure SVG primitives — six shape kinds, no dependencies. Stroke widths scale with the rendered slide width so the same shape stays visually consistent from thumbnail to fullscreen.
                </Text>
            </header>

            <section>
                <Heading as="h2" size="sm" className="!uppercase !tracking-wider !text-zinc-500">
                    Shape kinds
                </Heading>
                <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {kinds.map((kind) => (
                        <Card key={kind} className="overflow-hidden">
                            <Card.Header>
                                <Text size="xs" className="!font-mono !text-zinc-500">shape=&quot;{kind}&quot;</Text>
                            </Card.Header>
                            <div className="border-t border-zinc-100 dark:border-zinc-800">
                                <Slide slide={shapeTile(kind)} theme={defaultTheme} />
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            <section>
                <Heading as="h2" size="sm" className="!uppercase !tracking-wider !text-zinc-500">
                    Style variations
                </Heading>
                <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="overflow-hidden">
                        <Card.Header>
                            <Text size="xs" className="!font-mono !text-zinc-500">filled rounded-rect</Text>
                        </Card.Header>
                        <div className="border-t border-zinc-100 dark:border-zinc-800">
                            <Slide
                                slide={shapeTile("rounded-rect", { fill: "#8B5CF6", stroke: "#581c87", strokeWidth: 4, radius: 24 })}
                                theme={defaultTheme}
                            />
                        </div>
                    </Card>
                    <Card className="overflow-hidden">
                        <Card.Header>
                            <Text size="xs" className="!font-mono !text-zinc-500">dashed border</Text>
                        </Card.Header>
                        <div className="border-t border-zinc-100 dark:border-zinc-800">
                            <Slide
                                slide={shapeTile("rect", { fill: "none", stroke: "#0F172A", strokeWidth: 3, dashed: true })}
                                theme={defaultTheme}
                            />
                        </div>
                    </Card>
                    <Card className="overflow-hidden">
                        <Card.Header>
                            <Text size="xs" className="!font-mono !text-zinc-500">thick arrow</Text>
                        </Card.Header>
                        <div className="border-t border-zinc-100 dark:border-zinc-800">
                            <Slide
                                slide={shapeTile("arrow", { stroke: "#22c55e", strokeWidth: 6 })}
                                theme={defaultTheme}
                            />
                        </div>
                    </Card>
                    <Card className="overflow-hidden">
                        <Card.Header>
                            <Text size="xs" className="!font-mono !text-zinc-500">ellipse + tinted fill</Text>
                        </Card.Header>
                        <div className="border-t border-zinc-100 dark:border-zinc-800">
                            <Slide
                                slide={shapeTile("ellipse", { fill: "rgba(34,197,94,0.2)", stroke: "#22c55e", strokeWidth: 3 })}
                                theme={defaultTheme}
                            />
                        </div>
                    </Card>
                    <Card className="overflow-hidden">
                        <Card.Header>
                            <Text size="xs" className="!font-mono !text-zinc-500">composed scene</Text>
                        </Card.Header>
                        <div className="border-t border-zinc-100 dark:border-zinc-800">
                            <Slide
                                slide={{
                                    id: "composed",
                                    elements: [
                                        { id: "a", type: "shape", shape: "rect", x: 0.1, y: 0.2, w: 0.3, h: 0.6, fill: "rgba(139,92,246,0.12)", stroke: "#8B5CF6", strokeWidth: 2 },
                                        { id: "b", type: "shape", shape: "arrow", x: 0.42, y: 0.45, w: 0.16, h: 0.1, stroke: "#8B5CF6", strokeWidth: 4 },
                                        { id: "c", type: "shape", shape: "ellipse", x: 0.6, y: 0.2, w: 0.3, h: 0.6, fill: "rgba(34,197,94,0.15)", stroke: "#22c55e", strokeWidth: 2 },
                                    ],
                                }}
                                theme={defaultTheme}
                            />
                        </div>
                    </Card>
                    <Card className="overflow-hidden">
                        <Card.Header>
                            <Text size="xs" className="!font-mono !text-zinc-500">triangle accent</Text>
                        </Card.Header>
                        <div className="border-t border-zinc-100 dark:border-zinc-800">
                            <Slide
                                slide={shapeTile("triangle", { fill: "#F59E0B", stroke: "#92400E", strokeWidth: 3 })}
                                theme={defaultTheme}
                            />
                        </div>
                    </Card>
                </div>
            </section>
        </div>
    );
}
