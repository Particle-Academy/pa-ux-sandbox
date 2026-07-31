import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";
import { resolveTarget } from "./provider";

/** Read one pull request in full — body, mergeability, timestamps. */
export const gitPrGetExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const { provider, ref } = resolveTarget(config);

  // Accept the number from the node's input as well as its config, so this
  // drops straight after git_pr_list or git_pr_open without a transform.
  const incoming = (ctx.inputs as any)?.in;
  const raw = config.number ?? incoming?.number ?? incoming?.review?.number;
  const number = Number(raw);

  if (!Number.isInteger(number) || number <= 0) {
    throw new Error("git_pr_get: needs a pull request `number`, on the node or from its input.");
  }

  const review = await provider.getReview(ref, number);

  return { review, number: review.number, url: review.webUrl, state: review.state };
};
