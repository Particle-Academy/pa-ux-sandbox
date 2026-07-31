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

/** File an issue on GitHub, GitLab or Bitbucket. */
export const gitIssueOpenExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const target = resolveTarget(config);
  const provider = requireIssues(target.provider);
  const ref = target.ref;

  const title = String(config.title ?? "").trim();
  if (!title) {
    throw new Error('git_issue_open: needs a "title". Refusing to file an untitled issue.');
  }

  const issue = await provider.createIssue(ref, {
    title,
    ...(config.body ? { body: String(config.body) } : {}),
    ...(list(config.labels).length ? { labels: list(config.labels) } : {}),
    ...(list(config.assignees).length ? { assignees: list(config.assignees) } : {}),
  });

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: "opened #" + issue.number + " in " + ref.owner + "/" + ref.name,
  });

  return { __port: "out", value: issue };
};
