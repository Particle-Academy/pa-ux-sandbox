<?php

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

/*
 * `connectors:check` — and specifically, that it fails when it cannot tell.
 *
 * The command's whole value is that a stale index goes RED rather than quietly
 * serving versions nobody publishes any more. That value is destroyed by one
 * mistake: treating an unreachable registry as "fine". A blip that reads as
 * published is worse than having no check, because it is a check people trust.
 *
 * So the interesting assertions here are the failure ones. Every request is
 * faked — a test that reached the real registries would be measuring the
 * network, and would go red on a Tuesday for reasons having nothing to do with
 * this repo.
 */

it('passes when every package resolves at the claimed version', function () {
    Http::fake([
        'registry.npmjs.org/*' => Http::response(['name' => 'x'], 200),
        'pypi.org/*' => Http::response(['info' => []], 200),
        'repo.packagist.org/*' => fn ($request) => Http::response([
            'packages' => [
                packagistNameFrom($request->url()) => claimedPackagistVersions(),
            ],
        ], 200),
    ]);

    $this->artisan('connectors:check')->assertSuccessful();
});

it('FAILS when a claimed version 404s', function () {
    Http::fake([
        'registry.npmjs.org/*' => Http::response([], 404),
        'pypi.org/*' => Http::response(['info' => []], 200),
        'repo.packagist.org/*' => fn ($request) => Http::response([
            'packages' => [packagistNameFrom($request->url()) => [['version' => 'v0.3.1']]],
        ], 200),
    ]);

    $this->artisan('connectors:check')->assertFailed();
});

it('FAILS on an unreachable registry rather than counting it as current', function () {
    // The rule that makes the check trustworthy. A 500 is not a "no" and it is
    // certainly not a "yes" — it is the absence of an answer, and the command
    // has to say so.
    Http::fake([
        'registry.npmjs.org/*' => Http::response('upstream exploded', 500),
        'pypi.org/*' => Http::response(['info' => []], 200),
        'repo.packagist.org/*' => fn ($request) => Http::response([
            'packages' => [packagistNameFrom($request->url()) => [['version' => 'v0.3.1']]],
        ], 200),
    ]);

    $this->artisan('connectors:check')->assertFailed();
});

it('FAILS a Packagist package that answers 200 while carrying no such version', function () {
    // `p2/<name>.json` returns 200 for a package that has never tagged a
    // release, so a status check alone would pass a package with no versions at
    // all. The version has to be looked for inside the document.
    Http::fake([
        'registry.npmjs.org/*' => Http::response(['name' => 'x'], 200),
        'pypi.org/*' => Http::response(['info' => []], 200),
        'repo.packagist.org/*' => fn ($request) => Http::response([
            'packages' => [packagistNameFrom($request->url()) => [['version' => 'v0.0.1']]],
        ], 200),
    ]);

    $this->artisan('connectors:check')->assertFailed();
});

it('accepts a Packagist tag with or without the v prefix', function () {
    Http::fake([
        'registry.npmjs.org/*' => Http::response(['name' => 'x'], 200),
        'pypi.org/*' => Http::response(['info' => []], 200),
        'repo.packagist.org/*' => fn ($request) => Http::response([
            'packages' => [
                // No `v`, which is equally valid and means the same release.
                packagistNameFrom($request->url()) => claimedPackagistVersions(''),
            ],
        ], 200),
    ]);

    $this->artisan('connectors:check')->assertSuccessful();
});

it('asks the per-VERSION endpoint, not the packument', function () {
    // Asking `/<name>` would check that the package EXISTS, which it does, and
    // would therefore pass every stale version forever.
    Http::fake([
        'registry.npmjs.org/*' => Http::response(['name' => 'x'], 200),
        'pypi.org/*' => Http::response(['info' => []], 200),
        'repo.packagist.org/*' => fn ($request) => Http::response([
            'packages' => [packagistNameFrom($request->url()) => claimedPackagistVersions()],
        ], 200),
    ]);

    $this->artisan('connectors:check')->assertSuccessful();

    Http::assertSent(function ($request) {
        if (! str_contains($request->url(), 'registry.npmjs.org')) {
            return true;
        }

        // .../@particle-academy%2fstripe-ui/0.3.1 — the trailing version is the
        // entire point.
        return (bool) preg_match('#registry\.npmjs\.org/.+/\d+\.\d+\.\d+$#', $request->url());
    });

    Http::assertSent(function ($request) {
        if (! str_contains($request->url(), 'pypi.org')) {
            return true;
        }

        return str_ends_with($request->url(), '/json')
            && (bool) preg_match('#/pypi/[^/]+/\d+\.\d+\.\d+/json$#', $request->url());
    });
});

/** The Packagist package name embedded in a `p2` url. */
function packagistNameFrom(string $url): string
{
    preg_match('#/p2/(.+)\.json#', $url, $matches);

    return $matches[1] ?? '';
}

/**
 * Every Packagist version the index actually claims, shaped as a `p2`
 * document's version list.
 *
 * Read from the index rather than hand-listed, because that is what the
 * happy-path fakes above MEAN: "the registry has what we claim". Hand-listing
 * the versions encoded something else — "the registry has v0.3.1 and v0.2.1" —
 * which is a property of the fixture, not of the command, and it rotted the
 * first time a connector arrived on a version no existing one used. Adding six
 * connectors on 0.1.0 failed three tests, none of which was about 0.1.0, and
 * all of which would have passed against the real registry.
 *
 * The FAILURE tests below deliberately keep fixed fixtures. Each one asserts on
 * a specific mismatch, so following the index would erase the thing they test.
 */
function claimedPackagistVersions(string $prefix = 'v'): array
{
    $index = json_decode(
        (string) file_get_contents(resource_path('registry/connectors.json')),
        true,
    );

    $versions = [];
    foreach ($index['connectors'] ?? [] as $connector) {
        foreach ($connector['packages'] ?? [] as $package) {
            if (($package['registry'] ?? null) === 'packagist' && isset($package['version'])) {
                $versions[$package['version']] = true;
            }
        }
    }

    // Guard the guard: an index that yielded nothing would make every
    // happy-path fake return an empty version list, and those tests would fail
    // for a reason having nothing to do with the command.
    expect($versions)->not->toBeEmpty('no packagist versions found in the connector index');

    return array_map(
        fn (string $version) => ['version' => $prefix.$version],
        array_keys($versions),
    );
}
