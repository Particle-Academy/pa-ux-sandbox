<?php


// GENERATED from particle-academy/fancy-connectors — php/src/ShapeMismatch.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** Where a declared metric shape and the code that produces it disagree. */
final readonly class ShapeMismatch
{
    /**
     * @param  list<string>  $undeclared  keys the mapping produced that nothing declared
     * @param  list<string>  $unproduced  keys declared that the mapping never produces
     */
    public function __construct(
        public string $connector,
        public array $undeclared,
        public array $unproduced,
    ) {}
}
