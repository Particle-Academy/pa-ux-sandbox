<?php

use App\Models\GithubRepoStat;
use App\Models\LeaderboardSnapshot;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

it('sweeps stars, PRs, and issues across the ecosystem into a snapshot', function () {
    config(['services.github.api_token' => 'test-token']);

    Http::fake([
        // Sub-path endpoints first (most specific), then repo meta as catch-all.
        'api.github.com/repos/*/pulls*' => Http::response([
            ['merged_at' => now()->toIso8601String(), 'user' => ['login' => 'alice']],
        ]),
        'api.github.com/repos/*/stargazers*' => Http::response([
            ['starred_at' => now()->toIso8601String(), 'user' => ['login' => 'bob']],
        ]),
        'api.github.com/repos/*/issues*' => Http::response([
            ['created_at' => now()->toIso8601String(), 'user' => ['login' => 'carol']],
        ]),
        'api.github.com/repos/*' => Http::response(['stargazers_count' => 42]),
    ]);

    $this->artisan('showcase:refresh-leaderboard --scope=all_time')->assertSuccessful();

    $snapshot = LeaderboardSnapshot::query()->where('scope', 'all_time')->latest('generated_at')->first();
    expect($snapshot)->not->toBeNull();

    $byUser = collect($snapshot->rows)->keyBy('github_username');
    expect($byUser->has('alice'))->toBeTrue()   // merged PRs
        ->and($byUser->has('bob'))->toBeTrue()   // stars
        ->and($byUser->has('carol'))->toBeTrue() // opened issues
        ->and($byUser['bob']['stars'])->toBeGreaterThan(0)
        ->and($byUser['carol']['issues_opened'])->toBeGreaterThan(0)
        ->and($byUser['alice']['merged_prs'])->toBeGreaterThan(0);

    // Per-repo star counts persisted for the packages page.
    expect(GithubRepoStat::query()->count())->toBeGreaterThan(0)
        ->and(GithubRepoStat::query()->first()->stars)->toBe(42);
});

it('degrades to a votes-only snapshot without a GitHub token', function () {
    config(['services.github.api_token' => null]);

    $this->artisan('showcase:refresh-leaderboard --scope=all_time')->assertSuccessful();

    expect(LeaderboardSnapshot::query()->where('scope', 'all_time')->exists())->toBeTrue();
});

it('shows GitHub star counts on the packages page', function () {
    GithubRepoStat::create(['repo' => 'Particle-Academy/react-fancy', 'stars' => 1234]);

    $this->get('/packages')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Packages/Index')
            ->where('packages', fn ($packages) => collect($packages)
                ->firstWhere('slug', 'react-fancy')['stars'] === 1234));
});
