/**
 * Deriving an idempotency key — and being honest when we cannot.
 *
 * ## The gap this works around
 *
 * A durable run RETRIES. For a writing connector that is only survivable if the
 * retry carries the same idempotency key the first attempt did, so the provider
 * returns the original result instead of creating a second charge, a second
 * refund, a second message.
 *
 * **Neither engine's execution context carries a run identity today.** The TS
 * `ctx` is `{ node, inputs, emit, abort }`; `FancyFlow\Runtime\ExecutionContext`
 * is the same four plus `depth`. There is no run key, no attempt number, nothing
 * a node can key on — checked against fancy-flow 0.45.0 and fancy-flow-php
 * 0.17.0 rather than assumed.
 *
 * So this reads the conventional places a host might put one, and returns
 * `null` when there is none.
 *
 * ## Why the two obvious fallbacks are both wrong
 *
 * - **The node id alone** is stable across retries — and also across different
 *   runs. Two legitimate payments for the same customer would share a key, and
 *   the second would be silently deduplicated into the first. A payment that
 *   never happened, reported as success.
 * - **A fresh random value** is unique per run — and also per attempt. A retry
 *   would create a second charge, which is the whole thing we are avoiding.
 *
 * Both are worse than no key. So with no run identity a connector sends none
 * and stays `unsafe-to-replay`, which pins it to a single attempt under the
 * per-node queue driver. Fewer retries, no double writes.
 */

/** Where a host may publish the run key. Checked in order. */
export function runKeyFrom(ctx: unknown): string | null {
  const bag = ctx as Record<string, any> | null;
  if (!bag) return null;

  const candidates = [
    bag.runKey,
    bag.run?.key,
    bag.runId,
    // A host with no engine support can seed it as an initial input, which the
    // engine merges into every node's inputs.
    bag.inputs?.__runKey,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim() !== "") return candidate.trim();
  }

  return null;
}

/**
 * The idempotency key for one node in one run, or `null`.
 *
 * `null` is a legitimate answer and callers must treat it as one — passing it
 * through means "send no idempotency header", not "make something up".
 */
export function idempotencyKeyFor(ctx: unknown, nodeId: string): string | null {
  const run = runKeyFrom(ctx);

  return run === null ? null : `${run}:${nodeId}`;
}

/**
 * The warning a node emits when it is about to write without a key.
 *
 * Said out loud, at the moment it matters, because the failure it precedes is
 * invisible: the run succeeds, the retry succeeds, and there are two charges.
 */
export const NO_IDEMPOTENCY_KEY_WARNING =
  "no run identity available, so this write is being sent WITHOUT an idempotency key. " +
  "A retry would repeat the effect rather than recover from it — the node is marked " +
  "unsafe-to-replay, so a durable runner will give it one attempt. To enable safe retries, " +
  "seed a stable `__runKey` into the run's initial inputs.";
