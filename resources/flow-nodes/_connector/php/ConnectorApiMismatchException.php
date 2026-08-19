<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/ConnectorApiMismatchException.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use RuntimeException;

/** A connector written against a surface this core does not implement. */
final class ConnectorApiMismatchException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly string $connector,
        public readonly int $declared,
    ) {
        parent::__construct($message);
    }
}
