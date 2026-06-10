<?php

use App\Support\RobotsTxt;
use App\Support\Seo;
use Tests\TestCase;

uses(TestCase::class);

/**
 * SEO + discovery surface: the standard *.txt / sitemap endpoints and the
 * server-rendered meta the Inertia SPA would otherwise hide from crawlers.
 */
it('serves a robots.txt that welcomes LLM bots and points at the sitemap', function () {
    $res = $this->get('/robots.txt');

    $res->assertOk();
    expect($res->headers->get('Content-Type'))->toContain('text/plain');
    $res->assertSee('User-agent: GPTBot', false);
    $res->assertSee('User-agent: ClaudeBot', false);
    $res->assertSee('Sitemap: '.config('app.url').'/sitemap.xml', false);
});

it('disallows the admin + auth surface for every user-agent, including AI bots', function () {
    $res = $this->get('/robots.txt');
    $res->assertOk();

    // The disallow block repeats for the wildcard group AND each AI-bot group,
    // so the dashboard is off-limits to every crawler (no per-bot Allow leak).
    expect(substr_count((string) $res->getContent(), 'Disallow: /admin'))->toBeGreaterThan(1);
    $res->assertSee('Disallow: /auth', false)
        ->assertSee('Disallow: /login', false)
        ->assertSee('Disallow: /profile', false);
});

it('RobotsTxt evaluates Disallow/Allow with longest-prefix precedence', function () {
    $body = "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /auth\n";
    expect(RobotsTxt::allows($body, '/'))->toBeTrue()
        ->and(RobotsTxt::allows($body, '/packages'))->toBeTrue()
        ->and(RobotsTxt::allows($body, '/admin/sites'))->toBeFalse()
        ->and(RobotsTxt::allows($body, '/auth/github'))->toBeFalse();

    // A more specific Allow overrides a broader Disallow.
    $nested = "User-agent: *\nDisallow: /admin\nAllow: /admin/public\n";
    expect(RobotsTxt::allows($nested, '/admin/secret'))->toBeFalse()
        ->and(RobotsTxt::allows($nested, '/admin/public/x'))->toBeTrue();

    // No rules → allowed.
    expect(RobotsTxt::allows('', '/admin'))->toBeTrue();
});

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
    $res->assertSee('version '.Seo::VERSION, false);
});

it('serves llms-full.txt with the Human+ UX contract', function () {
    $res = $this->get('/llms-full.txt');

    $res->assertOk();
    $res->assertSee('Human+ UX contract', false);
    $res->assertSee('Controlled state', false);
});

it('serves an RFC 9116 security.txt at the well-known path and the alias', function () {
    foreach (['/.well-known/security.txt', '/security.txt'] as $path) {
        $res = $this->get($path);
        $res->assertOk();
        $res->assertSee('Contact: mailto:', false);
        $res->assertSee('Expires:', false);
    }
});

it('serves a humans.txt', function () {
    $this->get('/humans.txt')->assertOk()->assertSee('humans.txt', false);
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
