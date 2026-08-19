<?php

declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * What a connector call returns, alongside the provider's own payload.
 *
 * The mode is REPORTED, never inferred by the caller. A node that emitted the
 * provider's data alone would leave every downstream reader — a human, an agent,
 * a log — unable to tell a faked result from a real one, which is the single
 * most important fact about a connector run.
 */
final class ConnectorResult
{
    public function __construct(
        public readonly mixed $data,
        public readonly Mode $mode,
        public readonly string $connection,
    ) {}

    /** The shape a node publishes on its output port. */
    public function toArray(): array
    {
        return [
            'data' => $this->data,
            'mode' => $this->mode->value,
            'connection' => $this->connection,
        ];
    }
}
