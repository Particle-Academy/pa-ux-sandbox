<?php

use App\Models\User;
use App\Services\CoinMinter;
use Database\Seeders\FunLabSeeder;
use LaravelFunLab\Facades\LFL;
use Tests\TestCase;

uses(TestCase::class);

/*
 * Coin earn pipeline (Phase B). Three pathways:
 *   - XpAwarded -> MintCoinsFromXp (per-metric rate)
 *   - AchievementUnlocked -> MintCoinsFromAchievement (slug bonus or default)
 *   - PrizeAwarded -> MintCoinsFromPrize (slug bonus or default)
 *
 * Goal: a real LFL::award()/grant() call ends with the user's wallet
 * holding the expected coin total. No mocking — exercises the same
 * EventServiceProvider wiring production uses.
 */

beforeEach(function () {
    $this->seed(FunLabSeeder::class);
});

it('mints coins from an XP award using the per-metric rate', function () {
    $user = User::factory()->create();

    // bridge-xp rate is 0.25 -> floor(100 * 0.25) = 25 coins
    LFL::award('bridge-xp')->to($user)->amount(100)->save();

    expect($user->coinBalance())->toBe(25);
});

it('uses the default per-XP rate for an unconfigured metric', function () {
    $user = User::factory()->create();
    // Register a new metric not present in config/coins.php
    LFL::setup(a: 'gamed-metric', with: ['slug' => 'mystery-xp', 'name' => 'Mystery', 'active' => true]);
    LFL::setup(a: 'metric-level', with: ['metric' => 'mystery-xp', 'level' => 1, 'xp' => 0, 'name' => 'Start']);

    config(['coins.earn.default_per_xp' => 0.05]);

    LFL::award('mystery-xp')->to($user)->amount(100)->save();

    expect($user->coinBalance())->toBe(5); // floor(100 * 0.05)
});

it('mints zero coins when the XP amount produces less than one coin', function () {
    $user = User::factory()->create();

    // reader-xp rate is 0.05 -> floor(10 * 0.05) = 0
    LFL::award('reader-xp')->to($user)->amount(10)->save();

    expect($user->coinBalance())->toBe(0);
});

it('mints the per-slug achievement bonus on unlock', function () {
    $user = User::factory()->create();

    LFL::grant('first-pr')->to($user)->save();

    // achievement.first-pr is configured at 100
    expect($user->coinBalance())->toBe(100);
});

it('falls back to default achievement bonus for unconfigured slugs', function () {
    $user = User::factory()->create();

    LFL::grant('first-visit')->to($user)->save();

    // first-visit isn't in achievement[] -> default_achievement (50)
    expect($user->coinBalance())->toBe(50);
});

it('does not mint coins for non-User recipients', function () {
    $minter = app(CoinMinter::class);
    $fakeNonUser = new \stdClass();

    $coins = $minter->fromXp($fakeNonUser instanceof \Illuminate\Database\Eloquent\Model ? $fakeNonUser : new class extends \Illuminate\Database\Eloquent\Model {}, 'bridge-xp', 100);

    expect($coins)->toBe(0);
});

it('writes ledger transactions with xp-yield source metadata', function () {
    $user = User::factory()->create();
    LFL::award('bridge-xp')->to($user)->amount(40)->save();

    $tx = $user->getWallet()->transactions()->first();
    expect($tx->amount)->toBe(10)
        ->and($tx->kind)->toBe('credit')
        ->and($tx->metadata['source'] ?? null)->toBe('xp-yield')
        ->and($tx->metadata['metric'] ?? null)->toBe('bridge-xp')
        ->and($tx->metadata['xp'] ?? null)->toBe(40);
});
