<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** A 5xx, a timeout, a reset — the provider's problem, and it may pass. */
final class ConnectorTransientException extends ConnectorException
{
    public function retryable(): bool
    {
        return true;
    }
}
