import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";
import { gitStatusKind } from "../ui/kind";
import { gitStatusExecutor } from "./executor";

/**
 * The kind with its TypeScript executor attached — for hosts that EXECUTE on TS.
 *
 * The surface in `ui/kind.ts` deliberately carries no executor: the editor is
 * React on every host, so a PHP project vendors `ui/` and never `js/`. When the
 * two were one file the import dangled on exactly those hosts and the editor
 * build failed — a break that only appeared off the runtime that authored it.
 */
export const gitStatusRunnableKind: NodeKindDefinition = {
  ...gitStatusKind,
  executor: gitStatusExecutor,
};
