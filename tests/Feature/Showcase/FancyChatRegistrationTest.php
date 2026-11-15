<?php

use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/*
 * CC-fancy-0042, owner approved 2026-11-15 (q_975913cd): the agent chat
 * framework, five packages. Registered before the repos exist, per "Register a
 * package BEFORE you build it". Design: .ai/plans/agent-chat-framework.md.
 *
 * The whole Prism ecosystem is an optional addon, so only the two -prism
 * packages may describe themselves as Prism adapters.
 */
dataset('fancy-chat-planned', [
    ['fancy-chat-js', 'Particle-Academy/fancy-chat-js', 'npm', '@particle-academy/fancy-chat-js', false],
    ['fancy-chat-ui', 'Particle-Academy/fancy-chat-ui', 'npm', '@particle-academy/fancy-chat-ui', false],
    ['fancy-chat-php', 'Particle-Academy/fancy-chat-php', 'packagist', 'particle-academy/fancy-chat-php', false],
    ['fancy-chat-prism', 'Particle-Academy/fancy-chat-prism', 'npm', '@particle-academy/fancy-chat-prism', true],
    ['fancy-chat-prism-php', 'Particle-Academy/fancy-chat-prism-php', 'packagist', 'particle-academy/fancy-chat-prism-php', true],
]);

it('registers the agent chat package as planned with its registry name', function (string $slug, string $repo, string $registry, string $name) {
    expect(PackageRegistry::PLANNED)->toHaveKey($slug);
    $entry = PackageRegistry::PLANNED[$slug];
    expect($entry['name'])->toBe($name)
        ->and($entry['repo'])->toBe($repo)
        ->and($entry['registries'])->toBe([$registry => $name])
        ->and($entry['why'])->toContain('CC-fancy-0042')
        ->and($entry['why'])->toContain('.ai/plans/agent-chat-framework.md')
        ->and($entry['why'])->toContain('NOT YET PUBLISHED');
})->with('fancy-chat-planned');

it('keeps the planned agent chat package off every public listing', function (string $slug) {
    $public = collect(PackageRegistry::all())->merge(PackageRegistry::companions())->pluck('slug');
    expect($public)->not->toContain($slug);
    expect(PackageRegistry::find($slug))->toBeNull();
    $this->get("/packages/{$slug}")->assertNotFound();
})->with('fancy-chat-planned');

it('marks only the prism packages as optional prism adapters', function (string $slug, string $repo, string $registry, string $name, bool $isPrismAdapter) {
    $why = PackageRegistry::PLANNED[$slug]['why'];
    if ($isPrismAdapter) {
        expect($why)->toContain('OPTIONAL');
    } else {
        expect($why)->toContain('No Prism');
    }
})->with('fancy-chat-planned');
