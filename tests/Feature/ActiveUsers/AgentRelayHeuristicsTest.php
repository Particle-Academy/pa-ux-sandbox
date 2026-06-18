<?php

use App\Models\Setting;
use FancyHeuristics\Models\HeuristicsEvent;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

uses(TestCase::class);

/** Register a relay session token the way AgentRelayController::register does. */
function registerRelaySession(string $session, string $token): void
{
    Cache::put("wb-share:token:{$session}", hash('sha256', $token), 3600);
}

/** Point the showcase's "self" pixel at a known site_key via the tracker setting. */
function setSelfTracker(string $siteKey = 'self-key', string $endpoint = '/heuristics'): void
{
    Setting::put('tracker_code', '<script src="https://x/fancy-pixel.global.min.js" '.
        'data-site="'.$siteKey.'" data-mode="floating" data-endpoint="'.$endpoint.'"></script>');
}

it('records an inbound agent tool call as an actor:agent heuristics event', function () {
    setSelfTracker();
    registerRelaySession('sess1', 'tok-1234567890abcdef');

    $frame = [
        'jsonrpc' => '2.0',
        'id' => 1,
        'method' => 'tools/call',
        'params' => ['name' => 'whiteboard_add_sticky', 'arguments' => ['path' => '/board', 'text' => 'hi']],
    ];

    $this->call('POST', '/agent-relay/sess1/inbox?token=tok-1234567890abcdef', [], [], [],
        ['CONTENT_TYPE' => 'application/json'], (string) json_encode($frame))
        ->assertOk();

    $event = HeuristicsEvent::query()->where('site_key', 'self-key')->where('actor', 'agent')->first();

    expect($event)->not->toBeNull()
        ->and($event->target_id)->toBe('whiteboard_add_sticky')
        ->and($event->path)->toBe('/board')
        ->and($event->session_id)->toBe('relay-sess1');
});

it('ignores non tool-call frames (no analytics row)', function () {
    setSelfTracker();
    registerRelaySession('sess2', 'tok-1234567890abcdef');

    $frame = ['jsonrpc' => '2.0', 'id' => 2, 'method' => 'tools/list', 'params' => []];

    $this->call('POST', '/agent-relay/sess2/inbox?token=tok-1234567890abcdef', [], [], [],
        ['CONTENT_TYPE' => 'application/json'], (string) json_encode($frame))
        ->assertOk();

    expect(HeuristicsEvent::query()->where('actor', 'agent')->count())->toBe(0);
});

it('no-ops when the showcase has no self tracker configured', function () {
    // No setSelfTracker() — SelfSite::key() resolves null.
    registerRelaySession('sess3', 'tok-1234567890abcdef');

    $frame = [
        'jsonrpc' => '2.0',
        'id' => 3,
        'method' => 'tools/call',
        'params' => ['name' => 'flow_add_node', 'arguments' => []],
    ];

    $this->call('POST', '/agent-relay/sess3/inbox?token=tok-1234567890abcdef', [], [], [],
        ['CONTENT_TYPE' => 'application/json'], (string) json_encode($frame))
        ->assertOk();

    expect(HeuristicsEvent::query()->where('actor', 'agent')->count())->toBe(0);
});
