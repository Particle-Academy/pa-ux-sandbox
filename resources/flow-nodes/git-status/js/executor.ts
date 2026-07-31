import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";
import { resolveWorkingCopy } from "./repo";

/**
 * Working-tree status, routed on whether there is anything to commit.
 *
 * Two ports rather than one flag: "is the tree clean" is the question every
 * automation asks before it does anything else, and a downstream test on
 * `files.length` is one somebody forgets to write. A workflow that commits
 * without checking creates empty commits; one that pushes without checking
 * pushes nothing and reports success.
 */
export const gitStatusExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const repo = resolveWorkingCopy(config);

  const status = (await repo.status()) as {
    branch: string | null;
    upstream: string | null;
    ahead: number;
    behind: number;
    files: unknown[];
    clean: boolean;
  };

  const files = status.files ?? [];
  // `clean` comes from fancy-git, but a status with no files IS clean whatever
  // the flag says — trust the observable over the summary.
  const clean = status.clean ?? files.length === 0;

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: clean
      ? `working tree clean on ${status.branch ?? "(detached)"}`
      : `${files.length} change(s) on ${status.branch ?? "(detached)"}`,
  });

  return {
    __port: clean ? "clean" : "dirty",
    value: {
      branch: status.branch ?? null,
      upstream: status.upstream ?? null,
      ahead: status.ahead ?? 0,
      behind: status.behind ?? 0,
      files,
      count: files.length,
      clean,
    },
  };
};
