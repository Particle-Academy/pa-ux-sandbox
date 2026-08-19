<?php

use App\Mcp\Tools\ListConnectorServices;
use App\Mcp\Tools\ListNodes;
use App\Mcp\Tools\SearchNodes;
use App\Models\FlowNodePackage;
use App\Support\Registry\ConnectorFacet;
use App\Support\Registry\FirstPartyNodeSource;
use Laravel\Mcp\Request;
use Tests\TestCase;

uses(TestCase::class);

/**
 * The connector filter.
 *
 * A vendor catalogue is unbounded — payments alone is twenty providers — while
 * the core node vocabulary is twenty-seven kinds. Listed flat, the thing an
 * author actually needs is buried, so connectors are EXCLUDED by default from
 * the surfaces a human or an agent browses.
 *
 * **The danger of that default is the danger this registry has already shipped
 * twice**: a list that silently withholds results looks exactly like a list with
 * nothing in it, and the caller has no reason to suspect otherwise. `list_nodes`
 * answering "No marketplace nodes are published yet" while eight nodes sat in
 * the repo is the same defect wearing different clothes.
 *
 * So every assertion below is really one assertion in different places: **the
 * exclusion must announce itself.**
 */
function connectorKinds(): array
{
    return collect(app(FirstPartyNodeSource::class)->indexEntries())
        ->filter(fn (array $entry) => ConnectorFacet::isConnector($entry))
        ->pluck('kind')
        ->all();
}

function coreKinds(): array
{
    return collect(app(FirstPartyNodeSource::class)->indexEntries())
        ->reject(fn (array $entry) => ConnectorFacet::isConnector($entry))
        ->pluck('kind')
        ->all();
}

it('has both connector and non-connector nodes to test against', function () {
    // A guard: every assertion below is vacuously true if one side is empty.
    expect(connectorKinds())->not->toBeEmpty();
    expect(coreKinds())->not->toBeEmpty();
});

it('excludes connectors from list_nodes by default', function () {
    $body = mcpBody(app(ListNodes::class)->handle(new Request([])));
    $kinds = collect($body['items'])->pluck('kind')->all();

    foreach (connectorKinds() as $kind) {
        expect($kinds)->not->toContain($kind);
    }
    foreach (coreKinds() as $kind) {
        expect($kinds)->toContain($kind);
    }
});

it('SAYS how many connectors it hid, and names the services', function () {
    // The whole safety property. A silently shortened list is indistinguishable
    // from a short list.
    $body = mcpBody(app(ListNodes::class)->handle(new Request([])));

    expect($body['connectorsHidden'])->toBe(count(connectorKinds()));
    expect($body['note'])->toContain('vendor connector node');
    expect(collect($body['services'])->pluck('service'))->toContain('stripe');
});

it('returns connectors when they are explicitly requested', function () {
    $body = mcpBody(app(ListNodes::class)->handle(new Request(['connectors' => 'include'])));
    $kinds = collect($body['items'])->pluck('kind')->all();

    foreach (connectorKinds() as $kind) {
        expect($kinds)->toContain($kind);
    }
    // Nothing was withheld, so nothing is announced.
    expect($body)->not->toHaveKey('connectorsHidden');
});

it('returns ONLY connectors when asked for only', function () {
    $body = mcpBody(app(ListNodes::class)->handle(new Request(['connectors' => 'only'])));
    $kinds = collect($body['items'])->pluck('kind')->all();

    expect($kinds)->toEqual(collect(connectorKinds())->sort()->values()->all());
});

it('narrows to one service — the second step of the two-step browse', function () {
    $body = mcpBody(app(ListNodes::class)->handle(new Request(['service' => 'stripe'])));

    expect($body['count'])->toBeGreaterThan(0);
    foreach ($body['items'] as $item) {
        expect($item['service'])->toBe('stripe');
    }
});

it('says plainly when a service has no nodes, and points at the directory', function () {
    $body = mcpBody(app(ListNodes::class)->handle(new Request(['service' => 'nosuchservice'])));

    expect($body['count'])->toBe(0);
    expect($body['note'])->toContain('list_connector_services');
});

it('still honours the runtime filter alongside the connector filter', function () {
    $body = mcpBody(app(ListNodes::class)->handle(new Request(['connectors' => 'only', 'runtime' => 'php'])));

    expect($body['count'])->toBeGreaterThan(0);
    foreach ($body['items'] as $item) {
        expect($item['runtimes'])->toContain('php');
    }
});

it('search_nodes hides connectors but NEVER lets a search dead-end', function () {
    // The worst outcome would be a search for "stripe" returning nothing, which
    // teaches an agent the capability does not exist. So the count is reported
    // even when it is the only thing that matched.
    $body = mcpBody(app(SearchNodes::class)->handle(new Request(['query' => 'stripe'])));

    expect($body['count'])->toBe(0);
    expect($body['connectorMatches'])->toBeGreaterThan(0);
    expect($body['note'])->toContain('connectors: "include"');
    expect($body['connectorServices'])->toContain('stripe');
});

it('search_nodes finds a connector by its SERVICE name when asked to include them', function () {
    $body = mcpBody(app(SearchNodes::class)->handle(new Request([
        'query' => 'stripe',
        'connectors' => 'include',
    ])));

    expect(collect($body['items'])->pluck('kind'))->toContain('@particle-academy/stripe_payment_intent');
});

it('list_connector_services groups services by domain with trigger and action counts', function () {
    $body = mcpBody(app(ListConnectorServices::class)->handle(new Request([])));

    $stripe = collect($body['services'])->firstWhere('service', 'stripe');

    expect($stripe['domain'])->toBe('payments');
    expect($stripe['triggers'])->toBeGreaterThan(0);
    expect($stripe['actions'])->toBeGreaterThan(0);
    expect($body['domains'])->toHaveKey('payments');
});

it('list_connector_services narrows by domain', function () {
    $body = mcpBody(app(ListConnectorServices::class)->handle(new Request(['domain' => 'payments'])));

    foreach ($body['services'] as $service) {
        expect($service['domain'])->toBe('payments');
    }
});

it('the HTTP index INCLUDES connectors by default, because the CLI resolves through it', function () {
    // The one place the default is deliberately the other way round. `add node
    // <kind>` finds a node's URL here, so a default that omitted anything would
    // make those nodes uninstallable while looking like a working registry.
    $items = collect(json_decode($this->get('/r/nodes/index.json')->getContent(), true)['items'])
        ->pluck('kind');

    foreach (connectorKinds() as $kind) {
        expect($items)->toContain($kind);
    }
});

it('the HTTP index can be filtered too, so both surfaces have the same lever', function () {
    $payload = json_decode($this->get('/r/nodes/index.json?connectors=exclude')->getContent(), true);
    $kinds = collect($payload['items'])->pluck('kind');

    foreach (connectorKinds() as $kind) {
        expect($kinds)->not->toContain($kind);
    }
    // The service directory travels with the index either way, so a client can
    // offer the two-step browse without a second request.
    expect(collect($payload['services'])->pluck('service'))->toContain('stripe');
});

it('the MCP and the HTTP registry still agree on what is published', function () {
    // The invariant `McpNodeToolsTest` protects, restated for the filtered
    // world: the DEFAULTS differ by surface, the CONTENTS must not.
    $http = collect(json_decode($this->get('/r/nodes/index.json')->getContent(), true)['items'])
        ->pluck('kind')->sort()->values()->all();

    $mcp = collect(mcpBody(app(ListNodes::class)->handle(new Request(['connectors' => 'include'])))['items'])
        ->pluck('kind')->sort()->values()->all();

    expect($mcp)->toBe($http);
});

it('reads the connector facet off a third-party submission the same way', function () {
    // A submitted manifest declares `connector` exactly as a first-party one
    // does. Deriving the facet in one place is what keeps the two sources of the
    // index answering the same question.
    FlowNodePackage::create([
        'kind' => '@acme/hubspot_contact_upsert',
        'name' => 'acme/hubspot-nodes',
        'title' => 'Upsert contact',
        'category' => 'io',
        'status' => FlowNodePackage::LISTED,
        'verified' => false,
        'runtimes' => ['ts'],
        'manifest' => [
            'kind' => '@acme/hubspot_contact_upsert',
            'connector' => [
                'service' => 'hubspot',
                'serviceTitle' => 'HubSpot',
                'domain' => 'crm',
                'role' => 'action',
            ],
        ],
    ]);

    $body = mcpBody(app(ListNodes::class)->handle(new Request([])));
    expect(collect($body['items'])->pluck('kind'))->not->toContain('@acme/hubspot_contact_upsert');
    expect(collect($body['services'])->pluck('service'))->toContain('hubspot');

    $only = mcpBody(app(ListNodes::class)->handle(new Request(['service' => 'hubspot'])));
    expect(collect($only['items'])->pluck('kind'))->toContain('@acme/hubspot_contact_upsert');
});

it('leaves a non-connector entry byte-for-byte unchanged', function () {
    // The facet is ABSENT rather than false on a core node, so no existing
    // consumer of this payload sees a wire change.
    $entry = collect(app(FirstPartyNodeSource::class)->indexEntries())
        ->firstWhere('kind', '@particle-academy/ui_effect');

    expect($entry)->not->toHaveKey('connector');
    expect($entry)->not->toHaveKey('service');
});
