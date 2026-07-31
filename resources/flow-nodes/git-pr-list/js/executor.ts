import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";
import { resolveTarget } from "./provider";

/**
 * List pull requests.
 *
 * Emits on `found` or `none` rather than returning an empty array on one port.
 * "No open PRs" is a routing decision in almost every workflow that asks — and
 * a branch that has to test `length === 0` downstream is a branch someone
 * forgets to write.
 */
export const gitPrListExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const { provider, ref } = resolveTarget(config);

  const state = String(config.state ?? "open");
  const limit = Number(config.limit ?? 20) || 20;

  const page = await provider.listReviews(ref, { state: state === "any" ? undefined : state, limit });
  const reviews = page.items ?? [];

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: `${reviews.length} ${state} pull request(s) in ${ref.owner}/${ref.name}`,
  });

  return {
    __port: reviews.length > 0 ? "found" : "none",
    value: { reviews, count: reviews.length, nextCursor: page.nextCursor ?? null },
  };
};
