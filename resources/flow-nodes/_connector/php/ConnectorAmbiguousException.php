<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/ConnectorAmbiguousException.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * Nobody can tell whether the provider acted on it — a timeout, an aborted
 * request, an error nothing recognises.
 *
 * Retryable ONLY where the connector declared that repeating a request is
 * harmless. On anything else this is reported for a person, because the
 * alternative is a duplicate nobody will ever trace back to a bug.
 *
 * NEW in this package. Its absence is exactly what made the previous runtime
 * retry a timeout on a connector with no idempotency key.
 */
final class ConnectorAmbiguousException extends ConnectorException
{
    public function kind(): FailureKind
    {
        return FailureKind::Ambiguous;
    }
}
