<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/DriftFinding.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** One thing a drift check noticed. */
final readonly class DriftFinding
{
    public function __construct(
        public DriftFindingKind $kind,
        public string $detail,
        public ?string $operation = null,
    ) {}
}
