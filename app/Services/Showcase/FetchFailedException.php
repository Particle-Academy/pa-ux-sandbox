<?php

namespace App\Services\Showcase;

use RuntimeException;
use Throwable;

/**
 * Thrown by SafeUrlFetcher when a URL passed the SSRF checks but the request to it
 * failed. Unlike the raw cURL message it says WHERE it failed and over WHICH address
 * family, so "cURL error 28" no longer reads the same for a dead IPv6 path, a TLS
 * stall and a server that accepted the connection and never answered.
 */
class FetchFailedException extends RuntimeException
{
    /**
     * @param  'connect'|'tls'|'http'  $phase  How far the request got before it failed.
     * @param  'IPv4'|'IPv6'|'IPv4+IPv6'|null  $family  The family dialled, or both when curl could race them.
     */
    public function __construct(
        string $message,
        public readonly string $phase,
        public readonly ?string $family,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }
}
