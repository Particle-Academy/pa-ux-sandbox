<?php

namespace App\Support;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\IpUtils;

/**
 * Whether a request reached PHP from one of Cloudflare's edges.
 *
 * The answer comes from the TCP peer (`REMOTE_ADDR`) checked against the owned
 * range list in `config/trustedproxy.php`, never from a header: anything a
 * header says, a client that reaches the origin directly can say too. That is
 * the one fact every Cloudflare header (CF-Connecting-IP, CF-IPCountry, the
 * visitor-location set) is believed on.
 */
final class CloudflareNetwork
{
    public static function isFromCloudflare(Request $request): bool
    {
        $peer = $request->server->get('REMOTE_ADDR');

        return is_string($peer) && $peer !== '' && self::contains($peer);
    }

    public static function contains(string $ip): bool
    {
        $ranges = config('trustedproxy.cloudflare', []);

        return is_array($ranges) && $ranges !== [] && IpUtils::checkIp($ip, $ranges);
    }
}
