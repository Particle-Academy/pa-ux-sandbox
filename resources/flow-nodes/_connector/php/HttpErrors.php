<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/HttpErrors.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use Throwable;

/**
 * Turning what actually happened into the right exception class.
 *
 * The ordering in {@see classify()} matters and is the same on both runtimes:
 * **429 is checked before the 4xx sweep.** A rate limit is a 4xx and it is the
 * one 4xx worth retrying, so an ordering that tested `>= 400` first would mark
 * every throttle permanent and turn a busy minute into a failed run.
 */
final class HttpErrors
{
    /** Classify an HTTP response into the taxonomy. */
    public static function classify(
        int $status,
        string $service,
        string $operation,
        string $body,
        ?int $retryAfter = null,
    ): ConnectorException {
        $detail = trim($body) === '' ? '' : ' — '.self::truncate($body, 400);
        $where = $service.'.'.$operation;

        if ($status === 429) {
            return new ConnectorRateLimitedException(
                "{$where}: rate limited by the provider{$detail}",
                $service,
                $operation,
                $status,
                null,
                $retryAfter,
            );
        }

        if ($status === 401 || $status === 403) {
            return new ConnectorAuthException(
                "{$where}: the provider rejected the credential ({$status}){$detail}. "
                .'Check the credentials and that they match the mode you are running in — '
                .'a live key in sandbox, or the reverse, fails exactly like this.',
                $service,
                $operation,
                $status,
            );
        }

        if ($status >= 500) {
            return new ConnectorTransientException(
                "{$where}: provider returned {$status}{$detail}",
                $service,
                $operation,
                $status,
            );
        }

        return new ConnectorRequestException(
            "{$where}: request rejected with {$status}{$detail}",
            $service,
            $operation,
            $status,
        );
    }

    /**
     * Turn a thrown transport failure into the right class.
     *
     * The default is {@see ConnectorAmbiguousException}, NOT
     * {@see ConnectorTransientException}. That single default is the difference
     * between "a flaky network costs us a retry" and "a flaky network costs
     * someone a duplicate charge".
     *
     * A {@see TransportException} already knows what it was, because the
     * transport told it; anything else is unknown and unknown is ambiguous.
     */
    public static function classifyThrown(Throwable $cause, string $service, string $operation): ConnectorException
    {
        $classified = Delivery::classifyError($cause);
        $message = "{$service}.{$operation}: {$classified->detail}";

        return $classified->kind === FailureKind::Unreachable
            ? new ConnectorUnreachableException($message, $service, $operation, null, null, $cause)
            : new ConnectorAmbiguousException($message, $service, $operation, null, null, $cause);
    }

    /**
     * An HTTP failure carrying its classification, for connectors that decide
     * what counts as a failure themselves.
     *
     * Telegram answers `200 OK` with `{"ok": false}` for a real refusal, so its
     * connector has to raise the failure itself — and when it does, it must be
     * classified the same way every other failure is. `failure(400, …)` is how
     * it says "this is a real no" without inventing a second vocabulary.
     */
    public static function failure(int $status, string $body = '', ?string $retryAfter = null): HttpFailureException
    {
        return new HttpFailureException(Delivery::classifyStatus($status, $body, $retryAfter));
    }

    private static function truncate(string $value, int $max): string
    {
        return mb_strlen($value) <= $max ? $value : mb_substr($value, 0, $max).'…';
    }
}
