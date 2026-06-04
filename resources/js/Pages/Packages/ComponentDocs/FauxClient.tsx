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
    ],
    props: [
        { name: "variant", type: `"browser" | "device" | "bare"`, default: `"browser"`, description: "Chrome style around the content." },
        { name: "url", type: `string`, default: "—", description: "Address-bar text (browser variant)." },
        { name: "meta", type: `string`, default: "—", description: "Right-aligned meta text in the title bar (e.g. encoding)." },
        { name: "dots", type: `boolean`, default: `true`, description: "Show the traffic-light dots (browser variant)." },
        { name: "width", type: `number`, default: "—", description: "Logical content width in px. Pair with `scale=\"fit\"` to scale a full-size page into the frame." },
        { name: "scale", type: `"fit" | number`, default: `"fit"`, description: "`fit` auto-scales to the container; a number sets a fixed scale. Only applies when `width` is set." },
        { name: "children", type: `ReactNode`, default: "—", description: "The real UI rendered inside — interactive, not a snapshot." },
        { name: "className / barClassName / bodyClassName", type: `string`, default: "—", description: "Class hooks for the frame, title bar, and body." },
    ],
};
