<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/SetupStep.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** One step of standing a provider up. */
final readonly class SetupStep
{
    /**
     * @param  string  $detail  the step, AND the trap in it. A step with no trap named is
     *                          usually wrong — the traps are why setup takes an afternoon
     *                          rather than five minutes.
     */
    public function __construct(
        public string $title,
        public string $detail,
        public ?string $url = null,
    ) {}
}
