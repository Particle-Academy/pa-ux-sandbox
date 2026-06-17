<?php

use App\Jobs\SimulateActiveUsers;
use App\Models\ActiveUser;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

uses(TestCase::class);

it('enqueues the simulate job from POST /active-users/simulate', function () {
    Queue::fake();

    $this->postJson('/active-users/simulate', ['count' => 8])->assertNoContent();

    Queue::assertPushed(SimulateActiveUsers::class, function (SimulateActiveUsers $job) {
        return $job->step === 0 && $job->total === 8;
    });
});

it('returns the recently-active collection with the expected JSON shape', function () {
    ActiveUser::create([
        'user_id' => null,
        'fake_key' => 'fake-1',
        'name' => 'Ada Lovelace',
        'avatar_url' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=fake-1',
        'activity_type' => 'xp',
        'activity_label' => 'earned 12 XP — browsing',
        'activity_at' => now(),
        'is_xp' => true,
        'is_achievement' => false,
        'last_active_at' => now(),
        'is_fake' => true,
    ]);

    // A stale row (>15 min) must be excluded from the seed.
    ActiveUser::create([
        'user_id' => null,
        'fake_key' => 'fake-stale',
        'name' => 'Ghost',
        'last_active_at' => now()->subMinutes(30),
        'activity_at' => now()->subMinutes(30),
        'is_fake' => true,
    ]);

    $response = $this->getJson('/active-users');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonStructure([
            'data' => [
                [
                    'id',
                    'user_id',
                    'name',
                    'avatar_url',
                    'activity_type',
                    'activity_label',
                    'activity_at',
                    'is_xp',
                    'is_achievement',
                    'last_active_at',
                    'is_fake',
                ],
            ],
        ])
        ->assertJsonPath('data.0.name', 'Ada Lovelace')
        ->assertJsonPath('data.0.is_xp', true)
        ->assertJsonPath('data.0.is_fake', true);
});
