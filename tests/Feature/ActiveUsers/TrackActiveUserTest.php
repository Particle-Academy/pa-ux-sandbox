<?php

use App\Events\ActiveUserActivity;
use App\Models\ActiveUser;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    // The middleware throttle persists in the array cache across requests in
    // feature tests; flush so each test starts from a clean throttle window.
    Cache::flush();
});

it('upserts a presence row for an authed user on a GET page load', function () {
    Event::fake([ActiveUserActivity::class]);

    $user = User::factory()->create();

    $this->actingAs($user)->get('/packages')->assertOk();

    $row = ActiveUser::where('user_id', $user->id)->first();

    expect($row)->not->toBeNull()
        ->and($row->name)->toBe($user->name)
        ->and($row->is_fake)->toBeFalse()
        ->and($row->last_active_at)->not->toBeNull()
        ->and($row->activity_at)->not->toBeNull();

    Event::assertDispatched(ActiveUserActivity::class);
});

it('throttles a second immediate hit so it does not re-broadcast', function () {
    Event::fake([ActiveUserActivity::class]);

    $user = User::factory()->create();

    // /leaderboard is a plain GET page that does not itself award XP, so the
    // only presence broadcasts come from the TrackActiveUser middleware.
    $this->actingAs($user)->get('/leaderboard')->assertOk();
    $this->actingAs($user)->get('/leaderboard')->assertOk();

    // One presence row, one broadcast — the 10s cache throttle swallows the second.
    expect(ActiveUser::where('user_id', $user->id)->count())->toBe(1);
    Event::assertDispatchedTimes(ActiveUserActivity::class, 1);
});

it('ignores guests', function () {
    Event::fake([ActiveUserActivity::class]);

    $this->get('/leaderboard')->assertOk();

    expect(ActiveUser::count())->toBe(0);
    Event::assertNotDispatched(ActiveUserActivity::class);
});

it('does not record presence for the active-users poll itself (no self-referential false hits)', function () {
    Event::fake([ActiveUserActivity::class]);

    $user = User::factory()->create();

    // The overlay polls GET /active-users every few seconds as a JSON fetch.
    // It must NOT count as the user's own activity, or idle users would see
    // their own avatar pop up "on active-users.index" forever.
    $this->actingAs($user)->getJson('/active-users')->assertOk();

    expect(ActiveUser::where('user_id', $user->id)->count())->toBe(0);
    Event::assertNotDispatched(ActiveUserActivity::class);
});

it('does not record presence for XHR/fetch data requests — only real navigations', function () {
    Event::fake([ActiveUserActivity::class]);

    $user = User::factory()->create();

    // A JSON/XHR fetch (Accept: application/json, no X-Inertia) is not a page
    // navigation, so it must not generate presence.
    $this->actingAs($user)->getJson('/leaderboard')->assertOk();

    expect(ActiveUser::where('user_id', $user->id)->count())->toBe(0);
    Event::assertNotDispatched(ActiveUserActivity::class);
});
