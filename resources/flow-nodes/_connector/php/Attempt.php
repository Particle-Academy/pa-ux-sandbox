<?php


// GENERATED from particle-academy/fancy-connectors — php/src/Attempt.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** One attempt that FAILED, kept on the record so a host can journal what happened. */
final readonly class Attempt
{
    /**
     * @param  int  $attempt  1-based
     * @param  int|null  $waitedMs  how long we waited before the NEXT attempt. Null on the last.
     */
    public function __construct(
        public int $attempt,
        public FailureKind $kind,
        public string $detail,
        public ?int $waitedMs = null,
    ) {}
}
