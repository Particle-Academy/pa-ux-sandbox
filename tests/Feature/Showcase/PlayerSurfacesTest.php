<?php

use App\Models\User;
use App\Services\PlayerProfile;
use Database\Seeders\FunLabSeeder;
use LaravelFunLab\Facades\LFL;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    $this->seed(FunLabSeeder::class);
});

it('PlayerProfile summary reports coins, level and cosmetics', function () {
    $user = User::factory()->create(['cosmetic_slots' => ['avatar-frame' => 'gold']]);
    $user->getWallet()->credit(300, 'seed');
    LFL::award('bridge-xp')->to($user)->amount(200)->save();

    $summary = app(PlayerProfile::class)->summary($user->fresh());

    expect($summary['coins'])->toBeGreaterThanOrEqual(300)
        ->and($summary['level'])->toBeGreaterThanOrEqual(1)
        ->and($summary['cosmetics'])->toBe(['avatar-frame' => 'gold'])
        ->and($summary)->toHaveKeys(['levelName', 'totalXp', 'progress', 'optedOut']);
});

it('PlayerProfile full includes per-metric, achievements and prizes', function () {
    $user = User::factory()->create();
    LFL::award('explorer-xp')->to($user)->amount(60)->save();
    LFL::grant('first-visit')->to($user)->save();

    $full = app(PlayerProfile::class)->full($user->fresh());

    expect($full['metrics'])->toHaveCount(1)
        ->and($full['metrics'][0]['slug'])->toBe('explorer-xp')
        ->and(collect($full['achievements'])->pluck('slug'))->toContain('first-visit')
        ->and($full)->toHaveKeys(['identity', 'name', 'lifetimeEarned', 'lifetimeSpent']);
});

it('shares the player summary on auth.user for signed-in users', function () {
    $user = User::factory()->create();
    $user->getWallet()->credit(50, 'seed');

    $this->actingAs($user)
        ->get('/')
        ->assertInertia(fn ($page) => $page
            ->where('auth.user.player.coins', 50)
            ->has('auth.user.player.level')
        );
});

it('renders the profile page for signed-in users', function () {
    $user = User::factory()->create(['name' => 'Profile Person']);
    $user->getWallet()->credit(120, 'seed');

    $this->actingAs($user)->get('/profile')->assertOk();
});

it('redirects guests away from the profile page', function () {
    $this->get('/profile')->assertRedirect('/login');
});

it('toggles gamification opt-out from the profile', function () {
    $user = User::factory()->create();
    expect($user->isOptedIn())->toBeTrue();

    $this->actingAs($user)->post('/profile/opt-out')->assertRedirect()->assertSessionHas('success');

    expect($user->fresh()->isOptedOut())->toBeTrue();
});

it('lists top players on the leaderboard ranked by XP', function () {
    $whale = User::factory()->create(['name' => 'Whale']);
    $minnow = User::factory()->create(['name' => 'Minnow']);
    LFL::award('bridge-xp')->to($whale)->amount(5000)->save();
    LFL::award('explorer-xp')->to($minnow)->amount(10)->save();

    $this->get('/leaderboard')->assertOk()->assertInertia(fn ($page) => $page
        ->has('players', fn ($players) => $players
            ->where('0.identity.name', 'Whale')
            ->etc()
        )
    );
});

it('excludes opted-out users from the players leaderboard', function () {
    $optedOut = User::factory()->create(['name' => 'Hidden']);
    LFL::award('bridge-xp')->to($optedOut)->amount(9000)->save();
    $optedOut->optOut();

    $this->get('/leaderboard')->assertOk()->assertInertia(fn ($page) => $page
        ->where('players', fn ($players) => collect($players)->doesntContain(fn ($p) => $p['identity']['name'] === 'Hidden'))
    );
});
