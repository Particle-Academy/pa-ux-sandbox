<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/HttpFailureException.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * An HTTP failure carrying its own classification, for connectors that decide
 * what counts as a failure themselves.
 *
 * Telegram answers `200 OK` with `{"ok": false}` for a real refusal, so its
 * connector has to raise the failure itself — and when it does, it must be
 * classified the same way every other failure is. `HttpErrors::failure(400, …)`
 * is how it says "this is a real no" without inventing a second vocabulary.
 */
final class HttpFailureException extends ConnectorException
{
    public function __construct(private readonly Classified $classification)
    {
        parent::__construct($classification->detail);
    }

    public function kind(): FailureKind
    {
        return $this->classification->kind;
    }

    public function classified(): Classified
    {
        return $this->classification;
    }
}
