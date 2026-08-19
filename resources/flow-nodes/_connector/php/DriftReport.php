<?php


// GENERATED from particle-academy/fancy-connectors — php/src/DriftReport.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** What one drift check produced. */
final readonly class DriftReport
{
    /** @param list<DriftFinding> $findings */
    public function __construct(
        public string $connector,
        public string $checkedAt,
        public DriftOutcome $outcome,
        public array $findings,
        public DriftMethod $method,
    ) {}
}
