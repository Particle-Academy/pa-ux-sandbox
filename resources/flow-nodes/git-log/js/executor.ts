import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";
import { resolveWorkingCopy } from "./repo";

/**
 * Commits, routed on whether any matched.
 *
 * `none` is a real answer, not an error: "has anything landed on this branch
 * since the tag" is a routing question, and an empty array on a single port is
 * a check somebody forgets downstream.
 */
export const gitLogExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const repo = resolveWorkingCopy(config);

  const limit = Number(config.limit ?? 20) || 20;
  const ref = config.ref === undefined || config.ref === null || config.ref === "" ? undefined : String(config.ref);
  const skip = Number(config.skip ?? 0) || 0;

  const commits = (await repo.log({ ref, limit, skip })) ?? [];

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: `${commits.length} commit(s)${ref ? ` on ${ref}` : ""}`,
  });

  return {
    __port: commits.length > 0 ? "found" : "none",
    value: { commits, count: commits.length, ref: ref ?? null },
  };
};
