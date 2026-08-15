<?php

use App\Providers\SeoServiceProvider;
use App\Support\UseCases\UseCaseContent;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class);

/**
 * SEO + discovery surface owned by fancy-seo: the dynamic sitemap.xml + llms
 * endpoints and the server-rendered meta the Inertia SPA would otherwise hide
 * from crawlers. robots.txt / security.txt / humans.txt now live in
 * particle-academy/fancy-x-files — see tests/Feature/XFilesTest.php.
 */
it('serves a well-formed sitemap with the home page and package URLs', function () {
    $res = $this->get('/sitemap.xml');

    $res->assertOk();
    expect($res->headers->get('Content-Type'))->toContain('application/xml');
    $body = $res->getContent();
    expect($body)->toContain('<urlset');
    $res->assertSee(config('app.url').'/', false);
    $res->assertSee('/packages/react-fancy', false);
    // Parses as valid XML.
    expect(simplexml_load_string($body))->not->toBeFalse();
});

it('serves an llms.txt in the llmstxt.org shape with the package index', function () {
    $res = $this->get('/llms.txt');

    $res->assertOk();
    expect($res->headers->get('Content-Type'))->toContain('text/markdown');
    $res->assertSee('# Fancy UI', false);
    $res->assertSee('## Packages', false);
    $res->assertSee('/packages/fancy-slides', false);
    $res->assertSee('version '.SeoServiceProvider::VERSION, false);
});

it('serves llms-full.txt with the Human+ UX contract', function () {
    $res = $this->get('/llms-full.txt');

    $res->assertOk();
    $res->assertSee('Human+ UX contract', false);
    $res->assertSee('Controlled state', false);
});

it('renders server-side SEO meta + JSON-LD on the home page for crawlers', function () {
    $res = $this->get('/');

    $res->assertOk();
    $html = $res->getContent();
    // Real metadata is present on first byte — not just an empty SPA shell.
    expect($html)
        ->toContain('property="og:title"')
        ->toContain('property="og:image"')
        ->toContain('name="twitter:card"')
        ->toContain('rel="canonical"')
        ->toContain('application/ld+json')
        ->toContain('"@type":"SoftwareApplication"');
});

it('gives a package page its own title + canonical', function () {
    $res = $this->get('/packages/fancy-slides');

    $res->assertOk();
    $html = $res->getContent();
    expect($html)
        ->toContain('<title inertia>fancy-slides — Fancy UI</title>')
        ->toContain('rel="canonical" href="'.config('app.url').'/packages/fancy-slides"');
});

it('gives each docs page a unique title + Article/Breadcrumb JSON-LD', function () {
    $res = $this->get('/docs/human-plus-ux');

    $res->assertOk();
    $html = $res->getContent();
    expect($html)
        ->toContain('<title inertia>Human+ UX — Docs — Fancy UI</title>')
        ->toContain('"@type":"Article"')
        ->toContain('"@type":"BreadcrumbList"')
        ->toContain('rel="canonical" href="'.config('app.url').'/docs/human-plus-ux"');
});

it('serves a clean markdown variant of a docs page for LLM fetchers', function () {
    $res = $this->get('/docs/human-plus-ux.md');

    $res->assertOk();
    expect($res->headers->get('Content-Type'))->toContain('text/markdown');
    expect($res->getContent())->toContain('Human+ UX');

    // Non-doc paths 404.
    $this->get('/docs/does-not-exist.md')->assertNotFound();
});

it('lists docs pages in the sitemap', function () {
    $this->get('/sitemap.xml')->assertOk()->assertSee('/docs/human-plus-ux', false);
});

/**
 * Use cases were absent from the sitemap entirely -- the highest-INTENT content
 * on the site, reachable only by following an internal link.
 *
 * This lives HERE rather than in `UseCasesTest` for a reason worth recording:
 * the dynamic sitemap is filtered by fancy-x-files' admin controls, which are
 * database-backed. Under `RefreshDatabase` those controls are empty and the
 * rendered sitemap collapses to the home page, so the identical assertion fails
 * there while the application is perfectly correct. This file does not refresh
 * the database -- which is also why the docs assertion above passes.
 */
it('lists use-case pages in the sitemap', function () {
    $xml = $this->get('/sitemap.xml')->assertOk()->getContent();

    expect($xml)->toContain('/use-cases');

    foreach (UseCaseContent::all() as $useCase) {
        expect(str_contains($xml, "/use-cases/{$useCase['slug']}"))->toBeTrue(
            "use case [{$useCase['slug']}] is missing from the sitemap, so nothing will crawl it",
        );
    }
});

it('serves real 1200x630 PNG OG cards (GD-drawn — no headless Chrome needed)', function () {
    Storage::fake('public');

    foreach (['/og/default.png', '/og/packages/react-fancy.png'] as $path) {
        $res = $this->get($path);
        $res->assertOk();
        expect($res->headers->get('Content-Type'))->toBe('image/png');
        // The bytes must REALLY be a 1200×630 PNG: LinkedIn ignores the declared
        // og:image:width/height when the fetched image is a small square.
        $size = getimagesizefromstring($res->getContent());
        expect($size[0])->toBe(1200)
            ->and($size[1])->toBe(630)
            ->and($size['mime'])->toBe('image/png');
    }

    // Unknown package 404s.
    $this->get('/og/packages/not-a-real-package.png')->assertNotFound();
});

it('declares the og:image dimensions + type site-wide', function () {
    expect($this->get('/')->getContent())
        ->toContain('property="og:image:width" content="1200"')
        ->toContain('property="og:image:height" content="630"')
        ->toContain('property="og:image:type" content="image/png"')
        ->toContain('name="twitter:card" content="summary_large_image"');
});

it('points each page og:image at its card', function () {
    expect($this->get('/')->getContent())
        ->toContain('property="og:image" content="'.config('app.url').'/og/default.png"');
    expect($this->get('/packages/react-fancy')->getContent())
        ->toContain('property="og:image" content="'.config('app.url').'/og/packages/react-fancy.png"');
});
