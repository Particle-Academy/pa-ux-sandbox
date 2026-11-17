<?php

use App\Support\FeatureSites;
use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/*
 * /features/heuristics: interaction analytics as a Feature (owner, 2026-11-16).
 * It gathers the capability across packages: fancy-heuristics (PHP) and
 * fancy-heuristics-js (Node / browser collector) through their family, and
 * fancy-pixel, the one-script embed that renders the badge and feeds them.
 */

const HEURISTICS_DIR = 'resources/js/Pages/Features/Heuristics';

function heuristicsPage(TestCase $test): array
{
    $html = $test->get('/features/heuristics')->assertOk()->getContent();
    preg_match('#<script data-page="app" type="application/json">(.*?)</script>#s', $html, $page);

    return json_decode($page[1] ?? '{}', true) ?? [];
}

/** @return array<string, string> */
function heuristicsSources(): array
{
    $files = [];
    foreach (glob(base_path(HEURISTICS_DIR.'/*')) ?: [] as $path) {
        $files[basename($path)] = (string) file_get_contents($path);
    }

    return $files;
}

it('serves the Analytics & Heuristics page with the heuristics pair and the pixel, from the registry', function () {
    $page = heuristicsPage($this);
    $slugs = collect($page['props']['feature']['members'] ?? [])->pluck('slug')->all();

    expect($page['component'] ?? null)->toBe('Features/Heuristics/Index')
        ->and($page['props']['feature']['name'] ?? null)->toBe('Analytics & Heuristics')
        ->and($slugs)->toBe(['fancy-heuristics', 'fancy-heuristics-js', 'fancy-pixel']);
});

it('is in the Features menu, before Connectors, which stays last', function () {
    $nav = collect(FeatureSites::nav())->firstWhere('slug', 'heuristics');

    expect($nav)->not->toBeNull()
        ->and($nav['href'])->toBe('/features/heuristics')
        ->and($nav['name'])->toBe('Analytics & Heuristics')
        ->and(array_search('heuristics', FeatureSites::slugs(), true))->toBeLessThan(array_search('connectors', FeatureSites::slugs(), true));

    $shared = collect(heuristicsPage($this)['props']['features'] ?? [])->pluck('slug')->all();
    expect($shared)->toContain('heuristics');
});

it('lists only installable packages', function () {
    foreach (FeatureSites::find('heuristics')['memberSlugs'] as $slug) {
        expect(PackageRegistry::findAny($slug))->not->toBeNull()
            ->and(PackageRegistry::isHidden($slug))->toBeFalse()
            ->and(array_key_exists($slug, PackageRegistry::PLANNED))->toBeFalse();
    }
});

it('mounts the real pixel with no endpoint, so the demo sends nothing', function () {
    $sources = heuristicsSources();
    $all = implode("\n", $sources);

    expect($sources)->toHaveKey('Index.tsx')
        ->and($sources)->toHaveKey('PixelDemo.tsx')
        ->and($sources['PixelDemo.tsx'])->toContain('mountPixel(')
        ->and($sources['PixelDemo.tsx'])->not->toContain('endpoint:')
        ->and($sources['Index.tsx'])->toContain('<DemoFrame', '<FeatureTour', '<HowItFits', '<InstallSteps', '<PackagesGrid', '<FeatureCta')
        ->and($all)->not->toContain('TODO');
});

it('gives each demo pixel its own site key, because fancy-pixel mounts one pixel per key', function () {
    // fancy-pixel README, "One pixel per site key": a second mount with the
    // same key does not render another. With one shared key, only the Badge
    // card showed anything, on this page and on /packages/fancy-pixel/pixel.
    $demos = [
        'feature' => heuristicsSources()['PixelDemo.tsx'],
        'package' => (string) file_get_contents(resource_path('js/Pages/Packages/ComponentDemo.tsx')),
    ];

    foreach ($demos as $where => $src) {
        preg_match_all('/mountPixel\(\{[^}]*siteKey:\s*([^,\n]+)/', $src, $keys);
        expect($keys[1])->not->toBeEmpty("{$where}: no mountPixel call found");
        foreach ($keys[1] as $key) {
            expect(str_contains($key, '${style}'))->toBeTrue("{$where}: siteKey {$key} is shared by every style");
        }
    }
});

it('links to the live analytics dashboard with a full-page link the auth redirect survives', function () {
    // /analytics is auth-only; a guest lands on the GitHub-only /login.
    expect(heuristicsSources()['Index.tsx'])->toContain('href="/analytics"');
});

it('says consent is denied by default, as fancy-pixel does', function () {
    expect(heuristicsSources()['Index.tsx'])->toContain('denied by default');
});

it('loads its identity stylesheet with the site CSS, not from the page chunk', function () {
    expect((string) file_get_contents(resource_path('css/showcase.css')))
        ->toContain('@import "../js/Pages/Features/Heuristics/heuristics.css";')
        ->and(implode("\n", heuristicsSources()))->not->toContain('import "./heuristics.css"');
});
