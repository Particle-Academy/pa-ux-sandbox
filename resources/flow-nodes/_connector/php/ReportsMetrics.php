<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/ReportsMetrics.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * A connector that can measure what it did.
 *
 * Implementing this is what makes `capabilities.metrics: true` honest. A
 * connector that claimed the capability without implementing this would be asked
 * on every pull, return nothing, and report nothing — which on a dashboard is
 * indistinguishable from "we asked and nobody engaged".
 */
interface ReportsMetrics
{
    /**
     * @param  list<string>  $refs
     * @param  array<string,string>  $credentials  passed IN, never read from the environment
     * @return list<MetricSample>
     */
    public function fetchMetrics(array $refs, array $credentials): array;
}
