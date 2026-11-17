<?php

use App\Http\Controllers\AgentRelayController;
use Illuminate\Support\Facades\Cache;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

uses(TestCase::class);

/*
 * Behind Cloudflare, a streamed or long-polled response must not be buffered,
 * compressed or rewritten at the edge: `no-transform` tells Cloudflare to pass
 * it through untouched, and `X-Accel-Buffering: no` tells nginx at the origin
 * not to hold it back either. Every route that streams or parks a request is
 * listed here, so a new one without the headers is a visible omission.
 */
function expectStreamSafe(TestResponse $response): void
{
    $cacheControl = (string) $response->headers->get('Cache-Control');

    expect($cacheControl)->toContain('no-cache')
        ->and($cacheControl)->toContain('no-transform')
        ->and($response->headers->get('X-Accel-Buffering'))->toBe('no');
}

beforeEach(function () {
    Cache::put('wb-share:token:hs1', hash('sha256', 'tok-1234567890abcdef'), 3600);
});

it('marks the relay long-poll stream-safe on both prefixes', function (string $prefix) {
    $response = $this->getJson("/{$prefix}/hs1/poll?token=tok-1234567890abcdef&wait=0");

    $response->assertOk();
    expectStreamSafe($response);
})->with(['agent-relay', 'whiteboard-share']);

it('marks the relay SSE endpoint stream-safe, including its refusal', function (string $prefix) {
    // A valid token opens a stream that only ends on disconnect, so the
    // refusal is what a test can hold; the streaming branch sets the same
    // headers itself and the middleware covers both.
    $response = $this->get("/{$prefix}/hs1/events?token=wrong");

    $response->assertStatus(401);
    expectStreamSafe($response);
})->with(['agent-relay', 'whiteboard-share']);

it('marks the MCP endpoint stream-safe', function () {
    $response = $this->postJson('/mcp', [
        'jsonrpc' => '2.0', 'id' => 1, 'method' => 'tools/list',
    ], ['Accept' => 'application/json, text/event-stream']);

    $response->assertOk();
    expectStreamSafe($response);
});

it('marks the TUI frame long-poll stream-safe', function () {
    config(['services.tui.url' => '']);

    $response = $this->getJson('/fancy-tui/session/stream?id=x');

    $response->assertStatus(503);
    expectStreamSafe($response);
});

it('keeps every long-poll park under Cloudflare\'s 100-second origin timeout', function () {
    expect(AgentRelayController::MAX_POLL_WAIT_MS)->toBeLessThan(100_000)
        ->and(AgentRelayController::SSE_KEEPALIVE_SECONDS)->toBeLessThan(100)
        ->and((float) config('services.tui.stream_timeout', 8))->toBeLessThan(100.0);
});

it('clamps a relay poll that asks to park longer than the cap', function () {
    expect(AgentRelayController::parkWindowMs(10_000_000))->toBe(AgentRelayController::MAX_POLL_WAIT_MS)
        ->and(AgentRelayController::parkWindowMs(-5))->toBe(0)
        ->and(AgentRelayController::parkWindowMs(20_000))->toBe(20_000);
});
