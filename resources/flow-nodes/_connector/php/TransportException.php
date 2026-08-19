<?php


// GENERATED from particle-academy/fancy-connectors — php/src/TransportException.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use Throwable;

/**
 * A transport failed before any HTTP status arrived — and it says which KIND of
 * nothing happened.
 *
 * ## Why the transport has to say, rather than the classifier guessing
 *
 * The TypeScript twin classifies a thrown transport by its Node error code
 * (`ECONNREFUSED`, `ETIMEDOUT`, …). PHP has no equivalent vocabulary: a thrown
 * exception from a Guzzle-shaped client, a Laravel `ConnectionException` and a
 * hand-rolled socket wrapper all arrive as "some throwable with a message", and
 * MESSAGE TEXT IS NOT AN API — it is localised, it changes between library
 * versions, and matching on it would silently start classifying differently
 * after a minor bump nobody read the notes for.
 *
 * So the transport carries the fact instead. {@see fromCurlErrno()} maps the
 * cURL codes for the bundled {@see CurlTransport}; a host binding its own
 * transport calls {@see unreachable()} or {@see ambiguous()} and gets identical
 * guarantees with no dependency on this file's guesswork.
 *
 * A transport that says NOTHING is classified `Ambiguous` — never
 * `Unreachable`. That asymmetry is the whole safety property: an unknown failure
 * treated as unreachable would be retried, and the one thing worse than a lost
 * call is two calls nobody asked for.
 */
final class TransportException extends ConnectorException
{
    private function __construct(
        string $message,
        private readonly FailureKind $failureKind,
        /** The cURL errno, where one is known. Kept for the message a person reads. */
        public readonly ?int $curlErrno = null,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, previous: $previous);
    }

    /** The request provably never left. Safe to repeat. */
    public static function unreachable(string $message, ?int $curlErrno = null, ?Throwable $previous = null): self
    {
        return new self($message, FailureKind::Unreachable, $curlErrno, $previous);
    }

    /** Nobody can tell whether it arrived. Retryable only on an idempotent connector. */
    public static function ambiguous(string $message, ?int $curlErrno = null, ?Throwable $previous = null): self
    {
        return new self($message, FailureKind::Ambiguous, $curlErrno, $previous);
    }

    /**
     * Classify a cURL errno.
     *
     * Only the codes that PROVE nothing left map to unreachable:
     *
     * - `CURLE_COULDNT_RESOLVE_HOST` (6) — no address, so no bytes.
     * - `CURLE_COULDNT_CONNECT` (7) — the connection was refused at the door.
     * - `CURLE_SEND_ERROR` (55) / `CURLE_RECV_ERROR` (56) — the socket broke.
     *
     * `CURLE_OPERATION_TIMEDOUT` (28) is AMBIGUOUS. We stopped waiting; that
     * says nothing about whether the provider acted on the request. Treating a
     * timeout as unreachable is precisely the double write this package exists
     * to prevent, and it is the single easiest line here to get wrong.
     *
     * Everything else — including codes a future cURL adds — is ambiguous.
     */
    public static function fromCurlErrno(int $errno, string $message, ?Throwable $previous = null): self
    {
        $detail = "curl error {$errno}: {$message}";

        return match ($errno) {
            6, 7, 55, 56 => self::unreachable($detail, $errno, $previous),
            default => self::ambiguous($detail, $errno, $previous),
        };
    }

    public function kind(): FailureKind
    {
        return $this->failureKind;
    }
}
