<?php


// GENERATED from particle-academy/fancy-connectors — php/src/ConnectorRequestException.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** A 4xx we caused. The same request will fail the same way. */
final class ConnectorRequestException extends ConnectorException
{
    public function kind(): FailureKind
    {
        return FailureKind::Rejected;
    }
}
