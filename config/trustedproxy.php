<?php

/*
|--------------------------------------------------------------------------
| Trusted proxies
|--------------------------------------------------------------------------
|
| ui.particle.academy is served through Cloudflare's proxy, so the TCP peer of
| every real request is a Cloudflare edge. Only those edges are trusted to say
| who the client is; trusting everyone (`*`) let any caller pick the address
| every rate limiter, IP hash and analytics row keyed on, by sending its own
| X-Forwarded-For.
|
| Read by Illuminate\Http\Middleware\TrustProxies (`proxies`) and by
| App\Support\CloudflareNetwork (`cloudflare`), which decides whether
| CF-Connecting-IP and the visitor-location headers are believed at all.
|
| `cloudflare` is an OWNED copy of Cloudflare's published ranges, not fetched at
| runtime: a network call on boot would put the trust boundary on someone
| else's uptime.
|
|   Source:      https://www.cloudflare.com/ips-v4
|                https://www.cloudflare.com/ips-v6
|                (same set as https://api.cloudflare.com/client/v4/ips)
|   Copied:      2026-11-17, etag 38f79d050aa027e3be3865e495dcc9bc
|   Re-check:    when Cloudflare announces a change, and at least quarterly.
|                A missing range is not a hole, it is lost IPs: requests from
|                a new edge are seen as coming from the edge itself.
|
| `extra` adds hops in front of PHP that are not Cloudflare. Loopback is the
| default so a local TLS proxy (Genie's https://fancy.gen) can still report the
| https scheme. Set TRUSTED_PROXIES_EXTRA if production ever gains a load
| balancer between Cloudflare and nginx; an empty value trusts no extras.
|
*/

$cloudflare = [
    // IPv4
    '173.245.48.0/20',
    '103.21.244.0/22',
    '103.22.200.0/22',
    '103.31.4.0/22',
    '141.101.64.0/18',
    '108.162.192.0/18',
    '190.93.240.0/20',
    '188.114.96.0/20',
    '197.234.240.0/22',
    '198.41.128.0/17',
    '162.158.0.0/15',
    '104.16.0.0/13',
    '104.24.0.0/14',
    '172.64.0.0/13',
    '131.0.72.0/22',
    // IPv6
    '2400:cb00::/32',
    '2606:4700::/32',
    '2803:f800::/32',
    '2405:b500::/32',
    '2405:8100::/32',
    '2a06:98c0::/29',
    '2c0f:f248::/32',
];

$extra = array_values(array_filter(array_map(
    trim(...),
    explode(',', (string) env('TRUSTED_PROXIES_EXTRA', '127.0.0.1,::1')),
), fn (string $entry): bool => $entry !== '' && $entry !== '*' && $entry !== '**'));

return [

    'cloudflare' => $cloudflare,

    'extra' => $extra,

    'proxies' => array_values(array_unique([...$cloudflare, ...$extra])),

];
