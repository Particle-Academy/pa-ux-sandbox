<?php

namespace App\Services\Showcase;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * SSRF-safe HTTP fetch shared by the submission gate
 * (ShowcaseSubmissionController) and the background scanner
 * (ScanShowcaseSubmission). Centralised so both apply the same guards:
 *
 *   - only http / https schemes,
 *   - DNS-resolve the host and refuse private / loopback / link-local /
 *     metadata IP ranges (blocks SSRF to internal services),
 *   - a short connect + request timeout,
 *   - a bounded response size,
 *   - a small redirect cap.
 *
 * Returns the Illuminate HTTP Response on success, or throws
 * UnsafeUrlException when the URL is rejected before any request is made.
 */
class SafeUrlFetcher
{
    /**
     * Host → list-of-IPs resolver. Defaults to real DNS; tests swap this for
     * a deterministic map so they can exercise the SSRF guard without live
     * lookups. Signature: fn(string $host): list<string>.
     *
     * @var (callable(string): list<string>)|null
     */
    protected static $resolver = null;

    public function __construct(
        protected int $timeout = 10,
        protected int $maxBytes = 2_000_000,
        protected int $maxRedirects = 3,
    ) {}

    /**
     * Override the host resolver (test seam). Pass null to restore real DNS.
     *
     * @param  (callable(string): list<string>)|null  $resolver
     */
    public static function resolveUsing(?callable $resolver): void
    {
        static::$resolver = $resolver;
    }

    /**
     * Fetch the given URL with SSRF guards applied.
     *
     * @throws UnsafeUrlException when the URL fails a safety check.
     */
    public function fetch(string $url): Response
    {
        $this->assertSafe($url);

        return Http::timeout($this->timeout)
            ->connectTimeout($this->timeout)
            ->withOptions([
                'allow_redirects' => [
                    'max' => $this->maxRedirects,
                    'strict' => true,
                    'referer' => false,
                    'protocols' => ['http', 'https'],
                    // Re-validate the host each hop so a redirect can't
                    // bounce us onto an internal address.
                    'on_redirect' => function ($request, $response, $uri): void {
                        $this->assertSafe((string) $uri);
                    },
                ],
                'stream' => false,
                'max' => $this->maxBytes,
                // Pin the connection to the exact IPs we validate below so a
                // low-TTL record can't rebind to a private/metadata address
                // between the check and the connect (DNS-rebinding TOCTOU).
                // curl still sends the correct Host header + TLS SNI.
                'curl' => $this->pinnedResolveOptions($url),
            ])
            ->withHeaders(['User-Agent' => 'FancyUI-ShowcaseVerifier/1.0'])
            ->get($url);
    }

    /**
     * Resolve the URL's host once, re-validate those exact addresses, and
     * return a curl CURLOPT_RESOLVE map pinning host:port → validated IPs so the
     * connection can't be rebound to an internal address after the check. A
     * literal-IP host needs no pin (it was validated in assertSafe).
     *
     * @return array<int, mixed>
     *
     * @throws UnsafeUrlException
     */
    protected function pinnedResolveOptions(string $url): array
    {
        $parts = parse_url($url);
        $host = $parts['host'] ?? '';
        if ($host === '' || filter_var($host, FILTER_VALIDATE_IP)) {
            return [];
        }

        $scheme = strtolower($parts['scheme'] ?? 'https');
        $port = $parts['port'] ?? ($scheme === 'https' ? 443 : 80);

        $entries = [];
        foreach ($this->resolve($host) as $ip) {
            if ($this->isBlockedIp($ip)) {
                throw new UnsafeUrlException('The URL resolves to a private or reserved address.');
            }
            $entries[] = "{$host}:{$port}:{$ip}";
        }

        return $entries === [] ? [] : [CURLOPT_RESOLVE => $entries];
    }

    /**
     * Validate the URL is safe to fetch. Throws UnsafeUrlException otherwise.
     *
     * @throws UnsafeUrlException
     */
    public function assertSafe(string $url): void
    {
        $parts = parse_url($url);

        if ($parts === false || empty($parts['scheme']) || empty($parts['host'])) {
            throw new UnsafeUrlException('The URL is malformed.');
        }

        $scheme = strtolower($parts['scheme']);
        if (! in_array($scheme, ['http', 'https'], true)) {
            throw new UnsafeUrlException('Only http and https URLs are allowed.');
        }

        $host = $parts['host'];

        // Reject hosts given as a literal private/loopback IP outright.
        if (filter_var($host, FILTER_VALIDATE_IP) && $this->isBlockedIp($host)) {
            throw new UnsafeUrlException('The URL points at a private or reserved address.');
        }

        // Resolve the hostname and refuse if ANY resolved address is blocked.
        foreach ($this->resolve($host) as $ip) {
            if ($this->isBlockedIp($ip)) {
                throw new UnsafeUrlException('The URL resolves to a private or reserved address.');
            }
        }
    }

    /**
     * Resolve a host to its IP addresses. A literal IP resolves to itself.
     *
     * @return list<string>
     */
    protected function resolve(string $host): array
    {
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return [$host];
        }

        if (static::$resolver !== null) {
            return (static::$resolver)($host);
        }

        $ips = [];

        $records = @dns_get_record($host, DNS_A | DNS_AAAA);
        if (is_array($records)) {
            foreach ($records as $record) {
                if (! empty($record['ip'])) {
                    $ips[] = $record['ip'];
                }
                if (! empty($record['ipv6'])) {
                    $ips[] = $record['ipv6'];
                }
            }
        }

        if (empty($ips)) {
            $resolved = gethostbynamel($host);
            if (is_array($resolved)) {
                $ips = $resolved;
            }
        }

        // If resolution turns up nothing we cannot prove the host is safe,
        // so treat it as blocked by returning a sentinel loopback address.
        return empty($ips) ? ['127.0.0.1'] : $ips;
    }

    /**
     * True when the IP is in a private / loopback / link-local / reserved /
     * cloud-metadata range that must never be fetched.
     */
    protected function isBlockedIp(string $ip): bool
    {
        // PHP's filter flags catch RFC1918, loopback, link-local (incl.
        // 169.254.x — the cloud metadata range), and reserved blocks.
        $public = filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE,
        );

        return $public === false;
    }
}
