<?php

use App\Models\User;
use Database\Seeders\FunLabSeeder;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    // The overall-engagement metric group (headline level/XP) lives in the seeder.
    $this->seed(FunLabSeeder::class);
});

it('requires authentication', function () {
    $this->get('/profile')->assertRedirect('/login');
});

it('renders the gamification profile for an authed user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/profile')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Profile/Show')
            ->where('profile.memberSince', (int) $user->created_at->year)
            ->has('profile.metrics')
            ->has('profile.achievements')
            ->has('profile.prizes')
            ->where('profile.lifetimeEarned', fn ($v) => $v !== null)
        );
});
