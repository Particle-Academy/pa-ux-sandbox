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

/** Post a comment on an issue. */
export const gitIssueCommentExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const target = resolveTarget(config);
  const provider = requireIssues(target.provider);
  const ref = target.ref;

  const number = Number(config.number ?? (ctx.inputs as any)?.in?.number ?? 0);
  if (!number) {
    throw new Error('git_issue_comment: needs an issue "number" — on the node, or from the input.');
  }

  const body = String(config.body ?? "").trim();
  if (!body) {
    throw new Error('git_issue_comment: needs a "body". Refusing to post an empty comment.');
  }

  const comment = await provider.commentOnIssue(ref, number, body);

  ctx.emit({
    type: "log",
    level: "info",
    nodeId: ctx.node.id,
    message: "commented on #" + number,
  });

  return { __port: "out", value: { number, ...comment } };
};
