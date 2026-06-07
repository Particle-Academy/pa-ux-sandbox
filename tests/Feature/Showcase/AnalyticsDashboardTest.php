<?php

use App\Http\Controllers\AnalyticsController;
use App\Models\ShowcaseSubmission;
use App\Models\SitePageShot;
use App\Models\User;
use Database\Seeders\FunLabSeeder;
use FancyHeuristics\Models\HeuristicsEvent;
use FancyHeuristics\Models\HeuristicsSite;
use LaravelFunLab\Facades\LFL;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    // The `sandbox-pro` prize (and the overall-engagement metric that grants
    // it) live in the FunLabSeeder. The Pro pre-strategy resolves the prize, so
    // the seeder is a prerequisite for any Pro-path assertion.
    $this->seed(FunLabSeeder::class);
});

/**
 * Seed a realistic event stream for the showcase site so the controller has
 * something to roll up. Two sessions: one human, one agent.
 */
function seedShowcaseEvents(string $site = AnalyticsController::DEFAULT_SITE): void
{
    $now = now();

    $events = [
        // Human session on /pricing — a pageview, two clicks (pointer coords),
        // and a dwell so time-on-page has something to average.
        ['session_id' => 'sess-human', 'actor' => 'human', 'kind' => 'pageview', 'path' => '/pricing', 'occurred_at' => $now->copy()->subMinutes(10)],
        ['session_id' => 'sess-human', 'actor' => 'human', 'kind' => 'click', 'path' => '/pricing', 'x' => 120, 'y' => 340, 'vw' => 1280, 'vh' => 800, 'occurred_at' => $now->copy()->subMinutes(9)],
        ['session_id' => 'sess-human', 'actor' => 'human', 'kind' => 'click', 'path' => '/pricing', 'x' => 640, 'y' => 400, 'vw' => 1280, 'vh' => 800, 'occurred_at' => $now->copy()->subMinutes(9)],
        ['session_id' => 'sess-human', 'actor' => 'human', 'kind' => 'dwell', 'path' => '/pricing', 'dwell_ms' => 12000, 'occurred_at' => $now->copy()->subMinutes(8)],

        // Agent session on /docs — a pageview only (no pointer coords).
        ['session_id' => 'sess-agent', 'actor' => 'agent', 'kind' => 'pageview', 'path' => '/docs', 'occurred_at' => $now->copy()->subMinutes(5)],
        ['session_id' => 'sess-agent', 'actor' => 'agent', 'kind' => 'dwell', 'path' => '/docs', 'dwell_ms' => 4000, 'occurred_at' => $now->copy()->subMinutes(4)],
    ];

    foreach ($events as $e) {
        HeuristicsEvent::create(array_merge(['site_key' => $site], $e));
    }

    HeuristicsSite::firstOrCreate(
        ['site_key' => $site],
        ['url' => 'https://fancy-ui.test', 'visible' => true],
    );
}

it('requires authentication', function () {
    $this->get('/analytics')->assertRedirect('/login');
});

it('gates a non-pro user to the upsell with no data', function () {
    $user = User::factory()->create();
    seedShowcaseEvents();

    $this->actingAs($user)
        ->get('/analytics')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Analytics/Index')
            ->where('pro', false)
            ->where('kpis', null)
            ->where('sites', [])
            ->where('heatmap', null)
        );
});

it('shows the dashboard with the site rollups for a pro user', function () {
    $user = User::factory()->create();
    LFL::grant('sandbox-pro')->to($user)->save();
    seedShowcaseEvents();

    $this->actingAs($user)
        ->get('/analytics')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Analytics/Index')
            ->where('pro', true)
            ->where('proSource', 'prize')
            ->where('site', AnalyticsController::DEFAULT_SITE)
            ->where('kpis.totalEvents', 6)
        );
});

it('computes KPI rollups from the seeded events', function () {
    $user = User::factory()->create();
    LFL::grant('sandbox-pro')->to($user)->save();
    seedShowcaseEvents();

    $this->actingAs($user)
        ->get('/analytics')
        ->assertInertia(fn ($page) => $page
            // 2 pageviews (one human /pricing, one agent /docs).
            ->where('kpis.pageviews', 2)
            // 2 distinct sessions.
            ->where('kpis.sessions', 2)
            // 2 clicks / 2 pageviews = 1.0 clickthrough (JSON-encoded as 1).
            ->where('kpis.clickthrough', 1)
            ->where('kpis.clicks', 2)
            // Avg dwell across 12000ms + 4000ms = 8000ms.
            ->where('kpis.avgTimeOnPageMs', 8000)
            // Actor split: 4 human events, 2 agent events.
            ->where('kpis.human', 4)
            ->where('kpis.agent', 2)
        );
});

it('builds the real heatmap grid for the busiest path', function () {
    $user = User::factory()->create();
    LFL::grant('sandbox-pro')->to($user)->save();
    seedShowcaseEvents();

    $this->actingAs($user)
        ->get('/analytics')
        ->assertInertia(function ($page) {
            // /pricing is the only path with pointer/click coords, so it's the
            // busiest. The grid is the real normalised aggregate.
            $page->where('heatmap.path', '/pricing')
                ->where('heatmap.sample_count', 2)
                ->where('heatmap.site_key', AnalyticsController::DEFAULT_SITE);

            $cells = $page->toArray()['props']['heatmap']['cells'];
            expect($cells)->not->toBeEmpty();
            // Every cell carries grid coords + a 0..1 weight.
            foreach ($cells as $cell) {
                expect($cell['weight'])->toBeGreaterThan(0.0)
                    ->and($cell['weight'])->toBeLessThanOrEqual(1.0);
            }
        });
});

it('lists top paths ordered by event volume', function () {
    $user = User::factory()->create();
    LFL::grant('sandbox-pro')->to($user)->save();
    seedShowcaseEvents();

    $this->actingAs($user)
        ->get('/analytics')
        ->assertInertia(function ($page) {
            $paths = $page->toArray()['props']['topPaths'];
            // /pricing has 4 events, /docs has 2 → /pricing leads.
            expect($paths[0]['path'])->toBe('/pricing')
                ->and($paths[0]['events'])->toBe(4)
                ->and($paths[0]['clicks'])->toBe(2);
        });
});

it('tags recent sessions human vs agent', function () {
    $user = User::factory()->create();
    LFL::grant('sandbox-pro')->to($user)->save();
    seedShowcaseEvents();

    $this->actingAs($user)
        ->get('/analytics')
        ->assertInertia(function ($page) {
            $sessions = collect($page->toArray()['props']['recentSessions']);
            expect($sessions)->toHaveCount(2);
            $actors = $sessions->pluck('actor')->sort()->values()->all();
            expect($actors)->toBe(['agent', 'human']);
        });
});

it('scopes the site picker to the user’s own submissions (+ the showcase)', function () {
    $user = User::factory()->create();
    LFL::grant('sandbox-pro')->to($user)->save();

    ShowcaseSubmission::create([
        'user_id' => $user->id, 'site_key' => 'owned-key',
        'kind' => 'website', 'url' => 'https://owned.test', 'status' => 'verified',
    ]);
    // Another user's site must never appear in this user's picker.
    $other = User::factory()->create();
    ShowcaseSubmission::create([
        'user_id' => $other->id, 'site_key' => 'foreign-key',
        'kind' => 'website', 'url' => 'https://foreign.test', 'status' => 'verified',
    ]);

    $this->actingAs($user)
        ->get('/analytics')
        ->assertInertia(function ($page) {
            $keys = collect($page->toArray()['props']['sites'])->pluck('site_key')->all();
            expect($keys)->toContain('owned-key')
                ->and($keys)->toContain(AnalyticsController::DEFAULT_SITE)
                ->and($keys)->not->toContain('foreign-key');
        });
});

it('refuses to resolve a site the user does not own', function () {
    $user = User::factory()->create();
    LFL::grant('sandbox-pro')->to($user)->save();
    $other = User::factory()->create();
    ShowcaseSubmission::create([
        'user_id' => $other->id, 'site_key' => 'foreign-key',
        'kind' => 'website', 'url' => 'https://foreign.test', 'status' => 'verified',
    ]);

    // Probing someone else's site via ?site= falls back to the showcase default.
    $this->actingAs($user)
        ->get('/analytics?site=foreign-key')
        ->assertInertia(fn ($page) => $page->where('site', AnalyticsController::DEFAULT_SITE));
});

it('defaults a pro owner to their own first site', function () {
    $user = User::factory()->create();
    LFL::grant('sandbox-pro')->to($user)->save();
    ShowcaseSubmission::create([
        'user_id' => $user->id, 'site_key' => 'owned-key',
        'kind' => 'website', 'url' => 'https://owned.test', 'status' => 'verified',
    ]);

    $this->actingAs($user)
        ->get('/analytics')
        ->assertInertia(fn ($page) => $page->where('site', 'owned-key'));
});

it('includes the page screenshot for the busiest path when one is captured', function () {
    $user = User::factory()->create();
    LFL::grant('sandbox-pro')->to($user)->save();
    seedShowcaseEvents();
    SitePageShot::create([
        'site_key' => AnalyticsController::DEFAULT_SITE, 'path' => '/pricing',
        'image_path' => 'heatmaps/x/y.png', 'vw' => 1440, 'vh' => 900, 'captured_at' => now(),
    ]);

    $this->actingAs($user)
        ->get('/analytics')
        ->assertInertia(fn ($page) => $page
            // /pricing is the busiest path, so its captured shot is attached.
            ->where('heatmap.path', '/pricing')
            ->where('heatmapShot.vw', 1440)
            ->where('heatmapShot.vh', 900)
        );
});

it('renders an empty state for a pro user when the site has no events', function () {
    $user = User::factory()->create();
    LFL::grant('sandbox-pro')->to($user)->save();
    // No events seeded.

    $this->actingAs($user)
        ->get('/analytics')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('pro', true)
            ->where('kpis.totalEvents', 0)
            ->where('heatmap', null)
            ->where('topPaths', [])
        );
});
