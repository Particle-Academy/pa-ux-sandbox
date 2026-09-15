<?php

use App\Support\Registry\ConnectorSource;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

uses(TestCase::class);

/*
 * What a host needs to WIRE a trigger survives the serving layer.
 *
 * Every trigger in the index carried `delivery` (webhook or poll), `setup` (the
 * steps the host has to take) and `verifiesSignature`, and none of the three
 * reached `/r/connectors/index.json`: `entryFor()` builds an explicit whitelist
 * and names none of them. `setup` is the costly one. For facebook-lead-ads it
 * says to echo `hub.challenge` and to subscribe the app to each Page, and a
 * webhook without that second step delivers nothing and reports nothing. A host
 * reading our index never saw it.
 *
 * The provider-subscription connectors (google-calendar, microsoft-outlook) add
 * `verification`, `handshake` and `subscription`, which are the same kind of
 * fact: a `validationToken` handshake the host must answer, and a subscription
 * it must renew before its TTL runs out. They were about to be dropped at the
 * same whitelist.
 *
 * They travel as ONE nested `trigger` block, not as flat keys. The entry already
 * has a `delivery` key meaning the INSTALL path (package / vendor / both), and a
 * flat trigger `delivery` would silently overwrite it. The block is `null` on
 * actions and searches: checked, and not a trigger. Every key inside is emitted
 * even when null, for the same reason `auth` does it.
 */

/**
 * The entries for a one-connector index whose trigger carries $operation.
 *
 * @param  array<string,mixed>  $operation
 * @return Collection<int,array<string,mixed>>
 */
function triggerEntries(array $operation, bool $needsWebhookEndpoint = true): Collection
{
    $path = storage_path('framework/testing/connectors-trigger-'.uniqid().'.json');
    File::ensureDirectoryExists(dirname($path));
    File::put($path, json_encode(['connectors' => [[
        'slug' => 'google-calendar',
        'service' => 'google_calendar',
        'serviceTitle' => 'Google Calendar',
        'domain' => 'productivity',
        'needsWebhookEndpoint' => $needsWebhookEndpoint,
        'packages' => ['ui' => ['name' => '@particle-academy/google-calendar-ui', 'version' => '0.1.0', 'registry' => 'npm']],
        'operations' => [
            array_merge(['kind' => '@particle-academy/google_calendar_events_changed', 'role' => 'trigger'], $operation),
            ['kind' => '@particle-academy/google_calendar_create_event', 'role' => 'action'],
        ],
    ]]]));

    try {
        return collect((new ConnectorSource($path))->indexEntries());
    } finally {
        @unlink($path);
    }
}

it('carries delivery, setup and signature verification onto a trigger entry', function () {
    $entries = collect((new ConnectorSource(base_path('tests/Fixtures/connectors.json')))->indexEntries());

    $webhook = $entries->firstWhere('kind', '@particle-academy/stripe_webhook_trigger');
    expect($webhook)->not->toBeNull('the stripe webhook trigger left the fixture; this pins nothing');

    expect($webhook['trigger'])->toBeArray();
    expect($webhook['trigger']['delivery'])->toBe('webhook');
    expect($webhook['trigger']['setup'])->toContain('webhookSecret');
    expect($webhook['trigger']['verifiesSignature'])->toBeTrue();

    // The install-path `delivery` is untouched by the trigger's own.
    expect($webhook['delivery'])->toBe('package');

    $poll = $entries->firstWhere('kind', '@particle-academy/telegram_updates_trigger');
    expect($poll)->not->toBeNull('the telegram poll trigger left the fixture; this pins nothing');
    expect($poll['trigger']['delivery'])->toBe('poll');
    expect($poll['trigger']['verifiesSignature'])->toBeFalse();
});

it('carries a subscription trigger\'s verification, handshake and renewal window', function () {
    $entries = triggerEntries([
        'delivery' => 'webhook',
        'setup' => 'Create a subscription.',
        'verification' => 'shared-token',
        'handshake' => 'validationToken',
        'subscription' => ['ttlSeconds' => 604800, 'renewBeforeSeconds' => 3600, 'renewable' => true],
    ]);

    $trigger = $entries->firstWhere('role', 'trigger');

    expect($trigger['needsWebhookEndpoint'])->toBeTrue();
    expect($trigger['trigger']['verification'])->toBe('shared-token');
    expect($trigger['trigger']['handshake'])->toBe('validationToken');
    expect($trigger['trigger']['subscription'])->toBe([
        'ttlSeconds' => 604800,
        'renewBeforeSeconds' => 3600,
        'renewable' => true,
    ]);
});

it('states a considered null for every trigger fact the index does not carry', function () {
    $entries = triggerEntries(['delivery' => 'poll'], needsWebhookEndpoint: false);

    $trigger = $entries->firstWhere('role', 'trigger');

    expect(array_keys($trigger['trigger']))->toBe([
        'delivery', 'setup', 'verification', 'handshake', 'subscription', 'verifiesSignature',
    ]);
    expect($trigger['trigger']['handshake'])->toBeNull();
    expect($trigger['trigger']['subscription'])->toBeNull();

    // An action is not a trigger, and says so rather than going quiet.
    $action = $entries->firstWhere('role', 'action');
    expect($action)->toHaveKey('trigger');
    expect($action['trigger'])->toBeNull();
});

it('keeps only the renewal facts a host acts on from a subscription block', function () {
    $entries = triggerEntries([
        'subscription' => ['ttlSeconds' => '604800', 'renewBeforeSeconds' => 86400, 'renewable' => false, 'resource' => 'events'],
    ]);

    // A malformed number is not coerced into a plausible one; an unknown key is
    // not passed through a whitelist that exists to name what it carries.
    expect($entries->firstWhere('role', 'trigger')['trigger']['subscription'])->toBe([
        'ttlSeconds' => null,
        'renewBeforeSeconds' => 86400,
        'renewable' => false,
    ]);
});

it('serves both provider-subscription triggers exactly as Weaver emitted them', function () {
    // Weaver's statement for weaver.agi 6ce8431, pinned against the shipped
    // file rather than a fixture: the file being right at the boundary proves
    // nothing about what a host receives.
    $items = collect($this->getJson('/r/connectors/index.json')->assertOk()->json('items'))->keyBy('kind');

    $expected = [
        '@particle-academy/google_calendar_events_changed_trigger' => [
            'handshake' => null,
            'subscription' => ['ttlSeconds' => 604800, 'renewBeforeSeconds' => 86400, 'renewable' => false],
        ],
        '@particle-academy/microsoft_outlook_calendar_changed_trigger' => [
            'handshake' => 'validationToken',
            'subscription' => ['ttlSeconds' => 604800, 'renewBeforeSeconds' => 3600, 'renewable' => true],
        ],
    ];

    foreach ($expected as $kind => $facts) {
        $item = $items->get($kind);
        expect($item)->not->toBeNull("{$kind} is not served; the case this pins is gone");

        expect($item['needsWebhookEndpoint'])->toBeTrue();
        expect($item['trigger']['delivery'])->toBe('subscription');
        expect($item['trigger']['verification'])->toBe('shared-token');
        expect($item['trigger']['verifiesSignature'])->toBeTrue();
        expect($item['trigger']['handshake'])->toBe($facts['handshake']);
        expect($item['trigger']['subscription'])->toBe($facts['subscription']);
        expect($item['trigger']['setup'])->toBeString()->not->toBe('');
    }
});

it('serves the trigger block on the public connector endpoint', function () {
    $body = $this->getJson('/r/connectors/index.json')->assertOk()->json();

    $triggers = collect($body['items'])->where('role', 'trigger');
    expect($triggers)->not->toBeEmpty('no trigger in the shipped index; this check would assert nothing');

    foreach ($triggers as $item) {
        expect($item['trigger'])->toBeArray("{$item['kind']} reached the endpoint without its trigger facts");
        expect($item['trigger']['delivery'])->toBeIn(['webhook', 'poll', 'subscription'], "{$item['kind']} has no delivery");
    }
});
