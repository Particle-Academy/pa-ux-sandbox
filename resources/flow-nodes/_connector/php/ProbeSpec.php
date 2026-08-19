<?php


// GENERATED from particle-academy/fancy-connectors — php/src/ProbeSpec.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use Closure;

/** One credential-free proof that a connector's transport is real. */
final readonly class ProbeSpec
{
    /**
     * @param  Closure(): TransportResponse  $request  the read-only request, fully formed,
     *                                                 carrying a credential that CANNOT be valid. Built by the connector so the
     *                                                 probe exercises the connector's own URL and auth placement rather than a
     *                                                 second copy of them — a probe against a hand-written URL proves only that the
     *                                                 hand-written URL works.
     * @param  list<int>  $authStatuses  statuses that count as an auth-shaped refusal for
     *                                   THIS provider. Declared rather than assumed: Discord answers 404 for an
     *                                   unknown webhook id, and on a provider that does not, a 404 means the endpoint
     *                                   moved — the exact drift a probe is for.
     * @param  string  $why  why those statuses, for whoever reads a failure at 3am
     */
    public function __construct(
        public string $connector,
        public Closure $request,
        public array $authStatuses,
        public string $why,
    ) {}
}
