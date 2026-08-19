<?php


// GENERATED from particle-academy/fancy-connectors — php/src/Problem.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** Something a connector's own validation found. */
final readonly class Problem
{
    public function __construct(
        public ProblemSeverity $severity,
        public string $message,
    ) {}
}
