<?php

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
    seedDashboard();
    $this->artisan('mcp-stats:rollup', ['--days' => 40])->assertSuccessful();
});

afterEach(function () {
    Carbon::setTestNow();
});

function mcpAdmin(): User
{
    return User::factory()->create(['is_admin' => true]);
}

/**
 * Two clients over the last few days: claude-code searching for things that
 * exist, cursor searching for one thing that does not and hitting errors.
 */
function seedDashboard(): void
{
    $d1 = now()->subDays(2);
    $d2 = now()->subDay();

    McpSession::factory()->create(['session_id' => 'sess-claude', 'client_name' => 'claude-code', 'client_version' => '2.1.0', 'first_seen_at' => $d1, 'last_seen_at' => $d1]);
    McpSession::factory()->create(['session_id' => 'sess-cursor', 'client_name' => 'cursor', 'client_version' => '1.7.3', 'first_seen_at' => $d2, 'last_seen_at' => $d2]);

    $claude = ['session_id' => 'sess-claude', 'client_name' => 'claude-code', 'client_version' => '2.1.0', 'day' => $d1->toDateString()];
    $cursor = ['session_id' => 'sess-cursor', 'client_name' => 'cursor', 'client_version' => '1.7.3', 'day' => $d2->toDateString()];

    McpRequest::factory()->create($claude + ['method' => 'initialize', 'created_at' => $d1->copy()->setTime(9, 0)]);
    McpRequest::factory()->tool('search-components', ['query' => 'calendar'])->create($claude + ['result_count' => 2, 'latency_ms' => 12, 'created_at' => $d1->copy()->setTime(9, 1)]);
    McpRequest::factory()->tool('get-component', ['name' => 'calendar'])->create($claude + ['latency_ms' => 40, 'created_at' => $d1->copy()->setTime(9, 2)]);

    McpRequest::factory()->create($cursor + ['method' => 'initialize', 'created_at' => $d2->copy()->setTime(14, 0)]);
    McpRequest::factory()->tool('search-components', ['query' => 'hologram projector'])->create($cursor + ['result_count' => 0, 'latency_ms' => 15, 'created_at' => $d2->copy()->setTime(14, 1)]);
    McpRequest::factory()->tool('search-nodes', ['query' => 'fax machine'])->create($cursor + ['result_count' => 0, 'latency_ms' => 18, 'created_at' => $d2->copy()->setTime(14, 2)]);
    McpRequest::factory()->tool('get-component', ['name' => 'hologram'])->toolError("Component 'hologram' not found in the registry.")->create($cursor + ['latency_ms' => 9, 'created_at' => $d2->copy()->setTime(14, 3)]);
    McpRequest::factory()->create($cursor + ['method' => 'does/not-exist', 'status' => 'error', 'error_code' => -32601, 'error_message' => 'The method [does/not-exist] was not found.', 'created_at' => $d2->copy()->setTime(14, 4)]);
}

dataset('mcp pages', [
    'overview' => ['/admin/mcp'],
    'tool' => ['/admin/mcp/tools/search-components'],
    'client' => ['/admin/mcp/clients/cursor'],
    'session' => ['/admin/mcp/sessions/sess-cursor'],
    'errors' => ['/admin/mcp/errors'],
    'error calls' => ['/admin/mcp/errors/calls'],
    'search demand' => ['/admin/mcp/search-demand'],
]);

it('forbids non-admins', function (string $url) {
    $this->actingAs(User::factory()->create(['is_admin' => false]))->get($url)->assertForbidden();
})->with('mcp pages');

it('sends guests to log in', function (string $url) {
    $this->get($url)->assertRedirect();
})->with('mcp pages');

it('renders every page for an admin', function (string $url) {
    $this->actingAs(mcpAdmin())->get($url)->assertOk();
})->with('mcp pages');

it('shows the overview: totals, series, top tools, top clients, latency and sessions', function () {
    $this->actingAs(mcpAdmin())
        ->get('/admin/mcp')
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Mcp/Index')
            ->where('range.days', 7)
            ->where('totals.requests', 8)
            ->where('totals.errors', 2)
            ->where('totals.sessions', 2)
            ->where('totals.clients', 2)
            ->where('totals.errorRate', 0.25)
            ->has('totals.p50')
            ->has('totals.p95')
            ->has('series', 7)
            // Two tools tie on calls; the tie breaks by name so the order is stable.
            ->where('topTools.0.tool', 'get-component')
            ->where('topTools.0.calls', 2)
            ->where('topTools.0.errors', 1)
            ->has('topTools', 3)
            ->has('topClients', 2)
            ->has('recentSessions', 2)
            ->where('recentSessions.0.session_id', 'sess-cursor')
        );
});

it('narrows the overview to a custom range', function () {
    $day = now()->subDays(2)->toDateString();

    $this->actingAs(mcpAdmin())
        ->get("/admin/mcp?from={$day}&to={$day}")
        ->assertInertia(fn (Assert $page) => $page
            ->where('range.preset', 'custom')
            ->where('range.from', $day)
            ->where('range.to', $day)
            ->where('totals.requests', 3)
            ->where('totals.errors', 0)
            ->has('series', 1)
        );
});

it('offers the 30-day preset', function () {
    $this->actingAs(mcpAdmin())
        ->get('/admin/mcp?days=30')
        ->assertInertia(fn (Assert $page) => $page->where('range.days', 30)->has('series', 30));
});

it('rejects an invalid range', function (string $query) {
    $this->actingAs(mcpAdmin())->get('/admin/mcp?'.$query)->assertSessionHasErrors();
})->with([
    'reversed' => ['from=2026-11-10&to=2026-11-01'],
    'not a date' => ['from=yesterday&to=2026-11-01'],
    'too long' => ['from=2020-01-01&to=2026-11-16'],
    'unknown preset' => ['days=9'],
]);

it('drills into a tool: calls over time, top argument values, errors, latency and clients', function () {
    $this->actingAs(mcpAdmin())
        ->get('/admin/mcp/tools/get-component')
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Mcp/Tool')
            ->where('tool', 'get-component')
            ->where('totals.calls', 2)
            ->where('totals.errors', 1)
            ->has('series', 7)
            ->where('argValues.0.key', 'name')
            ->has('argValues.0.values', 2)
            ->where('errorGroups.0.status', 'tool_error')
            ->where('recentErrors.0.error_message', "Component 'hologram' not found in the registry.")
            ->has('clients', 2)
            ->has('latency.p50')
            ->has('latency.buckets')
        );
});

it('drills into a client: its sessions, tool mix and errors', function () {
    $this->actingAs(mcpAdmin())
        ->get('/admin/mcp/clients/cursor?version=1.7.3')
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Mcp/Client')
            ->where('client.name', 'cursor')
            ->where('client.version', '1.7.3')
            ->where('totals.requests', 5)
            ->where('totals.errors', 2)
            ->where('sessions.0.session_id', 'sess-cursor')
            ->has('toolMix', 3)
            ->has('errors', 2)
            ->has('versions', 1)
        );
});

it('shows a session as its full ordered timeline', function () {
    $this->actingAs(mcpAdmin())
        ->get('/admin/mcp/sessions/sess-cursor')
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Mcp/Session')
            ->where('session.client_name', 'cursor')
            ->has('requests', 5)
            ->where('requests.0.method', 'initialize')
            ->where('requests.1.target', 'search-components')
            ->where('requests.1.arguments', ['query' => 'hologram projector'])
            ->where('requests.4.status', 'error')
        );
});

it('404s an unknown session', function () {
    $this->actingAs(mcpAdmin())->get('/admin/mcp/sessions/nope')->assertNotFound();
});

it('groups errors by code and tool', function () {
    $this->actingAs(mcpAdmin())
        ->get('/admin/mcp/errors')
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Mcp/Errors')
            ->where('total', 2)
            ->has('groups', 2)
            ->has('series', 7)
        );
});

it('lists the individual calls behind an error group', function () {
    $this->actingAs(mcpAdmin())
        ->get('/admin/mcp/errors/calls?status=tool_error&tool=get-component')
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Mcp/ErrorCalls')
            ->where('filters.tool', 'get-component')
            ->has('calls.data', 1)
            ->where('calls.data.0.session_id', 'sess-cursor')
        );

    $this->actingAs(mcpAdmin())
        ->get('/admin/mcp/errors/calls?code=-32601')
        ->assertInertia(fn (Assert $page) => $page
            ->has('calls.data', 1)
            ->where('calls.data.0.method', 'does/not-exist')
        );
});

it('reports search demand: empty searches and missing slugs', function () {
    $this->actingAs(mcpAdmin())
        ->get('/admin/mcp/search-demand')
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Mcp/SearchDemand')
            ->has('emptySearches', 2)
            ->where('emptySearches.0.tool', fn ($tool) => in_array($tool, ['search-components', 'search-nodes'], true))
            ->has('missingLookups', 1)
            ->where('missingLookups.0.value', 'hologram')
            ->where('missingLookups.0.tool', 'get-component')
        );
});

it('links the dashboard from the admin nav', function () {
    $layout = file_get_contents(resource_path('js/Pages/Admin/AdminLayout.tsx'));

    expect($layout)->toContain('href: "/admin/mcp"')
        ->and($layout)->toMatch('/\bmcp: \{ group: /');
});
