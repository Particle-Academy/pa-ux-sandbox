<?php

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

/**
 * The session proxy behind /fancy-tui's live terminal.
 *
 * The whole TUI is one live Ink app rendered by a localhost Node service; this
 * route is its public edge. The contract that matters here: it degrades cleanly
 * when the service is absent, forwards the RAW body (so the trimmed-whitespace
 * bug that ate the Enter key can't come back), passes the service's status
 * through, and never lets the service's failure become a 500.
 */
it('degrades to a clean 503 when no render service is configured', function () {
    config(['services.tui.url' => null]);

    $this->postJson('/fancy-tui/session', ['action' => 'start', 'cols' => 80, 'rows' => 24])
        ->assertStatus(503)
        ->assertJsonStructure(['error']);
});

it('forwards a start to the render service and returns its session', function () {
    config(['services.tui.url' => 'http://127.0.0.1:9999']);

    Http::fake([
        'http://127.0.0.1:9999/session' => Http::response([
            'id' => 's-abc',
            'seq' => 0,
            'frame' => 'hello terminal',
            'effects' => [],
        ]),
    ]);

    $this->postJson('/fancy-tui/session', ['action' => 'start', 'cols' => 80, 'rows' => 24])
        ->assertOk()
        ->assertJsonPath('id', 's-abc')
        ->assertJsonPath('frame', 'hello terminal');
});

it('forwards the raw body so the Enter key survives whitespace trimming', function () {
    // Laravel's TrimStrings middleware strips a lone `\r`/`\n` from parsed
    // input, which silently eats Enter. Forwarding the raw body is the fix, and
    // this pins it: the byte the service receives must still be the carriage
    // return.
    config(['services.tui.url' => 'http://127.0.0.1:9999']);

    Http::fake([
        'http://127.0.0.1:9999/session' => Http::response(['id' => 's-1', 'seq' => 0, 'frame' => '', 'effects' => []]),
    ]);

    $this->call(
        'POST',
        '/fancy-tui/session',
        [],
        [],
        [],
        ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'],
        json_encode(['action' => 'key', 'id' => 's-1', 'key' => "\r"]),
    )->assertOk();

    Http::assertSent(function ($request) {
        $body = json_decode($request->body(), true);

        return ($body['key'] ?? null) === "\r";
    });
});

it('passes the service status through, so a full-sessions 409 reaches the browser', function () {
    config(['services.tui.url' => 'http://127.0.0.1:9999']);

    Http::fake([
        'http://127.0.0.1:9999/session' => Http::response(['error' => 'too many live sessions'], 409),
    ]);

    $this->postJson('/fancy-tui/session', ['action' => 'start', 'cols' => 80, 'rows' => 24])
        ->assertStatus(409)
        ->assertJsonStructure(['error']);
});

it('turns a render-service outage into a 503, never a 500', function () {
    config(['services.tui.url' => 'http://127.0.0.1:9999']);

    Http::fake([
        'http://127.0.0.1:9999/session' => fn () => throw new ConnectionException('down'),
    ]);

    $this->postJson('/fancy-tui/session', ['action' => 'start', 'cols' => 80, 'rows' => 24])
        ->assertStatus(503)
        ->assertJsonStructure(['error']);
});

it('rejects an oversized body before forwarding it', function () {
    config(['services.tui.url' => 'http://127.0.0.1:9999']);

    $this->call(
        'POST',
        '/fancy-tui/session',
        [],
        [],
        [],
        ['CONTENT_TYPE' => 'application/json'],
        json_encode(['blob' => str_repeat('x', 70_000)]),
    )->assertStatus(413);
});
