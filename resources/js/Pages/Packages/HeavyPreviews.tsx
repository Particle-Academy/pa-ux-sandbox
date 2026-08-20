import { useState } from "react";
import { MarkdownEditor } from "@particle-academy/fancy-code";
import { SheetWorkbook } from "@particle-academy/fancy-sheets";
import { FlowViewer } from "@particle-academy/fancy-flow";
import { FlowEditor } from "../../components/FlowEditor";
import { Canvas } from "@particle-academy/fancy-3d";
import { Stage as BabylonStage, Monitor as BabylonMonitor } from "@particle-academy/fancy-3d-babylon/react";
import { Stage as ThreeStage, Monitor as ThreeMonitor } from "@particle-academy/fancy-3d-three/react";
import { createEmptyWorkbook } from "@particle-academy/fancy-sheets";
import { PasskeyManager, PasskeySignIn } from "@particle-academy/fancy-passkeys-ui";
import "@particle-academy/fancy-passkeys-ui/styles.css";
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
    { id: "a", type: "@particle-academy/api_request", position: { x: 170, y: 40 }, data: { kind: "@particle-academy/api_request", label: "Fetch" } },
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

/**
 * WebGL and canvas tiles.
 *
 * Babylon and three each build a WebGL context at module scope, and ECharts
 * measures a canvas — none of which survives `renderToString`. Deferred for the
 * same reason as the editors above, and grouped here so the whole grid still
 * costs one chunk.
 */
export function BabylonStageTile() {
  return (
    <div className="h-32 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-800">
      <BabylonStage cameraRadius={6.5} cameraTarget={[0, 1.2, 0]} clearColor="#0b1220" style={{ height: "100%" }}>
        <BabylonMonitor position={[0, 1.2, 0]} width={3.4} height={2.1} bezel="#0b0f17">
          <div className="grid h-full place-items-center bg-violet-600 text-sm text-white">Live DOM</div>
        </BabylonMonitor>
      </BabylonStage>
    </div>
  );
}

export function ThreeStageTile() {
  return (
    <div className="h-32 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-800">
      <ThreeStage cameraRadius={6.5} cameraTarget={[0, 1.2, 0]} clearColor="#0b1220" style={{ height: "100%" }}>
        <ThreeMonitor position={[0, 1.2, 0]} width={3.4} height={2.1} bezel="#0b0f17">
          <div className="grid h-full place-items-center bg-emerald-600 text-sm text-white">Live DOM</div>
        </ThreeMonitor>
      </ThreeStage>
    </div>
  );
}

/** The DOM/CSS-3D renderer — no WebGL, but it still measures on mount. */
export function Canvas3DTile() {
  return (
    <div className="h-32 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
      <Canvas engine="dom" style={{ height: 128 }}>
        {/* CanvasProps requires children — the scene it renders. */}
        <div className="grid h-full place-items-center text-[11px] text-zinc-500">DOM / CSS-3D scene</div>
      </Canvas>
    </div>
  );
}

/**
 * A read-only run view of the same graph the editor tile shows. `FlowViewer`
 * is React Flow underneath, so it needs a browser exactly like `FlowEditor`.
 */
export function FlowViewerTile() {
    return (
        <div className="h-36 w-full max-w-[20rem] overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            {/* Reuses TILE_GRAPH — the editor validates wiring, so one valid
                graph serves both tiles and cannot drift from the other. The
                `list` variant reads far better at tile size than a canvas
                shrunk to 128px. */}
            <FlowViewer graph={TILE_GRAPH as never} variant="list" height={144} />
        </div>
    );
}

/**
 * The passkey surfaces are controlled, but the package reaches for the WebAuthn
 * client on import — `navigator.credentials` does not exist during Inertia's
 * synchronous SSR render, so importing them into ComponentPreviews would crash
 * the whole page rather than one tile.
 *
 * Both tiles are READ-ONLY: no handler here starts a ceremony, which also
 * matches the bridge's own rule that a gesture plus biometric is something only
 * the human can supply.
 */
export function PasskeyManagerTile() {
    return (
        <div className="h-36 w-full max-w-[20rem] overflow-hidden text-left text-[11px]">
            <PasskeyManager
                value={{
                    passkeys: [
                        {
                            id: "pk_1", name: "MacBook Touch ID", createdAt: "2026-07-01T10:00:00Z",
                            lastUsedAt: "2026-08-10T08:00:00Z", transports: ["internal"],
                            backedUp: true, aaguid: "adce0002-35bc-c60a-648b-0b25f1f05503", clonedAt: null,
                        },
                    ],
                    pendingRevoke: null, renamingId: null, draftName: "",
                    status: "idle", error: null,
                }}
                onChange={() => {}}
            />
        </div>
    );
}

export function PasskeySignInTile() {
    return (
        <div className="w-full max-w-[18rem] text-left text-[11px]">
            <PasskeySignIn
                value={{ status: "idle", email: "ada@example.com", error: null }}
                onChange={() => {}}
                onAuthenticate={async () => {}}
            />
        </div>
    );
}
