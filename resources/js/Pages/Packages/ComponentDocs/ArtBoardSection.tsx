import type { ComponentDoc } from "./types";
import { ArtBoard, ArtPiece, type ArtBoardValue } from "@particle-academy/fancy-artboard";
import "@particle-academy/fancy-artboard/styles.css";
import { useState } from "react";

const MOCKUP = `
<div style="height:100%;padding:14px;font-family:system-ui,sans-serif;background:#fff;color:#18181b">
  <div style="height:12px;width:55%;background:#e4e4e7;border-radius:4px"></div>
  <div style="margin-top:14px;height:60px;background:linear-gradient(135deg,#a78bfa,#38bdf8);border-radius:8px"></div>
</div>`;

function ArtBoardSectionDemo() {
    const [value, setValue] = useState<ArtBoardValue>({
        sections: [
            {
                id: "hero",
                title: "Hero variants",
                subtitle: "A/B/C copy directions",
                pieces: [
                    { id: "h-a", label: "A", width: 200, height: 280, content: { kind: "html", html: MOCKUP } },
                    { id: "h-b", label: "B", width: 200, height: 280, content: { kind: "html", html: MOCKUP } },
                ],
            },
            {
                id: "pricing",
                title: "Pricing",
                subtitle: "Two layouts",
                pieces: [
                    { id: "pr-a", label: "Cards", width: 200, height: 280, content: { kind: "html", html: MOCKUP } },
                    { id: "pr-b", label: "Table", width: 200, height: 280, content: { kind: "html", html: MOCKUP } },
                ],
            },
        ],
    });
    return (
        <div className="h-80 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <ArtBoard value={value} onChange={setValue} defaultViewport={{ x: 24, y: 24, zoom: 0.55 }} style={{ height: "100%", width: "100%" }} />
        </div>
    );
}

export const artBoardSectionDoc: ComponentDoc = {
    intro: (
        <p>
            Groups pieces into a titled, horizontally-scrolling row.{" "}
            <code>ArtBoard.Section</code> is an authoring marker — like <code>ArtPiece</code>, it
            renders nothing on its own; <code>ArtBoard</code> compiles it into the value. The
            section head (inline-editable title + subtitle) is rendered from the controlled value.
        </p>
    ),
    examples: [
        {
            name: "Two sections",
            description:
                "Each section is a titled group with its own horizontal piece row. The title is inline-editable; mutations flow through the board's onChange.",
            render: () => <ArtBoardSectionDemo />,
            code: `<ArtBoard value={value} onChange={setValue} style={{ height: "100%" }}>
  <ArtBoard.Section id="hero" title="Hero variants" subtitle="A/B/C copy directions">
    <ArtPiece id="h-a" label="A" content={{ kind: "html", html }} />
    <ArtPiece id="h-b" label="B" content={{ kind: "html", html }} />
  </ArtBoard.Section>
  <ArtBoard.Section id="pricing" title="Pricing" subtitle="Two layouts">
    <ArtPiece id="pr-a" label="Cards" content={{ kind: "html", html }} />
    <ArtPiece id="pr-b" label="Table" content={{ kind: "html", html }} />
  </ArtBoard.Section>
</ArtBoard>`,
        },
    ],
    props: [
        { name: "id", type: `string`, default: "—", required: true, description: "Stable handle (`data-fa-section`). Falls back to `title`." },
        { name: "title", type: `string`, default: "—", required: true, description: "Inline-editable section title." },
        { name: "subtitle", type: `string`, default: "—", description: "Optional secondary line under the title." },
        { name: "children", type: `ReactNode`, default: "—", description: "`<ArtPiece>` markers. Ignored when `value` drives the board." },
    ],
};
