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

/** Read one issue — body, state, labels, assignees. */
export const gitIssueGetExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const target = resolveTarget(config);
  const provider = requireIssues(target.provider);
  const ref = target.ref;

  const number = Number(config.number ?? (ctx.inputs as any)?.in?.number ?? 0);
  if (!number) {
    throw new Error('git_issue_get: needs an issue "number" — on the node, or from the input.');
  }

  const issue = await provider.getIssue(ref, number);

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: "#" + issue.number + " is " + issue.state,
  });

  // Routed rather than returned as a field: "is it still open" is the question
  // almost every workflow asks next, and a downstream string compare is one
  // somebody forgets to write.
  return { __port: issue.state === "closed" ? "closed" : "open", value: issue };
};
