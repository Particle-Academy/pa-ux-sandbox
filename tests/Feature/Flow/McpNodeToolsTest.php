<?php

use App\Mcp\Tools\ListNodes;
use App\Mcp\Tools\NodeInstallInstructions;
use App\Mcp\Tools\SearchNodes;
use App\Support\Registry\FirstPartyNodeSource;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Tests\TestCase;

uses(TestCase::class);

/**
 * The MCP node tools must serve the SAME nodes as `/r/nodes/index.json`.
 *
 * They did not, and this is the second time the same defect shipped. The first
 * time, `/r/nodes/index.json` served `items: []` because it read only the
 * database — rows written by `flow:register-node`, which nobody ran against
 * production. That was fixed by unioning in the built artifact, and
 * `FirstPartyNodeRegistryTest` pins it.
 *
 * The three MCP tools were left on the database alone. So the HTTP registry
 * served eight nodes and `fancy-cli add node` installed them, while an agent
 * asking the MCP was told:
 *
 *     "No marketplace nodes are published yet."
 *
 * That is the worse half. **The MCP is how an agent discovers nodes** — an agent
 * given that answer stops looking, and the marketplace may as well not exist.
 * And again nothing reported it, because an empty marketplace is a valid answer.
 *
 * These assert the tools against the artifact rather than a hardcoded count, so
 * they keep meaning something when nodes are added or removed.
 */
/**
 * The tool's JSON body.
 *
 * `Response::content()` returns a single `Content\Text`, not an array, and it
 * json_encodes to `{}` — the payload is only reachable through `toArray()`.
 */
function mcpBody(Response $response): array
{
    return json_decode($response->content()->toArray()['text'] ?? '{}', true) ?? [];
}

function firstPartyKinds(): array
{
    return collect(app(FirstPartyNodeSource::class)->indexEntries())
        ->pluck('kind')
        ->all();
}

it('has first-party nodes to test against', function () {
    // A guard: every assertion below is vacuously true if the artifact is empty,
    // which is precisely the failure being tested for.
    expect(firstPartyKinds())->not->toBeEmpty();
});

it('list_nodes returns the first-party nodes, not an empty marketplace', function () {
    $response = app(ListNodes::class)->handle(new Request([]));
    $body = mcpBody($response);

    $kinds = collect($body['items'] ?? [])->pluck('kind')->all();

    expect($body['count'] ?? 0)->toBeGreaterThan(0);
    foreach (firstPartyKinds() as $kind) {
        expect($kinds)->toContain($kind);
    }
    // The "nothing published yet" note is the exact string an agent acted on.
    expect($body['note'] ?? '')->not->toContain('No marketplace nodes are published yet');
});

it('search_nodes can find a first-party node', function () {
    $kind = firstPartyKinds()[0];
    $bare = str_contains($kind, '/') ? explode('/', $kind)[1] : $kind;

    $response = app(SearchNodes::class)->handle(new Request(['query' => $bare]));
    $body = mcpBody($response);

    expect($body['count'] ?? 0)->toBeGreaterThan(0);
    expect(collect($body['items'] ?? [])->pluck('kind')->all())->toContain($kind);
});

it('node_install_instructions resolves a first-party kind', function () {
    // This returned "No marketplace node with kind ... Run search_nodes first",
    // advice that led nowhere because search_nodes read the same empty table.
    $kind = firstPartyKinds()[0];

    $response = app(NodeInstallInstructions::class)->handle(new Request(['kind' => $kind]));
    $text = $response->content()->toArray()['text'] ?? '';

    expect($text)->not->toContain('No marketplace node with kind');

    $body = json_decode($text, true);
    expect($body['kind'] ?? null)->toBe($kind);
    // The recommended path must be the version-safe one.
    expect($body['recommended'] ?? '')->toContain('npx fancy-cli@latest add node');
});

it('the MCP and the HTTP registry agree on what is published', function () {
    // The actual invariant. Two surfaces reading two sources is how this
    // diverged twice; asserting them equal is what stops a third time.
    $http = collect(json_decode($this->get('/r/nodes/index.json')->getContent(), true)['items'] ?? [])
        ->pluck('kind')->sort()->values()->all();

    $response = app(ListNodes::class)->handle(new Request([]));
    $mcp = collect(mcpBody($response)['items'] ?? [])
        ->pluck('kind')->sort()->values()->all();

    expect($mcp)->toBe($http);
});
