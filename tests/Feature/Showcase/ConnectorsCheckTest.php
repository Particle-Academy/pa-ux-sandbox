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
                packagistNameFrom($request->url()) => [['version' => 'v0.3.1'], ['version' => 'v0.2.1']],
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
                packagistNameFrom($request->url()) => [['version' => '0.3.1'], ['version' => '0.2.1']],
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
            'packages' => [packagistNameFrom($request->url()) => [['version' => 'v0.3.1'], ['version' => 'v0.2.1']]],
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
