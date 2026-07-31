import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";
import { resolveWorkingCopy } from "./repo";

/**
 * Branches, with the current one lifted out.
 *
 * `current` is separated because almost every workflow that lists branches then
 * asks "which one am I on" — and finding it means scanning for `current: true`,
 * which is a loop each consumer would otherwise rewrite.
 */
export const gitBranchesExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const repo = resolveWorkingCopy(config);

  const all = ((await repo.branches()) ?? []) as { name: string; current?: boolean; remote?: boolean }[];
  const includeRemote = config.includeRemote === true;
  const branches = includeRemote ? all : all.filter((b) => !b.remote);
  const current = all.find((b) => b.current)?.name ?? null;

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: `${branches.length} branch(es), on ${current ?? "(detached)"}`,
  });

  return {
    __port: "out",
    value: { branches, count: branches.length, current, names: branches.map((b) => b.name) },
  };
};
