<?php

use App\Models\User;
use Database\Seeders\FunLabSeeder;
use FancyHeuristics\Models\HeuristicsEvent;
use FancyHeuristics\Models\HeuristicsPixelPing;
use FancyHeuristics\Models\HeuristicsSite;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    $this->seed(FunLabSeeder::class);
});

function heuristicsAdmin(): User
{
    return User::factory()->create(['is_admin' => true]);
}

/**
 * Seed a realistic event stream + a registered site so the controller has
 * something to roll up. Two sessions: one human (with pointer coords on
 * /pricing), one agent on /docs.
 */
function seedSiteWithEvents(string $site = 'demo-site'): HeuristicsSite
{
    $now = now();

    $events = [
        ['session_id' => 'sess-human', 'actor' => 'human', 'kind' => 'pageview', 'path' => '/pricing', 'occurred_at' => $now->copy()->subMinutes(10)],
        ['session_id' => 'sess-human', 'actor' => 'human', 'kind' => 'click', 'path' => '/pricing', 'x' => 120, 'y' => 340, 'vw' => 1280, 'vh' => 800, 'occurred_at' => $now->copy()->subMinutes(9)],
        ['session_id' => 'sess-human', 'actor' => 'human', 'kind' => 'click', 'path' => '/pricing', 'x' => 640, 'y' => 400, 'vw' => 1280, 'vh' => 800, 'occurred_at' => $now->copy()->subMinutes(9)],
        ['session_id' => 'sess-human', 'actor' => 'human', 'kind' => 'dwell', 'path' => '/pricing', 'dwell_ms' => 12000, 'occurred_at' => $now->copy()->subMinutes(8)],
        ['session_id' => 'sess-agent', 'actor' => 'agent', 'kind' => 'pageview', 'path' => '/docs', 'occurred_at' => $now->copy()->subMinutes(5)],
        ['session_id' => 'sess-agent', 'actor' => 'agent', 'kind' => 'dwell', 'path' => '/docs', 'dwell_ms' => 4000, 'occurred_at' => $now->copy()->subMinutes(4)],
    ];

    foreach ($events as $e) {
        HeuristicsEvent::create(array_merge(['site_key' => $site], $e));
    }

    return HeuristicsSite::create([
        'site_key' => $site,
        'url' => 'https://demo-site.test',
        'visible' => true,
    ]);
}

it('forbids non-admins from the heuristics index', function () {
    $this->actingAs(User::factory()->create(['is_admin' => false]))
        ->get('/admin/heuristics')
        ->assertForbidden();
});

it('forbids non-admins from a per-site drilldown', function () {
    $site = seedSiteWithEvents();

    $this->actingAs(User::factory()->create(['is_admin' => false]))
        ->get("/admin/heuristics/{$site->site_key}")
        ->assertForbidden();
});

it('shows the platform-wide rollups and the site list', function () {
    $admin = heuristicsAdmin();
    seedSiteWithEvents('site-a');
    seedSiteWithEvents('site-b');
    HeuristicsPixelPing::create([
        'site_key' => 'site-a',
        'style' => 'badge',
        'mode' => 'floating',
        'visible' => true,
        'path' => '/',
        'pinged_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get('/admin/heuristics')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Heuristics/Index')
            // 12 events total across the two seeded sites (6 each).
            ->where('rollups.totalEvents', 12)
            ->where('rollups.sites', 2)
            ->where('rollups.visibleSites', 2)
            // Two distinct session ids per site, but session_id is shared across
            // sites in the seed, so DISTINCT session_id across all sites = 2.
            ->where('rollups.sessions', 2)
            ->where('rollups.human', 8)
            ->where('rollups.agent', 4)
            ->where('rollups.pixelPings', 1)
            ->has('sites', 2)
            ->where('sites.0.site_key', 'site-a')
            ->where('sites.0.events', 6)
        );
});

it('returns the per-site KPIs on the show page', function () {
    $admin = heuristicsAdmin();
    $site = seedSiteWithEvents();

    $this->actingAs($admin)
        ->get("/admin/heuristics/{$site->site_key}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Heuristics/Show')
            ->where('site.site_key', $site->site_key)
            ->where('kpis.totalEvents', 6)
            ->where('kpis.pageviews', 2)
            ->where('kpis.sessions', 2)
            ->where('kpis.clicks', 2)
            ->where('kpis.clickthrough', 1)
            ->where('kpis.avgTimeOnPageMs', 8000)
            ->where('kpis.human', 4)
            ->where('kpis.agent', 2)
            // The busiest path (/pricing — the only one with pointer coords)
            // drives the real heatmap grid.
            ->where('heatmap.path', '/pricing')
            ->where('heatmap.sample_count', 2)
        );
});

it('runs the verify action and reports the result', function () {
    $admin = heuristicsAdmin();
    $site = seedSiteWithEvents();
    $site->update(['visible' => false, 'pixel_status' => null]);

    // The PixelVerifier fetches the site URL; fake a passing response carrying
    // the Fancy badge marker the shared detector looks for.
    Http::fake([
        '*' => Http::response('<html><body data-fancy-badge>Powered by Fancy UI</body></html>', 200),
    ]);

    $this->actingAs($admin)
        ->post("/admin/heuristics/{$site->site_key}/verify")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($site->refresh()->pixel_status)->toBe('passed')
        ->and($site->visible)->toBeTrue()
        ->and($site->last_verified_at)->not->toBeNull();
});
