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
    $chrome = [
        'resources/js/Pages/Layout.tsx',
        'resources/js/Pages/Home.tsx',
        'resources/js/cms/registry.tsx',
    ];

    foreach ($chrome as $file) {
        expect(file_get_contents(base_path($file)))
            ->not->toContain('v0.4', "hardcoded kit version in $file — use __KIT_VERSION__");
    }
});
