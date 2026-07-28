import { useState } from "react";
import { MarkdownEditor } from "@particle-academy/fancy-code";
import { SheetWorkbook } from "@particle-academy/fancy-sheets";
import { FlowEditor } from "@particle-academy/fancy-flow";
import { createEmptyWorkbook } from "@particle-academy/fancy-sheets";
import "@particle-academy/fancy-flow/styles.css";
import "@particle-academy/fancy-sheets/styles.css";

/**
 * Listing tiles whose components need a browser.
 *
 * Every module imported here reaches for `window`, a canvas or a measured DOM
 * node at import time — xterm, CodeMirror, React Flow. The packages page is
 * server-rendered through Inertia's synchronous `renderToString`, so importing
 * any of them into `ComponentPreviews` would crash the SSR render of the whole
 * page, not just one tile.
 *
 * **That is the real reason these tiles were hand-drawn.** The explanation the
 * file carried — that a controlled component "has no repository to read" — was
 * never true; the constraint was SSR, and a drawing was the wrong answer to it.
 * `clientOnly` is the right one: it defers the *import*, so this whole module
 * lands in a browser-only chunk and the drawings survive as SSR fallbacks.
 *
 * One module, one chunk. Twelve separate dynamic imports would mean twelve
 * round trips to paint one grid.
 *
 * Every tile here is READ-ONLY and small. A listing is a preview, not a
 * workspace — the full demos one click away are where the handlers are wired.
 *
 * ## `<Terminal>` is deliberately NOT here
 *
 * xterm does not render correctly at tile size. Given a 128px box it leaks its
 * character-measurement row into view as a run of `5555…`, and hiding that
 * leaves every glyph letter-spaced (`f a n c y  v 0 . 4`) because the cell
 * width was measured against a container that had no size yet. Both were
 * reproduced here. The same thing defeated the fancy-tui tiles earlier, which
 * is why those render captured ANSI frames instead of mounting a terminal.
 *
 * So fancy-term keeps its drawing — the one tile where the drawing is the
 * better answer, on evidence rather than by default.
 */

export function MarkdownEditorTile() {
  // Controlled, so it needs state even though the tile is not for editing.
  const [md] = useState("# Release notes\n\n- Real components, not drawings\n- **Labelled** controls\n");

  return (
    <div className="h-32 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 text-[10px] dark:border-zinc-800">
      <MarkdownEditor value={md} onValueChange={() => {}} mode="split" minHeight={120} />
    </div>
  );
}

export function SheetWorkbookTile() {
  const [workbook] = useState(() => {
    const wb = createEmptyWorkbook();
    const sheet = wb.sheets[0];
    sheet.cells.A1 = { value: "Region", format: { bold: true } };
    sheet.cells.B1 = { value: "Q1", format: { bold: true } };
    sheet.cells.A2 = { value: "North" };
    sheet.cells.B2 = { value: 4260 };
    sheet.cells.A3 = { value: "South" };
    sheet.cells.B3 = { value: 3400 };
    return wb;
  });

  return (
    <div className="h-32 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 text-[10px] dark:border-zinc-800">
      <SheetWorkbook defaultData={workbook} hideToolbar />
    </div>
  );
}

/** A small, valid graph — the editor validates wiring, so a fake one would warn. */
const TILE_GRAPH = {
  nodes: [
    { id: "t", type: "@particle-academy/manual_trigger", position: { x: 0, y: 40 }, data: { kind: "@particle-academy/manual_trigger", label: "Manual" } },
    { id: "a", type: "@particle-academy/http_request", position: { x: 170, y: 40 }, data: { kind: "@particle-academy/http_request", label: "Fetch" } },
  ],
  edges: [{ id: "t-a", source: "t", target: "a" }],
};

export function FlowEditorTile() {
  return (
    <div className="h-32 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
      <FlowEditor initial={TILE_GRAPH as never} showFeed={false} showPalette={false} height={128} />
    </div>
  );
}
