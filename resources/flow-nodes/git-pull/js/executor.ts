import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";
import { resolveWorkingCopy } from "./repo";

/**
 * Pull from a remote.
 *
 * Mutating and `propose`-aware for the same reason as push: a pull can conflict,
 * and a workflow that discovers that on a queue worker at 3am should have been
 * able to stage it for a human first.
 */
export const gitPullExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const repo = resolveWorkingCopy(config);

  const remote = config.remote === undefined || config.remote === null || config.remote === ""
    ? undefined
    : String(config.remote);
  const branch = config.branch === undefined || config.branch === null || config.branch === ""
    ? undefined
    : String(config.branch);
  const propose = config.propose === true;

  const result = await repo.pull(remote, branch, { propose });

  if (propose) {
    ctx.emit({
      type: "log",
      level: "info",
      nodeId: ctx.node.id,
      message: `proposed pull from ${remote ?? "origin"}${branch ? `/${branch}` : ""} (not performed)`,
    });
    return { __port: "proposed", value: { remote: remote ?? null, branch: branch ?? null, proposal: result ?? null } };
  }

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: `pulled from ${remote ?? "origin"}${branch ? `/${branch}` : ""}`,
  });

  return { __port: "done", value: { remote: remote ?? null, branch: branch ?? null } };
};
