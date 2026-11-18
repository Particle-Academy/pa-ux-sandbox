<?php

use App\Support\FeatureSites;
use App\Support\PackageFamily;
use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/*
 * CC-fancy-0036 phase 1 (simple electronic signatures), released 2026-11-18:
 * particle-academy/fancy-sign 0.1.0 on Packagist and
 * @particle-academy/fancy-sign-ui 0.1.0 on npm. Registered in PLANNED on
 * 2026-11-13, before a line was written; moved to META when built.
 *
 * The Node twin (fancy-sign-js) and the PAdES packages are NOT built: they
 * stay PLANNED and on no public surface. Owner, 2026-11-13: signing lives in
 * the Documents feature. Design: .ai/plans/fancy-sign.md.
 */
dataset('fancy-sign-published', [
    ['fancy-sign', 'php', 'headless', 'composer', 'particle-academy/fancy-sign', 'Particle-Academy/fancy-sign-php'],
    ['fancy-sign-ui', 'ts', 'ui', 'npm', '@particle-academy/fancy-sign-ui', 'Particle-Academy/fancy-sign-ui'],
]);

it('lists the published e-signature package as built, classified and in its family', function (string $slug, string $ecosystem, string $kind, string $installKey, string $name, string $repo) {
    expect(PackageRegistry::PLANNED)->not->toHaveKey($slug);

    $package = collect(PackageRegistry::companions())->firstWhere('slug', $slug);
    expect($package)->not->toBeNull()
        ->and($package['name'])->toBe($name)
        ->and($package[$installKey])->toBe($name)
        ->and($package['repo'])->toBe($repo)
        ->and($package['group'])->toBe('documents')
        ->and($package['ecosystem'])->toBe($ecosystem)
        ->and($package['kind'])->toBe($kind)
        ->and(PackageRegistry::isHidden($slug))->toBeFalse();

    expect(PackageFamily::groupFor($slug)['family'])->toBe('fancy-sign');
})->with('fancy-sign-published');

// Carried over from the registration test the planned entries had: the legs
// not built yet keep every assertion they had.
dataset('fancy-sign-planned', [
    ['fancy-sign-js', 'Particle-Academy/fancy-sign-js', 'npm', '@particle-academy/fancy-sign'],
    ['fancy-sign-pades', 'Particle-Academy/fancy-sign-pades-php', 'packagist', 'particle-academy/fancy-sign-pades'],
    ['fancy-sign-pades-js', 'Particle-Academy/fancy-sign-pades-js', 'npm', '@particle-academy/fancy-sign-pades'],
]);

it('keeps the unbuilt legs planned, with their registry names, and off every public surface', function (string $slug, string $repo, string $registry, string $name) {
    $public = collect(PackageRegistry::all())->merge(PackageRegistry::companions())->pluck('slug');
    $entry = PackageRegistry::PLANNED[$slug] ?? null;

    expect($entry)->not->toBeNull()
        ->and($entry['name'])->toBe($name)
        ->and($entry['repo'])->toBe($repo)
        ->and($entry['registries'])->toBe([$registry => $name])
        ->and($entry['why'])->toContain('CC-fancy-0036')
        ->and(strtolower($entry['why']))->not->toContain('legally compliant')
        ->and($public)->not->toContain($slug)
        ->and(PackageRegistry::find($slug))->toBeNull();
    $this->get("/packages/{$slug}")->assertNotFound();
})->with('fancy-sign-planned');

it('puts signing in the Documents feature', function () {
    expect(FeatureSites::find('documents')['memberSlugs'])->toContain('fancy-sign')
        ->and(FeatureSites::find('documents')['memberSlugs'])->toContain('fancy-sign-ui');
});

it('makes no legal claim beyond the plan\'s section 10 wording', function (string $slug) {
    $tagline = strtolower(collect(PackageRegistry::companions())->firstWhere('slug', $slug)['tagline']);
    foreach (['legally compliant', 'legally binding', 'eidas compliant', 'esign compliant', 'ueta compliant', 'court-proof', 'qualified', 'advanced electronic', 'ades'] as $phrase) {
        expect(str_contains($tagline, $phrase))->toBeFalse("{$slug} tagline says \"{$phrase}\"");
    }
    expect($tagline)->toContain('simple electronic signatures');
})->with(['fancy-sign', 'fancy-sign-ui']);
