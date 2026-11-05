<?php

use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/*
 * Owner decided 2026-11-05: five packages registered before a line exists, per
 * "Register a package BEFORE you build it". Planned means visible to kit:status
 * and to nothing public: nothing here can be installed yet.
 */
dataset('planned-2026-11-05', [
    ['fancy-compliance', 'packagist', 'particle-academy/fancy-compliance'],
    ['fancy-compliance-ui', 'npm', '@particle-academy/fancy-compliance-ui'],
    ['fancy-translations', 'packagist', 'particle-academy/fancy-translations'],
    ['fancy-translations-ui', 'npm', '@particle-academy/fancy-translations-ui'],
    ['fancy-fun-lab-ui', 'npm', '@particle-academy/fancy-fun-lab-ui'],
]);

it('registers the package as planned with its registry name', function (string $slug, string $registry, string $name) {
    expect(PackageRegistry::PLANNED)->toHaveKey($slug);
    $entry = PackageRegistry::PLANNED[$slug];
    expect($entry['name'])->toBe($name)
        ->and($entry['registries'])->toBe([$registry => $name])
        ->and($entry['repo'])->toBe('Particle-Academy/'.$slug)
        ->and($entry['why'])->toContain('Owner decided 2026-11-05. NOT YET STARTED.');
})->with('planned-2026-11-05');

it('keeps the planned package off every public listing', function (string $slug) {
    $public = collect(PackageRegistry::all())->merge(PackageRegistry::companions())->pluck('slug');
    expect($public)->not->toContain($slug);
    expect(PackageRegistry::find($slug))->toBeNull();
    $this->get("/packages/{$slug}")->assertNotFound();
})->with('planned-2026-11-05');
