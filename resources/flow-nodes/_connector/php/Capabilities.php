<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/Capabilities.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * What a connector can do.
 *
 * **A capability flag must not outrun the code**, and this is checkable rather
 * than a rule people remember: {@see Metrics::capabilityProblems()} fails a
 * connector claiming `metrics` with no declared shape. In the reference
 * implementation two connectors claimed metrics while returning nothing for
 * weeks — so a pull did not skip them, it asked, got nothing, and reported
 * nothing, which on a dashboard is indistinguishable from "we asked and nobody
 * engaged".
 */
final readonly class Capabilities
{
    public function __construct(
        public bool $call,
        public bool $metrics = false,
        public bool $feedback = false,
    ) {}
}
