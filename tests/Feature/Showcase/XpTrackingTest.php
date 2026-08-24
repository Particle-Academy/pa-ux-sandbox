<?php

use App\Models\User;
use App\Support\XpAwarder;
use Database\Seeders\FunLabSeeder;
use Illuminate\Support\Facades\Cache;
use LaravelFunLab\Models\Profile;
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

    expect(Profile::count())->toBe(0);
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

/*
 * ─────────────────────────────────────────────────────────────────────────
 * The anti-farm throttle was keyed on a string the CLIENT chooses.
 *
 * `XpAwarder::award()` buckets on "xp:{user}:{metric}:{throttleKey}", and both
 * XP endpoints built that key straight from request input validated only as
 * `string|max:80` (`demo`) and `string|max:120` (`tool`). Varying the string
 * therefore opened an UNBOUNDED number of fresh buckets, so the per-bucket
 * hour cooldown bounded nothing at all.
 *
 * The route rate limits are the only real ceiling: 60/min on demo at 25 XP for
 * a `completion`, 120/min on bridge at 5 XP — about 2,100 points a minute
 * against a level-10 threshold. Auth is required, so this is SELF-minting,
 * which is exactly what matters: levels gate an entitlement, so a user farms
 * their own way into a tier that is supposed to be paid for or earned.
 *
 * This is the canon's named worst case almost verbatim — "rewarding a cheap,
 * repeatable action with a scarce or transferable asset; bots will find the
 * conversion" — and the reason a per-user RATE limit does not help is that the
 * attacker chooses the KEY, not the rate.
 */

it('refuses XP for a demo slug that is not a real component', function () {
    // The root fix. An unknown demo cannot be interacted with, so awarding for
    // one was never meaningful — and accepting arbitrary strings is precisely
    // what made the buckets unbounded.
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->postJson('/api/xp/demo', ['demo' => 'not-a-real-component', 'kind' => 'completion'])
        ->assertStatus(422);

    expect($user->getProfile()->fresh()->getXpFor('tinkerer-xp'))->toBe(0);
});

it('still awards for a genuine component slug', function () {
    // Guard against the fix over-reaching: the legitimate path must survive.
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->postJson('/api/xp/demo', ['demo' => 'accordion', 'kind' => 'completion'])
        ->assertOk()
        ->assertJson(['awarded' => true]);

    expect($user->getProfile()->fresh()->getXpFor('tinkerer-xp'))->toBe(25);
});

it('caps how many distinct buckets one user can open in a window', function () {
    // Defence in depth, and the ONLY fix available for the bridge endpoint —
    // MCP tool names cannot be enumerated server-side, so an allowlist is not
    // possible there. Bounding awards per user per window makes the content of
    // the key irrelevant, which is the property that was missing.
    $user = User::factory()->create();
    $this->actingAs($user);

    $awarded = 0;
    for ($i = 0; $i < 60; $i++) {
        if (XpAwarder::award(
            user: $user,
            metric: 'bridge-xp',
            amount: 5,
            reason: "synthetic {$i}",
            throttleKey: "tool:synthetic-{$i}",
            throttleSeconds: 3600,
        )) {
            $awarded++;
        }
    }

    expect($awarded)->toBeLessThan(60);
    expect($user->getProfile()->fresh()->getXpFor('bridge-xp'))->toBeLessThan(300);
});
