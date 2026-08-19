import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";
import { telegramUpdatesTriggerKind } from "../ui/kind";
import { telegramUpdatesTriggerExecutor } from "./executor";

/** The kind with its TypeScript executor attached — for hosts that EXECUTE on TS. */
export const telegramUpdatesTriggerRunnableKind: NodeKindDefinition = {
  ...telegramUpdatesTriggerKind,
  executor: telegramUpdatesTriggerExecutor,
};
