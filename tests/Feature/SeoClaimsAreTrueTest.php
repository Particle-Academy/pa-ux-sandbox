<?php

use App\Http\Controllers\Showcase\HomeController;
use App\Http\Controllers\Showcase\StarterKitController;
use App\Mcp\Servers\FancyUiRegistry;
use App\Support\GalleryRegistry;
use App\Support\PackageRegistry;
use App\Support\Seo\KitFacts;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The site's meta says true things about the kit.
 *
 * `SeoTest` proves the meta is PRESENT. This proves it is RIGHT, and it exists
 * because every claim below was once wrong on the live site while every
 * presence check passed:
 *
 * - the home title and link preview said "React, PHP, Node" and "every server
 *   capability ships for both PHP and Node", while six Python packages were on
 *   PyPI and most PHP packages had no Node twin;
 * - the SoftwareApplication JSON-LD and llms.txt said "version 0.2" after the
 *   kit cut 0.5;
 * - every package page, holy-sheet and laravel-fms included, called itself
 *   "bridgeable over MCP";
 * - the gallery described two collections when there were three.
 *
 * Each test ties a sentence to the data it has to agree with, so the next
 * change to the kit fails a build instead of a link preview.
 */

/** @return array<string, string> meta name/property => content */
function metaOf(string $html): array
{
    // fancy-seo renders `head-key` first, so the attributes are read per tag
    // rather than assumed to be in any order.
    preg_match_all('#<meta\s[^>]*>#i', $html, $tags);

    return collect($tags[0])
        ->filter(fn (string $tag) => preg_match('#\s(?:name|property)="[^"]+"#i', $tag) && preg_match('#\scontent="[^"]*"#i', $tag))
        ->mapWithKeys(function (string $tag) {
            preg_match('#\s(?:name|property)="([^"]+)"#i', $tag, $key);
            preg_match('#\scontent="([^"]*)"#i', $tag, $content);

            return [$key[1] => html_entity_decode($content[1], ENT_QUOTES)];
        })
        ->all();
}

function titleOf(string $html): string
{
    preg_match('#<title[^>]*>(.*?)</title>#si', $html, $m);

    return html_entity_decode(trim($m[1] ?? ''), ENT_QUOTES);
}

it('names exactly the languages the kit ships for, in the home title and link preview', function () {
    $languages = KitFacts::languages();
    expect($languages)->toContain('React')->toContain('PHP');

    $html = $this->get('/')->assertOk()->getContent();
    $meta = metaOf($html);

    foreach ([titleOf($html), $meta['description'], $meta['og:description'], $meta['twitter:title']] as $claim) {
        foreach (['React', 'PHP', 'Node', 'Python'] as $language) {
            expect(str_contains($claim, $language))->toBe(
                in_array($language, $languages, true),
                "\"{$claim}\" ".(in_array($language, $languages, true) ? 'leaves out' : 'claims')." {$language}",
            );
        }
    }
});

it('never claims every server capability ships for both PHP and Node', function () {
    // Most PHP packages have no Node twin (fancy-seo, laravel-fun-lab, the
    // prism family...). "Every" was the sentence in the preview.
    $meta = metaOf($this->get('/')->assertOk()->getContent());

    expect(strtolower($meta['description']))->not->toContain('every server capability');
});

it('states the kit version in the JSON-LD and llms.txt, not a typed one', function () {
    $version = KitFacts::kitVersion();
    expect($version)->not->toBe('0.0');

    expect($this->get('/')->getContent())->toContain('"softwareVersion":"'.$version.'"');

    $llms = $this->get('/llms.txt')->assertOk()->getContent();
    expect($llms)->toContain('Kit version '.$version);
    expect($this->get('/llms-full.txt')->getContent())->toContain('Kit version '.$version);
});

it('names every registry the kit publishes to in llms.txt', function () {
    $llms = $this->get('/llms.txt')->assertOk()->getContent();

    expect(KitFacts::registries())->toContain('PyPI');
    foreach (KitFacts::registries() as $registry) {
        expect($llms)->toContain($registry);
    }
    // It described the kit as "React + Laravel UI primitives" with Python, Node
    // engines and document writers on the list below it.
    expect($llms)->not->toContain('React + Laravel UI primitives');
});

it('does not call a headless package bridgeable over MCP', function () {
    $headless = collect(PackageRegistry::all())->firstWhere('kind', 'headless');
    expect($headless)->not->toBeNull('no headless package in all(); this check would assert nothing');

    $meta = metaOf($this->get('/packages/'.$headless['slug'])->assertOk()->getContent());

    expect($meta['description'])->toStartWith(trim($headless['tagline']));
    expect(strtolower($meta['description']))->not->toContain('bridgeable');
});

it('describes every inspiration collection that exists', function () {
    $meta = metaOf($this->get('/inspiration')->assertOk()->getContent());

    $collections = GalleryRegistry::collections();
    expect(count($collections))->toBeGreaterThan(1);
    foreach ($collections as $collection) {
        expect($meta['description'])->toContain($collection['name']);
    }
});

it('describes the starter kits that are on the page, not a promise', function () {
    $meta = metaOf($this->get('/starter-kits')->assertOk()->getContent());

    expect(strtolower($meta['description']))->not->toContain('production-ready');
    foreach (StarterKitController::kits() as $kit) {
        expect($meta['description'])->toContain($kit['name']);
    }
});

it('counts react-fancy components from its component list', function () {
    $reactFancy = PackageRegistry::find('react-fancy');

    expect($reactFancy['tagline'])->toContain((string) count($reactFancy['components']).' components');
});

it('gives the home page the same languages its meta names', function () {
    expect((new HomeController)->props()['languages'])->toBe(KitFacts::languages());
});

it('keeps package counts out of the introduction, which cannot compute them', function () {
    // Markdown has no way to read the registry. "64 small, independent packages
    // -- 47 TypeScript and 16 PHP" stood there after the kit reached 97.
    $intro = (string) file_get_contents(resource_path('docs/introduction.md'));

    expect($intro)->not->toMatch('/\b\d+ (small|TypeScript|PHP)\b/');
    expect($intro)->not->toMatch('/other \d+ unless/');
});

it('tells MCP clients the real package count and every language', function () {
    $instructions = (new ReflectionMethod(FancyUiRegistry::class, 'instructions'))->invoke(null);

    expect($instructions)->toContain(KitFacts::packageCount().' packages');
    foreach (KitFacts::languages() as $language) {
        expect($instructions)->toContain($language);
    }
    expect($instructions)->not->toContain('more languages on the roadmap');
});
