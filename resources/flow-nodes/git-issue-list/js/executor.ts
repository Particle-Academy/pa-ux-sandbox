import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";
import { requireIssues, resolveTarget } from "./provider";

/** Split a comma-separated config field into a clean list. */
function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  if (value === undefined || value === null || value === "") return [];

  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** List a repository's issues, branching on whether any matched. */
export const gitIssueListExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const target = resolveTarget(config);
  const provider = requireIssues(target.provider);
  const ref = target.ref;

  const state = String(config.state ?? "open");
  const limit = Number(config.limit ?? 20) || 20;

  const page = await provider.listIssues(ref, {
    state,
    limit,
    ...(list(config.labels).length ? { labels: list(config.labels) } : {}),
    ...(config.assignee ? { assignee: String(config.assignee) } : {}),
  });
  const issues = page.items ?? [];

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: issues.length + " " + state + " issue(s) in " + ref.owner + "/" + ref.name,
  });

  return {
    __port: issues.length > 0 ? "found" : "none",
    value: { issues, count: issues.length, nextCursor: page.nextCursor ?? null },
  };
};
