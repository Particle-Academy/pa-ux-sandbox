<?php

use App\Console\Commands\BackfillHeuristicsSessions;
use App\Http\Controllers\AnalyticsController;
use App\Models\User;
use App\Services\Heuristics\HeuristicsReport;
use Database\Seeders\FunLabSeeder;
use FancyHeuristics\Facades\Heuristics;
use FancyHeuristics\Models\HeuristicsEvent;
use FancyHeuristics\Models\HeuristicsSession;
use FancyHeuristics\Models\HeuristicsSite;
use LaravelFunLab\Facades\LFL;
use Tests\TestCase;

uses(TestCase::class);

const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

beforeEach(function () {
    $this->seed(FunLabSeeder::class);
});

function proUser(): User
{
    $user = User::factory()->create();
    LFL::grant('sandbox-pro')->to($user)->save();

    return $user;
}

/**
 * Seed real rolled sessions (via the live collect path) so the GA-parity
 * session reports have data. One human session with acquisition + utm context,
 * one agent session. Both inside the default 28-day window.
 */
function seedShowcaseSessions(string $site = AnalyticsController::DEFAULT_SITE): void
{
    HeuristicsSite::firstOrCreate(['site_key' => $site], ['url' => 'https://fancy-ui.test', 'visible' => true]);

    $now = now();

    Heuristics::collect([
        'siteKey' => $site,
        'sessionId' => 'human-1',
        'context' => [
            'referrer' => 'https://news.ycombinator.com/',
            'utm' => ['source' => 'newsletter', 'medium' => 'email', 'campaign' => 'launch'],
            'lang' => 'en-US',
        ],
        'events' => [
            ['kind' => 'pageview', 'actor' => 'human', 'path' => '/pricing', 'ts' => $now->copy()->subDays(3)->valueOf()],
            ['kind' => 'click', 'actor' => 'human', 'path' => '/pricing', 'targetId' => 'cta-go-pro', 'label' => 'Go Pro', 'x' => 100, 'y' => 200, 'vw' => 1280, 'vh' => 800, 'ts' => $now->copy()->subDays(3)->addSeconds(20)->valueOf()],
            ['kind' => 'pageview', 'actor' => 'human', 'path' => '/docs', 'ts' => $now->copy()->subDays(3)->addSeconds(60)->valueOf()],
        ],
    ], CHROME_UA);

    Heuristics::collect([
        'siteKey' => $site,
        'sessionId' => 'agent-1',
        'context' => ['referrer' => null, 'utm' => []],
        'events' => [
            ['kind' => 'pageview', 'actor' => 'agent', 'path' => '/docs', 'ts' => $now->copy()->subDays(2)->valueOf()],
            ['kind' => 'click', 'actor' => 'agent', 'path' => '/docs', 'targetId' => 'docs-link', 'label' => 'Docs', 'ts' => $now->copy()->subDays(2)->addSeconds(10)->valueOf()],
        ],
    ], CHROME_UA);
}

// ── Controller: new props + filters ──────────────────────────────────────────

it('returns the GA-parity sections for a pro user', function () {
    $user = proUser();
    seedShowcaseSessions();

    $this->actingAs($user)
        ->get('/analytics')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Analytics/Index')
            ->where('pro', true)
            ->where('filters.range', 28)
            ->where('filters.actor', 'all')
            ->where('filters.compare', true)
            ->has('overview')
            ->has('overviewSeries')
            ->has('acquisition')
            ->has('audience')
            ->has('behavior')
            ->has('realtime')
            ->has('agent')
            ->where('overview.total', 2)
        );
});

it('clamps the range param to a valid window', function () {
    $user = proUser();
    seedShowcaseSessions();

    $this->actingAs($user)
        ->get('/analytics?range=999')
        ->assertInertia(fn ($page) => $page->where('filters.range', 28));

    $this->actingAs($user)
        ->get('/analytics?range=7')
        ->assertInertia(fn ($page) => $page->where('filters.range', 7));
});

it('re-scopes the overview to the human actor filter', function () {
    $user = proUser();
    seedShowcaseSessions();

    $this->actingAs($user)
        ->get('/analytics?actor=human')
        ->assertInertia(fn ($page) => $page
            ->where('filters.actor', 'human')
            // Only the human session is in scope.
            ->where('overview.total', 1)
        );
});

it('re-scopes the overview to the agent actor filter', function () {
    $user = proUser();
    seedShowcaseSessions();

    $this->actingAs($user)
        ->get('/analytics?actor=agent')
        ->assertInertia(fn ($page) => $page
            ->where('filters.actor', 'agent')
            ->where('overview.total', 1)
        );
});

it('rejects an unknown actor param and falls back to all', function () {
    $user = proUser();
    seedShowcaseSessions();

    $this->actingAs($user)
        ->get('/analytics?actor=robot')
        ->assertInertia(fn ($page) => $page->where('filters.actor', 'all')->where('overview.total', 2));
});

it('honours the compare=0 toggle', function () {
    $user = proUser();
    seedShowcaseSessions();

    $this->actingAs($user)
        ->get('/analytics?compare=0')
        ->assertInertia(fn ($page) => $page
            ->where('filters.compare', false)
            // No comparison window requested → previous series is empty.
            ->where('overviewSeries.previous', [])
        );
});

it('exposes the human-vs-agent split in the overview', function () {
    $user = proUser();
    seedShowcaseSessions();

    $this->actingAs($user)
        ->get('/analytics')
        ->assertInertia(fn ($page) => $page
            ->where('overview.split.human.sessions', 1)
            ->where('overview.split.agent.sessions', 1)
        );
});

it('frames the agent moat section with the actor split', function () {
    $user = proUser();
    seedShowcaseSessions();

    $this->actingAs($user)
        ->get('/analytics')
        ->assertInertia(fn ($page) => $page
            ->where('agent.totals.human', 1)
            ->where('agent.totals.agent', 1)
            ->where('agent.totals.agentPct', 50)
        );
});

it('surfaces acquisition referrer + utm breakdowns', function () {
    $user = proUser();
    seedShowcaseSessions();

    $this->actingAs($user)
        ->get('/analytics')
        ->assertInertia(function ($page) {
            $acq = $page->toArray()['props']['acquisition'];
            // The human session referred from news.ycombinator.com.
            expect(collect($acq['referrer_hosts'])->pluck('host'))->toContain('news.ycombinator.com');
            expect(collect($acq['utm_sources'])->pluck('value'))->toContain('newsletter');
            // 1 referral (human), 1 direct (agent).
            expect($acq['referral'])->toBe(1)->and($acq['direct'])->toBe(1);
        });
});

it('surfaces audience device + browser breakdowns from the UA', function () {
    $user = proUser();
    seedShowcaseSessions();

    $this->actingAs($user)
        ->get('/analytics')
        ->assertInertia(function ($page) {
            $aud = $page->toArray()['props']['audience'];
            expect(collect($aud['browsers'])->pluck('value'))->toContain('Chrome');
            expect(collect($aud['devices'])->pluck('value'))->toContain('desktop');
        });
});

it('renders the no-sessions state for a pro site with events but no rolled sessions', function () {
    $user = proUser();
    HeuristicsSite::firstOrCreate(['site_key' => AnalyticsController::DEFAULT_SITE], ['url' => 'https://x.test', 'visible' => true]);
    // Raw events only — no session rows.
    HeuristicsEvent::create(['site_key' => AnalyticsController::DEFAULT_SITE, 'session_id' => 's1', 'actor' => 'human', 'kind' => 'pageview', 'path' => '/', 'occurred_at' => now()]);

    $this->actingAs($user)
        ->get('/analytics')
        ->assertInertia(fn ($page) => $page->where('overview.total', 0));
});

// ── Report: delta math ───────────────────────────────────────────────────────

it('computes period-over-period deltas in the overview', function () {
    $site = 'delta-site';
    HeuristicsSite::firstOrCreate(['site_key' => $site], ['url' => 'https://d.test', 'visible' => true]);

    // 2 sessions in the current 7-day window…
    HeuristicsSession::create(['site_key' => $site, 'session_id' => 'cur-1', 'actor' => 'human', 'started_at' => now()->subDays(1), 'last_event_at' => now()->subDays(1), 'pageviews' => 2, 'events' => 3, 'is_bounce' => false]);
    HeuristicsSession::create(['site_key' => $site, 'session_id' => 'cur-2', 'actor' => 'human', 'started_at' => now()->subDays(2), 'last_event_at' => now()->subDays(2), 'pageviews' => 1, 'events' => 1, 'is_bounce' => true]);
    // …vs 1 session in the previous 7-day window.
    HeuristicsSession::create(['site_key' => $site, 'session_id' => 'prev-1', 'actor' => 'human', 'started_at' => now()->subDays(9), 'last_event_at' => now()->subDays(9), 'pageviews' => 1, 'events' => 1, 'is_bounce' => true]);

    $report = app(HeuristicsReport::class);
    $overview = $report->overview($site, 7, 'all', true);

    // Sessions: 2 now vs 1 prior → +100%.
    expect($overview['metrics']['sessions']['value'])->toBe(2.0)
        ->and($overview['metrics']['sessions']['deltaPct'])->toBe(100.0);
});

it('omits deltas when comparison is disabled', function () {
    $site = 'nocompare-site';
    HeuristicsSite::firstOrCreate(['site_key' => $site], ['url' => 'https://n.test', 'visible' => true]);
    HeuristicsSession::create(['site_key' => $site, 'session_id' => 'a', 'actor' => 'human', 'started_at' => now()->subDays(1), 'last_event_at' => now()->subDays(1), 'pageviews' => 1, 'events' => 1, 'is_bounce' => true]);

    $report = app(HeuristicsReport::class);
    $overview = $report->overview($site, 7, 'all', false);

    expect($overview['metrics']['sessions']['deltaPct'])->toBeNull();
});

it('reports a 100% delta when the prior period had nothing', function () {
    $site = 'fresh-site';
    HeuristicsSite::firstOrCreate(['site_key' => $site], ['url' => 'https://f.test', 'visible' => true]);
    HeuristicsSession::create(['site_key' => $site, 'session_id' => 'a', 'actor' => 'human', 'started_at' => now()->subDays(1), 'last_event_at' => now()->subDays(1), 'pageviews' => 1, 'events' => 1, 'is_bounce' => true]);

    $report = app(HeuristicsReport::class);
    $overview = $report->overview($site, 7, 'all', true);

    expect($overview['metrics']['sessions']['deltaPct'])->toBe(100.0);
});

// ── Backfill command ─────────────────────────────────────────────────────────

it('builds session rows from historical events', function () {
    $site = 'backfill-site';
    $now = now();

    foreach ([
        ['session_id' => 'sess-a', 'actor' => 'human', 'kind' => 'pageview', 'path' => '/', 'occurred_at' => $now->copy()->subMinutes(10)],
        ['session_id' => 'sess-a', 'actor' => 'human', 'kind' => 'pageview', 'path' => '/pricing', 'occurred_at' => $now->copy()->subMinutes(9)],
        ['session_id' => 'sess-a', 'actor' => 'human', 'kind' => 'click', 'path' => '/pricing', 'occurred_at' => $now->copy()->subMinutes(8)],
        ['session_id' => 'sess-b', 'actor' => 'agent', 'kind' => 'pageview', 'path' => '/docs', 'occurred_at' => $now->copy()->subMinutes(5)],
    ] as $e) {
        HeuristicsEvent::create(array_merge(['site_key' => $site], $e));
    }

    expect(HeuristicsSession::where('site_key', $site)->count())->toBe(0);

    $this->artisan(BackfillHeuristicsSessions::class, ['--site' => $site])
        ->assertSuccessful();

    $sessions = HeuristicsSession::where('site_key', $site)->get();
    expect($sessions)->toHaveCount(2);

    $a = $sessions->firstWhere('session_id', 'sess-a');
    expect($a->pageviews)->toBe(2)
        ->and($a->events)->toBe(3)
        ->and($a->landing_path)->toBe('/')
        ->and($a->exit_path)->toBe('/pricing')
        ->and($a->is_bounce)->toBeFalse();

    $b = $sessions->firstWhere('session_id', 'sess-b');
    expect($b->actor)->toBe('agent')
        ->and($b->is_bounce)->toBeTrue();
});

it('is idempotent across repeated backfill runs', function () {
    $site = 'idempotent-site';
    HeuristicsEvent::create(['site_key' => $site, 'session_id' => 's', 'actor' => 'human', 'kind' => 'pageview', 'path' => '/', 'occurred_at' => now()->subMinutes(2)]);
    HeuristicsEvent::create(['site_key' => $site, 'session_id' => 's', 'actor' => 'human', 'kind' => 'click', 'path' => '/', 'occurred_at' => now()->subMinute()]);

    $this->artisan(BackfillHeuristicsSessions::class, ['--site' => $site])->assertSuccessful();
    $this->artisan(BackfillHeuristicsSessions::class, ['--site' => $site])->assertSuccessful();

    // Exactly one row, events counted once (not doubled by the second run).
    $rows = HeuristicsSession::where('site_key', $site)->get();
    expect($rows)->toHaveCount(1)
        ->and($rows->first()->events)->toBe(2);
});

it('skips events with no session id', function () {
    $site = 'no-session-site';
    HeuristicsEvent::create(['site_key' => $site, 'session_id' => null, 'actor' => 'human', 'kind' => 'pageview', 'path' => '/', 'occurred_at' => now()]);

    $this->artisan(BackfillHeuristicsSessions::class, ['--site' => $site])->assertSuccessful();

    expect(HeuristicsSession::where('site_key', $site)->count())->toBe(0);
});
