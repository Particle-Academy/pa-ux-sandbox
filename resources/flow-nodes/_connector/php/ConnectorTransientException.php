<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/ConnectorTransientException.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * A 5xx. The provider answered, and its answer was "not now".
 *
 * Named for what it IS rather than for how it feels: this is an explicit
 * refusal, which is why it is always safe to repeat. A timeout feels identical
 * to the caller and is not the same thing — see
 * {@see ConnectorAmbiguousException}, and note that the previous runtime used
 * this one class for both.
 */
final class ConnectorTransientException extends ConnectorException
{
    public function kind(): FailureKind
    {
        return FailureKind::RefusedExplicitly;
    }
}
