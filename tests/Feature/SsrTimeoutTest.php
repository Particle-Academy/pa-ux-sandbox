<?php

use App\Ssr\TimeoutHttpGateway;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Inertia\Ssr\Gateway;
use Tests\TestCase;

uses(TestCase::class);

it('binds the bounded-timeout SSR gateway over Inertia\'s default', function () {
    expect(app(Gateway::class))->toBeInstanceOf(TimeoutHttpGateway::class);
});

it('falls back to client rendering (no 500) when the SSR daemon is unreachable', function () {
    config([
        'inertia.ssr.enabled' => true,
        // Force the HTTP path (skip the early bundle-exists short-circuit) so the
        // timeout/connection handling is what we actually exercise.
        'inertia.ssr.ensure_bundle_exists' => false,
    ]);

    // Simulate a hung/down daemon: the SSR HTTP call raises a connection error,
    // exactly as a timeout would. The bounded gateway must swallow it and return
    // null so Inertia renders the page client-side instead of 500-ing.
    Http::fake(function () {
        throw new ConnectionException('cURL error 28: Operation timed out after 5000 ms');
    });

    $this->get('/leaderboard')->assertOk();
});
