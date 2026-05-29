import type { ComponentDoc } from "./types";
import { ArtBoard, ArtPiece, type ArtBoardValue } from "@particle-academy/fancy-artboard";
import "@particle-academy/fancy-artboard/styles.css";
import { useState } from "react";

const MOCKUP = `
<div style="height:100%;padding:14px;font-family:system-ui,sans-serif;background:#fff;color:#18181b">
  <div style="height:12px;width:50%;background:#e4e4e7;border-radius:4px"></div>
  <div style="margin-top:10px;height:8px;width:80%;background:#f4f4f5;border-radius:4px"></div>
  <div style="margin-top:6px;height:8px;width:70%;background:#f4f4f5;border-radius:4px"></div>
  <div style="margin-top:16px;height:60px;background:linear-gradient(135deg,#a78bfa,#38bdf8);border-radius:8px"></div>
</div>`;

function ArtPieceKindsDemo() {
    const [value, setValue] = useState<ArtBoardValue>({
        sections: [
            {
                id: "kinds",
                title: "Three content kinds + pending",
                pieces: [
                    { id: "p-image", label: "image", width: 220, height: 200, content: { kind: "image", src: "/showcase-assets/fancy-ui-logo.jpg", alt: "Logo" } },
                    { id: "p-html", label: "html", width: 220, height: 200, content: { kind: "html", html: MOCKUP } },
                    { id: "p-node", label: "node (JSX)", width: 220, height: 200, content: { kind: "node" } },
                    { id: "p-pending", label: "pending", width: 220, height: 200, pending: true, content: { kind: "html", html: MOCKUP } },
                ],
            },
        ],
    });
    return (
        <div className="h-80 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <ArtBoard value={value} onChange={setValue} defaultViewport={{ x: 24, y: 24, zoom: 0.7 }} style={{ height: "100%", width: "100%" }}>
                <ArtPiece id="p-node">
                    <div className="grid h-full place-items-center bg-zinc-900 p-3 text-center font-mono text-xs text-emerald-300">
                        any JSX
                    </div>
                </ArtPiece>
            </ArtBoard>
        </div>
    );
}

export const artPieceDoc: ComponentDoc = {
    intro: (
        <p>
            A single design frame inside an <code>ArtBoard.Section</code>.{" "}
            <code>ArtPiece</code> is an <strong>authoring marker</strong> — it renders nothing
            itself; <code>ArtBoard</code> walks the markers to build the <code>ArtBoardValue</code>{" "}
            and a node registry for JSX content. All three content kinds render{" "}
            <em>inline</em> so they scale crisply under the world transform.
        </p>
    ),
    examples: [
        {
            name: "Three content kinds",
            description:
                "image (object-fit:cover), html (dangerouslySetInnerHTML — live app mockups), and node (your JSX children, resolved by id). The fourth frame is pending — a trust-but-verify \"proposed\" affordance.",
            render: () => <ArtPieceKindsDemo />,
            code: `<ArtBoard.Section id="kinds" title="Three content kinds">
  <ArtPiece id="p-image" label="image" width={220} height={200}
    content={{ kind: "image", src: "/mocks/hero.png", alt: "Hero" }} />

  <ArtPiece id="p-html" label="html" width={220} height={200}
    content={{ kind: "html", html: heroHtml }} />

  <ArtPiece id="p-node" label="node (JSX)" width={220} height={200}>
    <HeroMockup variant="c" />
  </ArtPiece>

  <ArtPiece id="p-pending" label="pending" pending
    content={{ kind: "html", html: draftHtml }} />
</ArtBoard.Section>`,
        },
    ],
    props: [
        { name: "id", type: `string`, default: "—", required: true, description: "Stable handle (`data-fa-piece`). Agents/selectors target this without guessing the DOM." },
        { name: "label", type: `string`, default: "id", description: "Inline-editable header label." },
        { name: "width", type: `number`, default: `260`, description: "Natural px width (also the export width)." },
        { name: "height", type: `number`, default: `480`, description: "Natural px height (also the export height)." },
        { name: "content", type: `ArtPieceContent`, default: `{ kind: "node" }`, description: "Content source: image / html / node. Omit to render `children` as a node piece." },
        { name: "pending", type: `boolean`, default: `false`, description: "Renders a dashed \"proposed\" ring + badge (trust-but-verify)." },
        { name: "children", type: `ReactNode`, default: "—", description: "JSX content when authoring inline (compiled to a `kind:\"node\"` piece)." },
    ],
    notes: (
        <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
            <p>
                <strong>Per-piece chrome:</strong> each frame header (counter-scaled to stay a
                constant on-screen size) carries a drag grip, an inline-editable label, a kebab
                menu (Download PNG / HTML, two-click-confirm Delete) and a focus button.
            </p>
            <p>
                <strong>Export:</strong> PNG/HTML export is self-contained (styles + fonts +
                images inlined) and independent of viewport zoom; it also invokes the board's{" "}
                <code>onExport(pieceId, kind)</code>.
            </p>
        </div>
    ),
};
