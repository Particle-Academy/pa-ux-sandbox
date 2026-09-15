<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/ConnectorRateLimitedException.php
// Do not edit here. Fix it in the package and re-run `node scripts/vendor.mjs --target <this directory>` there;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use Throwable;

/**
 * The provider asked us to slow down. It did nothing, and said so.
 *
 * `retryAfter` is carried through to the classification, because the provider's
 * own number is an instruction and ours is a guess. Ignoring theirs is how a
 * rate limit becomes a ban.
 */
final class ConnectorRateLimitedException extends ConnectorException
{
    /**
     * @param  list<Attempt>|null  $attempts  see {@see ConnectorException::__construct()}
     * @param  bool|null  $idempotent  see {@see ConnectorException::__construct()}
     */
    public function __construct(
        string $message,
        string $service = '',
        string $operation = '',
        ?int $status = null,
        ?string $providerCode = null,
        /** Seconds to wait, when the provider said. */
        public readonly ?int $retryAfter = null,
        ?Throwable $previous = null,
        ?array $attempts = null,
        ?bool $idempotent = null,
    ) {
        parent::__construct($message, $service, $operation, $status, $providerCode, $previous, $attempts, $idempotent);
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
