<?php


// GENERATED from particle-academy/fancy-connectors — php/src/DeliveryOutcome.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * What {@see Delivery::deliver()} produced.
 *
 * Failure is a VALUE here rather than an exception, because a caller has to see
 * the attempts even when the call SUCCEEDED. A request that worked on the third
 * try is a different operational fact from one that worked immediately, and an
 * exception-only design throws that difference away.
 */
final readonly class DeliveryOutcome
{
    /**
     * @param  list<Attempt>  $attempts  every attempt that failed, in order. Empty when the
     *                                   first one worked.
     * @param  string|null  $gaveUp  why it stopped, when it failed. Written for a person who
     *                               has to act, not for a log grep.
     * @param  FailureKind|null  $kind  the classification of the last failure, so a host can
     *                                  route on it without re-parsing a message.
     */
    public function __construct(
        public bool $ok,
        public mixed $value = null,
        public array $attempts = [],
        public ?string $gaveUp = null,
        public ?FailureKind $kind = null,
    ) {}
}
