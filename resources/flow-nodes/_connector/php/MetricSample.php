<?php


// GENERATED from particle-academy/fancy-connectors — php/src/MetricSample.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** One measurement of one thing we did. */
final readonly class MetricSample
{
    /**
     * @param  array<string,int|float>  $metrics  ONLY what the provider actually reported.
     *                                            Absent stays absent — build it with
     *                                            {@see Metrics::reported()}.
     */
    public function __construct(
        public string $ref,
        public string $at,
        public array $metrics,
    ) {}
}
