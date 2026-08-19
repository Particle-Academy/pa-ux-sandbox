import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";
import { stripeWebhookTriggerKind } from "../ui/kind";
import { stripeWebhookTriggerExecutor } from "./executor";

/** The kind with its TypeScript executor attached — for hosts that EXECUTE on TS. */
export const stripeWebhookTriggerRunnableKind: NodeKindDefinition = {
  ...stripeWebhookTriggerKind,
  executor: stripeWebhookTriggerExecutor,
};
