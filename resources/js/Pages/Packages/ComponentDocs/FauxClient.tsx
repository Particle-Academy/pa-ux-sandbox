import type { ComponentDoc } from "./types";
import { Badge, Button, FauxClient, Text } from "@particle-academy/react-fancy";

export const fauxClientDoc: ComponentDoc = {
    intro: (
        <p>
            A frame that mimics a <strong>browser window, desktop window, or device</strong> and
            renders <strong>real, interactive UI inside</strong> — not a screenshot. With a logical{" "}
            <code>width</code> + <code>scale="fit"</code> it renders a full-size page and scales it
            down to any container (live thumbnails, device mockups); omit <code>width</code> for
            chrome around natural-size content (a code/preview card). It's the building block behind
            the homepage hero card and the CMS <code>device</code> Element.
        </p>
    ),
    examples: [
        {
            name: "Browser chrome",
            description: "The `browser` variant — dots, a URL bar, and real children inside.",
            render: () => (
                <FauxClient variant="browser" url="fancy.test/agent-playground" meta="UTF-8" className="w-full max-w-lg">
                    <div className="space-y-2 p-5">
                        <Badge color="emerald" dot>live</Badge>
                        <Text className="!font-semibold">This is real UI</Text>
                        <Button color="violet" size="sm" icon="sparkles">The button works</Button>
                    </div>
                </FauxClient>
            ),
            code: `<FauxClient variant="browser" url="fancy.test/agent-playground" meta="UTF-8">
  <YourLiveApp />
</FauxClient>`,
        },
        {
            name: "Scale-to-fit preview",
            description: "Give a logical `width` + `scale=\"fit\"` to render a full-size page scaled into a thumbnail.",
            render: () => (
                <FauxClient variant="browser" url="fancy.test" width={1280} scale="fit" className="w-full max-w-sm">
                    <div style={{ padding: 48 }}>
                        <Text className="!text-3xl !font-bold">A 1280px page…</Text>
                        <Text className="!text-zinc-500">…scaled to fit this small frame, still interactive.</Text>
                    </div>
                </FauxClient>
            ),
            code: `<FauxClient variant="browser" width={1280} scale="fit">
  <FullSizePage />
</FauxClient>`,
        },
        {
            name: "Device + bare",
            description: "`device` adds a thick rounded bezel; `bare` is a plain rounded surface with no titlebar.",
            render: () => (
                <div className="grid w-full gap-3 sm:grid-cols-2">
                    <FauxClient variant="device"><div className="p-5"><Text>Device bezel</Text></div></FauxClient>
                    <FauxClient variant="bare"><div className="p-5"><Text>Bare frame</Text></div></FauxClient>
                </div>
            ),
            code: `<FauxClient variant="device">…</FauxClient>
<FauxClient variant="bare">…</FauxClient>`,
        },
        {
            name: "Zoom and full screen",
            description:
                "controls adds a zoom bar and a full-screen button, hidden until the frame is hovered (always shown on touch screens). In the browser variant they sit inline in the address bar; on a device or bare frame, a slim pill top-right. Zoom scrolls the content inside a frame that keeps its size; zoom / defaultZoom / onZoomChange make it controllable within minZoom..maxZoom, and onFullscreenChange reports full screen however it changed. fill makes the frame take its parent's height, for content that sizes itself to its box; applyZoom={false} keeps the controls and state but lets that content zoom itself (SlideViewer does). Hover the frames.",
            render: () => (
                <div className="grid w-full gap-3 sm:grid-cols-2">
                    <FauxClient variant="browser" url="report.pdf" controls>
                        <div className="space-y-2 p-5">
                            <Text>Hover for the controls in the bar.</Text>
                            <Text size="sm">Zoom scrolls this content inside the frame.</Text>
                        </div>
                    </FauxClient>
                    <div className="h-40">
                        <FauxClient variant="device" controls fill defaultZoom={1} minZoom={0.5} maxZoom={3} onZoomChange={() => {}} onFullscreenChange={() => {}}>
                            <div className="flex h-full items-center justify-center p-5"><Text>Device, fill</Text></div>
                        </FauxClient>
                    </div>
                </div>
            ),
            code: `<FauxClient variant="browser" url="report.pdf" controls>…</FauxClient>

// Controlled, filling a sized parent:
const [zoom, setZoom] = useState(1);
<div className="h-96">
    <FauxClient variant="device" controls fill zoom={zoom} onZoomChange={setZoom}
        minZoom={0.5} maxZoom={3} onFullscreenChange={(on) => track(on)}>
        <Viewer />
    </FauxClient>
</div>

// Content that zooms itself: the frame keeps the controls and the state.
<FauxClient controls fill applyZoom={false} zoom={zoom} onZoomChange={setZoom}>
    <SelfFittingViewer zoom={zoom} />
</FauxClient>`,
        },
    ],
    props: [
        { name: "variant", type: `"browser" | "device" | "bare"`, default: `"browser"`, description: "Chrome style around the content." },
        { name: "url", type: `string`, default: "—", description: "Address-bar text (browser variant)." },
        { name: "meta", type: `string`, default: "—", description: "Right-aligned meta text in the title bar (e.g. encoding)." },
        { name: "dots", type: `boolean`, default: `true`, description: "Show the traffic-light dots (browser variant)." },
        { name: "width", type: `number`, default: "—", description: "Logical content width in px. Pair with `scale=\"fit\"` to scale a full-size page into the frame." },
        { name: "scale", type: `"fit" | number`, default: `"fit"`, description: "`fit` auto-scales to the container; a number sets a fixed scale. Only applies when `width` is set." },
        { name: "controls", type: `boolean | { zoom?: boolean; fullscreen?: boolean }`, default: `false`, description: "Zoom bar and full-screen button, revealed on hover." },
        { name: "zoom / defaultZoom / onZoomChange", type: `number`, default: `1`, description: "The zoom, controllable (1 = fit)." },
        { name: "minZoom / maxZoom", type: `number`, default: `0.5 / 4`, description: "Bounds for the zoom bar." },
        { name: "onFullscreenChange", type: `(fullscreen: boolean) => void`, default: "—", description: "Entered or left full screen, by the button, Esc or the browser. The frame carries `data-fullscreen` too." },
        { name: "fill", type: `boolean`, default: `false`, description: "Take the parent's height and give the content what the chrome leaves." },
        { name: "applyZoom", type: `boolean`, default: `true`, description: "`false`: keep the controls and state, let the content zoom itself." },
        { name: "children", type: `ReactNode`, default: "—", description: "The real UI rendered inside — interactive, not a snapshot." },
        { name: "className / barClassName / bodyClassName", type: `string`, default: "—", description: "Class hooks for the frame, title bar, and body." },
    ],
};
