<?php

use App\Services\Showcase\SafeUrlFetcher;
use App\Services\Showcase\UnsafeUrlException;
use Tests\TestCase;

uses(TestCase::class);

/*
 * A submitted hostname whose DNS answers with one of these forms must be refused.
 * PHP's NO_PRIV_RANGE | NO_RES_RANGE flags missed CGNAT, NAT64, 6to4 and Teredo
 * on PHP 8.4, and even FILTER_FLAG_GLOBAL_RANGE misses NAT64 (64:ff9b::/96), which
 * can carry the cloud metadata address. The forms come from Prism's guard work,
 * standardised across its three languages (2026-11-07).
 */

afterEach(fn () => SafeUrlFetcher::resolveUsing(null));

function refusesResolvedTo(string $ip): bool
{
    SafeUrlFetcher::resolveUsing(fn (string $host): array => [$ip]);

    try {
        (new SafeUrlFetcher)->assertSafe('https://submitted.example.com/');

        return false;
    } catch (UnsafeUrlException) {
        return true;
    }
}

it('refuses a host resolving to an internal or tunnelled address', function (string $ip) {
    expect(refusesResolvedTo($ip))->toBeTrue();
})->with([
    'CGNAT' => '100.64.0.1',
    'CGNAT upper' => '100.127.255.254',
    'IPv6 link-local' => 'fe80::1',
    'IPv6 ULA' => 'fd12:3456::1',
    'v4-mapped loopback' => '::ffff:127.0.0.1',
    'v4-mapped metadata' => '::ffff:169.254.169.254',
    'NAT64 metadata' => '64:ff9b::a9fe:a9fe',
    'NAT64 loopback' => '64:ff9b::7f00:1',
    'NAT64 private' => '64:ff9b::a00:1',
    'local NAT64' => '64:ff9b:1::1',
    '6to4 metadata' => '2002:a9fe:a9fe::',
    '6to4 loopback' => '2002:7f00:1::',
    'Teredo' => '2001::1',
    'loopback' => '127.0.0.1',
    'metadata' => '169.254.169.254',
]);

it('still allows a host resolving to a public address', function (string $ip) {
    expect(refusesResolvedTo($ip))->toBeFalse();
})->with([
    'public IPv4' => '93.184.215.14',
    'public IPv6' => '2606:2800:21f:cb07:6820:80da:af6b:8b2c',
    'NAT64 of a public IPv4' => '64:ff9b::5db8:d70e',
]);
