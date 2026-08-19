<?php


// GENERATED from particle-academy/fancy-connectors — php/src/Clock.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * The wall clock, as a seam, in milliseconds.
 *
 * Only the rate floor needs it. Rendering deliberately does NOT, because a
 * renderer that could read a clock could produce a different payload from the
 * one that was approved.
 */
interface Clock
{
    public function nowMs(): int;
}
