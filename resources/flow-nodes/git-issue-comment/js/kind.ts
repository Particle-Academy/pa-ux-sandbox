import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";
import { gitIssueCommentKind } from "../ui/kind";
import { gitIssueCommentExecutor } from "./executor";

/**
 * The kind with its TypeScript executor attached — for hosts that EXECUTE on TS.
 *
 * The surface in ui/kind.ts carries no executor: the editor is React on every
 * host, so a PHP project vendors ui/ and never js/.
 */
export const gitIssueCommentRunnableKind: NodeKindDefinition = {
  ...gitIssueCommentKind,
  executor: gitIssueCommentExecutor,
};
