<?php


// GENERATED from particle-academy/fancy-connectors — php/src/Classified.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * One classified failure: what kind it was, what happened, and how long the
 * provider asked us to wait.
 *
 * `retryAfter` is null when the provider said nothing, which is not the same as
 * zero. Zero would mean "try immediately", and no provider has ever meant that
 * by omitting the header.
 */
final readonly class Classified
{
    /**
     * @param  int|null  $retryAfter  seconds the provider asked us to wait, when it said so
     */
    public function __construct(
        public FailureKind $kind,
        public string $detail,
        public ?int $retryAfter = null,
    ) {}
}
