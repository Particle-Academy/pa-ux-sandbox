import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";
import { resolveTarget } from "./provider";

/**
 * CI state for a revision — the gate a "merge when green" workflow routes on.
 *
 * Four ports, because collapsing them loses the distinction that matters most:
 * `pending` is NOT `failing`. A workflow that treats "still running" as "broken"
 * either abandons good work or, worse, treats an unfinished run as a pass.
 */
export const gitPrChecksExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const { provider, ref } = resolveTarget(config);

  const incoming = (ctx.inputs as any)?.in;
  const revision = String(
    config.revision ?? incoming?.revision ?? incoming?.review?.sourceBranch ?? "",
  ).trim();

  if (!revision) {
    throw new Error("git_pr_checks: needs a `revision` — a SHA or branch, on the node or from its input.");
  }

  const checks = (await provider.checks(ref, revision)) ?? [];

  // No checks at all is its own answer. Reporting it as "passing" is how a
  // repository with CI misconfigured gets auto-merged.
  const failing = checks.filter((c: any) => c.state === "failed" || c.state === "failure" || c.state === "error");
  const pending = checks.filter((c: any) => c.state === "pending" || c.state === "running" || c.state === "queued");

  const port = checks.length === 0 ? "none" : failing.length > 0 ? "failing" : pending.length > 0 ? "pending" : "passing";

  ctx.emit({
    type: "log",
    level: failing.length > 0 ? "warn" : "info",
    nodeId: ctx.node.id,
    message: `${revision}: ${checks.length} check(s) — ${port}`,
  });

  return { __port: port, value: { checks, revision, failing: failing.length, pending: pending.length } };
};
