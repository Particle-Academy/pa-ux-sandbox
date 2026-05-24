import { Card, Heading, Text } from "@particle-academy/react-fancy";
import { Slide, defaultTheme, type SlideData, type TextElement } from "@particle-academy/fancy-slides";
import "@particle-academy/fancy-slides/styles.css";

/**
 * Demo for the `text` element. Each card is a full Slide rendering with a
 * single TextElement so the user can see exactly how each style + format
 * combination renders inside a real slide.
 */

function slide(element: Omit<TextElement, "id" | "x" | "y" | "w" | "h">): SlideData {
    return {
        id: "demo",
        elements: [
            {
                id: "t",
                type: "text",
                x: 0.06,
                y: 0.18,
                w: 0.88,
                h: 0.64,
                ...element,
            } as TextElement,
        ],
    };
}

const examples: Array<{ title: string; description: string; element: Omit<TextElement, "id" | "x" | "y" | "w" | "h"> }> = [
    {
        title: "Plain text",
        description: "format=\"plain\" — raw text, newlines preserved.",
        element: {
            type: "text",
            content: "A simple line of text.",
            format: "plain",
            style: { fontSize: 36, align: "center", verticalAlign: "middle" },
        },
    },
    {
        title: "Markdown",
        description: "format=\"markdown\" — parsed via ContentRenderer. Bullets, **bold**, *italic*, `code`.",
        element: {
            type: "text",
            content:
                "Inline **bold** and *italic* render as separate runs.\n\nList items work too:\n\n- one\n- two with `inline code`\n- three",
            format: "markdown",
            style: { fontSize: 22, lineHeight: 1.6 },
        },
    },
    {
        title: "Bold + center align",
        description: "weight=\"bold\" + align=\"center\".",
        element: {
            type: "text",
            content: "Headline",
            format: "plain",
            style: { fontSize: 72, weight: "bold", align: "center", verticalAlign: "middle" },
        },
    },
    {
        title: "Colored + right align",
        description: "Custom color + align=\"right\".",
        element: {
            type: "text",
            content: "Accent text",
            format: "plain",
            style: { fontSize: 40, color: "#8B5CF6", align: "right", verticalAlign: "middle" },
        },
    },
    {
        title: "Italic + line-height",
        description: "italic=true with a generous line-height for poetry / quotes.",
        element: {
            type: "text",
            content: "Where words fail, music speaks.\n— Hans Christian Andersen",
            format: "plain",
            style: { fontSize: 28, italic: true, align: "center", verticalAlign: "middle", lineHeight: 1.8 },
        },
    },
    {
        title: "Underline",
        description: "underline=true.",
        element: {
            type: "text",
            content: "Underlined text",
            format: "plain",
            style: { fontSize: 40, underline: true, align: "center", verticalAlign: "middle" },
        },
    },
];

export function TextElementDemo() {
    return (
        <div className="space-y-6 p-6">
            <header>
                <Heading as="h1" size="lg">
                    TextElement
                </Heading>
                <Text className="mt-1 !text-zinc-600 dark:!text-zinc-300">
                    The `text` element type, exercised across every style prop. Each tile is a real `&lt;Slide&gt;` containing a single TextElement.
                </Text>
            </header>

            <div className="grid gap-4 lg:grid-cols-2">
                {examples.map((ex) => (
                    <Card key={ex.title}>
                        <Card.Header>
                            <Heading as="h3" size="sm">{ex.title}</Heading>
                            <Text size="xs" className="mt-1 !text-zinc-500">{ex.description}</Text>
                        </Card.Header>
                        <div className="overflow-hidden border-t border-zinc-100 dark:border-zinc-800">
                            <Slide slide={slide(ex.element)} theme={defaultTheme} />
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
