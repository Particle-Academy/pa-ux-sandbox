<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/ProbeResult.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** What one probe found, in the provider's own words where possible. */
final readonly class ProbeResult
{
    public function __construct(
        public string $connector,
        public ProbeOutcome $outcome,
        public string $detail,
        public ?int $status = null,
        public ?FailureKind $kind = null,
    ) {}
}
