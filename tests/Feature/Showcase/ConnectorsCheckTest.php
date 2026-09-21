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
        '*packages/list.json*' => Http::response(['packageNames' => vendorListingFromIndex()], 200),
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
        '*packages/list.json*' => Http::response(['packageNames' => vendorListingFromIndex()], 200),
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
        '*packages/list.json*' => Http::response(['packageNames' => vendorListingFromIndex()], 200),
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
        '*packages/list.json*' => Http::response(['packageNames' => vendorListingFromIndex()], 200),
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
        '*packages/list.json*' => Http::response(['packageNames' => vendorListingFromIndex()], 200),
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
        '*packages/list.json*' => Http::response(['packageNames' => vendorListingFromIndex()], 200),
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

/*
 * Completeness — is the index SHORT?
 *
 * The tests above ask whether everything LISTED resolves. Nothing asked whether
 * the list was complete, and that gap was not hypothetical: `zoom` shipped on
 * 2026-09-21 and sat unlisted while this command reported all 100 packages fine.
 * It surfaced only because the catalogue's author mentioned the count in a
 * message. The index had gone stale twice before, the same way, each time with
 * every check green.
 */

/*
 * A NOTE ON THE FIXTURE SLUG BELOW.
 *
 * These originally appended `particle-academy/zoom-php`, which was a real
 * connector missing from the index at the time. Then the index was refreshed
 * to 26 and zoom joined it — so the fixture appended a name the index already
 * knew, the check correctly found nothing missing, and the test asserting a
 * FAILURE went red. It had encoded a property of that week's index rather than
 * of the command.
 *
 * A synthetic slug cannot be overtaken by a refresh. `particle-academy/`
 * prefixed so it still looks like the vendor listing it is standing in for.
 */
const ABSENT_CONNECTOR = 'particle-academy/notaconnector-php';

it('FAILS when a published connector is missing from the index', function () {
    Http::fake([
        '*packages/list.json*' => Http::response([
            'packageNames' => [...vendorListingFromIndex(), ABSENT_CONNECTOR],
        ], 200),
        'registry.npmjs.org/*' => Http::response(['name' => 'x'], 200),
        'pypi.org/*' => Http::response(['info' => []], 200),
        'repo.packagist.org/*' => fn ($request) => Http::response([
            'packages' => [packagistNameFrom($request->url()) => claimedPackagistVersions()],
        ], 200),
    ]);

    $this->artisan('connectors:check')
        ->expectsOutputToContain('notaconnector')
        ->assertFailed();
});

it('does not mistake a non-connector `-php` package for a connector', function () {
    // `particle-academy/fancy-flow-php` is the workflow runtime, not a
    // connector, and it really is in that vendor listing. Any rule keyed on the
    // `-php` suffix alone reports it as a missing connector forever. The whole
    // QUARTET has to exist — here the npm and PyPI halves 404.
    Http::fake([
        '*packages/list.json*' => Http::response([
            'packageNames' => [...vendorListingFromIndex(), 'particle-academy/fancy-flow-php'],
        ], 200),
        'registry.npmjs.org/@particle-academy%2ffancy-flow*' => Http::response([], 404),
        'pypi.org/pypi/fancy-fancy-flow/*' => Http::response([], 404),
        'registry.npmjs.org/*' => Http::response(['name' => 'x'], 200),
        'pypi.org/*' => Http::response(['info' => []], 200),
        'repo.packagist.org/*' => fn ($request) => Http::response([
            'packages' => [packagistNameFrom($request->url()) => claimedPackagistVersions()],
        ], 200),
    ]);

    $this->artisan('connectors:check')->assertSuccessful();
});

it('FAILS on an empty vendor listing rather than reporting nothing missing', function () {
    // An empty answer is not an answer. Reading it as "no connectors exist that
    // we lack" is the vacuous pass this command exists to refuse.
    Http::fake([
        '*packages/list.json*' => Http::response(['packageNames' => []], 200),
        'registry.npmjs.org/*' => Http::response(['name' => 'x'], 200),
        'pypi.org/*' => Http::response(['info' => []], 200),
        'repo.packagist.org/*' => fn ($request) => Http::response([
            'packages' => [packagistNameFrom($request->url()) => claimedPackagistVersions()],
        ], 200),
    ]);

    $this->artisan('connectors:check')->assertFailed();
});

it('FAILS when it cannot tell whether a candidate is a connector', function () {
    // The first version of this returned "not a connector" when a probe failed,
    // so an unreachable npm would have reported the index complete. Same rule as
    // the version check above, applied to the question it did not used to ask.
    Http::fake([
        '*packages/list.json*' => Http::response([
            'packageNames' => [...vendorListingFromIndex(), ABSENT_CONNECTOR],
        ], 200),
        'registry.npmjs.org/@particle-academy%2fnotaconnector*' => Http::response('upstream exploded', 500),
        'registry.npmjs.org/*' => Http::response(['name' => 'x'], 200),
        'pypi.org/*' => Http::response(['info' => []], 200),
        'repo.packagist.org/*' => fn ($request) => Http::response([
            'packages' => [packagistNameFrom($request->url()) => claimedPackagistVersions()],
        ], 200),
    ]);

    $this->artisan('connectors:check')->assertFailed();
});

/**
 * The index's own Packagist package names, as the vendor listing returns them.
 *
 * Derived rather than hand-listed, for the reason the version fixture below
 * gives: a hand-listed set encodes a property of the fixture, and rots the first
 * time a connector is added.
 *
 * Note this is keyed on the package NAME, not on `slug` or `service`. The index
 * carries all three and they disagree — `amazon_ses` / `amazon-ses` /
 * `particle-academy/amazon-ses-php` — but they AGREE for `buffer`, `discord`,
 * `gmail`, `stripe` and a dozen more, so comparing the wrong one passes a
 * spot-check and reports every multi-word connector as missing.
 *
 * @return list<string>
 */
function vendorListingFromIndex(): array
{
    $index = json_decode(
        (string) file_get_contents(resource_path('registry/connectors.json')),
        true,
    );

    $names = [];
    foreach ($index['connectors'] ?? [] as $connector) {
        $name = $connector['packages']['php']['name'] ?? null;

        if (is_string($name) && $name !== '') {
            $names[] = $name;
        }
    }

    // Guard the guard, same as below: an empty listing would trip the command's
    // own vacuity check and fail every test here for the wrong reason.
    expect($names)->not->toBeEmpty('no packagist package names found in the connector index');

    return $names;
}

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
