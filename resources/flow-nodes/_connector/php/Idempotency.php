<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use FancyFlow\Runtime\ExecutionContext;

/**
 * Deriving an idempotency key — and being honest when we cannot.
 *
 * ## The gap this works around
 *
 * A durable run RETRIES. For a writing connector that is only survivable if the
 * retry carries the same idempotency key the first attempt did, so the provider
 * returns the original result instead of creating a second charge.
 *
 * **Neither engine's execution context carries a run identity today.**
 * `ExecutionContext` is `{node, inputs, emit, depth}`; the TypeScript `ctx` is
 * the same minus depth. There is no run key and no attempt number — checked
 * against fancy-flow-php 0.17.0 and fancy-flow 0.45.0 rather than assumed.
 *
 * So this reads the conventional place a host may seed one — `__runKey` in the
 * run's initial inputs, which the engine merges into every node's inputs — and
 * returns `null` when there is none.
 *
 * ## Why the two obvious fallbacks are both wrong
 *
 * - **The node id alone** is stable across retries and also across RUNS, so two
 *   legitimate payments share a key and the second is silently deduplicated into
 *   the first: a payment that never happened, reported as success.
 * - **A fresh random value** is unique per run and also per ATTEMPT, so a retry
 *   creates a second charge — the thing we are avoiding.
 *
 * Both are worse than no key. With no run identity a connector sends none and
 * stays `unsafe-to-replay`, which pins it to one attempt under the per-node
 * queue driver.
 */
final class Idempotency
{
    /**
     * The warning a node emits when it is about to write without a key.
     *
     * Said out loud, at the moment it matters, because the failure it precedes
     * is invisible: the run succeeds, the retry succeeds, there are two charges.
     */
    public const NO_KEY_WARNING = 'no run identity available, so this write is being sent WITHOUT an '
        .'idempotency key. A retry would repeat the effect rather than recover from it — the node is '
        .'marked unsafe-to-replay, so a durable runner will give it one attempt. To enable safe retries, '
        .'seed a stable `__runKey` into the run\'s initial inputs.';

    /** The run key a host seeded, or null. */
    public static function runKey(ExecutionContext $ctx): ?string
    {
        $value = $ctx->inputs['__runKey'] ?? null;

        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }

    /**
     * The idempotency key for one node in one run, or null.
     *
     * `null` is a legitimate answer and callers must treat it as one — passing
     * it through means "send no idempotency header", not "make something up".
     */
    public static function keyFor(ExecutionContext $ctx): ?string
    {
        $run = self::runKey($ctx);

        return $run === null ? null : $run.':'.$ctx->node->id;
    }
}
