import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";
import { resolveTarget } from "./provider";

/**
 * Hosted repository metadata — default branch, visibility, URLs.
 *
 * The `git_pr_*` nodes all take a target branch, and hardcoding "main" in a
 * graph is how a workflow silently targets the wrong branch on a repo that uses
 * `master`, `develop` or `trunk`. This is the node that answers that, so a graph
 * can read the default branch instead of assuming it.
 */
export const gitRepoExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const { provider, ref } = resolveTarget(config);

  const repository = (await provider.repository(ref)) as Record<string, unknown>;

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: `${ref.owner}/${ref.name} — default branch ${String(repository.defaultBranch ?? "(unknown)")}`,
  });

  return { __port: "out", value: repository };
};
