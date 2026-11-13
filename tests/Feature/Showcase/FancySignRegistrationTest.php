<?php

use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/*
 * CC-fancy-0036, owner approved 2026-11-13: e-signature, eIDAS advanced
 * included. Registered before a line exists, per "Register a package BEFORE
 * you build it". Design: .ai/plans/fancy-sign.md.
 *
 * Slugs are what the built packages will carry (slug `fancy-sign`, repo
 * `fancy-sign-php`, as fancy-passkeys does), so the move to META cannot leave
 * a stale planned twin that PackageStatusTest would not catch.
 */
dataset('fancy-sign-planned', [
    ['fancy-sign', 'Particle-Academy/fancy-sign-php', 'packagist', 'particle-academy/fancy-sign'],
    ['fancy-sign-js', 'Particle-Academy/fancy-sign-js', 'npm', '@particle-academy/fancy-sign'],
    ['fancy-sign-ui', 'Particle-Academy/fancy-sign-ui', 'npm', '@particle-academy/fancy-sign-ui'],
    ['fancy-sign-pades', 'Particle-Academy/fancy-sign-pades-php', 'packagist', 'particle-academy/fancy-sign-pades'],
    ['fancy-sign-pades-js', 'Particle-Academy/fancy-sign-pades-js', 'npm', '@particle-academy/fancy-sign-pades'],
]);

it('registers the e-signature package as planned with its registry name', function (string $slug, string $repo, string $registry, string $name) {
    expect(PackageRegistry::PLANNED)->toHaveKey($slug);
    $entry = PackageRegistry::PLANNED[$slug];
    expect($entry['name'])->toBe($name)
        ->and($entry['repo'])->toBe($repo)
        ->and($entry['registries'])->toBe([$registry => $name])
        ->and($entry['why'])->toContain('CC-fancy-0036')
        ->and($entry['why'])->toContain('.ai/plans/fancy-sign.md')
        ->and($entry['why'])->toContain('NOT YET STARTED');
})->with('fancy-sign-planned');

it('keeps the planned e-signature package off every public listing', function (string $slug) {
    $public = collect(PackageRegistry::all())->merge(PackageRegistry::companions())->pluck('slug');
    expect($public)->not->toContain($slug);
    expect(PackageRegistry::find($slug))->toBeNull();
    $this->get("/packages/{$slug}")->assertNotFound();
})->with('fancy-sign-planned');

it('never describes a planned e-signature package as legally compliant', function (string $slug) {
    expect(strtolower(PackageRegistry::PLANNED[$slug]['why']))->not->toContain('legally compliant');
})->with('fancy-sign-planned');
