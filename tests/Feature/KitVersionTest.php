<?php

use Tests\TestCase;

uses(TestCase::class);

it('reads the kit version from kit.json', function () {
    $declared = json_decode((string) file_get_contents(base_path('kit.json')), true);

    expect(config('kit.version'))->toBe($declared['version']);
});

it('states a version, never the fallback', function () {
    // config/kit.php falls back to "0.0" if kit.json is missing or malformed.
    // Seeing that in the footer would be worse than a stale number, because it
    // looks like a real version.
    expect(config('kit.version'))->not->toBe('0.0');
});

/**
 * The whole reason kit.json exists. The react-fancy version in the footer was
 * hardcoded once and drifted twelve minor versions behind before anyone
 * noticed; the kit version was on its way to the same fate across four files.
 */
it('has no hardcoded kit version left in the site chrome', function () {
    // The seeded CMS home document is on this list because it is exactly how
    // the drift got out: it is a COPY of Home's hero, so the guard covering
    // Home.tsx said nothing about it, and it sat on the public homepage reading
    // "v0.4" after the cut to 0.5. Any file that renders the version belongs
    // here, not just the ones written as components.
    $chrome = [
        'resources/js/Pages/Layout.tsx',
        'resources/js/Pages/Home.tsx',
        'resources/js/cms/registry.tsx',
        'resources/js/cms/home-seed.ts',
    ];

    foreach ($chrome as $file) {
        expect(file_get_contents(base_path($file)))
            ->not->toMatch('/\bv\d+\.\d+\b/', "hardcoded kit version in $file — use __KIT_VERSION__");
    }
});

/**
 * The other half of the same failure. The version was stale in the seed, but so
 * were "64 small packages" and "12 UI packages" — and `Home`'s Hero already
 * carries a comment saying the "N UI packages" phrasing undercounted the kit by
 * more than half. A count typed into a document is a count nothing can keep
 * true, so the seed binds them from the server instead.
 */
it('does not hardcode a package count in the seeded CMS document', function () {
    $seed = (string) file_get_contents(base_path('resources/js/cms/home-seed.ts'));

    expect($seed)->not->toMatch('/\d+\s+(small|UI)\s+packages/', 'hardcoded package count in home-seed.ts — bind it from the server');
});
