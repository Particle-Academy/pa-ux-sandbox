<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use DateTimeImmutable;
use DateTimeInterface;
use FancyFlow\Runtime\ExecutionContext;
use FancyFlow\Runtime\RunIdentity;

/**
 * The idempotency key a writing connector sends, and when it must refuse to.
 *
 * ## What the engine now provides
 *
 * `fancy-flow-php` 0.19.0 carries a **run identity** on the execution context,
 * so a node can derive a key that is the same on every retry of one logical
 * step and different for every other execution of the same node.
 * `$ctx->run->stepKey($ctx->node->id)` is that key. The equivalent landed in
 * `@particle-academy/fancy-flow` 0.46.0 and the Python runtime, all three
 * pinned by `shared/flow-run-identity` in `particle-academy/fancy-conformance`.
 *
 * Before that, neither engine could produce one, and both obvious substitutes
 * were worse than sending nothing:
 *
 *   - the **node id alone** is stable across retries and also across RUNS, so
 *     two legitimate payments share a key and the provider silently collapses
 *     the second into the first — a payment that never happened, reported as
 *     success;
 *   - a **fresh random value** is unique per run and also per ATTEMPT, so a
 *     retry creates a second charge.
 *
 * So this used to return null and every writing node emitted a warning and sent
 * no key, staying pinned to one attempt. That is no longer the case where a host
 * supplies an identity — which durable runs do automatically, and where the
 * `per_node` driver makes the attempt and the first-attempt clock EXACT because
 * it reads them off the node's own claim row.
 *
 * ## The part that is still a judgement call: the provider's window
 *
 * Providers forget idempotency keys. Stripe's window is **24 hours**. Past it,
 * resending the key creates a second charge and sending a fresh one creates a
 * second charge — there is no safe third option — so {@see keyFor()} THROWS
 * rather than choosing. A loud stuck run that a person reconciles beats a silent
 * double write nobody ever sees.
 *
 * A first attempt is never refused, however long the run was parked: nothing was
 * sent on an earlier attempt, so there is nothing for the provider to have
 * forgotten. That is what lets an approval sit for a week and then charge.
 */
final class Idempotency
{
    /** Stripe's window, and the default for a provider that has not said otherwise. */
    public const DEFAULT_WINDOW_SECONDS = 24 * 60 * 60;

    /**
     * Longest key the strictest provider in the catalogue accepts.
     *
     * Stripe caps `Idempotency-Key` at 255 characters. A deep subflow path could
     * exceed that, and a provider rejecting the header is a 400 that looks like
     * a bug in the request body.
     */
    public const MAX_KEY_LENGTH = 255;

    /**
     * The warning a node emits when it is about to write without a key.
     *
     * Said out loud, at the moment it matters, because the failure it precedes
     * is invisible: the run succeeds, the retry succeeds, there are two charges.
     */
    public const NO_KEY_WARNING = 'no run identity available, so this write is being sent WITHOUT an '
        .'idempotency key. A retry would repeat the effect rather than recover from it — the node is '
        .'marked unsafe-to-replay, so a durable runner will give it one attempt. Durable runs supply an '
        .'identity automatically; for a synchronous run, pass `run` in RunOptions.';

    /** The run identity a host published, or null. */
    public static function identity(ExecutionContext $ctx): ?RunIdentity
    {
        return $ctx->run;
    }

    /**
     * The run key, from the identity or from the legacy seeded input.
     *
     * `__runKey` in the run's initial inputs is kept because a consumer on an
     * older `fancy-flow-php` has no `$ctx->run`. It gives a per-run key with no
     * attempt information, so the window check treats it as a first attempt —
     * correct for a host that does not retry, and the reason the
     * engine-supplied identity is strictly better.
     */
    public static function runKey(ExecutionContext $ctx): ?string
    {
        if ($ctx->run !== null) {
            return $ctx->run->runKey;
        }

        $seeded = $ctx->inputs['__runKey'] ?? null;

        return is_string($seeded) && trim($seeded) !== '' ? trim($seeded) : null;
    }

    /**
     * The idempotency key for this execution of this node, or null.
     *
     * Null means the host published no run identity at all — send no header
     * rather than inventing one, and keep the node `unsafe-to-replay`.
     *
     * @param  int|null  $windowSeconds  how long the provider remembers a key. `null` never
     *                                   forgets; `0` does not dedupe at all, so no retry may reuse one.
     * @param  int|null  $occurrence     distinguishes repeated executions of one node at the same level.
     *
     * @throws ConnectorIdempotencyExpiredException when this is a RETRY and the provider's window has
     *   elapsed. Not a defensive check — it is the only correct answer, because both alternatives
     *   write twice.
     */
    public static function keyFor(
        ExecutionContext $ctx,
        ?int $windowSeconds = self::DEFAULT_WINDOW_SECONDS,
        ?int $occurrence = null,
        DateTimeInterface|string|null $now = null,
        string $service = '',
        string $operation = '',
    ): ?string {
        $identity = $ctx->run;

        if ($identity === null) {
            $runKey = self::runKey($ctx);

            return $runKey === null ? null : self::fit($runKey.':'.$ctx->node->id);
        }

        if (! $identity->isReplaySafe($windowSeconds, $now ?? new DateTimeImmutable())) {
            throw new ConnectorIdempotencyExpiredException(
                sprintf(
                    'attempt %d of this step began at %s, which is outside the provider\'s %s idempotency '
                    .'window. The provider has forgotten the original key, so resending it and sending a new '
                    .'one would BOTH write twice. Refusing, so a person can reconcile — check whether the '
                    .'first attempt landed before re-running this workflow.',
                    $identity->attempt,
                    $identity->firstAttemptAt,
                    $windowSeconds === null ? 'unbounded' : $windowSeconds.'s',
                ),
                $service,
                $operation,
            );
        }

        return self::fit($identity->stepKey($ctx->node->id, $occurrence));
    }

    /**
     * Shorten an over-long key deterministically.
     *
     * The hash has to be stable across attempts AND across runtimes, so it is a
     * plain FNV-1a over the key rather than anything host-provided. The prefix
     * is kept so a key remains greppable against a run.
     */
    private static function fit(string $key): string
    {
        if (strlen($key) <= self::MAX_KEY_LENGTH) {
            return $key;
        }

        $digest = self::fnv1a($key);
        $head = substr($key, 0, self::MAX_KEY_LENGTH - strlen($digest) - 1);

        return $head.'~'.$digest;
    }

    private static function fnv1a(string $value): string
    {
        $hash = 0x811C9DC5;

        for ($i = 0, $len = strlen($value); $i < $len; $i++) {
            $hash ^= ord($value[$i]);
            // 32-bit FNV prime as shifts, masked back to 32 bits so a 64-bit PHP
            // produces the same digest a 32-bit JavaScript bitwise op does.
            $hash = ($hash + (($hash << 1) + ($hash << 4) + ($hash << 7) + ($hash << 8) + ($hash << 24))) & 0xFFFFFFFF;
        }

        return str_pad(dechex($hash), 8, '0', STR_PAD_LEFT);
    }
}
