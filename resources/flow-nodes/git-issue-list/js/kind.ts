import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";
import { gitIssueListKind } from "../ui/kind";
import { gitIssueListExecutor } from "./executor";

/**
 * The kind with its TypeScript executor attached — for hosts that EXECUTE on TS.
 *
 * The surface in ui/kind.ts carries no executor: the editor is React on every
 * host, so a PHP project vendors ui/ and never js/.
 */
export const gitIssueListRunnableKind: NodeKindDefinition = {
  ...gitIssueListKind,
  executor: gitIssueListExecutor,
};
