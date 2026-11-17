<?php

use App\Jobs\RecordMcpRequest;
use App\Models\McpRequest;
use App\Models\McpSession;
use App\Support\McpStats\IpHasher;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

uses(TestCase::class);

const MCP_TEST_IP = '203.0.113.7';

/**
 * POST one JSON-RPC message to the hosted MCP server, the way a real client
 * does: JSON + SSE accept header, an optional session id, a fixed IP.
 *
 * @param  array<string, mixed>  $message
 */
function mcpPost(array $message, ?string $session = null, string $userAgent = 'claude-code/2.1.0 (cli)'): TestResponse
{
    $headers = [
        'Accept' => 'application/json, text/event-stream',
        'User-Agent' => $userAgent,
    ];
    if ($session !== null) {
        $headers['MCP-Session-Id'] = $session;
    }

    return test()->withServerVariables(['REMOTE_ADDR' => MCP_TEST_IP])->postJson('/mcp', $message, $headers);
}

function mcpInitialize(string $client = 'claude-code', string $version = '2.1.0'): string
{
    $response = mcpPost([
        'jsonrpc' => '2.0',
        'id' => 1,
        'method' => 'initialize',
        'params' => [
            'protocolVersion' => '2025-06-18',
            'capabilities' => [],
            'clientInfo' => ['name' => $client, 'version' => $version],
        ],
    ]);
    $response->assertOk();

    return (string) $response->headers->get('MCP-Session-Id');
}

/** @param  array<string, mixed>  $arguments */
function mcpCall(string $tool, array $arguments, ?string $session = null, int $id = 2): TestResponse
{
    return mcpPost([
        'jsonrpc' => '2.0',
        'id' => $id,
        'method' => 'tools/call',
        'params' => ['name' => $tool, 'arguments' => $arguments],
    ], $session);
}

it('records an initialize as a session carrying the client name, version and protocol', function () {
    $session = mcpInitialize('cursor', '1.7.3');

    expect($session)->not->toBe('');

    $row = McpSession::query()->where('session_id', $session)->sole();
    expect($row->client_name)->toBe('cursor')
        ->and($row->client_version)->toBe('1.7.3')
        ->and($row->protocol_version)->toBe('2025-06-18')
        ->and($row->ua_family)->toBe('claude-code')
        ->and($row->request_count)->toBe(1);

    $request = McpRequest::query()->sole();
    expect($request->method)->toBe('initialize')
        ->and($request->session_id)->toBe($session)
        ->and($request->status)->toBe('ok')
        ->and($request->client_name)->toBe('cursor');
});

it('records a tool call with its name, sanitized arguments, status, latency and result count', function () {
    $session = mcpInitialize();

    mcpCall('search-components', ['query' => 'Calendar', 'api_key' => 'sk-live-should-not-be-kept'], $session)->assertOk();

    $call = McpRequest::query()->where('method', 'tools/call')->sole();
    expect($call->target)->toBe('search-components')
        ->and($call->status)->toBe('ok')
        ->and($call->error_code)->toBeNull()
        ->and($call->latency_ms)->toBeGreaterThanOrEqual(0)
        ->and($call->session_id)->toBe($session)
        ->and($call->result_count)->toBeGreaterThan(0)
        ->and($call->protocol_version)->toBe('2025-06-18')
        ->and($call->day)->toBe(now()->toDateString());

    $args = json_decode($call->arguments, true);
    expect($args)->toBe(['query' => 'Calendar']);
    expect($call->arguments)->not->toContain('sk-live');
});

it('attaches the session client to every later request in that session', function () {
    $session = mcpInitialize('codex', '0.9.1');

    mcpPost(['jsonrpc' => '2.0', 'id' => 2, 'method' => 'tools/list'], $session)->assertOk();
    mcpCall('search-components', ['query' => 'modal'], $session, 3)->assertOk();

    $later = McpRequest::query()->where('method', '!=', 'initialize')->get();
    expect($later)->toHaveCount(2);
    foreach ($later as $row) {
        expect($row->client_name)->toBe('codex')->and($row->client_version)->toBe('0.9.1');
    }

    expect(McpSession::query()->where('session_id', $session)->value('request_count'))->toBe(3);
});

it('records an empty search as a zero result count', function () {
    $session = mcpInitialize();

    mcpCall('search-components', ['query' => 'zzz-no-such-component-qqq'], $session)->assertOk();

    expect(McpRequest::query()->where('target', 'search-components')->value('result_count'))->toBe(0);
});

it('records a tool error result as tool_error', function () {
    $session = mcpInitialize();

    mcpCall('get-component', ['name' => 'no-such-slug'], $session)->assertOk();

    $row = McpRequest::query()->where('target', 'get-component')->sole();
    expect($row->status)->toBe('tool_error')
        ->and($row->error_message)->toContain('not found');
});

it('records a JSON-RPC error with its code', function () {
    $session = mcpInitialize();

    mcpPost(['jsonrpc' => '2.0', 'id' => 9, 'method' => 'does/not-exist'], $session);

    $row = McpRequest::query()->where('method', 'does/not-exist')->sole();
    expect($row->status)->toBe('error')
        ->and($row->error_code)->toBe(-32601);
});

it('never stores the raw IP, only a daily-salted SHA-256 of it', function () {
    $session = mcpInitialize();
    mcpCall('search-components', ['query' => 'grid'], $session)->assertOk();

    foreach (['mcp_requests', 'mcp_sessions'] as $table) {
        foreach (DB::table($table)->get() as $row) {
            expect(json_encode($row))->not->toContain(MCP_TEST_IP);
        }
    }

    $hash = McpRequest::query()->where('method', 'tools/call')->value('ip_hash');
    expect($hash)->toMatch('/^[0-9a-f]{64}$/')
        ->and($hash)->not->toBe(hash('sha256', MCP_TEST_IP))
        ->and($hash)->toBe(app(IpHasher::class)->hash(MCP_TEST_IP, now()));
});

it('salts the IP hash per day, so the same visitor cannot be followed across days', function () {
    $hasher = app(IpHasher::class);
    $today = Carbon::parse('2026-11-16 10:00');

    expect($hasher->hash(MCP_TEST_IP, $today))->toBe($hasher->hash(MCP_TEST_IP, $today->copy()->setTime(23, 59)))
        ->and($hasher->hash(MCP_TEST_IP, $today))->not->toBe($hasher->hash(MCP_TEST_IP, $today->copy()->addDay()))
        ->and($hasher->hash(MCP_TEST_IP, $today))->not->toBe($hasher->hash('198.51.100.1', $today));
});

it('does not record notifications by default', function () {
    $session = mcpInitialize();

    mcpPost(['jsonrpc' => '2.0', 'method' => 'notifications/initialized'], $session);

    expect(McpRequest::query()->where('method', 'notifications/initialized')->count())->toBe(0);
});

it('records notifications when configured to', function () {
    config(['mcp-stats.record_notifications' => true]);
    $session = mcpInitialize();

    mcpPost(['jsonrpc' => '2.0', 'method' => 'notifications/initialized'], $session);

    expect(McpRequest::query()->where('method', 'notifications/initialized')->count())->toBe(1);
});

it('records nothing when disabled', function () {
    config(['mcp-stats.enabled' => false]);

    mcpInitialize();

    expect(McpRequest::query()->count())->toBe(0)
        ->and(McpSession::query()->count())->toBe(0);
});

it('pushes the recording onto a queue when one is configured', function () {
    Queue::fake();
    config(['mcp-stats.queue' => 'database']);

    mcpInitialize();

    Queue::assertPushed(RecordMcpRequest::class, fn (RecordMcpRequest $job) => $job->connection === 'database');
    expect(McpRequest::query()->count())->toBe(0);
});

it('never lets a recording failure break the MCP response', function () {
    Schema::drop('mcp_requests');

    $response = mcpPost(['jsonrpc' => '2.0', 'id' => 1, 'method' => 'tools/list']);

    $response->assertOk();
    expect($response->json('result.tools'))->not->toBeEmpty();
});

it('returns the MCP response untouched', function () {
    $body = mcpPost(['jsonrpc' => '2.0', 'id' => 4, 'method' => 'tools/list'])->json();

    expect($body['id'])->toBe(4)
        ->and(array_column($body['result']['tools'], 'name'))->toContain('search-components');
});
