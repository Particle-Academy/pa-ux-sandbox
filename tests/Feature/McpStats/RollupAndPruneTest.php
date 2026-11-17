<?php

use App\Models\McpDailyArgValue;
use App\Models\McpDailyClient;
use App\Models\McpDailyRollup;
use App\Models\McpRequest;
use App\Models\McpSession;
use App\Models\User;
use App\Support\McpStats\LatencyHistogram;
use Database\Seeders\FunLabSeeder;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    Carbon::setTestNow('2026-11-16 12:00:00');
});

afterEach(function () {
    Carbon::setTestNow();
});

function seedRollupDay(): void
{
    $yesterday = now()->subDay();

    McpSession::factory()->create(['session_id' => 's-1', 'client_name' => 'claude-code', 'client_version' => '2.1.0', 'first_seen_at' => $yesterday, 'last_seen_at' => $yesterday]);
    McpSession::factory()->create(['session_id' => 's-2', 'client_name' => 'cursor', 'client_version' => '1.7.3', 'first_seen_at' => $yesterday, 'last_seen_at' => $yesterday]);

    $base = ['day' => $yesterday->toDateString(), 'created_at' => $yesterday];

    McpRequest::factory()->tool('search-components', ['query' => 'Calendar'])->create($base + ['session_id' => 's-1', 'client_name' => 'claude-code', 'client_version' => '2.1.0', 'latency_ms' => 10, 'result_count' => 3]);
    McpRequest::factory()->tool('search-components', ['query' => 'calendar '])->create($base + ['session_id' => 's-1', 'client_name' => 'claude-code', 'client_version' => '2.1.0', 'latency_ms' => 20, 'result_count' => 3]);
    McpRequest::factory()->tool('search-components', ['query' => 'hologram'])->create($base + ['session_id' => 's-2', 'client_name' => 'cursor', 'client_version' => '1.7.3', 'latency_ms' => 30, 'result_count' => 0]);
    McpRequest::factory()->tool('get-component', ['name' => 'no-such'])->toolError('not found')->create($base + ['session_id' => 's-2', 'client_name' => 'cursor', 'client_version' => '1.7.3', 'latency_ms' => 40]);
    McpRequest::factory()->create($base + ['method' => 'does/not-exist', 'status' => 'error', 'error_code' => -32601, 'session_id' => 's-2', 'client_name' => 'cursor', 'client_version' => '1.7.3', 'latency_ms' => 5]);
    // A request recorded before its session's initialize was: no client yet.
    McpRequest::factory()->create($base + ['method' => 'tools/list', 'session_id' => 's-2', 'client_name' => null, 'client_version' => null, 'latency_ms' => 2]);
}

it('rolls a day of raw requests into daily rollups', function () {
    seedRollupDay();

    $this->artisan('mcp-stats:rollup')->assertSuccessful();

    $day = now()->subDay()->toDateString();
    $search = McpDailyRollup::query()->whereDate('day', $day)->where('target', 'search-components')->get();

    expect((int) $search->sum('requests'))->toBe(3)
        ->and((int) $search->sum('empty_results'))->toBe(1)
        ->and((int) $search->sum('latency_sum'))->toBe(60)
        ->and((int) $search->max('latency_max'))->toBe(30);

    $errors = McpDailyRollup::query()->whereDate('day', $day)->where('status', '!=', 'ok')->get();
    expect($errors->pluck('status')->sort()->values()->all())->toBe(['error', 'tool_error'])
        ->and($errors->firstWhere('status', 'error')->error_code)->toBe(-32601);
});

it('backfills a client onto requests recorded before their session was known', function () {
    seedRollupDay();

    $this->artisan('mcp-stats:rollup')->assertSuccessful();

    expect(McpRequest::query()->where('method', 'tools/list')->value('client_name'))->toBe('cursor');

    $cursor = McpDailyClient::query()->where('client_name', 'cursor')->sole();
    expect($cursor->sessions)->toBe(1)
        ->and($cursor->requests)->toBe(4)
        ->and($cursor->errors)->toBe(2);
});

it('counts argument values, normalised, with their empty and error counts', function () {
    seedRollupDay();

    $this->artisan('mcp-stats:rollup')->assertSuccessful();

    $calendar = McpDailyArgValue::query()->where('target', 'search-components')->where('arg_value', 'calendar')->sole();
    expect($calendar->arg_key)->toBe('query')
        ->and($calendar->calls)->toBe(2)
        ->and($calendar->empty_results)->toBe(0);

    expect(McpDailyArgValue::query()->where('arg_value', 'hologram')->value('empty_results'))->toBe(1)
        ->and(McpDailyArgValue::query()->where('target', 'get-component')->where('arg_value', 'no-such')->value('errors'))->toBe(1);
});

it('stores a latency histogram the percentiles are read from', function () {
    seedRollupDay();

    $this->artisan('mcp-stats:rollup')->assertSuccessful();

    $histogram = LatencyHistogram::empty();
    foreach (McpDailyRollup::query()->where('target', 'search-components')->get() as $row) {
        $histogram->merge($row->latency_histogram);
    }

    expect($histogram->count())->toBe(3)
        ->and($histogram->percentile(50))->toBeGreaterThan(10.0)->toBeLessThanOrEqual(20.0)
        ->and($histogram->percentile(95))->toBeGreaterThan(20.0)->toBeLessThanOrEqual(30.0);
});

it('never estimates a percentile above the slowest call actually seen', function () {
    // 400 ms sits in the 300..500 bucket; interpolating to its top would
    // report a p99 of ~496 ms for a tool whose slowest call took 400.
    McpRequest::factory()->count(20)->tool('get-component', ['name' => 'x'])->create(['day' => now()->toDateString(), 'latency_ms' => 400]);
    $this->artisan('mcp-stats:rollup')->assertSuccessful();

    $user = User::factory()->create(['is_admin' => true]);
    $this->seed(FunLabSeeder::class);

    $this->actingAs($user)->get('/admin/mcp/tools/get-component')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('latency.max', 400)
            ->where('latency.p99', fn ($p) => $p <= 400)
            ->where('latency.p95', fn ($p) => $p <= 400)
        );

    $this->actingAs($user)->get('/admin/mcp')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('totals.p95', fn ($p) => $p <= 400)
            ->where('topTools.0.p95', fn ($p) => $p <= 400)
        );
});

it('is idempotent: rolling the same day twice gives the same rows', function () {
    seedRollupDay();

    $this->artisan('mcp-stats:rollup')->assertSuccessful();
    $first = McpDailyRollup::query()->sum('requests');
    $rows = McpDailyRollup::query()->count();

    $this->artisan('mcp-stats:rollup')->assertSuccessful();

    expect(McpDailyRollup::query()->sum('requests'))->toBe($first)
        ->and(McpDailyRollup::query()->count())->toBe($rows);
});

it('rolls a specific date on request', function () {
    McpRequest::factory()->tool('list-components', [])->create(['day' => '2026-10-01', 'created_at' => '2026-10-01 09:00:00']);

    $this->artisan('mcp-stats:rollup', ['--date' => '2026-10-01'])->assertSuccessful();

    expect(McpDailyRollup::query()->whereDate('day', '2026-10-01')->sum('requests'))->toEqual(1);
});

it('prunes everything older than the retention window and keeps the rest', function () {
    $old = now()->subDays(401);
    $recent = now()->subDays(10);

    McpRequest::factory()->create(['day' => $old->toDateString(), 'created_at' => $old]);
    McpRequest::factory()->create(['day' => $recent->toDateString(), 'created_at' => $recent]);
    McpSession::factory()->create(['first_seen_at' => $old, 'last_seen_at' => $old]);
    McpSession::factory()->create(['first_seen_at' => $recent, 'last_seen_at' => $recent]);
    McpDailyRollup::factory()->create(['day' => $old->toDateString()]);
    McpDailyRollup::factory()->create(['day' => $recent->toDateString()]);
    McpDailyClient::factory()->create(['day' => $old->toDateString()]);
    McpDailyArgValue::factory()->create(['day' => $old->toDateString()]);

    $this->artisan('mcp-stats:prune')->assertSuccessful();

    expect(McpRequest::query()->count())->toBe(1)
        ->and(McpSession::query()->count())->toBe(1)
        ->and(McpDailyRollup::query()->count())->toBe(1)
        ->and(McpDailyClient::query()->count())->toBe(0)
        ->and(McpDailyArgValue::query()->count())->toBe(0);
});

it('reads the retention window from config', function () {
    config(['mcp-stats.retention_days' => 5]);
    McpRequest::factory()->create(['day' => now()->subDays(10)->toDateString(), 'created_at' => now()->subDays(10)]);

    $this->artisan('mcp-stats:prune')->assertSuccessful();

    expect(McpRequest::query()->count())->toBe(0);
});

it('schedules the rollup and the prune', function () {
    $commands = collect(app(Schedule::class)->events())->map(fn ($event) => (string) $event->command)->implode("\n");

    expect($commands)->toContain('mcp-stats:rollup')
        ->and($commands)->toContain('mcp-stats:prune');
});
