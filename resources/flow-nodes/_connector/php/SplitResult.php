<?php


// GENERATED from particle-academy/fancy-connectors — php/src/SplitResult.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * What {@see Render::splitToFit()} produced.
 *
 * Parts AND problems, together, because a split that dropped something has to
 * hand back both — a caller that received only the parts would have no way to
 * learn that a URL was too long to place, and would send the rest as if nothing
 * were missing.
 */
final readonly class SplitResult
{
    /**
     * @param  list<string>  $parts
     * @param  list<string>  $problems
     */
    public function __construct(
        public array $parts,
        public array $problems,
    ) {}
}
