<?php

use App\Models\ActiveUser;
use Tests\TestCase;

uses(TestCase::class);

it('returns the recently-active collection with the expected JSON shape', function () {
    ActiveUser::create([
        'user_id' => 1,
        'name' => 'Ada Lovelace',
        'avatar_url' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=ada',
        'activity_type' => 'xp',
        'activity_label' => 'earned 12 XP — browsing',
        'activity_at' => now(),
        'is_xp' => true,
        'is_achievement' => false,
        'last_active_at' => now(),
        'is_fake' => false,
    ]);

    // A stale row (>15 min) must be excluded from the seed.
    ActiveUser::create([
        'user_id' => 2,
        'name' => 'Ghost',
        'last_active_at' => now()->subMinutes(30),
        'activity_at' => now()->subMinutes(30),
        'is_fake' => false,
    ]);

    $this->getJson('/active-users')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonStructure([
            'data' => [
                ['id', 'user_id', 'name', 'avatar_url', 'identity' => ['name', 'avatarUrl', 'cosmetics'], 'activity_type', 'activity_label', 'activity_at', 'is_xp', 'is_achievement', 'last_active_at', 'is_fake'],
            ],
        ])
        ->assertJsonPath('data.0.name', 'Ada Lovelace')
        ->assertJsonPath('data.0.is_xp', true);
});

it('excludes fake rows and keeps real users within the 15-minute window', function () {
    // A leftover fake row must never surface now that the simulate feature is gone.
    ActiveUser::create([
        'user_id' => null,
        'fake_key' => 'fake-old',
        'name' => 'Stale Fake',
        'last_active_at' => now()->subMinute(),
        'activity_at' => now()->subMinute(),
        'is_fake' => true,
    ]);

    // A real user idle for 5 minutes — still present.
    ActiveUser::create([
        'user_id' => 1,
        'name' => 'Real User',
        'last_active_at' => now()->subMinutes(5),
        'activity_at' => now()->subMinutes(5),
        'is_fake' => false,
    ]);

    $this->getJson('/active-users')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Real User');
});
