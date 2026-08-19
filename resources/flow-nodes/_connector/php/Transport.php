<?php


// GENERATED from particle-academy/fancy-connectors — php/src/Transport.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * The HTTP seam.
 *
 * An interface rather than a hard dependency on Guzzle, Laravel's `Http`, or
 * cURL, for the reason this package exists at all: adding a connector must cost
 * the consumer no new dependency. A Laravel host binds a four-line adapter over
 * `Http::send()`; anyone else implements this against whatever they already use.
 *
 * ## What an implementation MUST do on failure
 *
 * Throw a {@see TransportException}, built through `unreachable()`,
 * `ambiguous()` or `fromCurlErrno()`. That is not ceremony: PHP has no error-code
 * vocabulary, so the transport is the only place that knows whether the request
 * left. Throwing a bare exception is legal and is classified as AMBIGUOUS, which
 * means it will not be retried on a non-idempotent connector — conservative,
 * and correct, but it loses the "always safe" case.
 *
 * `fake` mode never reaches a transport at all — which is why a freshly vendored
 * connector runs before any of this is wired.
 */
interface Transport
{
    public function send(PreparedRequest $request): TransportResponse;
}
