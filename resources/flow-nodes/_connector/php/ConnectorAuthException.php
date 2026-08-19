<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/ConnectorAuthException.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** The provider rejected the credential. Retrying cannot help, and it locks accounts. */
final class ConnectorAuthException extends ConnectorException
{
    public function kind(): FailureKind
    {
        return FailureKind::Rejected;
    }
}
