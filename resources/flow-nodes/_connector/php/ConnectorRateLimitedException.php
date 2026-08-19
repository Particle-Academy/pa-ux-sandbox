<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** The provider asked us to slow down. */
final class ConnectorRateLimitedException extends ConnectorException
{
    public function __construct(
        string $message,
        string $service = '',
        string $operation = '',
        ?int $status = null,
        public readonly ?int $retryAfter = null,
    ) {
        parent::__construct($message, $service, $operation, $status);
    }

    public function retryable(): bool
    {
        return true;
    }
}
