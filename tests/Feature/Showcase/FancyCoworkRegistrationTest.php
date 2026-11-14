<?php

use App\Support\PackageFamily;
use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/*
 * CC-fancy-0037, owner approved 2026-11-13: generic human co-work sessions.
 * Moved out of PLANNED on 2026-11-14, the day the repos were created and the
 * build started. Both names 404 until the owner bootstraps them, so the
 * entries are built but HIDDEN: no public surface may offer an install for a
 * name that does not resolve. Design: .ai/plans/human-cobrowse-and-chat.md.
 */
dataset('fancy-cowork', [
    ['fancy-cowork', 'php', 'Particle-Academy/fancy-cowork-php', 'particle-academy/fancy-cowork'],
    ['fancy-cowork-js', 'ts', 'Particle-Academy/fancy-cowork-js', '@particle-academy/fancy-cowork'],
]);

it('is built, no longer planned', function (string $slug, string $ecosystem, string $repo, string $name) {
    expect(PackageRegistry::PLANNED)->not->toHaveKey($slug);

    $meta = (new ReflectionClass(PackageRegistry::class))->getConstant('META');
    expect($meta)->toHaveKey($slug)
        ->and($meta[$slug]['ecosystem'])->toBe($ecosystem)
        ->and($meta[$slug]['group'])->toBe('platform')
        ->and($meta[$slug]['kind'])->toBe('headless');

    $row = collect(PackageRegistry::everything())->firstWhere('slug', $slug);
    expect($row)->not->toBeNull()
        ->and($row['name'])->toBe($name)
        ->and($row['repo'])->toBe($repo);
})->with('fancy-cowork');

it('stays off every public listing until its registry name resolves', function (string $slug) {
    expect(PackageRegistry::isHidden($slug))->toBeTrue();
    $public = collect(PackageRegistry::all())->merge(PackageRegistry::companions())->pluck('slug');
    expect($public)->not->toContain($slug);
    expect(PackageRegistry::findAny($slug))->toBeNull();
    $this->get("/packages/{$slug}")->assertNotFound();
})->with('fancy-cowork');

it('describes both backends as one family, never as chat', function () {
    $family = collect((new ReflectionClass(PackageFamily::class))->getConstant('FAMILIES'))->firstWhere('slug', 'fancy-cowork');
    expect($family)->not->toBeNull();
    expect(collect($family['sections'])->flatMap(fn ($s) => $s['members'])->pluck('slug')->all())
        ->toBe(['fancy-cowork', 'fancy-cowork-js']);

    foreach (['fancy-cowork', 'fancy-cowork-js'] as $slug) {
        $tagline = strtolower(collect(PackageRegistry::everything())->firstWhere('slug', $slug)['tagline']);
        expect($tagline)->not->toContain('impersonat');
    }
});
