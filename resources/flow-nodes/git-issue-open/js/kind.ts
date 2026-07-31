import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";
import { gitIssueOpenKind } from "../ui/kind";
import { gitIssueOpenExecutor } from "./executor";

/**
 * The kind with its TypeScript executor attached — for hosts that EXECUTE on TS.
 *
 * The surface in ui/kind.ts carries no executor: the editor is React on every
 * host, so a PHP project vendors ui/ and never js/.
 */
export const gitIssueOpenRunnableKind: NodeKindDefinition = {
  ...gitIssueOpenKind,
  executor: gitIssueOpenExecutor,
};
