<?php

use App\Mcp\Tools\GetNode;
use App\Mcp\Tools\ListNodes;
use App\Models\FlowNodePackage;
use App\Support\Registry\FirstPartyNodeSource;
use Illuminate\Support\Facades\File;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Tests\TestCase;

uses(TestCase::class);

/**
 * A first-party node names no package, because there is none.
 *
 * Every first-party manifest declared `"name": "particle-academy/fancy-flow-nodes"`.
 * The manifest contract called that field "the package name, as installed" and
 * required it, and no such package exists on npm, Packagist or PyPI, or ever
 * should: a node is vendored source, copied in by `fancy-cli add node`, and the
 * whole point is that adding one costs a consumer no dependency.
 *
 * The invented name still reached everyone who read it. `fancy-cli add node`
 * printed it beside the kind, `/r/nodes/index.json` and `get_node` served it to
 * agents, and an agent following it ran `composer require` into a 404.
 *
 * fancy-flow 0.70.1 / fancy-flow-php 0.52.1 made `name` optional, meaning "the
 * package this node is published from, when there is one". These pin that the
 * first-party nodes leave it out at every layer an install passes through:
 * source, artifact, HTTP registry and MCP.
 *
 * Key checks use `array_key_exists`, never `not->toHaveKey('name', $message)`:
 * Pest reads that second argument as the expected VALUE, so the negation passes
 * for any name that is not literally the message. Written that way, the artifact
 * check passed against all 26 invented names.
 */
const INVENTED_PACKAGE = 'fancy-flow-nodes';

/** An MCP tool's JSON body. Local, because `mcpBody()` is declared by another test file. */
function nodeToolBody(Response $response): array
{
    return json_decode($response->content()->toArray()['text'] ?? '{}', true) ?? [];
}

it('declares no package in any first-party manifest', function () {
    $manifests = File::glob(resource_path('flow-nodes/*/fancy-flow.node.json'));

    expect($manifests)->not->toBeEmpty();

    foreach ($manifests as $path) {
        $manifest = json_decode(File::get($path), true);

        expect(array_key_exists('name', $manifest))->toBeFalse(
            basename(dirname($path)).' names a package. First-party nodes are vendored source with no package behind them; omit `name`.',
        );
        expect(File::get($path))->not->toContain(INVENTED_PACKAGE);
    }
});

it('compiles no package name into the artifact production serves', function () {
    $compiled = json_decode(File::get(FirstPartyNodeSource::compiledPath()), true)['nodes'] ?? [];

    expect($compiled)->not->toBeEmpty();

    foreach ($compiled as $slug => $node) {
        expect(array_key_exists('name', $node['manifest']))
            ->toBeFalse("{$slug}: run `php artisan flow:build` and commit the artifact");
    }
});

it('serves no package name from the HTTP registry', function () {
    $index = $this->get('/r/nodes/index.json')->assertOk();

    expect($index->getContent())->not->toContain(INVENTED_PACKAGE);
    expect($index->json('items'))->not->toBeEmpty();

    foreach ($index->json('items') as $item) {
        expect(array_key_exists('name', $item))->toBeFalse("{$item['kind']} is listed with a package name");

        $manifest = $this->get($item['url'])->assertOk();

        expect(array_key_exists('name', $manifest->json()))->toBeFalse("{$item['url']} serves a package name");
        expect($manifest->getContent())->not->toContain(INVENTED_PACKAGE);
    }
});

it('tells an agent no package name through the MCP either', function () {
    $listing = nodeToolBody(app(ListNodes::class)->handle(new Request(['connectors' => 'include'])));

    expect($listing['items'] ?? [])->not->toBeEmpty();
    expect(json_encode($listing))->not->toContain(INVENTED_PACKAGE);

    $kinds = collect(app(FirstPartyNodeSource::class)->indexEntries())->pluck('kind');

    expect($kinds)->not->toBeEmpty();

    foreach ($kinds as $kind) {
        $body = nodeToolBody(app(GetNode::class)->handle(new Request(['kind' => $kind])));

        expect($body['kind'] ?? null)->toBe($kind);
        expect($body['name'] ?? null)->toBeNull();
        expect(json_encode($body))->not->toContain(INVENTED_PACKAGE);
    }
});

it('takes the name from the built manifest, not from a stale row that still carries the old one', function () {
    // The artifact already wins for every other manifest fact (see
    // `McpNodeToolsTest`), because a row is a snapshot from whenever someone
    // last ran `flow:register-node`. The name is a manifest fact too.
    FlowNodePackage::create([
        'kind' => '@particle-academy/ui_effect',
        'name' => 'particle-academy/'.INVENTED_PACKAGE,
        'title' => 'UI Effect',
        'category' => 'io',
        'status' => FlowNodePackage::LISTED,
        'verified' => true,
        'runtimes' => ['ts', 'php'],
        'manifest' => ['kind' => '@particle-academy/ui_effect', 'name' => 'particle-academy/'.INVENTED_PACKAGE],
    ]);

    $body = nodeToolBody(app(GetNode::class)->handle(new Request(['kind' => '@particle-academy/ui_effect'])));

    expect($body['kind'] ?? null)->toBe('@particle-academy/ui_effect');
    expect($body['name'] ?? null)->toBeNull();
});
