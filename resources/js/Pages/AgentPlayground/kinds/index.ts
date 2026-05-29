/**
 * Kind registry for the Agent Playground. The page + server iterate this map
 * to (a) register every kind's bridge against the shared server and (b) mount
 * the right Surface for each screen.
 */
import type { KindModule } from "./types";
import { compositionKind } from "./composition";
import { artboardKind } from "./artboard";
import { whiteboardKind } from "./whiteboard";
import { chartKind } from "./chart";
import { formKind } from "./form";
import { sheetKind } from "./sheet";
import { flowKind } from "./flow";
import { slidesKind } from "./slides";
import { codeKind } from "./code";
import { sceneKind } from "./scene";

export const KIND_MODULES: KindModule[] = [
  compositionKind,
  artboardKind,
  whiteboardKind,
  chartKind,
  formKind,
  sheetKind,
  flowKind,
  slidesKind,
  codeKind,
  sceneKind,
];

export const KIND_BY_NAME: Record<string, KindModule> = Object.fromEntries(
  KIND_MODULES.map((k) => [k.kind, k]),
);

export type { KindModule, SurfaceProps, KindBridgeContext, Agent } from "./types";
