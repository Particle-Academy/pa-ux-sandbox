<?php

use App\Mcp\Servers\FancyUiRegistry;
use App\Support\Brand;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

uses(TestCase::class);

/**
 * The kit was renamed "Fancy UI" -> "Fancy Dev Kit" on 2026-11-15, and the
 * name now has ONE source: App\Support\Brand (PHP) and __BRAND_NAME__ (client,
 * extracted from the same file by vite.config.js).
 *
 * The old name had been typed into hundreds of strings, so these guards fail
 * if it comes back, in what the server renders AND in the source the client
 * bundle is built from (a PHP test cannot see what React renders, so the
 * source scan is the half that covers the header, footer and page copy).
 *
 * The one survivor is "Powered by Fancy UI": the embeddable badge wordmark that
 * customer sites already carry and that the pixel detector matches.
 */
const OLD_BRAND = '/(?<!Powered by )Fancy UI(?![A-Za-z])/';

it('names the kit Fancy Dev Kit, for SaaSy Agents', function () {
    expect(Brand::NAME)->toBe('Fancy Dev Kit')
        ->and(Brand::TAGLINE)->toBe('for SaaSy Agents')
        ->and(Brand::full())->toBe('Fancy Dev Kit for SaaSy Agents');
});

it('gives the client the same name the server uses', function () {
    $vite = (string) file_get_contents(base_path('vite.config.js'));
    $vitest = (string) file_get_contents(base_path('vitest.config.ts'));

    // Both configs must read Brand.php rather than carry a copy.
    expect($vite)->toContain('app/Support/Brand.php')->toContain('__BRAND_NAME__')
        ->and($vitest)->toContain('app/Support/Brand.php')->toContain('__BRAND_NAME__');
});

it('never renders the old name on a page, in the SEO head or in llms.txt', function (string $url) {
    $html = $this->get($url)->assertOk()->getContent();

    expect($html)->not->toContain('Fancy UI Kit')
        ->and(preg_match(OLD_BRAND, $html))->toBe(0, "old brand on {$url}")
        ->and($html)->toContain(Brand::NAME);
})->with([
    '/',
    '/packages',
    '/packages/react-fancy',
    '/docs',
    '/docs/installation',
    '/inspiration',
    '/learn',
    '/llms.txt',
    '/llms-full.txt',
]);

it('names the MCP server and its instructions with the new brand', function () {
    $instructions = FancyUiRegistry::instructions();

    expect($instructions)->toContain('The '.Brand::NAME.' install-MCP')
        ->not->toContain('{brand}')
        ->and(preg_match(OLD_BRAND, $instructions))->toBe(0);
});

it('has no old brand left in the source the site is built from', function () {
    $roots = ['app', 'config', 'routes', 'resources/js', 'resources/views', 'resources/docs', 'resources/css'];
    $hits = [];

    foreach ($roots as $root) {
        foreach (File::allFiles(base_path($root)) as $file) {
            if ($file->getRealPath() === realpath(app_path('Support/Brand.php'))) {
                continue; // records the rename itself
            }
            foreach (preg_split('/\R/', $file->getContents()) as $n => $line) {
                if (preg_match(OLD_BRAND, $line) || str_contains($line, 'Fancy UI Kit')) {
                    $hits[] = $file->getRelativePathname().':'.($n + 1);
                }
            }
        }
    }

    expect($hits)->toBe([], 'old brand typed into: '.implode(', ', $hits).' — use Brand::NAME / __BRAND_NAME__');
});
