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

/** Change an issue's title, body, state or labels. */
export const gitIssueUpdateExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const target = resolveTarget(config);
  const provider = requireIssues(target.provider);
  const ref = target.ref;

  const number = Number(config.number ?? (ctx.inputs as any)?.in?.number ?? 0);
  if (!number) {
    throw new Error('git_issue_update: needs an issue "number" — on the node, or from the input.');
  }

  // Only fields actually set are sent. An update that echoed everything back
  // would clobber whatever someone changed between the read and the write, and
  // on an issue tracker that someone is usually a person mid-conversation.
  const input: Record<string, unknown> = {};
  if (config.title) input.title = String(config.title);
  if (config.body) input.body = String(config.body);
  if (config.state) input.state = String(config.state);
  if (config.labels) input.labels = list(config.labels);

  if (Object.keys(input).length === 0) {
    throw new Error("git_issue_update: nothing to change. Set at least one field, or remove the node.");
  }

  const issue = await provider.updateIssue(ref, number, input);

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: "updated #" + issue.number + " (" + Object.keys(input).join(", ") + ")",
  });

  return { __port: "out", value: issue };
};
