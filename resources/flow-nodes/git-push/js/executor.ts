import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";
import { resolveWorkingCopy } from "./repo";

/**
 * Push to a remote.
 *
 * `unsafe-to-replay` in the manifest and `propose`-aware here. A durable run
 * retries, and a retried push is usually harmless but occasionally is not —
 * a force-push, or a push that races a colleague — so the manifest tells the
 * truth and lets the host scope the retry policy.
 */
export const gitPushExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const repo = resolveWorkingCopy(config);

  const remote = String(config.remote ?? "origin") || "origin";
  const branch = config.branch === undefined || config.branch === null || config.branch === ""
    ? undefined
    : String(config.branch);
  const propose = config.propose === true;

  const result = await repo.push(remote, branch, { propose });

  if (propose) {
    ctx.emit({
      type: "log",
      level: "info",
      nodeId: ctx.node.id,
      message: `proposed push to ${remote}${branch ? `/${branch}` : ""} (not performed)`,
    });
    return { __port: "proposed", value: { remote, branch: branch ?? null, proposal: result ?? null } };
  }

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: `pushed to ${remote}${branch ? `/${branch}` : ""}`,
  });

  return { __port: "done", value: { remote, branch: branch ?? null } };
};
