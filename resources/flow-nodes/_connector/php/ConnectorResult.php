<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/ConnectorResult.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * What a connector call returns, alongside the provider's own payload.
 *
 * The mode is REPORTED, never inferred by the caller. A call that emitted the
 * provider's data alone would leave every downstream reader — a human, an agent,
 * a log — unable to tell a faked result from a real one, which is the single
 * most important fact about a connector run.
 *
 * `attempts` carries every FAILED attempt, so a host can journal what actually
 * happened. A call that worked on the third try is a different operational fact
 * from one that worked immediately.
 */
final readonly class ConnectorResult
{
    /** @param list<Attempt> $attempts */
    public function __construct(
        public mixed $data,
        public Mode $mode,
        public string $connection,
        public array $attempts = [],
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
