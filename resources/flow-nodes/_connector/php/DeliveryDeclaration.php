<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/DeliveryDeclaration.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * How a connector behaves when a call goes wrong, and how fast it may be used.
 *
 * `idempotent` is the load-bearing field, and it is the only thing that makes an
 * ambiguous failure safe to retry. A connector that has not thought about it
 * gets false, and an ambiguous failure is then reported for a person instead of
 * retried into a double write.
 */
final readonly class DeliveryDeclaration
{
    /**
     * @param  string  $why  why it is or is not idempotent, cited rather than asserted.
     *                       `idempotent: true` with no reason is the one claim whose failure
     *                       is a public double write, so the reason names the mechanism
     *                       rather than restating the flag.
     * @param  int  $minIntervalMs  smallest gap between two calls on this connector
     */
    public function __construct(
        public bool $idempotent,
        public string $why,
        public int $minIntervalMs = 0,
        public RateSource $rateSource = RateSource::SelfImposed,
        public ?Citation $citation = null,
    ) {}
}
