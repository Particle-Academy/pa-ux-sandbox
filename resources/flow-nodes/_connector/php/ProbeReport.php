<?php


// GENERATED from particle-academy/fancy-connectors — php/src/ProbeReport.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** A set of probes, summarised. Skips do not fail a report. */
final readonly class ProbeReport
{
    /** @param list<ProbeResult> $results */
    public function __construct(
        public array $results,
        public int $passed,
        public int $failed,
        public int $skipped,
    ) {}

    public function ok(): bool
    {
        return $this->failed === 0;
    }
}
