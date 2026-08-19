<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/ConnectorModeException.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * A requested mode cannot be honoured.
 *
 * Never downgraded silently: an environment that quietly overrode a stated
 * intention produces the worst outcome available here, which is a workflow that
 * reports success having charged nobody.
 */
final class ConnectorModeException extends ConnectorException
{
    public function kind(): FailureKind
    {
        return FailureKind::Rejected;
    }
}
