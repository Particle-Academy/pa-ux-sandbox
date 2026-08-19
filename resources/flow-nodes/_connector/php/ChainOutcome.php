<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/ChainOutcome.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use Throwable;

/**
 * What a chain managed to post, and where it stopped.
 *
 * Both halves matter. A chain that failed halfway has PUBLISHED something, and a
 * result that reported only the failure would leave a host with two public
 * messages it does not know about.
 */
final readonly class ChainOutcome
{
    /**
     * @param  list<array<string,string|int>>  $posted  everything that was posted, in order
     * @param  int|null  $failedIndex  the position that failed, if one did
     */
    public function __construct(
        public array $posted,
        public ?int $failedIndex = null,
        public ?Throwable $failure = null,
    ) {}

    public function ok(): bool
    {
        return $this->failedIndex === null;
    }
}
