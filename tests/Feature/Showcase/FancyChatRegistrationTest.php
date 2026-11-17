<?php

use App\Support\PackageFamily;
use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/*
 * CC-fancy-0042, owner approved 2026-11-15 (q_975913cd): the agent chat
 * framework. Registered before the repos existed, per "Register a package
 * BEFORE you build it". Design: .ai/plans/agent-chat-on-prism.md.
 *
 * Owner, 2026-11-16: "fancy chat is built entirely on the prism eco system, the
 * extra packages like memory and graph and browser and such were the optional
 * parts." So three packages, built on Prism Harness, and the two separate Prism
 * adapter packages are retired: fancy-chat-prism-php merged into fancy-chat-php
 * 0.2.0, fancy-chat-prism (never built) dropped.
 *
 * Published 2026-11-16: @particle-academy/fancy-chat-js 0.2.0 and
 * @particle-academy/fancy-chat-ui 0.2.0 on npm, particle-academy/fancy-chat-php
 * 0.2.0 on Packagist. They sat in PLANNED a day after that, so the site and the
 * hosted MCP returned nothing for "fancy-chat". They are listed as companions:
 * fancy-chat-ui ships no component pages here yet, so it lists as an install
 * row, like fancy-captcha-ui.
 */
dataset('fancy-chat-published', [
    ['fancy-chat-js', 'ts', 'headless', 'npm', '@particle-academy/fancy-chat-js'],
    ['fancy-chat-ui', 'ts', 'ui', 'npm', '@particle-academy/fancy-chat-ui'],
    ['fancy-chat-php', 'php', 'headless', 'composer', 'particle-academy/fancy-chat-php'],
]);

it('lists the published agent chat package as built, classified and in its family', function (string $slug, string $ecosystem, string $kind, string $installKey, string $name) {
    expect(PackageRegistry::PLANNED)->not->toHaveKey($slug);

    $package = collect(PackageRegistry::companions())->firstWhere('slug', $slug);
    expect($package)->not->toBeNull()
        ->and($package['name'])->toBe($name)
        ->and($package[$installKey])->toBe($name)
        ->and($package['repo'])->toBe('Particle-Academy/'.$slug)
        ->and($package['group'])->toBe('platform')
        ->and($package['ecosystem'])->toBe($ecosystem)
        ->and($package['kind'])->toBe($kind)
        ->and(PackageRegistry::isHidden($slug))->toBeFalse();

    expect(PackageFamily::groupFor($slug)['family'])->toBe('fancy-chat');
})->with('fancy-chat-published');

it('describes the chat as built on Prism Harness, never as provider-neutral', function (string $slug) {
    $tagline = collect(PackageRegistry::companions())->firstWhere('slug', $slug)['tagline'];
    expect($tagline)->toContain('Prism')
        ->and($tagline)->not->toContain('No Prism')
        ->and($tagline)->not->toContain('neutral');
})->with('fancy-chat-published');

it('lists the Packagist leg under its registry name', function () {
    expect(collect(PackageRegistry::companions())->firstWhere('slug', 'fancy-chat-php')['packagist'])
        ->toBe('particle-academy/fancy-chat-php');
});

it('no longer lists the retired Prism adapter packages', function () {
    $public = collect(PackageRegistry::all())->merge(PackageRegistry::companions())->pluck('slug');

    expect(PackageRegistry::PLANNED)->not->toHaveKey('fancy-chat-prism')
        ->and(PackageRegistry::PLANNED)->not->toHaveKey('fancy-chat-prism-php')
        ->and($public)->not->toContain('fancy-chat-prism')
        ->and($public)->not->toContain('fancy-chat-prism-php');
});
