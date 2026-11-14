<?php

use App\Models\ShowcaseSubmission;
use App\Models\User;
use Database\Seeders\FunLabSeeder;
use FancyHeuristics\Models\HeuristicsEvent;
use FancyHeuristics\Models\HeuristicsSite;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use LaravelFunLab\Facades\LFL;
use Tests\TestCase;

uses(TestCase::class);

/*
 * A showcase project is an analytics property only when it can carry the Fancy
 * Pixel: a website. A repo is verified by the static Fancified README badge,
 * which collects nothing, so registering one must never create a heuristics
 * site, and the Pro Analytics picker must never offer it (it showed up as
 * "github.com" with "No session data for <key> yet").
 */

it('does not register a heuristics site for a repo submission', function () {
    $owner = User::factory()->create();

    $submission = ShowcaseSubmission::create([
        'user_id' => $owner->id,
        'kind' => 'repo',
        'url' => 'https://github.com/example/project',
        'status' => 'pending',
    ]);

    expect(HeuristicsSite::query()->where('site_key', $submission->site_key)->exists())->toBeFalse();
});

it('does not register a heuristics site for a website submission pointing at a shared repo host', function () {
    $owner = User::factory()->create();

    $submission = ShowcaseSubmission::create([
        'user_id' => $owner->id,
        'kind' => 'website',
        'url' => 'https://www.github.com/example/project',
        'status' => 'pending',
    ]);

    expect($submission->isAnalyticsProperty())->toBeFalse()
        ->and(HeuristicsSite::query()->where('site_key', $submission->site_key)->exists())->toBeFalse();
});

it('still registers a heuristics site for a real website', function () {
    $owner = User::factory()->create();

    $submission = ShowcaseSubmission::create([
        'user_id' => $owner->id,
        'kind' => 'website',
        'url' => 'https://owned-site.test',
        'status' => 'pending',
    ]);

    expect($submission->isAnalyticsProperty())->toBeTrue()
        ->and(HeuristicsSite::query()->where('site_key', $submission->site_key)->exists())->toBeTrue();
});

it('keeps repo submissions out of the Pro analytics site picker, even with a legacy site row', function () {
    $this->seed(FunLabSeeder::class);
    $user = User::factory()->create();
    LFL::grant('sandbox-pro')->to($user)->save();

    ShowcaseSubmission::create([
        'user_id' => $user->id, 'site_key' => 'al6jtky7rnpd',
        'kind' => 'repo', 'url' => 'https://github.com/example/project', 'status' => 'pending',
    ]);
    // The row the old code created on registration.
    HeuristicsSite::firstOrCreate(['site_key' => 'al6jtky7rnpd'], ['url' => 'https://github.com/example/project', 'visible' => false]);

    ShowcaseSubmission::create([
        'user_id' => $user->id, 'site_key' => 'owned-key',
        'kind' => 'website', 'url' => 'https://owned.test', 'status' => 'verified',
    ]);

    $this->actingAs($user)
        ->get('/analytics')
        ->assertOk()
        ->assertInertia(function ($page) {
            $props = $page->toArray()['props'];
            $sites = collect($props['sites']);

            expect($sites->pluck('site_key')->all())->not->toContain('al6jtky7rnpd')
                ->and($sites->pluck('site_key')->all())->toContain('owned-key')
                ->and($sites->pluck('label')->all())->not->toContain('github.com')
                ->and($props['site'])->toBe('owned-key');
        });

    // Asking for it by key does not reach it either.
    $this->actingAs($user)
        ->get('/analytics?site=al6jtky7rnpd')
        ->assertInertia(fn ($page) => $page->where('site', 'owned-key'));
});

it('quarantines bogus repo heuristics sites reversibly, and leaves sites with data alone', function () {
    $owner = User::factory()->create();
    $migration = require database_path('migrations/2026_11_13_000001_quarantine_repo_heuristics_sites.php');

    // Undo the migration the test database already ran, so up() runs fresh.
    $migration->down();

    $repo = ShowcaseSubmission::create([
        'user_id' => $owner->id, 'kind' => 'repo',
        'url' => 'https://github.com/example/project', 'status' => 'pending',
    ]);
    $repoWithData = ShowcaseSubmission::create([
        'user_id' => $owner->id, 'kind' => 'repo',
        'url' => 'https://github.com/example/other', 'status' => 'pending',
    ]);
    $website = ShowcaseSubmission::create([
        'user_id' => $owner->id, 'kind' => 'website',
        'url' => 'https://owned-site.test', 'status' => 'pending',
    ]);

    // Rows the old code created for the repos.
    HeuristicsSite::create(['site_key' => $repo->site_key, 'url' => $repo->url, 'visible' => false, 'pixel_status' => 'missing']);
    HeuristicsSite::create(['site_key' => $repoWithData->site_key, 'url' => $repoWithData->url, 'visible' => false]);
    HeuristicsEvent::create(['site_key' => $repoWithData->site_key, 'session_id' => 's1', 'actor' => 'human', 'kind' => 'pageview', 'path' => '/', 'occurred_at' => now()]);

    $migration->up();

    expect(HeuristicsSite::query()->where('site_key', $repo->site_key)->exists())->toBeFalse()
        ->and(DB::table('heuristics_sites_quarantine')->where('site_key', $repo->site_key)->value('pixel_status'))->toBe('missing')
        // Collected data means a real collector reached it: never touched blindly.
        ->and(HeuristicsSite::query()->where('site_key', $repoWithData->site_key)->exists())->toBeTrue()
        ->and(HeuristicsSite::query()->where('site_key', $website->site_key)->exists())->toBeTrue();

    $migration->down();

    expect(Schema::hasTable('heuristics_sites_quarantine'))->toBeFalse()
        ->and(HeuristicsSite::query()->where('site_key', $repo->site_key)->value('pixel_status'))->toBe('missing');

    $migration->up();
});
