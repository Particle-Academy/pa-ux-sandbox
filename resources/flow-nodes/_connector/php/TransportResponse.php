<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/TransportResponse.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * What a transport hands back.
 *
 * Header keys are LOWERCASED by the transport. Header case is not preserved
 * consistently across proxies and clients, and a `Retry-After` that is read
 * behind one server and missed behind another turns a throttle into a ban on
 * exactly one deployment.
 */
final readonly class TransportResponse
{
    /** @param array<string,string> $headers */
    public function __construct(
        public int $status,
        public array $headers = [],
        public string $body = '',
    ) {}
}
