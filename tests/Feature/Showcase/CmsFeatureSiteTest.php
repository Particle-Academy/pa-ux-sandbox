<?php

use Tests\TestCase;

uses(TestCase::class);

/*
 * /features/cms: the CMS micro-site (Phase B, .ai/plans/features-microsites.md).
 *
 * PHP cannot render the React page, so this pins two things: the props the
 * server hands the page (from App\Support\FeatureSites), and the page source
 * itself, which must carry a live fancy-cms-ui editor rather than the Phase A
 * stub's TODO placeholders.
 */

function cmsFeaturePage(TestCase $test): array
{
    $html = $test->get('/features/cms')->assertOk()->getContent();
    preg_match('#<script data-page="app" type="application/json">(.*?)</script>#s', $html, $page);

    return json_decode($page[1] ?? '{}', true) ?? [];
}

/** Every source file of the CMS micro-site, concatenated. */
function cmsFeatureSource(): string
{
    $source = '';
    foreach (glob(resource_path('js/Pages/Features/Cms/*.{ts,tsx,css}'), GLOB_BRACE) ?: [] as $file) {
        $source .= (string) file_get_contents($file)."\n";
    }

    return $source;
}

it('serves the CMS page with its feature props', function () {
    $page = cmsFeaturePage($this);

    expect($page['component'] ?? null)->toBe('Features/Cms/Index')
        ->and($page['props']['feature']['slug'] ?? null)->toBe('cms')
        // charlotte joined on 2026-10-27, when v0.1.0 became installable from Packagist.
        ->and(array_column($page['props']['feature']['members'] ?? [], 'slug'))->toBe(['fancy-cms', 'fancy-cms-ui', 'charlotte'])
        ->and($page['props']['feature']['theme']['font'] ?? null)->toBe('serif')
        ->and(array_column($page['props']['feature']['bridges'] ?? [], 'name'))->toContain('registerCmsBridge');
});

it('has no Phase A placeholders left', function () {
    $source = cmsFeatureSource();

    expect($source)->not->toBe('')
        ->and($source)->not->toContain('TODO')
        ->and($source)->not->toContain('feature-todo');
});

it('demos the real fancy-cms-ui editor on a seeded document', function () {
    $source = cmsFeatureSource();

    expect($source)->toMatch('#import\s*\{[^}]*\bEditor\b[^}]*\}\s*from\s*"@particle-academy/fancy-cms-ui#')
        ->and($source)->toContain('<Editor')
        ->and($source)->toContain('<CmsPage')
        ->and($source)->toContain('<DemoFrame')
        ->and($source)->toContain('imageResolver');
});

it('renders every kit section from feature data, not typed copies', function () {
    $source = cmsFeatureSource();

    expect($source)->toMatch('/<HowItFits\s+members=\{feature\.members\}\s+bridges=\{feature\.bridges\}/')
        ->and($source)->toMatch('/<InstallSteps\s+members=\{feature\.members\}/')
        ->and($source)->toMatch('/<PackagesGrid\s+members=\{feature\.members\}/')
        ->and($source)->toContain('<FeatureTour')
        ->and($source)->toContain('<FeatureCta');
});

it('says fancy-cms is early release and announces nothing uninstallable', function () {
    $source = cmsFeatureSource();

    // The page source names no package by hand. Charlotte reaches the page only
    // through feature data, which resolves through PackageRegistry, so it shows
    // only once it is installable. Its unbuilt siblings (charlotte-ui/-js/-py)
    // are still PLANNED and must never be named here.
    expect($source)->toMatch('/early[- ]release/i')
        ->and($source)->not->toMatch('/charlotte-(ui|js|py)/i');
});
