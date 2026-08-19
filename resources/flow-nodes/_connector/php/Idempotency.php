<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/Idempotency.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use DateTimeImmutable;
use DateTimeInterface;

/**
 * The idempotency key a writing connector sends, and when it must refuse to.
 *
 * ## What a host has to provide
 *
 * A key that is the SAME on every retry of one logical step and DIFFERENT for
 * every other execution of the same step. A run identity gives exactly that —
 * see {@see RunIdentity}, which is declared structurally so a flow engine's own
 * identity object satisfies it with no dependency in either direction.
 *
 * Both obvious substitutes are worse than sending nothing:
 *
 * - **the step id alone** is stable across retries and also across RUNS, so two
 *   legitimate payments share a key and the provider silently collapses the
 *   second into the first — a payment that never happened, reported as success;
 * - **a fresh random value** is unique per run and also per ATTEMPT, so a retry
 *   creates a second charge.
 *
 * With no identity at all this returns null, and the caller sends no header and
 * stays pinned to one attempt. That is the honest outcome.
 *
 * ## The part that is a judgement call: the provider's window
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
     * Stripe caps `Idempotency-Key` at 255 characters. A deep nested path could
     * exceed that, and a provider rejecting the header is a 400 that looks like
     * a bug in the request body.
     */
    public const MAX_KEY_LENGTH = 255;

    /**
     * The warning a caller emits when it is about to write without a key.
     *
     * Said out loud, at the moment it matters, because the failure it precedes
     * is invisible: the run succeeds, the retry succeeds, there are two charges.
     */
    public const NO_KEY_WARNING = 'no run identity available, so this write is being sent WITHOUT an '
        .'idempotency key. A retry would repeat the effect rather than recover from it — treat the step as '
        .'unsafe-to-replay and give it one attempt. A durable runner supplies an identity automatically.';

    /**
     * The run identity a host published, or null.
     *
     * Accepts the identity itself, or a context object carrying it as `run` —
     * which is where every flow engine in the suite puts it.
     *
     * The order matters. A `run` PROPERTY makes something a context, even when
     * its value is null: a context on a run that published no identity is the
     * ordinary case, and reading the context itself as the identity would turn
     * "no identity here" into a loud failure about the wrong object.
     *
     * A bare object is treated as an identity only when it carries `runKey`,
     * which is the discriminator. That keeps the loud refusal for the case that
     * matters — something claiming to be an identity while missing a member —
     * and answers null for anything not claiming to be one at all.
     */
    public static function identity(mixed $source): ?RunIdentity
    {
        if ($source instanceof RunIdentity) {
            return $source;
        }

        if (is_array($source)) {
            $run = $source['run'] ?? null;

            return is_object($run) ? ForeignRunIdentity::adapt($run) : null;
        }

        if (! is_object($source)) {
            return null;
        }

        if (property_exists($source, 'run')) {
            return is_object($source->run) ? ForeignRunIdentity::adapt($source->run) : null;
        }

        return property_exists($source, 'runKey') ? ForeignRunIdentity::adapt($source) : null;
    }

    /**
     * The run key, from the identity or from a seeded input.
     *
     * The `__runKey` fallback exists because a host on an older engine has no
     * run identity to publish. It gives a per-run key with NO attempt
     * information, so the window check below treats it as a first attempt —
     * correct for a host that does not retry, and the reason an
     * engine-supplied identity is strictly better.
     *
     * @param  array<string,mixed>  $seededInputs
     */
    public static function runKey(mixed $source, array $seededInputs = []): ?string
    {
        $identity = self::identity($source);

        if ($identity !== null) {
            return $identity->runKey;
        }

        $seeded = $seededInputs['__runKey'] ?? null;

        if ($seeded === null && is_object($source) && isset($source->inputs) && is_array($source->inputs)) {
            $seeded = $source->inputs['__runKey'] ?? null;
        }

        return is_string($seeded) && trim($seeded) !== '' ? trim($seeded) : null;
    }

    /**
     * The idempotency key for this execution of this step, or null.
     *
     * Null means the host published no run identity at all — send no header
     * rather than inventing one, and keep the step unsafe-to-replay.
     *
     * @param  mixed  $source  a run identity, or a context carrying one as `run`
     * @param  int|null  $windowSeconds  how long the provider remembers a key. Null never
     *                                   forgets; `0` does not dedupe at all, so no retry may reuse one — and reading
     *                                   `0` as null turns "this provider does not dedupe" into "this provider dedupes
     *                                   forever".
     * @param  int|null  $occurrence  distinguishes repeated executions of one step at the
     *                                same level
     * @param  array<string,mixed>  $seededInputs  the legacy `__runKey` fallback
     *
     * @throws ConnectorIdempotencyExpiredException when this is a RETRY and the provider's
     *                                              window has elapsed. Not a defensive check — it is the only correct answer,
     *                                              because both alternatives write twice.
     */
    public static function keyFor(
        mixed $source,
        string $stepId,
        ?int $windowSeconds = self::DEFAULT_WINDOW_SECONDS,
        ?int $occurrence = null,
        DateTimeInterface|string|null $now = null,
        string $service = '',
        string $operation = '',
        array $seededInputs = [],
    ): ?string {
        $identity = self::identity($source);

        if ($identity === null) {
            $runKey = self::runKey($source, $seededInputs);

            return $runKey === null ? null : self::fit($runKey.':'.$stepId);
        }

        if (! $identity->isReplaySafe($windowSeconds, $now ?? new DateTimeImmutable)) {
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

        return self::fit($identity->stepKey($stepId, $occurrence));
    }

    /**
     * Shorten an over-long key deterministically.
     *
     * The hash has to be stable across attempts AND across runtimes, so it is a
     * plain FNV-1a over the key rather than anything host-provided. The prefix is
     * kept so a key remains greppable against a run.
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
            $hash = ($hash + (($hash << 1) + ($hash << 4) + ($hash << 7) + ($hash << 8) + ($hash << 24)))
                & 0xFFFFFFFF;
        }

        return str_pad(dechex($hash), 8, '0', STR_PAD_LEFT);
    }
}
