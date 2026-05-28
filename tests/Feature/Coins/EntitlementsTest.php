<?php

use App\Models\User;
use App\Services\Entitlements;
use Database\Seeders\FunLabSeeder;
use LaravelFunLab\Facades\LFL;
use ParticleAcademy\Fms\Facades\FMS;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    $this->seed(FunLabSeeder::class);
});

it('reports not-pro for a fresh user', function () {
    $user = User::factory()->create();

    expect(app(Entitlements::class)->isPro($user))->toBeFalse()
        ->and(app(Entitlements::class)->proSource($user))->toBeNull();
});

it('treats a sandbox-pro prize holder as pro (earn path)', function () {
    $user = User::factory()->create();
    LFL::grant('sandbox-pro')->to($user)->save();

    $entitlements = app(Entitlements::class);
    expect($entitlements->isPro($user))->toBeTrue()
        ->and($entitlements->proSource($user))->toBe('prize');
});

it('grants Pro features through the FMS pre-strategy for a prize holder', function () {
    $user = User::factory()->create();
    LFL::grant('sandbox-pro')->to($user)->save();

    expect(FMS::canAccess('pro-themes', $user))->toBeTrue()
        ->and(FMS::canAccess('pro-source-export', $user))->toBeTrue();
});

it('denies Pro features to a non-entitled user', function () {
    $user = User::factory()->create();

    expect(FMS::canAccess('pro-themes', $user))->toBeFalse();
});

it('does not gate non-pro features', function () {
    $user = User::factory()->create();

    // A feature outside PRO_FEATURES falls through the pre-strategy to the
    // normal chain (undefined feature → false), proving the pre-strategy
    // only short-circuits Pro features.
    expect(FMS::canAccess('some-random-feature', $user))->toBeFalse();
});

it('explains a granted pro feature as resolved by the pre-strategy', function () {
    $user = User::factory()->create();
    LFL::grant('sandbox-pro')->to($user)->save();

    $explain = app(\ParticleAcademy\Fms\Services\FeatureManager::class)->explain('pro-themes', $user);

    expect($explain['source'])->toBe('pre-strategy')
        ->and($explain['enabled'])->toBeTrue()
        ->and($explain['detail']['name'])->toBe('pro-entitlement');
});

it('surfaces pro status in the player summary', function () {
    $user = User::factory()->create();
    LFL::grant('sandbox-pro')->to($user)->save();

    $summary = app(\App\Services\PlayerProfile::class)->summary($user->fresh());

    expect($summary['pro'])->toBeTrue()
        ->and($summary['proSource'])->toBe('prize');
});
