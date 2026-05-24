import { Card, Heading, Text } from "@particle-academy/react-fancy";
import { Slide, defaultTheme, type SlideData, type ImageElement } from "@particle-academy/fancy-slides";
import "@particle-academy/fancy-slides/styles.css";

/**
 * Demo for the `image` element type. Shows the four fit modes
 * (contain / cover / fill / scale-down) so the user can see how each
 * behaves when the element box doesn't match the source aspect ratio.
 */

const src = "https://placehold.co/600x400/8b5cf6/ffffff?text=600x400";

function slide(element: Omit<ImageElement, "id" | "type" | "x" | "y" | "w" | "h">): SlideData {
    return {
        id: "demo",
        elements: [
            {
                id: "img",
                type: "image",
                x: 0.06,
                y: 0.06,
                w: 0.88,
                h: 0.88,
                src,
                ...element,
            },
        ],
    };
}

const fits: Array<{ fit: ImageElement["fit"]; label: string; description: string }> = [
    { fit: "contain", label: "fit=\"contain\"", description: "Letterboxes. Preserves aspect, never crops." },
    { fit: "cover", label: "fit=\"cover\"", description: "Fills the box, crops to maintain aspect ratio." },
    { fit: "fill", label: "fit=\"fill\"", description: "Stretches to fill — may distort." },
    { fit: "scale-down", label: "fit=\"scale-down\"", description: "Like contain, but never enlarges." },
];

export function ImageElementDemo() {
    return (
        <div className="space-y-6 p-6">
            <header>
                <Heading as="h1" size="lg">
                    ImageElement
                </Heading>
                <Text className="mt-1 !text-zinc-600 dark:!text-zinc-300">
                    Image elements use a single `&lt;img&gt;` with theme-agnostic object-fit. Each tile below renders a 600×400 source inside a wide-aspect slide box so the four fit modes are clearly distinguishable.
                </Text>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
                {fits.map((f) => (
                    <Card key={f.fit}>
                        <Card.Header>
                            <Heading as="h3" size="sm">{f.label}</Heading>
                            <Text size="xs" className="mt-1 !text-zinc-500">{f.description}</Text>
                        </Card.Header>
                        <div className="overflow-hidden border-t border-zinc-100 dark:border-zinc-800">
                            <Slide slide={slide({ src, fit: f.fit })} theme={defaultTheme} />
                        </div>
                    </Card>
                ))}
            </div>

            <Card padding="md">
                <Text size="sm">
                    `src` accepts any URL or data URI. Local files work too — the package doesn't fetch network resources automatically (security boundary). Pair with a `&lt;Card&gt;` or set a `background` on the slide for the framed-photo look.
                </Text>
            </Card>
        </div>
    );
}
