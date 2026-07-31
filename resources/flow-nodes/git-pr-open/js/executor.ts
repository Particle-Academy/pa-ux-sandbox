import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";
import { resolveTarget } from "./provider";

/**
 * Open a pull request.
 *
 * The one node here with a side effect that cannot be taken back by re-running
 * it, which is why the manifest says `unsafe-to-replay`: a durable run that
 * retries after a network blip would otherwise open a second PR for the same
 * branch, and nothing downstream would notice.
 */
export const gitPrOpenExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const { provider, ref } = resolveTarget(config);

  const title = String(config.title ?? "").trim();
  const sourceBranch = String(config.sourceBranch ?? "").trim();
  const targetBranch = String(config.targetBranch ?? "main").trim();

  if (!title) throw new Error("git_pr_open: needs a `title`.");
  if (!sourceBranch) throw new Error("git_pr_open: needs a `sourceBranch` — the branch to merge FROM.");
  if (sourceBranch === targetBranch) {
    // The provider would reject this too, but with its own wording, and only
    // after a round trip that spends a token and a rate-limit unit.
    throw new Error(`git_pr_open: sourceBranch and targetBranch are both "${sourceBranch}".`);
  }

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: `Opening ${ref.owner}/${ref.name}: ${sourceBranch} → ${targetBranch}`,
  });

  const review = await provider.createReview(ref, {
    title,
    body: config.body === undefined ? undefined : String(config.body),
    sourceBranch,
    targetBranch,
    draft: Boolean(config.draft),
  });

  return { review, number: review.number, url: review.webUrl };
};
