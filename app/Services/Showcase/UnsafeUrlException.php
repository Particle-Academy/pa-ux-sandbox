<?php

namespace App\Services\Showcase;

use RuntimeException;

/**
 * Thrown by SafeUrlFetcher when a URL fails an SSRF safety check before any
 * network request is made (bad scheme, private/loopback/metadata address).
 */
class UnsafeUrlException extends RuntimeException {}
