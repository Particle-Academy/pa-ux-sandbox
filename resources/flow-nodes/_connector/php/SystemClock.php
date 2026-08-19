<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/SystemClock.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** The real clock. */
final class SystemClock implements Clock
{
    public function nowMs(): int
    {
        return (int) (microtime(true) * 1000);
    }
}
