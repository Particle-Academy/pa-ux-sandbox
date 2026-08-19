<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/ConnectorRateLimitedException.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * The provider asked us to slow down. It did nothing, and said so.
 *
 * `retryAfter` is carried through to the classification, because the provider's
 * own number is an instruction and ours is a guess. Ignoring theirs is how a
 * rate limit becomes a ban.
 */
final class ConnectorRateLimitedException extends ConnectorException
{
    public function __construct(
        string $message,
        string $service = '',
        string $operation = '',
        ?int $status = null,
        ?string $providerCode = null,
        /** Seconds to wait, when the provider said. */
        public readonly ?int $retryAfter = null,
    ) {
        parent::__construct($message, $service, $operation, $status, $providerCode);
    }

    public function kind(): FailureKind
    {
        return FailureKind::RefusedExplicitly;
    }

    public function classified(): Classified
    {
        return new Classified($this->kind(), $this->getMessage(), $this->retryAfter);
    }
}
