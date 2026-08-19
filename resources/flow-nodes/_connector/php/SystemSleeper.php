<?php


// GENERATED from particle-academy/fancy-connectors — php/src/SystemSleeper.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** The real pause. `usleep` takes microseconds; the seam speaks milliseconds. */
final class SystemSleeper implements Sleeper
{
    public function sleepMs(int $milliseconds): void
    {
        if ($milliseconds > 0) {
            usleep($milliseconds * 1000);
        }
    }
}
