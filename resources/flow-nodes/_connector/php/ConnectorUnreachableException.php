<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/ConnectorUnreachableException.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * The request never reached the provider — DNS, a refused connection, a socket
 * closed before anything went out.
 *
 * Always safe to repeat, and the only transport-level failure of which that is
 * true. NEW in this package: the previous runtime turned every thrown transport
 * into an unconditionally-retryable transient, which is the bug being fixed.
 */
final class ConnectorUnreachableException extends ConnectorException
{
    public function kind(): FailureKind
    {
        return FailureKind::Unreachable;
    }
}
