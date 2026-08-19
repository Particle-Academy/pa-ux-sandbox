<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * Classify an HTTP response into the connector error taxonomy.
 *
 * The twin of `classifyHttp` in `../js/errors.ts`, and the ordering matters
 * identically on both sides: **429 is checked before the 4xx sweep**. A rate
 * limit is a 4xx and it is the one 4xx worth retrying, so an ordering that
 * tested `>= 400` first would mark every throttle permanent and turn a busy
 * minute into a failed run.
 */
final class HttpErrors
{
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
                $retryAfter,
            );
        }

        if ($status === 401 || $status === 403) {
            return new ConnectorAuthException(
                "{$where}: the provider rejected the credential ({$status}){$detail}. "
                .'Check the connection\'s credentials and that they match the mode you are running in — '
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

    private static function truncate(string $value, int $max): string
    {
        return mb_strlen($value) <= $max ? $value : mb_substr($value, 0, $max).'…';
    }
}
