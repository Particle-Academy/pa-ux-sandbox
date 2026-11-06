<?php

use App\Support\PackageFamily;
use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/*
 * Owner decided 2026-11-05: packages registered before a line exists, per
 * "Register a package BEFORE you build it". Planned means visible to kit:status
 * and to nothing public: nothing here can be installed yet.
 *
 * fancy-compliance, fancy-compliance-ui and fancy-fun-lab-ui were planned here
 * the same day and published that evening, and fancy-captcha / fancy-captcha-ui
 * the same evening again; they are checked as built below.
 */
dataset('planned-2026-11-05', [
    ['fancy-translations', 'packagist', 'particle-academy/fancy-translations', 'NOT YET STARTED.'],
    ['fancy-translations-ui', 'npm', '@particle-academy/fancy-translations-ui', 'NOT YET STARTED.'],
]);

it('registers the package as planned with its registry name', function (string $slug, string $registry, string $name, string $state) {
    expect(PackageRegistry::PLANNED)->toHaveKey($slug);
    $entry = PackageRegistry::PLANNED[$slug];
    expect($entry['name'])->toBe($name)
        ->and($entry['registries'])->toBe([$registry => $name])
        ->and($entry['repo'])->toBe('Particle-Academy/'.$slug)
        ->and($entry['why'])->toContain('Owner decided 2026-11-05. '.$state);
})->with('planned-2026-11-05');

it('keeps the planned package off every public listing', function (string $slug) {
    $public = collect(PackageRegistry::all())->merge(PackageRegistry::companions())->pluck('slug');
    expect($public)->not->toContain($slug);
    expect(PackageRegistry::find($slug))->toBeNull();
    $this->get("/packages/{$slug}")->assertNotFound();
})->with('planned-2026-11-05');

dataset('published-2026-11-05', [
    ['fancy-compliance', 'platform', 'php', 'headless', 'fancy-compliance'],
    ['fancy-compliance-ui', 'platform', 'ts', 'ui', 'fancy-compliance'],
    ['fancy-fun-lab-ui', 'commerce', 'ts', 'ui', 'laravel-fun-lab'],
    ['fancy-captcha', 'platform', 'php', 'headless', 'fancy-captcha'],
    ['fancy-captcha-ui', 'platform', 'ts', 'ui', 'fancy-captcha'],
]);

it('lists both captcha halves as companions, the UI one with no component pages', function () {
    // Not installed in the showcase: there is no captcha surface to dogfood yet,
    // so fancy-captcha-ui has no demos to host and lists as an install row.
    $companions = collect(PackageRegistry::companions());
    expect($companions->pluck('slug'))->toContain('fancy-captcha', 'fancy-captcha-ui');
    expect($companions->firstWhere('slug', 'fancy-captcha-ui')['npm'])->toBe('@particle-academy/fancy-captcha-ui')
        ->and($companions->firstWhere('slug', 'fancy-captcha')['composer'])->toBe('particle-academy/fancy-captcha');
    expect(collect(PackageRegistry::all())->pluck('slug'))->not->toContain('fancy-captcha-ui');
});

it('lists the published package as built, classified, and in its family', function (string $slug, string $group, string $ecosystem, string $kind, string $family) {
    expect(PackageRegistry::PLANNED)->not->toHaveKey($slug);

    $package = PackageRegistry::findAny($slug);
    expect($package)->not->toBeNull()
        ->and($package['group'])->toBe($group)
        ->and($package['ecosystem'])->toBe($ecosystem)
        ->and($package['kind'])->toBe($kind)
        ->and($package['repo'])->toBe('Particle-Academy/'.$slug)
        ->and(PackageRegistry::isHidden($slug))->toBeFalse();

    expect(PackageFamily::groupFor($slug)['family'])->toBe($family);
})->with('published-2026-11-05');

it('lists the UI halves with their components and the backend as a companion', function () {
    expect(collect(PackageRegistry::companions())->pluck('slug'))->toContain('fancy-compliance');

    $compliance = collect(PackageRegistry::all())->firstWhere('slug', 'fancy-compliance-ui');
    expect($compliance['npm'])->toBe('@particle-academy/fancy-compliance-ui')
        ->and(collect($compliance['components'])->pluck('name')->all())
        ->toBe(['ConsentBanner', 'ConsentGate', 'ConsentPreferences']);

    $funLab = collect(PackageRegistry::all())->firstWhere('slug', 'fancy-fun-lab-ui');
    expect($funLab['npm'])->toBe('@particle-academy/fancy-fun-lab-ui')
        ->and(collect($funLab['components'])->pluck('name'))->toContain('FunLabLeaderboard', 'FunLabProfileSummary');
});
