import type { NodeExecutor } from "@particle-academy/fancy-flow/engine";
import { resolveWorkingCopy } from "./repo";

/**
 * Switch the working copy to a branch or revision.
 *
 * Mutating, so it honours `propose`: fancy-git returns an OperationProposal
 * instead of performing the checkout, and the node routes it to `proposed` for
 * a human to approve. Agents propose, humans confirm — a workflow that moves
 * someone's working copy under them is exactly the case that wants a pause.
 */
export const gitCheckoutExecutor: NodeExecutor = async (ctx) => {
  const config = ((ctx.node.data as any)?.config ?? {}) as Record<string, unknown>;
  const repo = resolveWorkingCopy(config);

  const target = String(config.target ?? "").trim();
  if (!target) {
    throw new Error("git_checkout: needs a `target` branch or revision. Refusing to guess.");
  }

  const propose = config.propose === true;
  const result = await repo.checkout(target, { propose });

  // A proposal is the RESULT, not a failure: the node did its job, and the
  // decision belongs to whoever reviews it.
  if (propose) {
    ctx.emit({
      type: "log",
      level: "info",
      nodeId: ctx.node.id,
      message: `proposed checkout of ${target} (not performed)`,
    });
    return { __port: "proposed", value: { target, proposal: result ?? null } };
  }

  ctx.emit({ type: "log", level: "info", nodeId: ctx.node.id, message: `checked out ${target}` });

  return { __port: "done", value: { target } };
};
