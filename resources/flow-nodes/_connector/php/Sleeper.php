<?php


// GENERATED from particle-academy/fancy-connectors — php/src/Sleeper.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * The pause between two attempts, as a seam.
 *
 * Injectable so a test proves the real backoff SCHEDULE without waiting for it.
 * A test that actually slept would be slow enough that somebody would eventually
 * shorten the delays to speed it up, and then the thing under test would be the
 * shortened version rather than the shipped one.
 */
interface Sleeper
{
    public function sleepMs(int $milliseconds): void;
}
