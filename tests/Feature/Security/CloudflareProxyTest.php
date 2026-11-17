<?php

use App\Models\McpRequest;
use App\Support\McpStats\IpHasher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The site sits behind Cloudflare's proxy, so every request's TCP peer is a
 * Cloudflare edge. The real client address arrives in CF-Connecting-IP, and is
 * believed ONLY when the peer is inside Cloudflare's published ranges
 * (config/trustedproxy.php). Anyone can reach the origin directly and send the
 * same header; from them it is spoofing and must change nothing.
 *
 * 203.0.113.0/24 and 198.51.100.0/24 are RFC 5737 documentation ranges, and
 * 2001:db8::/32 is RFC 3849: none of them is Cloudflare.
 */
const CF_EDGE_V4 = '172.64.10.20';      // inside 172.64.0.0/13
const CF_EDGE_V6 = '2606:4700:10::1';    // inside 2606:4700::/32
const NOT_CF = '203.0.113.9';
const VISITOR = '198.51.100.7';

beforeEach(function () {
    Route::get('/_test/client-ip', fn (Request $request) => response()->json([
        'ip' => $request->ip(),
        'country' => $request->header('CF-IPCountry'),
        'connecting' => $request->header('CF-Connecting-IP'),
    ]));

    Route::get('/_test/throttled', fn () => 'ok')->middleware('throttle:1,1');
});

function fromPeer(string $peer, array $headers = []): TestResponse
{
    return test()->withServerVariables(['REMOTE_ADDR' => $peer])
        ->getJson('/_test/client-ip', $headers);
}

it('ignores a spoofed CF-Connecting-IP from a non-Cloudflare address', function () {
    $response = fromPeer(NOT_CF, ['CF-Connecting-IP' => VISITOR]);

    expect($response->json('ip'))->toBe(NOT_CF)
        ->and($response->json('connecting'))->toBeNull('the forged header must not survive for later code to read');
});

it('uses CF-Connecting-IP when the request comes from a Cloudflare address', function () {
    expect(fromPeer(CF_EDGE_V4, ['CF-Connecting-IP' => VISITOR])->json('ip'))->toBe(VISITOR);
});

it('uses CF-Connecting-IP from a Cloudflare IPv6 edge, including an IPv6 visitor', function () {
    expect(fromPeer(CF_EDGE_V6, ['CF-Connecting-IP' => '2001:db8::5'])->json('ip'))->toBe('2001:db8::5');
});

it('prefers CF-Connecting-IP over a client-forged X-Forwarded-For relayed by Cloudflare', function () {
    // Cloudflare APPENDS to whatever X-Forwarded-For the client sent, so the
    // leftmost entry is the client's own claim.
    $response = fromPeer(CF_EDGE_V4, [
        'CF-Connecting-IP' => VISITOR,
        'X-Forwarded-For' => '6.6.6.6, '.VISITOR,
    ]);

    expect($response->json('ip'))->toBe(VISITOR);
});

it('ignores X-Forwarded-For from a non-Cloudflare address', function () {
    // Regression: trustProxies(at: '*') believed this from anybody, so any
    // caller could pick the IP every rate limiter keyed on.
    expect(fromPeer(NOT_CF, ['X-Forwarded-For' => VISITOR])->json('ip'))->toBe(NOT_CF);
});

it('falls back to the edge-appended address when CF-Connecting-IP is not an IP', function () {
    $response = fromPeer(CF_EDGE_V4, [
        'CF-Connecting-IP' => 'not-an-ip',
        'X-Forwarded-For' => VISITOR,
    ]);

    expect($response->json('ip'))->toBe(VISITOR);
});

it('strips every Cloudflare header from a request that did not come through Cloudflare', function () {
    $response = fromPeer(NOT_CF, ['CF-IPCountry' => 'DE', 'CF-Connecting-IP' => VISITOR]);

    expect($response->json('country'))->toBeNull()
        ->and($response->json('connecting'))->toBeNull();
});

it('keeps Cloudflare headers on a request that came through Cloudflare', function () {
    expect(fromPeer(CF_EDGE_V4, ['CF-IPCountry' => 'DE', 'CF-Connecting-IP' => VISITOR])->json('country'))->toBe('DE');
});

it('keys the rate limiter on the visitor, not on the Cloudflare edge', function () {
    $hit = fn (string $visitor) => test()->withServerVariables(['REMOTE_ADDR' => CF_EDGE_V4])
        ->get('/_test/throttled', ['CF-Connecting-IP' => $visitor]);

    $hit(VISITOR)->assertOk();
    $hit(VISITOR)->assertStatus(429);
    // Same edge, different visitor: a separate bucket. Keyed on the edge, every
    // visitor routed through it would share one limit.
    $hit('198.51.100.8')->assertOk();
});

it('hashes the visitor IP, not the edge, for MCP usage', function () {
    test()->withServerVariables(['REMOTE_ADDR' => CF_EDGE_V4])->postJson('/mcp', [
        'jsonrpc' => '2.0', 'id' => 1, 'method' => 'tools/list',
    ], ['Accept' => 'application/json, text/event-stream', 'CF-Connecting-IP' => VISITOR])->assertOk();

    expect(McpRequest::query()->value('ip_hash'))->toBe(app(IpHasher::class)->hash(VISITOR, now()));
});

it('trusts only the dated Cloudflare list (plus loopback), never everything', function () {
    $cloudflare = config('trustedproxy.cloudflare');
    $proxies = config('trustedproxy.proxies');

    expect($cloudflare)->toHaveCount(22)
        ->and($cloudflare)->toContain('173.245.48.0/20', '172.64.0.0/13', '2606:4700::/32', '2a06:98c0::/29')
        ->and($proxies)->not->toContain('*')
        ->and($proxies)->not->toContain('**')
        ->and($proxies)->not->toContain('0.0.0.0/0')
        ->and($proxies)->not->toContain('::/0');

    foreach ($cloudflare as $range) {
        [$ip, $bits] = explode('/', $range);
        expect(filter_var($ip, FILTER_VALIDATE_IP))->not->toBeFalse("{$range} is not an address")
            ->and((int) $bits)->toBeGreaterThan(0);
    }

    expect(array_values(array_diff($proxies, $cloudflare)))->toEqualCanonicalizing(['127.0.0.1', '::1']);
});
