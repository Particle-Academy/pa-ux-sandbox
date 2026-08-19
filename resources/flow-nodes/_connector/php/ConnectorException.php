<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use RuntimeException;

/**
 * The connector error taxonomy — base class.
 *
 * Durable runs retry, and a retry policy needs to know WHICH KIND of failure it
 * is looking at. "Something went wrong" is not enough information to choose
 * between retrying, pausing for a human and stopping, so every connector failure
 * is classified where it is known — inside the connector, not three frames up
 * where the type has already been lost.
 *
 * | class                          | retry? | why |
 * |--------------------------------|--------|-----|
 * | `ConnectorConfigException`     | never  | nothing about a second attempt changes an unset key |
 * | `ConnectorAuthException`       | never  | the credential is wrong; hammering it locks accounts |
 * | `ConnectorRateLimitedException`| yes    | after `retryAfter`, which the provider told us |
 * | `ConnectorTransientException`  | yes    | 5xx, timeout, connection reset |
 * | `ConnectorRequestException`    | never  | a 4xx we caused; the same request fails the same way |
 */
class ConnectorException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly string $service = '',
        public readonly string $operation = '',
        public readonly ?int $status = null,
        public readonly ?string $providerCode = null,
    ) {
        parent::__construct($message);
    }

    /** Whether a second attempt could plausibly succeed. */
    public function retryable(): bool
    {
        return false;
    }
}
