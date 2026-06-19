<?php

use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

uses(TestCase::class);

function registerPollSession(string $session, string $token): void
{
    Cache::put("wb-share:token:{$session}", hash('sha256', $token), 3600);
}

it('registers a subscriber and delivers a fanned-out frame on the next poll', function () {
    registerPollSession('p1', 'tok-1234567890abcdef');

    // First poll (wait=0 → return immediately): hands out a subscriber id, no frames.
    $first = $this->getJson('/agent-relay/p1/poll?token=tok-1234567890abcdef&direction=inbound&wait=0');
    $first->assertOk();
    $sub = $first->json('subscriber');
    expect($sub)->toMatch('/^[a-f0-9]{16}$/');
    expect($first->json('frames'))->toBe([]);

    // An external client posts an inbound frame → fanned out to our subscriber.
    $frame = ['jsonrpc' => '2.0', 'id' => 1, 'method' => 'tools/list', 'params' => []];
    $this->call('POST', '/agent-relay/p1/inbox?token=tok-1234567890abcdef', [], [], [],
        ['CONTENT_TYPE' => 'application/json'], (string) json_encode($frame))->assertOk();

    // Poll again with the SAME subscriber → drains the queued frame.
    $second = $this->getJson("/agent-relay/p1/poll?token=tok-1234567890abcdef&direction=inbound&wait=0&subscriber={$sub}");
    $second->assertOk();
    expect($second->json('subscriber'))->toBe($sub);
    expect($second->json('frames'))->toHaveCount(1);
    $delivered = json_decode($second->json('frames')[0], true);
    expect($delivered['method'])->toBe('tools/list')
        ->and($delivered['id'])->toBe(1);
});

it('rejects an invalid token', function () {
    registerPollSession('p2', 'tok-1234567890abcdef');
    $this->getJson('/agent-relay/p2/poll?token=wrong&wait=0')->assertStatus(401);
});

it('caps the park window (wait is clamped) and returns a JSON envelope', function () {
    registerPollSession('p3', 'tok-1234567890abcdef');
    $res = $this->getJson('/agent-relay/p3/poll?token=tok-1234567890abcdef&wait=0');
    $res->assertOk()->assertJsonStructure(['subscriber', 'frames']);
});
