<?php

use App\Models\User;
use App\Support\XpAwarder;
use Database\Seeders\FunLabSeeder;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

uses(TestCase::class);

/*
 * Coverage for the Phase 2 XP plumbing:
 *   - TrackPackageBrowsing middleware → explorer-xp
 *   - POST /api/xp/demo → tinkerer-xp
 *   - POST /api/xp/bridge → bridge-xp
 *   - XpAwarder throttle + opt-out behavior
 *
 * FunLabSeeder runs in beforeEach so the GamedMetrics + levels exist
 * — LFL::award() needs the metric to be registered.
 */

beforeEach(function () {
    Cache::flush();
    $this->seed(FunLabSeeder::class);
});

it('awards explorer-xp on a component page view (auth user)', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->get('/packages/react-fancy/accordion')->assertOk();

    $profile = $user->getProfile()->fresh();
    expect($profile->getXpFor('explorer-xp'))->toBe(4);
});

it('does not award explorer-xp for guests', function () {
    $this->get('/packages/react-fancy/accordion')->assertOk();

    expect(\LaravelFunLab\Models\Profile::count())->toBe(0);
});

it('throttles a repeat view of the same component within 24h', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->get('/packages/react-fancy/accordion');
    $this->get('/packages/react-fancy/accordion');
    $this->get('/packages/react-fancy/accordion');

    // Throttled to one award per (user, route-key) per 24h.

    expect($user->getProfile()->fresh()->getXpFor('explorer-xp'))->toBe(4);
});

it('still credits separate components on the same package', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->get('/packages/react-fancy/accordion');
    $this->get('/packages/react-fancy/avatar');

    expect($user->getProfile()->fresh()->getXpFor('explorer-xp'))->toBe(8);
});

it('awards tinkerer-xp via /api/xp/demo with kind-dependent amounts', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->postJson('/api/xp/demo', ['demo' => 'accordion', 'kind' => 'first-use'])
        ->assertOk()
        ->assertJson(['awarded' => true, 'amount' => 15]);

    $this->postJson('/api/xp/demo', ['demo' => 'accordion', 'kind' => 'completion'])
        ->assertOk()
        ->assertJson(['awarded' => true, 'amount' => 25]);

    expect($user->getProfile()->fresh()->getXpFor('tinkerer-xp'))->toBe(40);
});

it('throttles same (demo, kind) within the hour', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->postJson('/api/xp/demo', ['demo' => 'accordion', 'kind' => 'interaction'])
        ->assertJson(['awarded' => true]);
    $this->postJson('/api/xp/demo', ['demo' => 'accordion', 'kind' => 'interaction'])
        ->assertJson(['awarded' => false, 'amount' => 0]);

    expect($user->getProfile()->fresh()->getXpFor('tinkerer-xp'))->toBe(3);
});

it('rejects /api/xp/demo for guests', function () {
    $this->postJson('/api/xp/demo', ['demo' => 'accordion'])->assertStatus(401);
});

it('awards bridge-xp via /api/xp/bridge', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->postJson('/api/xp/bridge', ['bridge' => 'slides', 'tool' => 'deck.create'])
        ->assertOk()
        ->assertJson(['awarded' => true, 'amount' => 5]);

    expect($user->getProfile()->fresh()->getXpFor('bridge-xp'))->toBe(5);
});

it('XpAwarder skips opted-out users', function () {
    $user = User::factory()->create();
    $user->optOut();

    XpAwarder::award($user, 'explorer-xp', 3, 'test', 'k', 60);

    expect($user->getProfile()->fresh()->getXpFor('explorer-xp'))->toBe(0);
});
