<?php

use App\Support\PackageFamily;
use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

it('lists published fancy-qr as a headless PHP document package, no longer planned', function () {
    expect(PackageRegistry::PLANNED)->not->toHaveKey('fancy-qr');

    $package = PackageRegistry::findAny('fancy-qr');
    expect($package)->not->toBeNull()
        ->and($package['name'])->toBe('particle-academy/fancy-qr')
        ->and($package['composer'])->toBe('particle-academy/fancy-qr')
        ->and($package['packagist'])->toBe('particle-academy/fancy-qr')
        ->and($package['repo'])->toBe('Particle-Academy/fancy-qr')
        ->and($package['group'])->toBe('documents')
        ->and($package['ecosystem'])->toBe('php')
        ->and($package['kind'])->toBe('headless');

    expect(PackageFamily::groupFor('fancy-qr')['group'])->toBe('documents');
});

it('lists fancy-qr publicly, beside the other headless backends', function () {
    // Headless packages are companions, as fine-print and holy-sheet are.
    expect(collect(PackageRegistry::companions())->pluck('slug'))->toContain('fancy-qr');
    expect(PackageRegistry::isHidden('fancy-qr'))->toBeFalse();
});
