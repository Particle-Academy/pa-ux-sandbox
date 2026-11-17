<?php

use App\Support\McpStats\ArgumentSanitizer;
use App\Support\McpStats\UserAgentFamily;
use Tests\TestCase;

uses(TestCase::class);

function sanitize(mixed $arguments): array
{
    return app(ArgumentSanitizer::class)->sanitize($arguments);
}

it('keeps ordinary arguments as they are', function () {
    $result = sanitize(['query' => 'calendar', 'limit' => 5, 'connectors' => 'include']);

    expect(json_decode($result['json'], true))->toBe(['query' => 'calendar', 'limit' => 5, 'connectors' => 'include'])
        ->and($result['truncated'])->toBeFalse();
});

it('drops any key that looks like a secret, at every depth', function (string $key) {
    $result = sanitize(['query' => 'x', $key => 'leak-me', 'nested' => ['deeper' => [$key => 'leak-me-too', 'ok' => 1]]]);

    expect($result['json'])->not->toContain('leak-me')
        ->and(json_decode($result['json'], true))->toBe(['query' => 'x', 'nested' => ['deeper' => ['ok' => 1]]]);
})->with([
    'token', 'access_token', 'refreshToken', 'api_key', 'apiKey', 'API-KEY', 'password', 'client_secret',
    'Authorization', 'auth', 'bearer', 'credentials', 'cookie', 'private_key', 'signature', 'otp',
]);

it('truncates to the configured byte budget and still stores valid JSON', function () {
    $big = ['query' => str_repeat('a', 5000), 'other' => str_repeat('b', 5000)];
    for ($i = 0; $i < 200; $i++) {
        $big["k{$i}"] = str_repeat('c', 50);
    }

    $result = sanitize($big);

    expect(strlen($result['json']))->toBeLessThanOrEqual(2048)
        ->and($result['truncated'])->toBeTrue()
        ->and(json_decode($result['json'], true))->toBeArray()
        ->and(json_decode($result['json'], true)['query'])->toStartWith('aaaa');
});

it('honours a configured byte budget', function () {
    config(['mcp-stats.arguments.max_bytes' => 256]);

    $result = sanitize(['query' => str_repeat('z', 2000)]);

    expect(strlen($result['json']))->toBeLessThanOrEqual(256)
        ->and(json_decode($result['json'], true))->toBeArray();
});

it('stores nothing for missing arguments', function () {
    expect(sanitize(null)['json'])->toBeNull();
});

it('names a user-agent family', function (string $userAgent, string $family) {
    expect(app(UserAgentFamily::class)->of($userAgent))->toBe($family);
})->with([
    ['claude-code/2.1.0 (cli)', 'claude-code'],
    ['Cursor/1.7.3', 'cursor'],
    ['node', 'node'],
    ['python-httpx/0.28.1', 'python'],
    ['curl/8.4.0', 'curl'],
    ['Mozilla/5.0 (Windows NT 10.0)', 'browser'],
    ['SomeAgent/3.2', 'someagent'],
    ['', 'unknown'],
]);
