<?php


// GENERATED from particle-academy/fancy-connectors — php/src/ConnectorException.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use RuntimeException;
use Throwable;

/**
 * The connector error taxonomy — base class.
 *
 * A host that retries needs to know WHICH KIND of failure it is looking at.
 * "Something went wrong" is not enough information to choose between retrying,
 * pausing for a person and stopping — so every failure is classified at the
 * point it is known, which is inside the connector, not three frames up where
 * the type has already been lost.
 *
 * | class                                | kind                | retry?                            |
 * |--------------------------------------|---------------------|-----------------------------------|
 * | `ConnectorConfigException`           | `Rejected`          | never — a second attempt does not set a key |
 * | `ConnectorAuthException`             | `Rejected`          | never — hammering a bad credential locks accounts |
 * | `ConnectorRateLimitedException`      | `RefusedExplicitly` | yes, after `retryAfter`           |
 * | `ConnectorTransientException`        | `RefusedExplicitly` | yes — a 5xx is the provider saying it did nothing |
 * | `ConnectorAmbiguousException`        | `Ambiguous`         | ONLY where the connector is idempotent |
 * | `ConnectorUnreachableException`      | `Unreachable`       | yes — it never arrived            |
 * | `ConnectorRequestException`          | `Rejected`          | never — a 4xx we caused fails the same way twice |
 *
 * ## What changed from the previous runtime, and why it is a fix
 *
 * `ConnectorTransientException` used to mean *5xx OR a thrown transport*, with
 * `retryable() === true`. Those are opposite cases. A 5xx is the provider
 * reporting that it did nothing; a thrown transport may be a socket that closed
 * after the bytes went out. Retrying the second on a connector with no
 * idempotency key is a silent double write — the failure this whole layer exists
 * to prevent.
 *
 * So the two are separate classes now, {@see kind()} is the primitive, and
 * {@see retryable()} answers the narrow question *is this safe whatever the
 * connector is?* An older caller reading `retryable()` therefore becomes
 * conservative rather than wrong.
 */
class ConnectorException extends RuntimeException implements ClassifiedFailure
{
    public function __construct(
        string $message,
        public readonly string $service = '',
        public readonly string $operation = '',
        public readonly ?int $status = null,
        public readonly ?string $providerCode = null,
        ?Throwable $previous = null,
    ) {
        // The code is always 0: a provider's own error code is a STRING for
        // most providers and is carried as `providerCode`. Squeezing it into
        // `Exception::$code` would lose every non-numeric one silently.
        parent::__construct($message, 0, $previous);
    }

    /**
     * What kind of failure this is. The primitive every retry decision reads.
     *
     * `Ambiguous` on the base class deliberately: an unclassified failure must
     * not be assumed safe.
     */
    public function kind(): FailureKind
    {
        return FailureKind::Ambiguous;
    }

    /**
     * Safe to retry WITHOUT knowing anything about the connector.
     *
     * Ambiguous failures answer false here even though they may be retryable on
     * an idempotent connector — ask `Delivery::shouldRetry($kind, $policy)` for
     * that. This is the conservative half on purpose.
     */
    public function retryable(): bool
    {
        return Delivery::isUnconditionallyRetryable($this->kind());
    }

    /** The classification, in the shape `Delivery::deliver()` reads off a throwable. */
    public function classified(): Classified
    {
        return new Classified($this->kind(), $this->getMessage());
    }
}
