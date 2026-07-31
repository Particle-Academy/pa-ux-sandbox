import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";
import { resolveWorkingCopy } from "./repo";

/**
 * A diff, routed on whether it is empty.
 *
 * An empty diff is the common case in an automation that runs on a schedule,
 * and it is the one that must NOT continue into a commit or a pull request —
 * so it gets its own port rather than an empty string on the same one.
 */
export const gitDiffExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const repo = resolveWorkingCopy(config);

  const text = (v: unknown) => (v === undefined || v === null || v === "" ? undefined : String(v));
  const paths = Array.isArray(config.paths) ? config.paths.map(String) : undefined;

  const diff = (await repo.diff({
    from: text(config.from),
    to: text(config.to),
    staged: config.staged === true,
    paths,
  })) as { files?: unknown[]; patch?: string } | unknown[];

  // fancy-git returns a Diff object on one runtime and an array of file changes
  // on the other; normalize so a graph does not have to know which is running.
  const files = Array.isArray(diff) ? diff : (diff?.files ?? []);
  const patch = Array.isArray(diff) ? undefined : diff?.patch;

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: `${files.length} file(s) changed`,
  });

  return {
    __port: files.length > 0 ? "changed" : "empty",
    value: { files, count: files.length, patch: patch ?? null },
  };
};
