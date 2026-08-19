import type { NodeKindDefinition } from "@particle-academy/fancy-flow/engine";
import { resendEmailSendKind } from "../ui/kind";
import { resendEmailSendExecutor } from "./executor";

/** The kind with its TypeScript executor attached — for hosts that EXECUTE on TS. */
export const resendEmailSendRunnableKind: NodeKindDefinition = {
  ...resendEmailSendKind,
  executor: resendEmailSendExecutor,
};
