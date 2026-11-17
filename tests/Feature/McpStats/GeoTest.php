<?php

use App\Models\McpRequest;
use App\Support\McpStats\CountryCentroids;
use App\Support\McpStats\VisitorLocation;
use Illuminate\Http\Request;
use Tests\TestCase;

uses(TestCase::class);

/**
 * POST one tools/list to /mcp carrying these request headers.
 *
 * @param  array<string, string>  $headers
 */
function geoPost(array $headers, string $peer = '172.64.10.20'): void
{
    // 172.64.10.20 is inside Cloudflare's 172.64.0.0/13: the headers below are
    // believed only from a Cloudflare edge.
    test()->withServerVariables(['REMOTE_ADDR' => $peer])->postJson('/mcp', [
        'jsonrpc' => '2.0',
        'id' => 1,
        'method' => 'tools/list',
    ], ['Accept' => 'application/json, text/event-stream'] + $headers)->assertOk();
}

it('records coarse location from the Cloudflare visitor-location headers', function () {
    geoPost([
        'CF-IPCountry' => 'de',
        'cf-ipcity' => 'Berlin',
        'cf-iplatitude' => '52.52437',
        'cf-iplongitude' => '13.41053',
        'cf-region' => 'Land Berlin',
    ]);

    $row = McpRequest::query()->sole();
    expect($row->country)->toBe('DE')
        ->and($row->city)->toBe('Berlin')
        ->and($row->latitude)->toBe(52.5)
        ->and($row->longitude)->toBe(13.4);
});

it('stores only the country when that is all Cloudflare sends', function () {
    geoPost(['CF-IPCountry' => 'FR']);

    $row = McpRequest::query()->sole();
    expect($row->country)->toBe('FR')
        ->and($row->city)->toBeNull()
        ->and($row->latitude)->toBeNull()
        ->and($row->longitude)->toBeNull();
});

it('stores no location without the headers', function () {
    geoPost([]);

    $row = McpRequest::query()->sole();
    expect($row->country)->toBeNull()->and($row->latitude)->toBeNull();
});

it('ignores spoofed location headers sent straight to the origin', function () {
    geoPost([
        'CF-IPCountry' => 'DE',
        'cf-ipcity' => 'Berlin',
        'cf-iplatitude' => '52.5',
        'cf-iplongitude' => '13.4',
    ], peer: '203.0.113.9');

    $row = McpRequest::query()->sole();
    expect($row->country)->toBeNull()
        ->and($row->city)->toBeNull()
        ->and($row->latitude)->toBeNull();
});

it('reads no location from a non-Cloudflare peer even without the middleware', function () {
    // Defence in depth: VisitorLocation checks the peer itself, so a code path
    // that skips the global middleware still cannot be fed a forged location.
    $request = Request::create('/mcp', 'POST', server: [
        'REMOTE_ADDR' => '203.0.113.9',
        'HTTP_CF_IPCOUNTRY' => 'DE',
    ]);

    expect(VisitorLocation::fromRequest($request)['country'])->toBeNull();
});

it('rejects malformed or out-of-range location headers', function (array $headers, ?string $country, ?float $lat) {
    $location = VisitorLocation::fromRequest(Request::create('/mcp', 'POST', server: collect($headers)
        ->mapWithKeys(fn ($v, $k) => ['HTTP_'.strtoupper(str_replace('-', '_', $k)) => $v])
        ->all() + ['REMOTE_ADDR' => '172.64.10.20']));

    expect($location['country'])->toBe($country)
        ->and($location['latitude'])->toBe($lat);
})->with([
    'unknown country' => [['CF-IPCountry' => 'XX'], null, null],
    'not a code' => [['CF-IPCountry' => 'Germany'], null, null],
    'script in country' => [['CF-IPCountry' => '<b'], null, null],
    'latitude out of range' => [['CF-IPCountry' => 'DE', 'cf-iplatitude' => '123', 'cf-iplongitude' => '13'], 'DE', null],
    'latitude not a number' => [['CF-IPCountry' => 'DE', 'cf-iplatitude' => 'abc', 'cf-iplongitude' => '13'], 'DE', null],
    'latitude without longitude' => [['CF-IPCountry' => 'DE', 'cf-iplatitude' => '52.5'], 'DE', null],
    'tor exit' => [['CF-IPCountry' => 'T1'], 'T1', null],
]);

it('reads nothing when Cloudflare location is turned off in config', function () {
    config(['mcp-stats.geo.cloudflare_headers' => false]);

    geoPost(['CF-IPCountry' => 'DE', 'cf-ipcity' => 'Berlin']);

    expect(McpRequest::query()->value('country'))->toBeNull();
});

it('places a country-only row at its centroid from the bundled table', function () {
    $de = CountryCentroids::for('DE');

    expect($de)->toBeArray()
        ->and($de['lat'])->toBeGreaterThan(47.0)->toBeLessThan(55.0)
        ->and($de['lng'])->toBeGreaterThan(5.0)->toBeLessThan(15.5)
        ->and(CountryCentroids::for('US')['lng'])->toBeLessThan(-60.0)
        ->and(CountryCentroids::for('zz'))->toBeNull()
        ->and(CountryCentroids::for('T1'))->toBeNull();
});

it('covers every country a visitor is likely to come from', function () {
    foreach (['US', 'GB', 'DE', 'FR', 'IN', 'CN', 'JP', 'BR', 'CA', 'AU', 'NL', 'ES', 'IT', 'PL', 'RU', 'KR', 'SE', 'MX', 'AR', 'ZA', 'NG', 'EG', 'ID', 'PH', 'VN', 'TR', 'UA', 'IL', 'SG', 'NZ', 'MM', 'BD', 'PK', 'KE', 'CO', 'CL', 'PT', 'IE', 'CH', 'AT', 'BE', 'DK', 'NO', 'FI', 'CZ', 'RO', 'GR', 'HU', 'TH', 'MY', 'AE', 'SA', 'TW', 'HK'] as $code) {
        $c = CountryCentroids::for($code);
        expect($c)->not->toBeNull("no centroid for {$code}");
        expect($c['lat'])->toBeGreaterThanOrEqual(-90.0)->toBeLessThanOrEqual(90.0);
        expect($c['lng'])->toBeGreaterThanOrEqual(-180.0)->toBeLessThanOrEqual(180.0);
    }
});
