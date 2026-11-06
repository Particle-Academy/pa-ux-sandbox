<?php

use App\Models\User;
use Database\Seeders\FunLabSeeder;
use LaravelFunLab\Facades\LFL;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The profile's leaderboard (fancy-fun-lab-ui's FunLabLeaderboard) over
 * laravel-fun-lab 0.7.0's per-metric board: the same entries the REST API
 * returns, ranked on one gamed metric when ?board=<slug> picks one.
 */
beforeEach(function () {
    $this->seed(FunLabSeeder::class);
});

it('ranks on one gamed metric when the board picks it, and overall otherwise', function () {
    $me = User::factory()->create(['name' => 'Me']);
    $reader = User::factory()->create(['name' => 'Reader']);

    // I lead overall; the reader leads on reader-xp alone.
    LFL::award('explorer-xp')->to($me)->amount(500)->save();
    LFL::award('reader-xp')->to($me)->amount(10)->save();
    LFL::award('reader-xp')->to($reader)->amount(200)->save();

    $this->actingAs($me)->get('/profile')->assertOk()->assertInertia(fn ($page) => $page
        ->component('Profile/Show')
        ->where('metricBoard.metric', null)
        ->where('metricBoard.entries.0.awardable_id', $me->id)
        ->where('metricBoard.viewerProfileId', $me->getProfile()->id)
        ->where('metricBoard.names', fn ($names) => in_array('Me', collect($names)->all(), true))
        ->where('metricBoard.metrics', fn ($metrics) => collect($metrics)->pluck('slug')->contains('reader-xp')));

    $this->actingAs($me)->get('/profile?board=reader-xp')->assertOk()->assertInertia(fn ($page) => $page
        ->where('metricBoard.metric', 'reader-xp')
        ->where('metricBoard.entries.0.awardable_id', $reader->id)
        ->where('metricBoard.entries.0.metric.slug', 'reader-xp')
        ->where('metricBoard.entries.0.metric.total_xp', 200)
        ->where('metricBoard.entries.1.metric.total_xp', 10));
});

it('falls back to the overall board for an unknown metric', function () {
    $me = User::factory()->create();

    $this->actingAs($me)->get('/profile?board=no-such-metric')->assertOk()->assertInertia(fn ($page) => $page
        ->where('metricBoard.metric', null));
});

it('gives each achievement the id the achievement grid keys on', function () {
    $me = User::factory()->create();
    LFL::grant('first-visit')->to($me)->save();

    $this->actingAs($me->fresh())->get('/profile')->assertInertia(fn ($page) => $page
        ->where('profile.achievements', fn ($a) => (collect($a)->firstWhere('slug', 'first-visit')['id'] ?? 0) > 0));
});
