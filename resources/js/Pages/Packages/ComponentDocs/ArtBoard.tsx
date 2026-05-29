import type { ComponentDoc } from "./types";
import { ArtBoard, ArtPiece, type ArtBoardValue } from "@particle-academy/fancy-artboard";
import "@particle-academy/fancy-artboard/styles.css";
import { useState } from "react";

const MOCKUP = `
<div style="height:100%;display:flex;flex-direction:column;font-family:system-ui,sans-serif;background:#fff;color:#18181b">
  <div style="padding:16px">
    <div style="font-size:12px;font-weight:600;color:#7c3aed">Particle</div>
    <h1 style="margin:12px 0 6px;font-size:22px;line-height:1.15">Build with humans and agents.</h1>
    <p style="margin:0;font-size:12px;color:#71717a">One surface. Trade control fluidly.</p>
  </div>
  <div style="margin-top:auto;height:96px;background:linear-gradient(135deg,#a78bfa,#38bdf8)"></div>
</div>`;

function ArtBoardLiveDemo() {
    const [value, setValue] = useState<ArtBoardValue>({
        sections: [
            {
                id: "onboarding",
                title: "Onboarding",
                subtitle: "First-run variants",
                pieces: [
                    { id: "a", label: "A · HTML", width: 300, height: 420, content: { kind: "html", html: MOCKUP } },
                    { id: "b", label: "B · Proposed", width: 300, height: 420, pending: true, content: { kind: "html", html: MOCKUP } },
                    { id: "c", label: "C · Live JSX", width: 300, height: 420, content: { kind: "node" } },
                ],
            },
        ],
    });
    const [focus, setFocus] = useState<string | null>(null);
    return (
        <div className="h-[26rem] w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <ArtBoard
                value={value}
                onChange={setValue}
                focus={focus}
                onFocusChange={setFocus}
                defaultViewport={{ x: 24, y: 24, zoom: 0.55 }}
                style={{ height: "100%", width: "100%" }}
            >
                <ArtPiece id="c">
                    <div className="grid h-full place-items-center bg-gradient-to-br from-emerald-400 to-teal-500 text-center text-white">
                        <div className="text-xl font-bold">Live JSX</div>
                    </div>
                </ArtPiece>
            </ArtBoard>
        </div>
    );
}

export const artBoardDoc: ComponentDoc = {
    intro: (
        <p>
            A Figma-style design canvas — a controlled pan/zoom board of{" "}
            <code>ArtPiece</code> frames grouped into sections, with focus mode, drag-reorder,
            inline rename, sticky notes, and PNG/HTML export. Composed entirely from
            react-fancy primitives; the whole board is a JSON-friendly{" "}
            <code>ArtBoardValue</code> an agent can emit directly. Import{" "}
            <code>@particle-academy/fancy-artboard/styles.css</code> once.
        </p>
    ),
    examples: [
        {
            name: "Controlled board",
            description:
                "Hold an ArtBoardValue in state. Pan with drag, pinch/wheel to zoom, drag a piece header to reorder, focus a frame to enter the full-screen overlay. JSX content resolves to its kind:\"node\" piece by id.",
            render: () => <ArtBoardLiveDemo />,
            code: `const [value, setValue] = useState<ArtBoardValue>({
  sections: [{
    id: "onboarding", title: "Onboarding", subtitle: "First-run variants",
    pieces: [
      { id: "a", label: "A · HTML", width: 300, height: 420,
        content: { kind: "html", html: heroHtml } },
      { id: "b", label: "B · Proposed", pending: true,
        content: { kind: "html", html: heroHtml } },
      { id: "c", label: "C · Live JSX", content: { kind: "node" } },
    ],
  }],
});

<ArtBoard value={value} onChange={setValue} style={{ height: "100%" }}>
  {/* JSX content resolves to the kind:"node" piece by id */}
  <ArtPiece id="c"><HeroMockup variant="c" /></ArtPiece>
</ArtBoard>`,
        },
        {
            name: "Authoring with JSX sugar",
            description:
                "Skip the value object entirely — <ArtBoard.Section> / <ArtPiece> children compile to an ArtBoardValue and a node registry. Add an <ArtBoard.Note> sticky anywhere in the world.",
            render: () => (
                <div className="h-72 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <ArtBoard defaultViewport={{ x: 24, y: 24, zoom: 0.7 }} style={{ height: "100%", width: "100%" }}>
                        <ArtBoard.Section id="s1" title="Variants" subtitle="A / B">
                            <ArtPiece id="x" label="A" width={200} height={260} content={{ kind: "html", html: MOCKUP }} />
                            <ArtPiece id="y" label="B" width={200} height={260} content={{ kind: "html", html: MOCKUP }} />
                        </ArtBoard.Section>
                        <ArtBoard.Note top={20} left={460} rotate={-3}>
                            Try the dusk gradient?
                        </ArtBoard.Note>
                    </ArtBoard>
                </div>
            ),
            code: `<ArtBoard style={{ height: "100vh" }}>
  <ArtBoard.Section id="s1" title="Variants" subtitle="A / B">
    <ArtPiece id="x" label="A" content={{ kind: "html", html: heroHtml }} />
    <ArtPiece id="y" label="B"><MyMockup variant="b" /></ArtPiece>
  </ArtBoard.Section>
  <ArtBoard.Note top={20} left={460} rotate={-3}>
    Try the dusk gradient?
  </ArtBoard.Note>
</ArtBoard>`,
        },
    ],
    props: [
        { name: "value", type: `ArtBoardValue`, default: "—", description: "Controlled board content. Authoritative when set. Use with `onChange`." },
        { name: "defaultValue", type: `ArtBoardValue`, default: "from children", description: "Initial value (uncontrolled)." },
        { name: "onChange", type: `(v: ArtBoardValue) => void`, default: "—", description: "Fires on rename / reorder / delete." },
        { name: "viewport", type: `Viewport`, default: "—", description: "Controlled `{ x, y, zoom }`. Use with `onViewportChange`." },
        { name: "defaultViewport", type: `Viewport`, default: `{ x: 0, y: 0, zoom: 1 }`, description: "Initial viewport (uncontrolled)." },
        { name: "onViewportChange", type: `(v: Viewport) => void`, default: "—", description: "Fires after each pan / zoom frame." },
        { name: "focus", type: `string | null`, default: "—", description: "Controlled focused piece id (opens the full-screen overlay)." },
        { name: "onFocusChange", type: `(id: string | null) => void`, default: "—", description: "Fires when focus enters / exits a piece." },
        { name: "minZoom", type: `number`, default: `0.1`, description: "Smallest allowed scale." },
        { name: "maxZoom", type: `number`, default: `8`, description: "Largest allowed scale." },
        { name: "onExport", type: `(pieceId: string, kind: "png" | "html") => void`, default: "—", description: "Notified on each export action from a piece kebab menu." },
        { name: "children", type: `ReactNode`, default: "—", description: "`<ArtBoard.Section>` / `<ArtPiece>` / `<ArtBoard.Note>` authoring sugar." },
        { name: "className", type: `string`, default: "—", description: "Applied to the viewport element." },
        { name: "style", type: `CSSProperties`, default: "—", description: "Applied to the viewport element. Set a height — it fills its box." },
    ],
    notes: (
        <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
            <p>
                <strong>Stable handles:</strong> each frame renders <code>data-fa-piece={"{id}"}</code>{" "}
                and each section <code>data-fa-section={"{id}"}</code>, so a sibling MCP bridge
                targets the value contract and these handles — never DOM scraping. The component
                emits no <code>AgentActivity</code> itself; presence / undo live in the bridge layer.
            </p>
            <p>
                <strong>Trust-but-verify:</strong> a piece with <code>pending: true</code> renders a
                dashed "proposed" ring + badge — the agent proposes, the human confirms.
            </p>
            <p>
                <strong>Static members:</strong> <code>ArtBoard.Section</code> and{" "}
                <code>ArtBoard.Note</code> are attached to the component.
            </p>
        </div>
    ),
};
