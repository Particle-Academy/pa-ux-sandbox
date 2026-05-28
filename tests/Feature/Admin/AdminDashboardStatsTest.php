<?php

use App\Models\ShowcaseSubmission;
use App\Models\User;
use App\Services\GamificationStats;
use Database\Seeders\FunLabSeeder;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    $this->seed(FunLabSeeder::class);
});

it('aggregates coins in circulation + today movement', function () {
    $a = User::factory()->create();
    $b = User::factory()->create();
    $a->getWallet()->credit(1000, 'seed');
    $b->getWallet()->credit(500, 'seed');
    $a->getWallet()->debit(200, 'spent');

    $stats = app(GamificationStats::class)->dashboard();

    expect($stats['coins']['in_circulation'])->toBe(1300) // 1000-200 + 500
        ->and($stats['coins']['lifetime_minted'])->toBe(1500)
        ->and($stats['coins']['earned_today'])->toBe(1500)
        ->and($stats['coins']['spent_today'])->toBe(200);
});

it('ranks top earners all-time by lifetime minted', function () {
    $whale = User::factory()->create(['name' => 'Whale']);
    $minnow = User::factory()->create(['name' => 'Minnow']);
    $whale->getWallet()->credit(9000, 'seed');
    $minnow->getWallet()->credit(10, 'seed');

    $top = app(GamificationStats::class)->dashboard()['topEarners']['all_time'];

    expect($top[0]['name'])->toBe('Whale')
        ->and($top[0]['value'])->toBe(9000);
});

it('counts active featured submissions and pending moderation', function () {
    $u = User::factory()->create();
    ShowcaseSubmission::create([
        'user_id' => $u->id, 'kind' => 'website', 'url' => 'https://a.com',
        'title' => 'Featured One', 'status' => 'verified', 'featured_until' => now()->addDays(3),
    ]);
    ShowcaseSubmission::create([
        'user_id' => $u->id, 'kind' => 'website', 'url' => 'https://b.com',
        'title' => 'Expired', 'status' => 'verified', 'featured_until' => now()->subDay(),
    ]);
    ShowcaseSubmission::create([
        'user_id' => $u->id, 'kind' => 'website', 'url' => 'https://c.com',
        'title' => 'Pending', 'status' => 'pending',
    ]);

    $stats = app(GamificationStats::class)->dashboard();

    expect($stats['featured']['count'])->toBe(1)
        ->and($stats['featured']['items'][0]['title'])->toBe('Featured One')
        ->and($stats['pendingSubmissions'])->toBe(1);
});

it('renders the admin dashboard with gamification widgets', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    $admin->getWallet()->credit(777, 'seed');

    $this->actingAs($admin)->get('/admin')
        ->assertOk()
        ->assertSee('Coins in circulation')
        ->assertSee('Top earners');
});
