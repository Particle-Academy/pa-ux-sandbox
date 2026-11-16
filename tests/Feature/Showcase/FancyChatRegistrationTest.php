<?php

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
 */
dataset('fancy-chat-planned', [
    ['fancy-chat-js', 'Particle-Academy/fancy-chat-js', 'npm', '@particle-academy/fancy-chat-js'],
    ['fancy-chat-ui', 'Particle-Academy/fancy-chat-ui', 'npm', '@particle-academy/fancy-chat-ui'],
    ['fancy-chat-php', 'Particle-Academy/fancy-chat-php', 'packagist', 'particle-academy/fancy-chat-php'],
]);

it('registers the agent chat package as planned with its registry name', function (string $slug, string $repo, string $registry, string $name) {
    expect(PackageRegistry::PLANNED)->toHaveKey($slug);
    $entry = PackageRegistry::PLANNED[$slug];
    expect($entry['name'])->toBe($name)
        ->and($entry['repo'])->toBe($repo)
        ->and($entry['registries'])->toBe([$registry => $name])
        ->and($entry['why'])->toContain('CC-fancy-0042')
        ->and($entry['why'])->toContain('.ai/plans/agent-chat-on-prism.md');
})->with('fancy-chat-planned');

it('keeps the planned agent chat package off every public listing', function (string $slug) {
    $public = collect(PackageRegistry::all())->merge(PackageRegistry::companions())->pluck('slug');
    expect($public)->not->toContain($slug);
    expect(PackageRegistry::find($slug))->toBeNull();
    $this->get("/packages/{$slug}")->assertNotFound();
})->with('fancy-chat-planned');

it('describes the chat as built on Prism, never as provider-neutral', function (string $slug) {
    $why = PackageRegistry::PLANNED[$slug]['why'];
    expect($why)->toContain('Prism')
        ->and($why)->not->toContain('No Prism')
        ->and($why)->not->toContain('neutral');
})->with('fancy-chat-planned');

it('no longer lists the retired Prism adapter packages', function () {
    expect(PackageRegistry::PLANNED)->not->toHaveKey('fancy-chat-prism')
        ->and(PackageRegistry::PLANNED)->not->toHaveKey('fancy-chat-prism-php');
});
