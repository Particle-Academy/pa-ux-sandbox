<?php

use ParticleAcademy\XFiles\Robots\RobotsPolicy;
use Tests\TestCase;

uses(TestCase::class);

/**
 * Well-known files served by particle-academy/fancy-x-files: robots.txt,
 * .well-known/security.txt, humans.txt. The robots.txt is built with
 * RobotsTxt::protect(), making the historic "/admin leaked into a per-AI-bot
 * Allow" bug structurally impossible.
 */
it('serves a robots.txt that welcomes LLM bots and points at the sitemap', function () {
    $res = $this->get('/robots.txt');

    $res->assertOk();
    expect($res->headers->get('Content-Type'))->toContain('text/plain');
    $res->assertSee('User-agent: GPTBot', false);
    $res->assertSee('User-agent: ClaudeBot', false);
    $res->assertSee('Sitemap: '.config('app.url').'/sitemap.xml', false);
});

it('keeps /admin disallowed for a welcomed AI bot and for the wildcard group', function () {
    $body = (string) $this->get('/robots.txt')->assertOk()->getContent();

    // The robots policy is the same evaluator the scraper honors. Even though
    // GPTBot has its own permissive group (Allow: /), /admin must stay blocked.
    $policy = RobotsPolicy::parse($body);

    expect($policy->allowed('/admin/sites', 'GPTBot'))->toBeFalse()
        ->and($policy->allowed('/admin/sites', '*'))->toBeFalse()
        ->and($policy->allowed('/auth/github', 'GPTBot'))->toBeFalse()
        ->and($policy->allowed('/profile', 'ClaudeBot'))->toBeFalse()
        // …yet the public site is freely crawlable for the welcomed bot.
        ->and($policy->allowed('/packages/react-fancy', 'GPTBot'))->toBeTrue();

    // Belt + suspenders: the literal Disallow appears in more than one group
    // (the wildcard group AND each welcomed AI bot group), so no per-bot leak.
    expect(substr_count($body, 'Disallow: /admin'))->toBeGreaterThan(1);
});

it('serves an RFC 9116 security.txt with a Contact and a future Expires', function () {
    $res = $this->get('/.well-known/security.txt');

    $res->assertOk();
    expect($res->headers->get('Content-Type'))->toContain('text/plain');
    $res->assertSee('Contact: mailto:', false);
    $res->assertSee('Preferred-Languages: en', false);

    $body = (string) $res->getContent();
    expect(preg_match('/^Expires: (.+)$/m', $body, $m))->toBe(1);
    expect(strtotime($m[1]))->toBeGreaterThan(time());
});

it('serves a humans.txt', function () {
    $this->get('/humans.txt')
        ->assertOk()
        ->assertSee('Particle Academy', false)
        ->assertSee('Fancy UI', false);
});

it('serves a dynamic sitemap.xml that lists pages but never protected paths', function () {
    $res = $this->get('/sitemap.xml');

    $res->assertOk();
    expect($res->headers->get('Content-Type'))->toContain('xml');

    $base = rtrim((string) config('app.url'), '/');
    $body = (string) $res->getContent();

    expect($body)->toContain('<urlset')
        ->toContain('<loc>'.$base.'/</loc>')   // the homepage is auto-discovered
        ->not->toContain('/admin')             // protect() leak-guard — the gap the old sitemap had
        ->not->toContain('/login')
        ->not->toContain('/checkout');
});

it('passes x-files:check', function () {
    $this->artisan('x-files:check')->assertSuccessful();
});
