import { useState } from "react";
import type { ComponentDoc } from "./types";
import { ImageViewer, Text } from "@particle-academy/react-fancy";
import type { ImageViewerViewport } from "@particle-academy/react-fancy";

const SHOT = "/showcase-shots/fancy-artboard.png";
const DIAGRAM = "/showcase-assets/file-viewer/diagram.svg";

/** The viewer fills its container, so every example needs a box with a height. */
function Box({ children }: { children: React.ReactNode }) {
    return (
        <div className="h-64 w-full overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            {children}
        </div>
    );
}

export const imageViewerDoc: ComponentDoc = {
    intro: (
        <p>
            A pan-and-zoom image surface. The viewport — <code>panX</code>,{" "}
            <code>panY</code>, <code>zoom</code> — is{" "}
            <strong>controllable and JSON-serializable</strong>, which is the point: an
            agent can zoom to a defect and leave the view pointing at it, rather than
            describing where to look. Uncontrolled by default, so the simple case stays
            one prop.
        </p>
    ),
    examples: [
        {
            name: "Default",
            description:
                "Scroll with Ctrl/⌘ held to zoom, drag to pan. The floating controls appear because zoomable defaults on.",
            render: () => (
                <Box>
                    <ImageViewer
                        src={SHOT}
                        alt="fancy-artboard showcase screenshot"
                        style={{ height: "100%" }}
                    />
                </Box>
            ),
            code: `<ImageViewer src="/shots/artboard.png" alt="ArtBoard" />`,
        },
        {
            name: "fit",
            description:
                "How the image sits at zoom 1. contain fits the whole thing, cover fills and crops, none shows it at natural size so you pan to see the rest.",
            render: () => (
                <div className="w-full space-y-3">
                    {(["contain", "cover", "none"] as const).map((fit) => (
                        <div key={fit}>
                            <Text className="mb-1 text-xs font-medium text-zinc-500">
                                fit="{fit}"
                            </Text>
                            <Box>
                                <ImageViewer
                                    src={SHOT}
                                    alt={`fit ${fit}`}
                                    fit={fit}
                                    style={{ height: "100%" }}
                                />
                            </Box>
                        </div>
                    ))}
                </div>
            ),
            code: `<ImageViewer src={src} fit="contain" />
<ImageViewer src={src} fit="cover" />
<ImageViewer src={src} fit="none" />`,
        },
        {
            name: "Locking the interaction",
            description:
                "zoomable and pannable turn off the gestures independently — a static figure that should not move, or a zoomable one that must stay centred. controls defaults to whatever zoomable is, so turning zoom off also removes the buttons.",
            render: () => (
                <div className="w-full space-y-3">
                    <div>
                        <Text className="mb-1 text-xs font-medium text-zinc-500">
                            zoomable={"{false}"} — static figure
                        </Text>
                        <Box>
                            <ImageViewer
                                src={SHOT}
                                alt="Static"
                                zoomable={false}
                                style={{ height: "100%" }}
                            />
                        </Box>
                    </div>
                    <div>
                        <Text className="mb-1 text-xs font-medium text-zinc-500">
                            pannable={"{false}"} — zoom only, stays centred
                        </Text>
                        <Box>
                            <ImageViewer
                                src={SHOT}
                                alt="Zoom only"
                                pannable={false}
                                style={{ height: "100%" }}
                            />
                        </Box>
                    </div>
                </div>
            ),
            code: `<ImageViewer src={src} zoomable={false} />
<ImageViewer src={src} pannable={false} />`,
        },
        {
            name: "Zoom bounds",
            description:
                "minZoom and maxZoom clamp the range. Narrow them for a photo, widen them for a diagram where someone genuinely needs to read 8pt type.",
            render: () => (
                <Box>
                    <ImageViewer
                        src={DIAGRAM}
                        alt="Diagram"
                        minZoom={0.5}
                        maxZoom={20}
                        style={{ height: "100%" }}
                    />
                </Box>
            ),
            code: `<ImageViewer src={src} minZoom={0.5} maxZoom={20} />`,
        },
        {
            name: "Checkerboard",
            description:
                "On by default so transparency reads as transparency rather than as white. Turn it off for a flat themed surface when the image is known to be opaque.",
            render: () => (
                <div className="w-full space-y-3">
                    <Box>
                        <ImageViewer
                            src={DIAGRAM}
                            alt="With checkerboard"
                            style={{ height: "100%" }}
                        />
                    </Box>
                    <Box>
                        <ImageViewer
                            src={DIAGRAM}
                            alt="Flat surface"
                            checkerboard={false}
                            style={{ height: "100%" }}
                        />
                    </Box>
                </div>
            ),
            code: `<ImageViewer src={src} />
<ImageViewer src={src} checkerboard={false} />`,
        },
        {
            name: "Controlled viewport",
            description:
                "viewport + onViewportChange hand the pan and zoom to you. This is the shape a bridge drives: the numbers below are live state, and the buttons set them the same way an agent's tool call would.",
            render: () => {
                function Controlled() {
                    const [viewport, setViewport] = useState<ImageViewerViewport>({
                        panX: 0,
                        panY: 0,
                        zoom: 1,
                    });

                    return (
                        <div className="w-full space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                                {[1, 2, 4].map((zoom) => (
                                    <button
                                        key={zoom}
                                        type="button"
                                        onClick={() => setViewport({ panX: 0, panY: 0, zoom })}
                                        className="rounded-md border border-zinc-200 px-2 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                                    >
                                        zoom {zoom}×
                                    </button>
                                ))}
                                <code className="ml-auto text-xs text-zinc-500">
                                    {JSON.stringify(viewport)}
                                </code>
                            </div>
                            <Box>
                                <ImageViewer
                                    src={SHOT}
                                    alt="Controlled"
                                    viewport={viewport}
                                    onViewportChange={setViewport}
                                    style={{ height: "100%" }}
                                />
                            </Box>
                        </div>
                    );
                }

                return <Controlled />;
            },
            code: `const [viewport, setViewport] = useState({ panX: 0, panY: 0, zoom: 1 });

<ImageViewer
    src={src}
    viewport={viewport}
    onViewportChange={setViewport}
/>

{/* An agent points the view at something: */}
setViewport({ panX: -320, panY: -180, zoom: 4 });`,
        },
        {
            name: "defaultViewport",
            description:
                "The uncontrolled equivalent — open already zoomed in, then let the user take over. Use this rather than controlling the viewport when nothing else needs to read it.",
            render: () => (
                <Box>
                    <ImageViewer
                        src={SHOT}
                        alt="Opens zoomed"
                        defaultViewport={{ panX: 0, panY: 0, zoom: 2 }}
                        style={{ height: "100%" }}
                    />
                </Box>
            ),
            code: `<ImageViewer src={src} defaultViewport={{ panX: 0, panY: 0, zoom: 2 }} />`,
        },
    ],
    props: [
        { name: "src", type: `string`, default: "—", description: "Image source — an `http(s):`, `data:` or `blob:` URL.", required: true },
        { name: "alt", type: `string`, default: "—", description: "Alt text, also used as the download filename hint." },
        { name: "fit", type: `"contain" | "cover" | "none"`, default: `"contain"`, description: "How the image sits in its container at zoom 1." },
        { name: "zoomable", type: `boolean`, default: `true`, description: "Allow Ctrl/⌘+wheel zoom and the zoom controls." },
        { name: "pannable", type: `boolean`, default: `true`, description: "Allow click-drag panning." },
        { name: "controls", type: `boolean`, default: `zoomable`, description: "Show the floating zoom controls. Defaults to whatever `zoomable` is." },
        { name: "minZoom", type: `number`, default: `0.25`, description: "Minimum zoom factor." },
        { name: "maxZoom", type: `number`, default: `8`, description: "Maximum zoom factor." },
        { name: "checkerboard", type: `boolean`, default: `true`, description: "Paint a checkerboard behind the image so transparency reads clearly." },
        { name: "viewport", type: `ImageViewerViewport`, default: "—", description: "Controlled pan + zoom. Pair with `onViewportChange`." },
        { name: "defaultViewport", type: `ImageViewerViewport`, default: "—", description: "Initial viewport when uncontrolled." },
        { name: "onViewportChange", type: `(v: ImageViewerViewport) => void`, default: "—", description: "Called whenever the pan or zoom changes." },
        { name: "onLoad", type: `() => void`, default: "—", description: "Fired when the image finishes loading." },
        { name: "onError", type: `() => void`, default: "—", description: "Fired when the image fails to load." },
        { name: "className", type: `string`, default: "—", description: "Additional classes for the container." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Inline styles — usually a height, since the viewer fills its box." },
    ],
    notes: (
        <ul>
            <li>
                <strong>Give it a height.</strong> The viewer fills its container; in a box
                with no height it collapses. Every example here sets{" "}
                <code>style={"{{ height: \"100%\" }}"}</code> inside a sized wrapper.
            </li>
            <li>
                <code>ImageViewerViewport</code> is three numbers and survives{" "}
                <code>JSON.parse(JSON.stringify(v))</code> — which is what lets an agent
                emit a view through a bridge rather than simulating drags.
            </li>
            <li>
                Zoom is bound to <strong>Ctrl/⌘+wheel</strong>, not bare wheel, so scrolling
                past an embedded viewer scrolls the page instead of trapping the gesture.
            </li>
        </ul>
    ),
};
