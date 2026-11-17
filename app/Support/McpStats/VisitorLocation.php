<?php

namespace App\Support\McpStats;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Coarse visitor location from Cloudflare's request headers, the only source:
 * no IP is looked up and no GeoIP database is bundled.
 *
 *   CF-IPCountry                    two-letter code (needs Network > IP Geolocation)
 *   cf-ipcity, cf-iplatitude,       need the Managed Transform
 *   cf-iplongitude                  "Add visitor location headers"
 *
 * Everything is validated, because off-Cloudflare a client can send these
 * headers itself. Coordinates are rounded to one decimal (about 10 km), and
 * are kept only when both are present and in range.
 */
final class VisitorLocation
{
    /**
     * Cloudflare's "no country" code. T1 (Tor) is kept: it is a real answer,
     * it just has no place on a map.
     */
    private const UNKNOWN = 'XX';

    /**
     * @return array{country: string|null, city: string|null, latitude: float|null, longitude: float|null}
     */
    public static function fromRequest(Request $request): array
    {
        $none = ['country' => null, 'city' => null, 'latitude' => null, 'longitude' => null];

        if (! config('mcp-stats.geo.cloudflare_headers', true)) {
            return $none;
        }

        $country = strtoupper(trim((string) $request->header('CF-IPCountry')));
        if (preg_match('/^[A-Z][A-Z0-9]$/', $country) !== 1 || $country === self::UNKNOWN) {
            return $none;
        }

        $city = self::city($request->header('cf-ipcity'));
        $latitude = self::coordinate($request->header('cf-iplatitude'), 90);
        $longitude = self::coordinate($request->header('cf-iplongitude'), 180);

        if ($latitude === null || $longitude === null) {
            $latitude = $longitude = null;
        }

        return ['country' => $country, 'city' => $city, 'latitude' => $latitude, 'longitude' => $longitude];
    }

    private static function city(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        // Cloudflare sends UTF-8; strip control characters and markup-ish bytes.
        $city = trim(preg_replace('/[\p{C}<>"]+/u', '', $value) ?? '');

        return $city === '' ? null : Str::limit($city, 100, '');
    }

    private static function coordinate(mixed $value, int $bound): ?float
    {
        if (! is_string($value) || ! is_numeric(trim($value))) {
            return null;
        }

        $number = (float) trim($value);
        if (! is_finite($number) || abs($number) > $bound) {
            return null;
        }

        return round($number, 1);
    }
}
