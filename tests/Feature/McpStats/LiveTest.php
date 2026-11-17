<?php

use App\Models\McpDailyRollup;
use App\Models\McpRequest;
use App\Models\McpSession;
use App\Models\User;
use Database\Seeders\FunLabSeeder;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    $this->seed(FunLabSeeder::class);
    Carbon::setTestNow('2026-11-16 12:00:00');
});

afterEach(function () {
    Carbon::setTestNow();
});

function liveAdmin(): User
{
    return User::factory()->create(['is_admin' => true]);
}

/** A raw request `$minutesAgo` minutes ago, today. */
function liveRow(int $minutesAgo, array $attributes = []): McpRequest
{
    $at = now()->subMinutes($minutesAgo);

    return McpRequest::factory()->create($attributes + [
        'day' => $at->toDateString(),
        'created_at' => $at,
        'session_id' => 'live-sess',
        'client_name' => 'claude-code',
        'client_version' => '2.1.0',
    ]);
}

dataset('live urls', [
    'page' => ['/admin/mcp/live'],
    'feed' => ['/admin/mcp/live/feed'],
    'country' => ['/admin/mcp/countries/DE'],
]);

it('forbids non-admins', function (string $url) {
    $this->actingAs(User::factory()->create(['is_admin' => false]))->get($url)->assertForbidden();
})->with('live urls');

it('sends guests away', function (string $url) {
    $this->get($url)->assertRedirect();
})->with('live urls');

it('renders the live page with its poll interval and row cap from config', function () {
    config(['mcp-stats.live.poll_ms' => 3500, 'mcp-stats.live.row_cap' => 40]);

    $this->actingAs(liveAdmin())->get('/admin/mcp/live')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Mcp/Live')
            ->where('pollMs', 3500)
            ->where('rowCap', 40)
            ->where('feedUrl', '/admin/mcp/live/feed')
        );
});

it('serves the newest raw requests, newest first, with a cursor', function () {
    liveRow(5, ['method' => 'initialize']);
    liveRow(4, ['method' => 'tools/call', 'target' => 'search-components', 'arguments' => '{"query":"calendar"}', 'latency_ms' => 12]);
    $newest = liveRow(1, ['method' => 'tools/call', 'target' => 'get-component', 'arguments' => '{"name":"nope"}', 'status' => 'tool_error', 'error_message' => 'not found']);

    $feed = $this->actingAs(liveAdmin())->getJson('/admin/mcp/live/feed')->assertOk()->json();

    expect($feed['cursor'])->toBe($newest->id)
        ->and($feed['rows'])->toHaveCount(3)
        ->and($feed['rows'][0]['id'])->toBe($newest->id)
        ->and($feed['rows'][0]['target'])->toBe('get-component')
        ->and($feed['rows'][0]['status'])->toBe('tool_error')
        ->and($feed['rows'][0]['client_name'])->toBe('claude-code')
        ->and($feed['rows'][0]['client_version'])->toBe('2.1.0')
        ->and($feed['rows'][0]['session_id'])->toBe('live-sess')
        ->and($feed['rows'][1]['arguments'])->toBe(['query' => 'calendar'])
        ->and($feed['rows'][1]['latency_ms'])->toBe(12);
});

it('returns only rows after the since cursor', function () {
    $old = liveRow(3);
    $new = liveRow(1, ['method' => 'tools/call', 'target' => 'list-components']);

    $feed = $this->actingAs(liveAdmin())->getJson('/admin/mcp/live/feed?since='.$old->id)->json();

    expect(array_column($feed['rows'], 'id'))->toBe([$new->id])
        ->and($feed['cursor'])->toBe($new->id);

    $empty = $this->actingAs(liveAdmin())->getJson('/admin/mcp/live/feed?since='.$new->id)->json();
    expect($empty['rows'])->toBe([])->and($empty['cursor'])->toBe($new->id);
});

it('bounds the feed at the configured row cap whatever limit is asked for', function () {
    config(['mcp-stats.live.row_cap' => 5]);
    for ($i = 10; $i > 0; $i--) {
        liveRow($i);
    }

    $feed = $this->actingAs(liveAdmin())->getJson('/admin/mcp/live/feed?limit=500')->json();
    expect($feed['rows'])->toHaveCount(5);

    $three = $this->actingAs(liveAdmin())->getJson('/admin/mcp/live/feed?limit=3')->json();
    expect($three['rows'])->toHaveCount(3);
});

it('rejects a malformed cursor or limit', function (string $query) {
    $this->actingAs(liveAdmin())->getJson('/admin/mcp/live/feed?'.$query)->assertUnprocessable();
})->with([
    'negative since' => ['since=-1'],
    'text since' => ['since=abc'],
    'zero limit' => ['limit=0'],
]);

it('counts the last 15 minutes from raw rows only', function () {
    liveRow(20, ['method' => 'tools/call', 'target' => 'old-tool']);
    liveRow(10, ['method' => 'tools/call', 'target' => 'search-components', 'session_id' => 's-a']);
    liveRow(5, ['method' => 'tools/call', 'target' => 'search-components', 'session_id' => 's-b']);
    liveRow(2, ['method' => 'tools/call', 'target' => 'get-component', 'session_id' => 's-b', 'status' => 'error', 'error_code' => -32603]);

    // Rollups must not leak into a live view.
    McpDailyRollup::factory()->create(['day' => now()->toDateString(), 'requests' => 999]);

    $counters = $this->actingAs(liveAdmin())->getJson('/admin/mcp/live/feed')->json('counters');

    expect($counters['minutes'])->toBe(15)
        ->and($counters['requests'])->toBe(3)
        ->and($counters['sessions'])->toBe(2)
        ->and($counters['errors'])->toBe(1)
        ->and($counters['topTools'][0])->toBe(['tool' => 'search-components', 'calls' => 2]);
});

it('maps the last 24 hours, clustered, placing country-only rows at a centroid', function () {
    liveRow(30, ['country' => 'DE', 'city' => 'Berlin', 'latitude' => 52.5, 'longitude' => 13.4]);
    liveRow(20, ['country' => 'DE', 'city' => 'Berlin', 'latitude' => 52.5, 'longitude' => 13.4]);
    liveRow(10, ['country' => 'FR']);
    liveRow(5);
    liveRow(60 * 30, ['country' => 'JP', 'latitude' => 35.7, 'longitude' => 139.7]); // 30 h ago

    $feed = $this->actingAs(liveAdmin())->getJson('/admin/mcp/live/feed')->json();

    $berlin = collect($feed['map'])->firstWhere('city', 'Berlin');
    expect($berlin['count'])->toBe(2)
        ->and($berlin['lat'])->toBe(52.5)
        ->and($berlin['lng'])->toBe(13.4)
        ->and($berlin['approximate'])->toBeFalse();

    $france = collect($feed['map'])->firstWhere('country', 'FR');
    expect($france['approximate'])->toBeTrue()
        ->and($france['lat'])->toBeGreaterThan(42.0)->toBeLessThan(51.5);

    expect(collect($feed['map'])->pluck('country')->all())->not->toContain('JP');

    expect(collect($feed['countries'])->firstWhere('country', 'DE'))->toMatchArray(['country' => 'DE', 'name' => 'Germany', 'requests' => 2])
        ->and($feed['located'])->toBe(3)
        ->and($feed['unlocated'])->toBe(1);
});

it('gives each streamed row a position for its ping', function () {
    liveRow(1, ['country' => 'FR']);

    $row = $this->actingAs(liveAdmin())->getJson('/admin/mcp/live/feed')->json('rows.0');

    expect($row['country'])->toBe('FR')
        ->and($row['ping'])->toBeArray()
        ->and($row['ping']['approximate'])->toBeTrue();
});

it('drills into the requests from one country', function () {
    McpSession::factory()->create(['session_id' => 'live-sess']);
    liveRow(10, ['country' => 'DE', 'city' => 'Berlin', 'latitude' => 52.5, 'longitude' => 13.4, 'method' => 'tools/call', 'target' => 'search-components']);
    liveRow(5, ['country' => 'DE', 'city' => 'Munich', 'latitude' => 48.1, 'longitude' => 11.6]);
    liveRow(2, ['country' => 'FR']);

    $this->actingAs(liveAdmin())->get('/admin/mcp/countries/de')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Mcp/Country')
            ->where('country.code', 'DE')
            ->where('country.name', 'Germany')
            ->where('total', 2)
            ->has('cities', 2)
            ->has('calls.data', 2)
            ->where('calls.data.0.session_id', 'live-sess')
        );
});

it('404s a country code that is not two letters', function () {
    $this->actingAs(liveAdmin())->get('/admin/mcp/countries/germany')->assertNotFound();
});

it('shows today on the overview from raw rows before any rollup has run', function () {
    McpSession::factory()->create(['session_id' => 'live-sess', 'client_name' => 'claude-code', 'first_seen_at' => now()->subMinutes(5), 'last_seen_at' => now()->subMinute()]);
    liveRow(5, ['method' => 'initialize']);
    liveRow(4, ['method' => 'tools/call', 'target' => 'search-components', 'result_count' => 0]);
    liveRow(3, ['method' => 'tools/call', 'target' => 'search-components', 'status' => 'tool_error']);

    expect(McpDailyRollup::query()->count())->toBe(0);

    $this->actingAs(liveAdmin())->get('/admin/mcp')
        ->assertInertia(fn (Assert $page) => $page
            ->where('totals.requests', 3)
            ->where('totals.errors', 1)
            ->where('totals.clients', 1)
            ->where('topTools.0.tool', 'search-components')
            ->where('topTools.0.calls', 2)
            ->where('series.6.date', now()->toDateString())
            ->where('series.6.requests', 3)
            ->where('series.6.sessions', 1)
        );
});

it('does not double-count today once the rollup has also run', function () {
    liveRow(4, ['method' => 'tools/call', 'target' => 'search-components']);
    liveRow(3, ['method' => 'tools/call', 'target' => 'search-components']);
    $this->artisan('mcp-stats:rollup')->assertSuccessful();
    liveRow(1, ['method' => 'tools/call', 'target' => 'search-components']); // after the rollup

    $this->actingAs(liveAdmin())->get('/admin/mcp')
        ->assertInertia(fn (Assert $page) => $page->where('totals.requests', 3));

    $this->actingAs(liveAdmin())->get('/admin/mcp/tools/search-components')
        ->assertInertia(fn (Assert $page) => $page->where('totals.calls', 3));
});

it('includes today from raw rows on the search-demand report', function () {
    liveRow(2, ['method' => 'tools/call', 'target' => 'search-components', 'arguments' => '{"query":"warp drive"}', 'result_count' => 0]);

    $this->actingAs(liveAdmin())->get('/admin/mcp/search-demand')
        ->assertInertia(fn (Assert $page) => $page->where('emptySearches.0.value', 'warp drive'));
});

it('links the live view prominently from the overview', function () {
    $overview = file_get_contents(resource_path('js/Pages/Admin/Mcp/Index.tsx'));
    $tabs = file_get_contents(resource_path('js/Pages/Admin/Mcp/parts.tsx'));

    expect($overview)->toContain('/admin/mcp/live')
        ->and($tabs)->toContain('/admin/mcp/live');
});
