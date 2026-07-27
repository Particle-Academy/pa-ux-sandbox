<?php

use App\Models\FlowNodePackage;
use Tests\TestCase;

uses(TestCase::class);

/**
 * The node marketplace registry — the server half of `fancy-cli add node`.
 *
 * MARKETPLACE ONLY: core builtins ship with fancy-flow and are not installable,
 * so they must never appear here.
 */
function nodeManifest(array $overrides = []): array
{
    return array_merge([
        'schemaVersion' => 1,
        'name' => '@acme/fancy-flow-salesforce',
        'kind' => '@acme/salesforce_upsert',
        'title' => 'Salesforce Upsert',
        'description' => 'Create or update a Salesforce record.',
        'category' => 'integrations',
        'runtimes' => [
            'ts' => ['files' => ['js'], 'engine' => '^0.30'],
            'php' => ['files' => ['php'], 'engine' => '^0.9'],
        ],
        'capabilities' => ['llm' => 'optional'],
        'sideEffects' => 'unsafe-to-replay',
        'fixtures' => 'fixtures/salesforce_upsert.json',
    ], $overrides);
}

function listPackage(array $manifestOverrides = [], array $attrs = []): FlowNodePackage
{
    $manifest = nodeManifest($manifestOverrides);

    return FlowNodePackage::create(array_merge(
        FlowNodePackage::attributesFrom($manifest),
        ['status' => FlowNodePackage::LISTED],
        $attrs,
    ));
}

it('validates a submitted manifest with the engine\'s own validator', function () {
    // Delegated, not reimplemented: a registry that disagreed with the engine
    // would accept packages the runtime then refuses.
    expect(FlowNodePackage::validateManifest(nodeManifest())['ok'])->toBeTrue();
});

it('rejects a manifest the engine rejects', function (array $overrides) {
    expect(FlowNodePackage::validateManifest(nodeManifest($overrides))['ok'])->toBeFalse();
})->with([
    'bare kind id' => [['kind' => 'salesforce_upsert']],
    'no runtimes' => [['runtimes' => []]],
    'a self-assigned verified flag' => [['verified' => true]],
    'a single engine range' => [['fancyFlow' => '>=0.10.1']],
]);

it('never lets a package vouch for itself', function () {
    // `verified` is the registry's claim. Even if validation were bypassed, the
    // stored row must not inherit it from the submission — so assert both that
    // the derived attributes never carry it, and that the PERSISTED row is
    // false rather than whatever the manifest asked for.
    expect(FlowNodePackage::attributesFrom(nodeManifest(['verified' => true])))
        ->not->toHaveKey('verified');

    expect(listPackage(['verified' => true])->fresh()->verified)->toBeFalse();
});

it('serves a well-formed index with no third-party submissions at all', function () {
    // This used to assert `items: []`. It cannot any more, and the reason is
    // the point: the first-party nodes are now BUILT into the index rather than
    // registered by hand, after production spent its whole life serving an
    // empty marketplace. What is still worth pinning is the response shape.
    $response = $this->getJson('/r/nodes/index.json')->assertOk();

    expect($response->json('items'))->toBeArray();
    expect($response->json('name'))->toBe('fancy-flow-nodes');
});

it('lists a published package with its runtimes', function () {
    listPackage();

    // Found by kind, not by position: the index also carries the first-party
    // nodes, so `items.0` is whatever sorts first rather than this submission.
    $entry = collect($this->getJson('/r/nodes/index.json')->assertOk()->json('items'))
        ->firstWhere('kind', '@acme/salesforce_upsert');

    expect($entry)->not->toBeNull();
    expect($entry['runtimes'])->toBe(['ts', 'php']);
    expect($entry['verified'])->toBeFalse();
});

it('hides packages that are not listed', function (string $status) {
    listPackage([], ['status' => $status]);

    expect(collect($this->getJson('/r/nodes/index.json')->json('items'))->pluck('kind'))
        ->not->toContain('@acme/salesforce_upsert');
})->with([FlowNodePackage::PENDING, FlowNodePackage::REJECTED]);

it('serves one package by its flattened slug', function () {
    // The slug avoids percent-encoding a path separator: a kind id contains a
    // slash, and %2F is handled inconsistently by hosts, CDNs and proxies.
    $package = listPackage();
    expect($package->slug())->toBe('acme__salesforce_upsert');

    $this->getJson("/r/nodes/{$package->slug()}.json")
        ->assertOk()
        ->assertJsonPath('kind', '@acme/salesforce_upsert')
        ->assertJsonPath('verified', false);
});

it('404s an unknown or unlisted slug', function () {
    listPackage([], ['status' => FlowNodePackage::PENDING]);

    $this->getJson('/r/nodes/acme__salesforce_upsert.json')->assertNotFound();
    $this->getJson('/r/nodes/nope.json')->assertNotFound();
});

it('does not let the node route swallow the component route', function () {
    // /r/nodes/index.json is registered before /r/{slug}; without that ordering
    // "nodes" resolves as a component slug and this returns a component 404
    // shape instead of the node index.
    $this->getJson('/r/nodes/index.json')->assertOk()->assertJsonStructure(['items']);
});

it('derives a title when the manifest omits one', function () {
    $manifest = nodeManifest();
    unset($manifest['title']);

    expect(FlowNodePackage::attributesFrom($manifest)['title'])->toBe('salesforce upsert');
});

it('falls back to the other category for an unknown one', function () {
    expect(FlowNodePackage::attributesFrom(nodeManifest(['category' => 'nonsense']))['category'])
        ->toBe('other');
});

it('records whether the node pauses or is unsafe to replay', function () {
    // Host-planning facts, denormalised so a listing can surface them without
    // decoding every manifest.
    $attrs = FlowNodePackage::attributesFrom(nodeManifest(['pausesForHuman' => 'signature']));

    expect($attrs['pauses_for_human'])->toBeTrue();
    expect($attrs['side_effects'])->toBe('unsafe-to-replay');
});

it('defaults an external submission to untrusted provenance', function () {
    // Code arriving from a public repo is untrusted until someone says
    // otherwise; only submissions originating inside our own workstation are
    // first-party.
    expect(FlowNodePackage::attributesFrom(nodeManifest())['provenance'])
        ->toBe(FlowNodePackage::EXTERNAL);
});
