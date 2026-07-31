import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";
import { resolveTarget } from "./provider";

/**
 * Compare two refs — how far ahead or behind, and the commits between.
 *
 * Routes on whether there is anything to merge. "0 commits ahead" is the answer
 * that most often should stop a workflow, and a node that returns it on the
 * same port as a real diff makes that a downstream `if` someone has to remember.
 */
export const gitPrCompareExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const { provider, ref } = resolveTarget(config);

  const base = String(config.base ?? "main").trim();
  const head = String(config.head ?? "").trim();

  if (!head) throw new Error("git_pr_compare: needs a `head` ref to compare against `base`.");
  if (base === head) throw new Error(`git_pr_compare: base and head are both "${base}".`);

  const comparison = await provider.compare(ref, base, head);
  const aheadBy = Number(comparison.aheadBy ?? 0);

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: `${head} is ${aheadBy} ahead / ${comparison.behindBy ?? 0} behind ${base}`,
  });

  return {
    __port: aheadBy > 0 ? "ahead" : "same",
    value: { comparison, base, head, aheadBy, behindBy: Number(comparison.behindBy ?? 0) },
  };
};
