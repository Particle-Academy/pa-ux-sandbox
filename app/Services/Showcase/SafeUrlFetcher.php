<?php

namespace App\Services\Showcase;

use GuzzleHttp\Psr7\Uri;
use GuzzleHttp\Psr7\UriResolver;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
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
 *   - a small redirect cap, with every hop followed here, validated and
 *     pinned exactly like the first request.
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

    /**
     * What the last pin dialled: counts per family, how many AAAA were resolved
     * (dialled or not), and the family curl tries first.
     *
     * @var array{v4: int, v6: int, resolved_v6: int, first: 'IPv4'|'IPv6'|null}
     */
    protected array $dialled = ['v4' => 0, 'v6' => 0, 'resolved_v6' => 0, 'first' => null];

    /**
     * The statuses fetch() follows as a redirect when they carry a Location.
     */
    protected const REDIRECT_STATUSES = [301, 302, 303, 307, 308];

    /**
     * @var list<array{url: string, curl: array<int, mixed>}>
     */
    protected array $hops = [];

    /**
     * Set by the transfer callback when the current hop's body passed maxBytes.
     */
    protected bool $overCap = false;

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
        $this->hops = [];
        $current = $url;

        for ($redirects = 0; ; $redirects++) {
            $response = $this->fetchOneHop($current);

            $location = $response->header('Location');
            if (! in_array($response->status(), self::REDIRECT_STATUSES, true) || $location === '') {
                return $response;
            }

            if ($redirects >= $this->maxRedirects) {
                throw new FetchFailedException(
                    "HTTP phase failed: too many redirects (more than {$this->maxRedirects}), last at {$current}.",
                    'http',
                    null,
                );
            }

            // A relative Location is resolved against the URL that answered with it.
            // The next hop is then checked, resolved and pinned from scratch.
            $current = (string) UriResolver::resolve(new Uri($current), new Uri($location));
        }
    }

    /**
     * Every hop the last fetch made: the URL and the curl options it was pinned with.
     *
     * @return list<array{url: string, curl: array<int, mixed>}>
     */
    public function hops(): array
    {
        return $this->hops;
    }

    /**
     * One request, never following a redirect. Redirects are followed by fetch(), so
     * each hop is validated AND pinned: Guzzle's own redirect handling re-checked a
     * new host in on_redirect but then let curl resolve it unpinned, after the check.
     *
     * @throws UnsafeUrlException
     * @throws FetchFailedException
     */
    protected function fetchOneHop(string $url): Response
    {
        $this->assertSafe($url);

        // Pin the connection to the exact IPs validated in pinnedResolveOptions so a
        // low-TTL record can't rebind to a private/metadata address between the check
        // and the connect (DNS-rebinding TOCTOU). curl still sends the correct Host
        // header + TLS SNI. Built before the request so a failure can name what was dialled.
        $curl = $this->pinnedResolveOptions($url);
        $this->hops[] = ['url' => $url, 'curl' => $curl];

        $this->overCap = false;

        try {
            // No Referer is ever set, so none leaks across a hop.
            $response = Http::timeout($this->timeout)
                ->connectTimeout($this->timeout)
                ->withOptions([
                    'allow_redirects' => false,
                    'stream' => false,
                    'curl' => $curl + $this->sizeCapOptions(),
                ])
                ->withHeaders(['User-Agent' => 'FancyUI-ShowcaseVerifier/1.0'])
                ->get($url);
        } catch (ConnectionException|RequestException $e) {
            if ($this->overCap || $this->isFileSizeExceeded($e)) {
                throw $this->tooLarge($url, $e);
            }
            if ($e instanceof RequestException) {
                throw $e;
            }

            throw $this->describeFailure($e, $url);
        }

        // The last guard, for a handler that ran none of the curl options above
        // (Http::fake, or a non-curl handler): never hand back an over-cap body.
        if (strlen($response->body()) > $this->maxBytes) {
            throw $this->tooLarge($url);
        }

        return $response;
    }

    /**
     * curl options that cap the response at maxBytes, both refusing a declared
     * Content-Length over the cap and aborting a body (chunked or not) the moment
     * it passes it.
     *
     * Guzzle's own `progress` option cannot do this: its wrapper discards the
     * callback's return value, and an exception thrown inside a curl callback does
     * not stop the transfer (PHP aborts only on a non-zero return). So the transfer
     * callback is set on curl directly and returns 1 to abort, and
     * CURLOPT_MAXFILESIZE_LARGE backs it up inside curl itself.
     *
     * @return array<int, mixed>
     */
    protected function sizeCapOptions(): array
    {
        return [
            CURLOPT_MAXFILESIZE_LARGE => $this->maxBytes,
            CURLOPT_NOPROGRESS => false,
            CURLOPT_XFERINFOFUNCTION => function ($handle, int $downloadTotal, int $downloaded): int {
                if ($downloadTotal > $this->maxBytes || $downloaded > $this->maxBytes) {
                    $this->overCap = true;

                    return 1;
                }

                return 0;
            },
        ];
    }

    /**
     * True when curl itself refused the body for its size (CURLE_FILESIZE_EXCEEDED).
     */
    protected function isFileSizeExceeded(\Throwable $e): bool
    {
        for ($cause = $e; $cause !== null; $cause = $cause->getPrevious()) {
            $context = method_exists($cause, 'getHandlerContext') ? $cause->getHandlerContext() : [];
            if (($context['errno'] ?? null) === CURLE_FILESIZE_EXCEEDED) {
                return true;
            }
        }

        return false;
    }

    protected function tooLarge(string $url, ?\Throwable $previous = null): FetchFailedException
    {
        return new FetchFailedException(
            "HTTP phase failed: response too large (more than {$this->maxBytes} bytes) from {$url}.",
            'http',
            $this->dialled['first'],
            $previous,
        );
    }

    /**
     * A one-line account of a non-2xx answer: the status, the phase, and the address
     * family the answer came over.
     */
    public function describeResponse(Response $response): string
    {
        $ip = (string) ($response->handlerStats()['primary_ip'] ?? '');
        $over = $ip !== '' ? 'over '.$this->familyOf($ip).' '.$ip : $this->dialledLabel();

        return 'HTTP '.$response->status().' (HTTP phase'.($over !== '' ? ', '.$over : '').')';
    }

    /**
     * Resolve the URL's host once, re-validate EVERY one of those addresses, and
     * return the curl options pinning host:port to the validated IPs, so the
     * connection can't be rebound to an internal address after the check. A
     * literal-IP host needs no pin (it was validated in assertSafe).
     *
     * All addresses go in ONE CURLOPT_RESOLVE entry. libcurl keeps only the last
     * entry it is given for a host:port ("old addresses discarded"), so one entry
     * per address pinned a dual-stack site to its last AAAA alone. One entry keeps
     * every address, and lets curl's happy-eyeballs race the second family when
     * the first is slow.
     *
     * The order and families dialled follow `services.showcase_fetcher.ip_family`:
     *   - prefer-ipv4 (default): IPv4 first, IPv6 kept as the fallback;
     *   - ipv4-only: when the host has an A record, dial IPv4 alone;
     *   - resolver-order: the order DNS returned.
     * Whatever is dialled, every resolved address is validated first: an address
     * left out of the pin can still refuse the host.
     *
     * @return array<int, mixed>
     *
     * @throws UnsafeUrlException
     */
    protected function pinnedResolveOptions(string $url): array
    {
        $this->dialled = ['v4' => 0, 'v6' => 0, 'resolved_v6' => 0, 'first' => null];

        $parts = parse_url($url);
        $host = $parts['host'] ?? '';
        if ($host === '' || filter_var($host, FILTER_VALIDATE_IP)) {
            if ($host !== '') {
                $this->recordDialled([$host], 0);
            }

            return [];
        }

        $scheme = strtolower($parts['scheme'] ?? 'https');
        $port = $parts['port'] ?? ($scheme === 'https' ? 443 : 80);

        $ips = $this->resolve($host);
        foreach ($ips as $ip) {
            if ($this->isBlockedIp($ip)) {
                throw new UnsafeUrlException('The URL resolves to a private or reserved address.');
            }
        }

        $v4 = array_values(array_filter($ips, fn (string $ip): bool => $this->familyOf($ip) === 'IPv4'));
        $v6 = array_values(array_filter($ips, fn (string $ip): bool => $this->familyOf($ip) === 'IPv6'));

        $options = [];
        $mode = $this->ipFamilyMode();
        if ($mode === 'ipv4-only' && $v4 !== []) {
            $pinned = $v4;
            $options[CURLOPT_IPRESOLVE] = CURL_IPRESOLVE_V4;
        } elseif ($mode === 'resolver-order') {
            $pinned = array_values($ips);
        } else {
            $pinned = [...$v4, ...$v6];
        }

        if ($pinned === []) {
            return [];
        }

        $this->recordDialled($pinned, count($v6));

        $addresses = array_map(
            fn (string $ip): string => $this->familyOf($ip) === 'IPv6' ? "[{$ip}]" : $ip,
            $pinned,
        );

        // Union, not spread: spreading an int-keyed array renumbers it, and curl
        // option constants ARE int keys.
        return [CURLOPT_RESOLVE => ["{$host}:{$port}:".implode(',', $addresses)]] + $options;
    }

    /**
     * @param  list<string>  $pinned
     */
    protected function recordDialled(array $pinned, int $resolvedV6): void
    {
        $v4 = count(array_filter($pinned, fn (string $ip): bool => $this->familyOf($ip) === 'IPv4'));

        $this->dialled = [
            'v4' => $v4,
            'v6' => count($pinned) - $v4,
            'resolved_v6' => $resolvedV6,
            'first' => $pinned === [] ? null : $this->familyOf($pinned[0]),
        ];
    }

    /**
     * The configured address-family policy, falling back to prefer-ipv4 for an
     * unknown value so a typo in the env cannot switch pinning off.
     */
    protected function ipFamilyMode(): string
    {
        $mode = (string) config('services.showcase_fetcher.ip_family', 'prefer-ipv4');

        return in_array($mode, ['prefer-ipv4', 'ipv4-only', 'resolver-order'], true) ? $mode : 'prefer-ipv4';
    }

    /**
     * @return 'IPv4'|'IPv6'
     */
    protected function familyOf(string $ip): string
    {
        return str_contains($ip, ':') ? 'IPv6' : 'IPv4';
    }

    /**
     * The family the last pin dialled, as a phrase: "over IPv4" when only one family
     * was dialled, "IPv4 first, IPv6 fallback" when curl could race both. Empty when
     * nothing was pinned.
     */
    protected function dialledLabel(): string
    {
        ['v4' => $v4, 'v6' => $v6, 'first' => $first] = $this->dialled;

        if ($v4 > 0 && $v6 > 0) {
            $second = $first === 'IPv4' ? 'IPv6' : 'IPv4';

            return "{$first} first, {$second} fallback";
        }

        return match (true) {
            $v4 > 0 => 'over IPv4',
            $v6 > 0 => 'over IPv6',
            default => '',
        };
    }

    /**
     * Turn a connection-level failure into one that says how far the request got
     * and over which address family.
     */
    protected function describeFailure(ConnectionException $e, string $url): FetchFailedException
    {
        $raw = $e->getMessage();
        $previous = $e->getPrevious();
        // Guzzle's ConnectException and RequestException both carry curl's info here.
        $info = $previous !== null && method_exists($previous, 'getHandlerContext') ? $previous->getHandlerContext() : [];

        $phase = $this->phaseOf($raw, $info, str_starts_with(strtolower($url), 'https:'));

        $ip = (string) ($info['primary_ip'] ?? '');
        if ($ip !== '') {
            $family = $this->familyOf($ip);
            $over = "over {$family} {$ip}";
        } else {
            $over = $this->dialledLabel();
            $family = match (true) {
                $this->dialled['v4'] > 0 && $this->dialled['v6'] > 0 => 'IPv4+IPv6',
                $this->dialled['v4'] > 0 => 'IPv4',
                $this->dialled['v6'] > 0 => 'IPv6',
                default => null,
            };
        }

        $pinned = $this->dialled['v4'].' IPv4 + '.$this->dialled['v6'].' IPv6';
        $skipped = $this->dialled['resolved_v6'] - $this->dialled['v6'];
        if ($skipped > 0) {
            $pinned .= " ({$skipped} IPv6 resolved, not dialled)";
        }

        $label = ['connect' => 'connect phase', 'tls' => 'TLS phase', 'http' => 'HTTP phase'][$phase];
        $message = trim("{$label} failed {$over}").". Pinned {$pinned}. {$raw}";

        return new FetchFailedException($message, $phase, $family, $e);
    }

    /**
     * How far the request got. curl's own timings decide when the handler reported
     * them (connect_time stays 0 until the TCP connection is up, appconnect_time
     * until TLS is done); otherwise the cURL message does.
     *
     * @param  array<string, mixed>  $info
     * @return 'connect'|'tls'|'http'
     */
    protected function phaseOf(string $message, array $info, bool $https): string
    {
        if (isset($info['connect_time'])) {
            if ((float) $info['connect_time'] <= 0.0) {
                return 'connect';
            }

            return $https && (float) ($info['appconnect_time'] ?? 0) <= 0.0 ? 'tls' : 'http';
        }

        return match (true) {
            (bool) preg_match('/SSL|TLS|certificate/i', $message) => 'tls',
            (bool) preg_match('/Operation timed out|Empty reply|Recv failure|transfer closed|Failure when receiving/i', $message) => 'http',
            default => 'connect',
        };
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
        $packed = @inet_pton($ip);
        if ($packed === false) {
            return true;
        }

        if (strlen($packed) === 16) {
            // Local-use NAT64 (64:ff9b:1::/48, RFC 8215): refuse outright.
            if (str_starts_with($packed, "\x00\x64\xff\x9b\x00\x01")) {
                return true;
            }
            // Well-known NAT64 (64:ff9b::/96, RFC 6052) carries an IPv4 in its last
            // 32 bits and reaches it; judge it by that IPv4. FILTER_FLAG_GLOBAL_RANGE
            // does not treat this prefix as special, so 64:ff9b::a9fe:a9fe would reach
            // the cloud metadata address.
            if (str_starts_with($packed, "\x00\x64\xff\x9b".str_repeat("\x00", 8))) {
                return $this->isBlockedIp((string) inet_ntop(substr($packed, 12)));
            }
        }

        // GLOBAL_RANGE (PHP 8.2+) refuses everything not globally routable: RFC1918,
        // loopback, link-local (incl. 169.254.x, the cloud metadata range), reserved,
        // CGNAT 100.64.0.0/10, IPv6 ULA fc00::/7 and link-local fe80::/10, IPv4-mapped
        // ::ffff:0:0/96, 6to4 2002::/16 and Teredo 2001::/32. The old
        // NO_PRIV_RANGE | NO_RES_RANGE pair let CGNAT, 6to4 and Teredo through.
        return filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_GLOBAL_RANGE) === false;
    }
}
