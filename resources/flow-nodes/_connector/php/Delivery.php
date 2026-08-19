<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/Delivery.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use Throwable;

/**
 * Failure classification — the one decision every retry gets wrong.
 *
 * ## The tension
 *
 * A network hiccup should not lose a call. And a retry after a request that
 * SUCCEEDED and whose response was lost is a second write — the exact failure an
 * idempotency gate exists to prevent, arriving through the door marked
 * *reliability*.
 *
 * Nearly every retry helper reconciles those the same way and loses: it catches
 * an error, waits, and tries again, because from the caller's side all failures
 * look alike. They are not alike.
 *
 * | what happened                                | received? | retry?                                |
 * |----------------------------------------------|-----------|---------------------------------------|
 * | DNS failure, refused connection, broken socket | **no**    | always safe                           |
 * | HTTP 429 / 5xx                                 | **yes**   | safe — it says it did nothing         |
 * | timeout, aborted request, unrecognised error   | **unknown** | only where the provider is idempotent |
 * | HTTP 4xx that is not 429                       | **yes**   | never — a real no fails the same way  |
 *
 * That third row is the whole design. A timeout looks exactly like a failure and
 * may have been a success.
 *
 * ## Why this is a separate axis from the error CLASS
 *
 * The previous runtime carried `retryable` as a fixed boolean on each exception
 * class, and `ConnectorTransientException` covered both a 5xx AND a thrown
 * transport. Those are opposite cases: a 5xx is the provider telling you it did
 * nothing, and a thrown transport may be a socket that closed after the bytes
 * went out. Marking both retryable meant an ambiguous failure on a connector
 * with no idempotency key was retried — a silent double write, on the path whose
 * entire job is not producing one.
 *
 * So the primitive is the KIND, and retryability is a function of the kind AND
 * what the connector declared about repeating a request.
 * `ConnectorException::retryable()` survives and now answers the narrower
 * question — is this safe to retry whatever the connector is? — which makes an
 * old caller conservative rather than wrong.
 */
final class Delivery
{
    /**
     * The message a person reads when an ambiguous failure could not be retried.
     *
     * A constant because a host will want to recognise it, and because the
     * wording is load-bearing: it has to say *go and look*, not *it failed*.
     * Those prompt different actions and only one of them is correct.
     */
    public const AMBIGUOUS_REFUSAL = 'The request may or may not have gone through, and this connector offers '
        .'no way to repeat it harmlessly. Refusing to try again — a duplicate is worse than a call that needs '
        .'doing by hand. Check the provider before re-running.';

    /**
     * Last-use instant per channel, in ms.
     *
     * @var array<string,int>
     */
    private static array $lastCallAt = [];

    /**
     * Classify a thrown transport failure.
     *
     * ## PHP has no error-code vocabulary, so the SOURCE has to carry the answer
     *
     * Two things are trusted, in order:
     *
     * 1. anything implementing {@see ClassifiedFailure} — it already knows, and
     *    {@see TransportException} is the one a transport builds from a cURL
     *    errno or from its own knowledge of what happened;
     * 2. nothing else.
     *
     * **Message text is never matched.** It is not an API: it is localised, it
     * differs between HTTP clients, and it changes on a minor bump nobody read
     * the notes for. A classifier keyed on it would silently start answering
     * differently, and the direction it would answer wrongly in is the expensive
     * one. This is the same reason the TypeScript twin matches Node error CODES
     * rather than messages; PHP simply has no such codes to match, so the fact
     * travels on the exception instead.
     *
     * **An unrecognised error therefore falls to `Ambiguous`, never to
     * `Unreachable`.** That asymmetry is deliberate: an unknown failure treated
     * as unreachable would be retried, and the one thing worse than a lost call
     * is two calls nobody asked for. Guessing in the safe-LOOKING direction is
     * how this goes wrong.
     */
    public static function classifyError(mixed $error): Classified
    {
        if ($error instanceof ClassifiedFailure) {
            return $error->classified();
        }

        if ($error instanceof Throwable) {
            return new Classified(FailureKind::Ambiguous, $error->getMessage());
        }

        return new Classified(FailureKind::Ambiguous, self::describe($error));
    }

    /**
     * Classify a cURL errno directly, for a transport that has one to hand.
     *
     * `6` (could not resolve host), `7` (could not connect), `55` (send error)
     * and `56` (receive error) prove nothing left. `28` — the timeout — does
     * NOT: it says we stopped waiting, not that the provider did nothing.
     * Anything unrecognised is ambiguous, for the reason in
     * {@see classifyError()}.
     */
    public static function classifyCurlErrno(int $errno): FailureKind
    {
        return match ($errno) {
            6, 7, 55, 56 => FailureKind::Unreachable,
            default => FailureKind::Ambiguous,
        };
    }

    /**
     * Classify an HTTP status.
     *
     * A status means the provider answered, so it knows what it did. 429 and 5xx
     * are "not now"; everything else in the 4xx range is a real no, and retrying
     * a real no just spends someone's rate limit on the same rejection.
     *
     * 429 is decided BEFORE the 4xx sweep, because it is a 4xx and is the one
     * 4xx worth retrying — the other ordering marks every throttle permanent and
     * turns a busy minute into a failed run.
     */
    public static function classifyStatus(int $status, string $body = '', ?string $retryAfterHeader = null): Classified
    {
        $detail = $status.($body !== '' ? ': '.mb_substr($body, 0, 200) : '');

        if ($status === 429 || $status >= 500) {
            $seconds = $retryAfterHeader !== null && is_numeric($retryAfterHeader)
                ? (int) $retryAfterHeader
                : null;

            return new Classified(FailureKind::RefusedExplicitly, $detail, $seconds);
        }

        return new Classified(FailureKind::Rejected, $detail);
    }

    /**
     * May this failure be retried?
     *
     * The whole rule, in four lines, in one place. A connector that classified
     * its own statuses would eventually decide some 4xx was worth retrying, and
     * the reason retries are safe at all is that this decision is made once.
     */
    public static function shouldRetry(FailureKind $kind, RetryPolicy $policy): bool
    {
        return match ($kind) {
            FailureKind::Rejected => false,
            FailureKind::Unreachable, FailureKind::RefusedExplicitly => true,
            FailureKind::Ambiguous => $policy->idempotent,
        };
    }

    /**
     * True where a retry is safe WHATEVER the connector is — without needing to
     * know whether repeating the request is harmless.
     *
     * This is what `ConnectorException::retryable()` answers, and it is
     * deliberately the narrow question. A caller holding an idempotency
     * declaration should ask {@see shouldRetry()} instead and get the extra
     * case.
     */
    public static function isUnconditionallyRetryable(FailureKind $kind): bool
    {
        return $kind === FailureKind::Unreachable || $kind === FailureKind::RefusedExplicitly;
    }

    /**
     * Run ONE request, retrying only where retrying is provably safe.
     *
     * ## Retry wraps ONE request, never a sequence
     *
     * Wrapping a multi-message publish would re-send every earlier segment of a
     * thread when a later one failed — turning a partial send into a duplicated
     * one. So the unit is a single request and {@see Chain} composes ABOVE it,
     * never below.
     *
     * `$send` must throw on failure. A throwable implementing
     * {@see ClassifiedFailure} is trusted; anything else is classified here.
     * That indirection lets each connector decide what counts as a failure for
     * it — a Telegram `200 OK` carrying `{"ok": false}` is a failure and only the
     * connector knows that — while the decision about RETRYING stays in one
     * place for all of them.
     *
     * `$sleeper` is injectable so a test proves the real backoff schedule
     * without waiting for it. A test that actually slept would be slow enough
     * that somebody would eventually shorten the delays to speed it up, and then
     * the thing under test would be the shortened version.
     *
     * @param  callable(int): mixed  $send  receives the 1-based attempt number
     */
    public static function deliver(
        callable $send,
        ?RetryPolicy $policy = null,
        ?Sleeper $sleeper = null,
    ): DeliveryOutcome {
        $policy ??= RetryPolicy::conservative();
        $sleeper ??= new SystemSleeper;

        $attempts = [];
        $budget = max(1, $policy->attempts);

        for ($attempt = 1; $attempt <= $budget; $attempt++) {
            try {
                return new DeliveryOutcome(true, $send($attempt), $attempts);
            } catch (Throwable $error) {
                $classified = self::classifyError($error);

                if (! self::shouldRetry($classified->kind, $policy)) {
                    $attempts[] = new Attempt($attempt, $classified->kind, $classified->detail);

                    return new DeliveryOutcome(
                        false,
                        null,
                        $attempts,
                        $classified->kind === FailureKind::Ambiguous
                            ? self::AMBIGUOUS_REFUSAL.' ('.$classified->detail.')'
                            : $classified->detail,
                        $classified->kind,
                    );
                }

                if ($attempt >= $budget) {
                    $attempts[] = new Attempt($attempt, $classified->kind, $classified->detail);

                    return new DeliveryOutcome(
                        false,
                        null,
                        $attempts,
                        "Gave up after {$attempt} attempts. {$classified->detail}",
                        $classified->kind,
                    );
                }

                // Exponential, but the provider's own number wins when it gave
                // one. Ours is a guess; theirs is an instruction, and ignoring
                // it is how a rate limit becomes a ban.
                $backoff = (int) min($policy->baseDelayMs * 2 ** ($attempt - 1), $policy->maxDelayMs);
                $waitedMs = $classified->retryAfter !== null && $classified->retryAfter > 0
                    ? max($backoff, $classified->retryAfter * 1000)
                    : $backoff;

                $attempts[] = new Attempt($attempt, $classified->kind, $classified->detail, $waitedMs);
                $sleeper->sleepMs($waitedMs);
            }
        }

        return new DeliveryOutcome(false, null, $attempts, 'Exhausted every attempt.');
    }

    /**
     * Wait until this channel may be used again.
     *
     * In-process only, and that is the correct scope for a host running on one
     * machine. A host that fans out across processes owns the coordination,
     * because this cannot see the other senders and pretending otherwise would
     * be a limiter that reports success while doing nothing.
     *
     * @return int milliseconds actually waited
     */
    public static function respectRate(
        string $channel,
        int $minIntervalMs,
        ?Clock $clock = null,
        ?Sleeper $sleeper = null,
    ): int {
        if ($minIntervalMs <= 0) {
            return 0;
        }

        $clock ??= new SystemClock;
        $sleeper ??= new SystemSleeper;

        $previous = self::$lastCallAt[$channel] ?? null;
        $at = $clock->nowMs();
        $waitedMs = $previous === null ? 0 : max(0, $previous + $minIntervalMs - $at);

        if ($waitedMs > 0) {
            $sleeper->sleepMs($waitedMs);
        }

        self::$lastCallAt[$channel] = $at + $waitedMs;

        return $waitedMs;
    }

    /** Only for tests — the map is static and would otherwise leak between them. */
    public static function resetRateState(): void
    {
        self::$lastCallAt = [];
    }

    /** A non-throwable that was thrown at us anyway, rendered for a human. */
    private static function describe(mixed $value): string
    {
        return match (true) {
            $value === null => 'null',
            is_string($value) => $value,
            is_scalar($value) => var_export($value, true),
            default => get_debug_type($value),
        };
    }
}
