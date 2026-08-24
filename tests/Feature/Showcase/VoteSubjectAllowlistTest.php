<?php

use App\Models\User;
use App\Models\Vote;
use Tests\TestCase;

uses(TestCase::class);

/*
 * A vote's SUBJECT was a free string, and every distinct one wrote a row.
 *
 * `VoteController::cast` validated `slug` as `string|max:120` and then did
 * `Vote::updateOrCreate` keyed on (user_id, subject_type, subject_slug). So a
 * signed-in user could create unbounded rows by varying the slug, and there is
 * NO route rate limit on this endpoint -- only `auth`.
 *
 * This is the same shape as the XP minting bug and was found sweeping for it:
 * a key built from request input with no allowlist. The XpAwarder ceiling
 * bounds the XP that rides along, but NOT the row write, which happens
 * independently of the award.
 *
 * `type` was already allowlisted. `slug` is now checked against DreamRegistry,
 * the same 46 dreams the gallery renders -- a vote for a subject that does not
 * exist was never meaningful.
 */

it('refuses a vote for a subject that does not exist', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->postJson('/api/votes', ['type' => 'dream', 'slug' => 'not-a-real-dream', 'value' => 1])
        ->assertStatus(422);

    expect(Vote::count())->toBe(0);
});

it('cannot be used to write unbounded rows', function () {
    // The exploit, as the shape rather than one instance.
    $user = User::factory()->create();
    $this->actingAs($user);

    foreach (range(1, 25) as $i) {
        $this->postJson('/api/votes', ['type' => 'dream', 'slug' => "junk-{$i}", 'value' => 1]);
    }

    expect(Vote::count())->toBe(0);
});

it('still accepts a vote on a real dream', function () {
    // Guard against the fix over-reaching: the legitimate path must survive.
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->postJson('/api/votes', ['type' => 'dream', 'slug' => 'control-baton', 'value' => 1])
        ->assertOk();

    expect(Vote::count())->toBe(1);
});
