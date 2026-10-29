<?php

use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/*
 * fancy-formula was registered PLANNED on 2026-10-28, the day it was decided,
 * and 0.1.0 reached Packagist the same week. A package that is both planned
 * and built is a list nobody is maintaining (PackageStatusTest), and a
 * published package that is only planned is invisible to /packages, the MCP
 * and kit:status -- the blind spot the catalog audit kept finding.
 */

it('lists published fancy-formula and no longer plans it', function () {
    expect(PackageRegistry::PLANNED)->not->toHaveKey('fancy-formula');

    $package = PackageRegistry::findAny('fancy-formula');

    expect($package)->not->toBeNull()
        ->and($package['composer'])->toBe('particle-academy/fancy-formula')
        ->and($package['packagist'])->toBe('particle-academy/fancy-formula')
        ->and($package['ecosystem'])->toBe('php')
        ->and($package['kind'])->toBe('headless')
        ->and($package['group'])->toBe('documents')
        ->and(mb_strlen(trim((string) $package['tagline'])))->toBeGreaterThan(40)
        ->and(PackageRegistry::isHidden('fancy-formula'))->toBeFalse();
});

it('does not offer the npm or PyPI legs, which are not published yet', function () {
    // Only the PHP leg shipped (0.1.0). An install surface turns `npm` into
    // `npm install`, which would 404 for every reader who tried it.
    expect(PackageRegistry::findAny('fancy-formula'))
        ->not->toHaveKey('npm')
        ->not->toHaveKey('pypi');
});

it('gives fancy-formula a package page with its README', function () {
    $this->get('/packages/fancy-formula')->assertOk()->assertInertia(fn ($page) => $page
        ->component('Packages/Show')
        ->where('readmeHtml', fn (string $html) => str_contains($html, 'trace'))
    );
});
