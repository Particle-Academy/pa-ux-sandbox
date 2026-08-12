<?php

declare(strict_types=1);

use Tests\TestCase;

uses(TestCase::class);

/**
 * The Inertia page finder must point at a directory that exists — spelled the
 * way the filesystem spells it.
 *
 * This guards a bug that was invisible on Windows for as long as the app has
 * existed. `app('inertia.view-finder')` reads `inertia.pages.paths`, whose
 * VENDOR default is `resource_path('js/pages')` — lowercase. This app's pages
 * live in `js/Pages`. A case-insensitive filesystem resolves one to the other,
 * so every `assertInertia(->component(...))` passed locally; the first CI run
 * on Linux failed 112 of them, naming files that were sitting right there in
 * the checkout.
 *
 * `is_dir()` is NOT a sufficient assertion here — it is exactly as
 * case-insensitive as the filesystem underneath it, so it passes on Windows
 * with the wrong spelling and proves nothing. These compare the configured
 * path to the real directory entry as a STRING, which behaves the same on
 * every platform, and then resolve a real page through the finder.
 */
it('points the page finder at the directory that actually exists, spelled exactly', function () {
    $paths = config('inertia.pages.paths');

    expect($paths)->toBeArray()->not->toBeEmpty();

    foreach ($paths as $path) {
        $normalized = str_replace('\\', '/', $path);
        $parent = dirname($normalized);
        $name = basename($normalized);

        expect(is_dir($parent))->toBeTrue("parent of configured page path is missing: {$parent}");

        // The case-sensitive part: the entry must appear in its parent's
        // listing under this exact name.
        expect(scandir($parent))->toContain($name);
    }
});

it('resolves a real page component through the finder', function () {
    // End-to-end: whatever the config says, the thing AssertableInertia calls
    // has to actually find a page. UseCases/Index is a plain .tsx with no
    // special casing.
    $found = app('inertia.view-finder')->find('UseCases/Index');

    expect($found)->toBeString();
    expect(file_exists($found))->toBeTrue();
});

it('lists tsx among the finder extensions', function () {
    // Every page in this app is .tsx. The vendor default extension list does
    // not include it at all, which is the other half of the same drift.
    expect(config('inertia.pages.extensions'))->toContain('tsx');
});
