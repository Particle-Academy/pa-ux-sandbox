import type { ComponentDoc } from "./types";
import { ImageElementRenderer } from "@particle-academy/fancy-slides";

const sampleSrc = "https://placehold.co/600x400/8b5cf6/ffffff?text=Image+element";

export const fancySlidesImageElementDoc: ComponentDoc = {
    intro: (
        <p>
            Renderer for the <code>image</code> element type. Pure{" "}
            <code>&lt;img&gt;</code> with theme-agnostic object-fit. The element model
            stays JSON-friendly so an LLM can emit it directly — `src` is a URL or data
            URI.
        </p>
    ),
    examples: [
        {
            name: "Default (contain)",
            description: "`fit=\"contain\"` letterboxes; preserves aspect ratio.",
            render: () => (
                <div className="h-32 w-full max-w-md rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <ImageElementRenderer
                        element={{ id: "i", type: "image", x: 0, y: 0, w: 1, h: 1, src: sampleSrc, fit: "contain" }}
                    />
                </div>
            ),
            code: `<ImageElementRenderer
    element={{
        id: "i",
        type: "image",
        x: 0.2, y: 0.2, w: 0.6, h: 0.6,
        src: "/photo.jpg",
        alt: "Description",
        fit: "contain",
    }}
/>`,
        },
        {
            name: "Fit modes",
            render: () => (
                <div className="grid grid-cols-3 gap-3">
                    {(["contain", "cover", "fill"] as const).map((fit) => (
                        <div key={fit} className="h-24 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                            <ImageElementRenderer
                                element={{ id: fit, type: "image", x: 0, y: 0, w: 1, h: 1, src: sampleSrc, fit }}
                            />
                        </div>
                    ))}
                </div>
            ),
            code: `<ImageElementRenderer element={{ ..., fit: "contain" }} />
<ImageElementRenderer element={{ ..., fit: "cover" }} />
<ImageElementRenderer element={{ ..., fit: "fill" }} />`,
        },
    ],
    props: [
        { name: "element", type: `ImageElement`, default: "—", description: "The image element model — `{ src, alt?, fit?, crop? }`." },
    ],
    notes: (
        <p className="text-xs text-zinc-600 dark:text-zinc-300">
            <strong>Cropping (v0.2):</strong> the type already has a `crop` field but the
            renderer doesn't honor it yet. Coming in the next release alongside the
            interactive resize / crop handles on the canvas.
        </p>
    ),
};
