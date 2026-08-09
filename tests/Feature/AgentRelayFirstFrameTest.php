<?php

use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

uses(TestCase::class);

/**
 * A frame posted before any subscriber has registered must not be lost.
 *
 * `fanOut()` wrote to the subscribers present *at that moment*. An external
 * agent that posts `initialize` before the browser's receive leg has connected
 * therefore got a `200 OK` for a frame that went nowhere — and then waited for a
 * reply that could never come.
 *
 * That is a nasty shape of bug: the failure is a TIMEOUT on the caller, seconds
 * later and in a different process, with a success status on the write. It was
 * reported as a broken shell client (mcp-relay-client#1) precisely because
 * nothing at the relay end looked wrong.
 *
 * It is also a race no client can avoid: sharing starts, the link is handed
 * over, and whether the agent's first call survives depends on whether the
 * browser's long-poll happened to be mid-flight.
 */
function registerFirstFrameSession(string $session, string $token): void
{
    Cache::put("wb-share:token:{$session}", hash('sha256', $token), 3600);
}

function postFrame(object $test, string $session, string $token, array $frame)
{
    return $test->call(
        'POST',
        "/agent-relay/{$session}/inbox?token={$token}",
        [], [], [],
        ['CONTENT_TYPE' => 'application/json'],
        (string) json_encode($frame),
    );
}

it('delivers a frame posted before any subscriber existed', function () {
    registerFirstFrameSession('ff1', 'tok-1234567890abcdef');

    // The agent posts first — nobody is listening yet.
    postFrame($this, 'ff1', 'tok-1234567890abcdef', [
        'jsonrpc' => '2.0', 'id' => 1, 'method' => 'initialize', 'params' => [],
    ])->assertOk();

    // The browser's receive leg connects a moment later and must still get it.
    $poll = $this->getJson('/agent-relay/ff1/poll?token=tok-1234567890abcdef&direction=inbound&wait=0');

    $poll->assertOk();
    expect($poll->json('frames'))->toHaveCount(1);
    $delivered = json_decode($poll->json('frames')[0], true);
    expect($delivered['method'])->toBe('initialize');
});

it('does not replay the backlog to a second subscriber', function () {
    // The backlog covers the gap before anyone was listening. Handing it to
    // every later subscriber would redeliver an already-answered initialize,
    // which is worse than dropping it.
    registerFirstFrameSession('ff2', 'tok-1234567890abcdef');

    postFrame($this, 'ff2', 'tok-1234567890abcdef', [
        'jsonrpc' => '2.0', 'id' => 1, 'method' => 'initialize', 'params' => [],
    ])->assertOk();

    $first = $this->getJson('/agent-relay/ff2/poll?token=tok-1234567890abcdef&direction=inbound&wait=0');
    expect($first->json('frames'))->toHaveCount(1);

    $second = $this->getJson('/agent-relay/ff2/poll?token=tok-1234567890abcdef&direction=inbound&wait=0');

    $second->assertOk();
    expect($second->json('frames'))->toBe([]);
});

it('still delivers normally once a subscriber is registered', function () {
    // Regression guard for the ordinary path — passes before the fix too.
    registerFirstFrameSession('ff3', 'tok-1234567890abcdef');

    $first = $this->getJson('/agent-relay/ff3/poll?token=tok-1234567890abcdef&direction=inbound&wait=0');
    $sub = $first->json('subscriber');
    expect($first->json('frames'))->toBe([]);

    postFrame($this, 'ff3', 'tok-1234567890abcdef', [
        'jsonrpc' => '2.0', 'id' => 2, 'method' => 'tools/list', 'params' => [],
    ])->assertOk();

    $second = $this->getJson("/agent-relay/ff3/poll?token=tok-1234567890abcdef&direction=inbound&wait=0&subscriber={$sub}");

    expect($second->json('frames'))->toHaveCount(1);
    expect(json_decode($second->json('frames')[0], true)['method'])->toBe('tools/list');
});
