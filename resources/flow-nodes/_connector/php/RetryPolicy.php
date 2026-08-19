<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/RetryPolicy.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * The retry budget for ONE request.
 *
 * Never for a sequence: wrapping a multi-message publish would re-send every
 * earlier segment when a later one failed, turning a partial send into a
 * duplicated one. See {@see Delivery::deliver()}.
 */
final readonly class RetryPolicy
{
    /**
     * @param  int  $attempts  total attempts, including the first
     * @param  int  $baseDelayMs  first backoff in ms; doubles each attempt
     * @param  int  $maxDelayMs  never wait longer than this between attempts
     * @param  bool  $idempotent  whether the provider makes a repeated request harmless.
     *                            false is correct for any connector that has not proven
     *                            otherwise, and "proven" means a test that writes twice and
     *                            compares the result, not a comment.
     */
    public function __construct(
        public int $attempts = 3,
        public int $baseDelayMs = 500,
        public int $maxDelayMs = 8000,
        public bool $idempotent = false,
    ) {}

    /** The conservative default: three attempts, and ambiguity is not retried. */
    public static function conservative(): self
    {
        return new self;
    }

    public function withIdempotent(bool $idempotent): self
    {
        return new self($this->attempts, $this->baseDelayMs, $this->maxDelayMs, $idempotent);
    }

    public function withAttempts(int $attempts): self
    {
        return new self($attempts, $this->baseDelayMs, $this->maxDelayMs, $this->idempotent);
    }
}
