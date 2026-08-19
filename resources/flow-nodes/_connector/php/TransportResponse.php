<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** What a transport hands back. Header keys are lowercased by the transport. */
final class TransportResponse
{
    /** @param array<string,string> $headers */
    public function __construct(
        public readonly int $status,
        public readonly array $headers = [],
        public readonly string $body = '',
    ) {}
}
