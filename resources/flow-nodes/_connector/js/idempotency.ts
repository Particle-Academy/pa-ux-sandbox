// GENERATED from @particle-academy/fancy-connectors — src/idempotency.ts
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.

import { ConnectorConfigError, type ConnectorErrorContext } from "./errors";

/**
 * A run, a position inside it, and how many times that position has been tried.
 *
 * Declared STRUCTURALLY rather than imported, and that is the whole point: this
 * package must be usable by a host that has never heard of a workflow engine.
 * `fancy-flow`'s `RunIdentity` class satisfies this shape exactly, so a flow
 * node passes `ctx.run` straight in with no adapter and no dependency in either
 * direction — and a host with its own notion of "the same logical attempt"
 * implements five members and gets the same guarantees.
 *
 * The identity is more than `(run, step)` for a reason: a step legitimately runs
 * many times in one run — once per loop iteration, once per nested invocation —
 * so the key carries the PATH that led to it. `attempt` is carried and
 * deliberately NOT part of the key, because a retry must produce the same key.
 */
export type RunIdentity = {
  /** Stable for the whole run: same across retries, resumes, workers and hosts. */
  readonly runKey: string;
  /** 1-based attempt of THIS logical step. Never part of the key. */
  readonly attempt: number;
  /** ISO-8601 instant of attempt 1 of this step. */
  readonly firstAttemptAt: string;
  /** The identity of one execution of one step, stable across its retries. */
  stepKey(stepId: string, occurrence?: number | null): string;
  /** May this attempt reuse the key and still be deduplicated? */
  isReplaySafe(windowSeconds: number | null | undefined, now?: Date | string): boolean;
};

/**
 * The idempotency key a writing connector sends, and when it must refuse to.
 *
 * ## What the engine now provides
 *
 * `fancy-flow` 0.46.0 carries a **run identity** on the execution context, so a
 * node can derive a key that is the same on every retry of one logical step and
 * different for every other execution of the same node.
 * `ctx.run.stepKey(ctx.node.id)` is that key. The equivalent landed in
 * `fancy-flow-php` 0.19.0 and the Python runtime, all three pinned by
 * `shared/flow-run-identity` in `@particle-academy/fancy-conformance`.
 *
 * Before that, neither engine could produce one, and both obvious substitutes
 * were worse than sending nothing:
 *
 * - **the node id alone** is stable across retries and also across RUNS, so two
 *   legitimate payments share a key and the provider silently collapses the
 *   second into the first — a payment that never happened, reported as success;
 * - **a fresh random value** is unique per run and also per ATTEMPT, so a retry
 *   creates a second charge.
 *
 * So this used to return `null` and every writing node emitted a warning and
 * sent no key, staying pinned to one attempt. That is no longer the case where
 * a host supplies an identity — which durable runs do automatically.
 *
 * ## The part that is still a judgement call: the provider's window
 *
 * Providers forget idempotency keys. Stripe's window is **24 hours**. Past it,
 * resending the key creates a second charge and sending a fresh one creates a
 * second charge — there is no safe third option — so `idempotencyKeyFor`
 * **throws** rather than choosing. A loud stuck run that a person reconciles
 * beats a silent double write nobody ever sees.
 *
 * A first attempt is never refused, however long the run was parked: nothing
 * was sent on an earlier attempt, so there is nothing for the provider to have
 * forgotten. That is what lets an approval sit for a week and then charge.
 */

/** Stripe's window, and the default for a provider that has not said otherwise. */
export const DEFAULT_IDEMPOTENCY_WINDOW_SECONDS = 24 * 60 * 60;

/**
 * Longest key the strictest provider in the catalogue accepts.
 *
 * Stripe caps `Idempotency-Key` at 255 characters. A deep subflow path could
 * exceed that, and a provider rejecting the header is a 400 that looks like a
 * bug in the request body.
 */
export const MAX_IDEMPOTENCY_KEY_LENGTH = 255;

/** Raised when a retry can no longer be made safe. Never retryable. */
export class ConnectorIdempotencyExpiredError extends ConnectorConfigError {}

/** The run identity a host published, or `null`. Checked in order. */
export function runIdentityFrom(ctx: unknown): RunIdentity | null {
  const bag = ctx as { run?: RunIdentity } | null;

  return bag?.run ?? null;
}

/**
 * Where a host with no engine support may still publish a run key.
 *
 * Kept because a consumer on an older `fancy-flow` has no `ctx.run`, and
 * seeding `__runKey` into the run's initial inputs is the documented fallback.
 * It gives a per-run key with no attempt information, so the window check below
 * treats it as a first attempt — correct for a host that does not retry, and
 * the reason the engine-supplied identity is strictly better.
 */
export function runKeyFrom(ctx: unknown): string | null {
  const identity = runIdentityFrom(ctx);
  if (identity) return identity.runKey;

  const bag = ctx as Record<string, any> | null;
  const seeded = bag?.inputs?.__runKey;

  return typeof seeded === "string" && seeded.trim() !== "" ? seeded.trim() : null;
}

export type IdempotencyOptions = {
  /**
   * How long the provider remembers a key. `null` means it never forgets; `0`
   * means it does not dedupe at all, so no retry may reuse one.
   */
  windowSeconds?: number | null;
  /** Distinguishes repeated executions of one node at the same level. */
  occurrence?: number | null;
  /** Injectable for tests. Never a network call. */
  now?: Date;
  /** For the error message when a key cannot be made safe. */
  context?: Partial<ConnectorErrorContext>;
};

/**
 * The idempotency key for this execution of this node, or `null`.
 *
 * `null` means the host published no run identity at all — send no header
 * rather than inventing one, and keep the node `unsafe-to-replay`.
 *
 * **Throws** `ConnectorIdempotencyExpiredError` when this is a RETRY and the
 * provider's window has elapsed. That is not a defensive check; it is the only
 * correct answer, because both alternatives write twice.
 */
export function idempotencyKeyFor(
  ctx: unknown,
  nodeId: string,
  options: IdempotencyOptions = {},
): string | null {
  const identity = runIdentityFrom(ctx);
  const windowSeconds =
    options.windowSeconds === undefined ? DEFAULT_IDEMPOTENCY_WINDOW_SECONDS : options.windowSeconds;

  if (!identity) {
    // The legacy seeded-key path. No attempt information exists, so there is
    // nothing to window-check; a host on this path is one that does not retry.
    const runKey = runKeyFrom(ctx);
    return runKey === null ? null : fit(`${runKey}:${nodeId}`);
  }

  if (!identity.isReplaySafe(windowSeconds, options.now ?? new Date())) {
    throw new ConnectorIdempotencyExpiredError(
      `attempt ${identity.attempt} of this step began at ${identity.firstAttemptAt}, which is outside ` +
        `the provider's ${windowSeconds}s idempotency window. The provider has forgotten the original ` +
        `key, so resending it and sending a new one would BOTH write twice. Refusing, so a person can ` +
        `reconcile — check whether the first attempt landed before re-running this workflow.`,
      {
        service: options.context?.service ?? "",
        operation: options.context?.operation ?? "",
        ...options.context,
      },
    );
  }

  return fit(identity.stepKey(nodeId, options.occurrence));
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
  "unsafe-to-replay, so a durable runner will give it one attempt. Durable runs supply an " +
  "identity automatically; for a synchronous run, pass `run` in RunOptions.";

/**
 * Shorten an over-long key deterministically.
 *
 * The hash has to be stable across attempts AND across runtimes, so it is a
 * plain FNV-1a over the key rather than anything host-provided. The prefix is
 * kept so a key remains greppable against a run.
 */
function fit(key: string): string {
  if (key.length <= MAX_IDEMPOTENCY_KEY_LENGTH) return key;

  const digest = fnv1a(key);
  const head = key.slice(0, MAX_IDEMPOTENCY_KEY_LENGTH - digest.length - 1);

  return `${head}~${digest}`;
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    // 32-bit FNV prime, written as shifts so it stays exact in a double.
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}
