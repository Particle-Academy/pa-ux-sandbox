<?php


// GENERATED from particle-academy/fancy-connectors — php/src/ConnectorConfigException.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * A required piece of configuration is missing or unusable.
 *
 * The message must name the exact key the consumer has to set. "Stripe is not
 * configured" sends someone reading source; "no `secretKey` on the `stripe`
 * connection" sends them to the line.
 */
class ConnectorConfigException extends ConnectorException
{
    public function kind(): FailureKind
    {
        return FailureKind::Rejected;
    }
}
