<?php

use App\Support\Downloads\PublishedNames;
use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/**
 * Download counts are looked up by the name a package is PUBLISHED under, which
 * is often not its slug: `last-word-js` is `@particle-academy/last-word` on npm,
 * `holy-sheet-py` is `fancy-holy-sheet` on PyPI. Asking a registry for the slug
 * would return a 404, which reads as "no downloads" rather than "wrong question".
 */
function targetsFor(string $slug): array
{
    return collect(PublishedNames::targets())
        ->where('slug', $slug)
        ->mapWithKeys(fn (array $t) => [$t['source'] => $t['name']])
        ->all();
}

it('uses the published npm name, not the slug', function () {
    expect(targetsFor('last-word-js'))->toBe(['npm' => '@particle-academy/last-word'])
        ->and(targetsFor('react-fancy'))->toBe(['npm' => '@particle-academy/react-fancy'])
        ->and(targetsFor('fancy-cli'))->toBe(['npm' => 'fancy-cli']);
});

it('uses the published Packagist name, including a packagist-only app template', function () {
    expect(targetsFor('fancy-git-github-php'))->toBe(['packagist' => 'particle-academy/fancy-git-github'])
        ->and(targetsFor('fancy-starter-kit'))->toBe(['packagist' => 'particle-academy/fancy-starter-kit']);
});

it('uses the published PyPI name', function () {
    expect(targetsFor('holy-sheet-py'))->toBe(['pypi' => 'fancy-holy-sheet'])
        ->and(targetsFor('prism-py'))->toBe(['pypi' => 'prism-ai-core']);
});

it('walks every ecosystem a polyglot package publishes to', function () {
    expect(targetsFor('fancy-template'))->toBe([
        'npm' => '@particle-academy/fancy-template',
        'packagist' => 'particle-academy/fancy-template',
        'pypi' => 'fancy-template',
    ]);
});

it('derives targets from the registry for a package it has never seen', function () {
    $targets = PublishedNames::for([
        'slug' => 'made-up',
        'npm' => '@particle-academy/made-up',
        'composer' => 'particle-academy/made-up-php',
        'packagist' => 'particle-academy/made-up-php',
    ]);

    expect($targets)->toBe([
        ['slug' => 'made-up', 'source' => 'npm', 'name' => '@particle-academy/made-up'],
        ['slug' => 'made-up', 'source' => 'packagist', 'name' => 'particle-academy/made-up-php'],
    ]);
});

it('skips a package with nothing published, and every hidden package', function () {
    expect(targetsFor('catalog-fms'))->toBe([]);

    $hidden = PackageRegistry::HIDDEN;
    expect($hidden)->not->toBe([]); // otherwise the next loop asserts nothing
    foreach ($hidden as $slug) {
        expect(targetsFor($slug))->toBe([]);
    }
});

it('lists each slug and source once', function () {
    $keys = collect(PublishedNames::targets())->map(fn (array $t) => $t['slug'].'|'.$t['source']);

    expect($keys->count())->toBeGreaterThan(100)
        ->and($keys->duplicates()->all())->toBe([]);
});
