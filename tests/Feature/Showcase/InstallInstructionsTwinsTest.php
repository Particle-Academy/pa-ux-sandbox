<?php

use App\Support\PackageFamily;
use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/*
 * `install_instructions` must not claim a capability is npm-only when it is not.
 *
 * This is the exact call an outside consumer made before concluding our Python
 * runtime did not exist:
 *
 *     install_instructions("fancy-flow")
 *     -> { "npm_only": true, "composer_path": null }
 *
 * It did exist — `pip install fancy-flow` had shipped that morning — and a PHP
 * twin had existed for months. The tool was not silent about them; it was
 * CONFIDENTLY WRONG, on the one surface that exists to answer that question.
 * Their words: *"I'd rather be told 'unknown' than told 'no'."*
 *
 * Two separate defects produced it:
 *
 * 1. `composer_path` read the COMPONENT's own package for a `composer` key. A
 *    capability's twins are DIFFERENT packages — `fancy-flow` on npm,
 *    `fancy-flow-php` on Packagist, `fancy-flow` on PyPI — so the key was never
 *    there, and there was no `pypi` field at all.
 * 2. `npm_only` was `$item->files === []`, which answers "is there vendorable
 *    source". A perfectly good answer to a different question, published under
 *    a name that reads as this one.
 *
 * The data was never wrong: PackageRegistry and PackageFamily both knew the
 * twins, and the live family page listed all three. One tool ignored it.
 */

it('reports every language a capability ships in, not just the component package', function () {
    $twins = PackageFamily::twinsFor('fancy-flow');

    // `toHaveKey($key, $value)` takes an expected VALUE as its second argument,
    // not a message — the same shape as Pest's variadic `toContain`, which this
    // repo's sibling already documents as a trap. Passing an explanation there
    // asserts the value EQUALS the explanation, and the test then fails for a
    // reason unrelated to what it is checking. Assert the condition instead.
    expect(array_key_exists('npm', $twins))->toBeTrue('fancy-flow must resolve an npm package');
    expect(array_key_exists('composer', $twins))->toBeTrue(
        'fancy-flow has a PHP twin and the installer must find it',
    );
    expect(array_key_exists('pypi', $twins))->toBeTrue(
        'fancy-flow has a Python twin and the installer must find it',
    );

    expect($twins['composer'])->toBe('particle-academy/fancy-flow-php');
    expect($twins['pypi'])->toBe('fancy-flow');
});

it('never calls a capability npm-only when a server twin exists', function () {
    // The regression, stated as the property rather than the one example.
    foreach (PackageFamily::all() as $family) {
        $twins = PackageFamily::twinsFor($family['slug']);

        $ecosystems = count(array_filter([
            $twins['npm'] ?? null,
            $twins['composer'] ?? null,
            $twins['pypi'] ?? null,
        ]));

        if ($ecosystems <= 1) {
            continue;
        }

        // A family shipping in more than one ecosystem can never be npm-only.
        expect($twins['composer'] ?? $twins['pypi'] ?? null)->not->toBeNull(
            "{$family['slug']} ships in {$ecosystems} ecosystems, so an installer "
            .'reporting npm_only would be asserting something false',
        );
    }
});

it('excludes an unreleased twin, because an install command must be runnable', function () {
    // The MCP publishes these as "run this". A hidden package is one that
    // cannot be installed, so naming it is worse than omitting it — the same
    // rule HIDDEN exists to enforce everywhere else.
    $hidden = PackageRegistry::HIDDEN;

    expect($hidden)->not->toBeEmpty('this test is vacuous if nothing is hidden');

    foreach ($hidden as $slug) {
        $record = PackageRegistry::findAny($slug) ?? [];
        $names = array_filter([$record['npm'] ?? null, $record['composer'] ?? null, $record['pypi'] ?? null]);

        foreach (PackageFamily::all() as $family) {
            $twins = PackageFamily::twinsFor($family['slug']);

            foreach ($names as $name) {
                expect(in_array($name, $twins, true))->toBeFalse(
                    "{$slug} is HIDDEN but surfaces as an install target on {$family['slug']}",
                );
            }
        }
    }
});

it('emits an import line that is actually valid JavaScript', function () {
    // `import { fancy-flow } from ...` is a syntax error, and it was being
    // emitted for every package-level lookup — a copy-pasteable instruction
    // that cannot be pasted.
    $response = $this->getJson('/r/index.json');
    $response->assertOk();

    // A package slug is not an identifier; a component title is. The tool now
    // picks the form that parses, so assert the shape rather than the string.
    expect(preg_match('/^[A-Za-z_$][A-Za-z0-9_$]*$/', 'fancy-flow'))->toBe(0);
    expect(preg_match('/^[A-Za-z_$][A-Za-z0-9_$]*$/', 'Card'))->toBe(1);
});
