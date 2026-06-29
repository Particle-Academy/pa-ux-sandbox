<?php

use Tests\TestCase;

uses(TestCase::class);

function rpc(array $body): array
{
    return test()->postJson('/mcp', $body, [
        'Accept' => 'application/json, text/event-stream',
    ])->json();
}

it('lists registered tools', function () {
    $body = rpc(['jsonrpc' => '2.0', 'id' => 1, 'method' => 'tools/list']);

    expect($body['jsonrpc'])->toBe('2.0');
    expect($body['result']['tools'])->toBeArray();

    $names = array_column($body['result']['tools'], 'name');
    // Laravel/Mcp converts CamelCase class names to kebab-case tool names.
    expect($names)->toContain('list-components');
    expect($names)->toContain('search-components');
    expect($names)->toContain('get-component');
    expect($names)->toContain('install-instructions');
});

it('list-components returns the registry summary set', function () {
    $body = rpc([
        'jsonrpc' => '2.0',
        'id' => 2,
        'method' => 'tools/call',
        'params' => ['name' => 'list-components', 'arguments' => new stdClass],
    ]);

    expect($body['result']['isError'])->toBeFalse();
    $text = $body['result']['content'][0]['text'];
    $payload = json_decode($text, true);
    expect($payload['count'])->toBeGreaterThan(0);
    expect($payload['items'])->toBeArray();
    expect($payload['items'][0])->toHaveKeys(['name', 'title', 'package', 'description', 'url']);
});

it('search-components filters by substring', function () {
    $body = rpc([
        'jsonrpc' => '2.0',
        'id' => 3,
        'method' => 'tools/call',
        'params' => ['name' => 'search-components', 'arguments' => ['query' => 'calendar']],
    ]);

    expect($body['result']['isError'])->toBeFalse();
    $payload = json_decode($body['result']['content'][0]['text'], true);
    $names = array_column($payload['items'], 'name');
    expect($names)->toContain('calendar');
});

it('get-component returns the full bundle for a real slug', function () {
    $body = rpc([
        'jsonrpc' => '2.0',
        'id' => 4,
        'method' => 'tools/call',
        'params' => ['name' => 'get-component', 'arguments' => ['name' => 'card']],
    ]);

    expect($body['result']['isError'])->toBeFalse();
    $payload = json_decode($body['result']['content'][0]['text'], true);
    expect($payload['name'])->toBe('card');
    expect($payload['files'])->toBeArray()->not->toBeEmpty();
});

it('install-instructions returns both npm and vendor paths', function () {
    $body = rpc([
        'jsonrpc' => '2.0',
        'id' => 5,
        'method' => 'tools/call',
        'params' => ['name' => 'install-instructions', 'arguments' => ['name' => 'card']],
    ]);

    expect($body['result']['isError'])->toBeFalse();
    $payload = json_decode($body['result']['content'][0]['text'], true);
    expect($payload['npm_path']['install'])->toContain('npm install @particle-academy/react-fancy');
    expect($payload['vendor_path']['install'])->toBe('npx fancy-ui@latest add card');
    expect($payload['vendor_path']['import'])->toContain('@/components/fancy/card');
});

it('returns an error when a tool argument is missing', function () {
    $body = rpc([
        'jsonrpc' => '2.0',
        'id' => 6,
        'method' => 'tools/call',
        'params' => ['name' => 'get-component', 'arguments' => new stdClass],
    ]);

    // laravel/mcp validates required args via JSON schema; missing required
    // arg produces either an isError result or a method error — both
    // outcomes are acceptable for this test, but the call must not 200
    // with a successful payload.
    $isError = $body['result']['isError'] ?? null;
    $hasError = isset($body['error']);
    expect($isError === true || $hasError)->toBeTrue();
});

it('lists the gallery design tools', function () {
    $names = array_column(rpc(['jsonrpc' => '2.0', 'id' => 7, 'method' => 'tools/list'])['result']['tools'], 'name');
    expect($names)->toContain('gallery-list-styles')->toContain('gallery-get-blueprint');
});

it('gallery-list-styles returns all 20 styles with blueprint urls', function () {
    $body = rpc([
        'jsonrpc' => '2.0',
        'id' => 8,
        'method' => 'tools/call',
        'params' => ['name' => 'gallery-list-styles', 'arguments' => new stdClass],
    ]);

    expect($body['result']['isError'])->toBeFalse();
    $payload = json_decode($body['result']['content'][0]['text'], true);
    expect($payload['count'])->toBe(20);
    expect($payload['kind'])->toBe('design-blueprints');
    $ids = array_column($payload['styles'], 'id');
    expect($ids)->toContain('swiss')->toContain('agentic');
    expect($payload['styles'][0]['blueprint'])->toBe('/gallery/swiss.json');
});

it('gallery-get-blueprint returns one style\'s full recipe', function () {
    $body = rpc([
        'jsonrpc' => '2.0',
        'id' => 9,
        'method' => 'tools/call',
        'params' => ['name' => 'gallery-get-blueprint', 'arguments' => ['style' => 'dark']],
    ]);

    expect($body['result']['isError'])->toBeFalse();
    $payload = json_decode($body['result']['content'][0]['text'], true);
    expect($payload['id'])->toBe('dark');
    expect($payload)->toHaveKeys(['thesis', 'tokens', 'sections', 'palette', 'contentArchetype', 'remix']);
});

it('lists the start-project tool', function () {
    $names = array_column(rpc(['jsonrpc' => '2.0', 'id' => 10, 'method' => 'tools/list'])['result']['tools'], 'name');
    expect($names)->toContain('start-project');
});

it('start-project leads with the backend decision + the per-language mirrors', function () {
    $body = rpc([
        'jsonrpc' => '2.0',
        'id' => 11,
        'method' => 'tools/call',
        'params' => ['name' => 'start-project', 'arguments' => new stdClass],
    ]);

    expect($body['result']['isError'])->toBeFalse();
    $payload = json_decode($body['result']['content'][0]['text'], true);

    // Backend choice is front-and-centre; all three paths are present.
    expect($payload)->toHaveKeys(['first_decision', 'ui_is_universal', 'mirror_strategy', 'backends', 'next_steps']);
    expect($payload['backends'])->toHaveKeys(['php', 'node', 'other']);

    // The PHP <-> Node mirror pairs are accurate.
    $catalog = collect($payload['mirror_strategy']['pairs'])->firstWhere('php', 'particle-academy/laravel-catalog');
    expect($catalog['node'])->toBe('@particle-academy/fancy-catalog');
});

it('start-project focuses on one backend when given', function () {
    $body = rpc([
        'jsonrpc' => '2.0',
        'id' => 12,
        'method' => 'tools/call',
        'params' => ['name' => 'start-project', 'arguments' => ['backend' => 'node']],
    ]);

    expect($body['result']['isError'])->toBeFalse();
    $payload = json_decode($body['result']['content'][0]['text'], true);
    expect(array_keys($payload['backends']))->toBe(['node']);
    expect($payload['backends']['node']['label'])->toContain('Node');
    // Node uses the JS mirror of the catalog package.
    expect($payload['backends']['node']['server_packages']['catalog (Stripe products/prices/checkout)'])
        ->toBe('@particle-academy/fancy-catalog');
});
