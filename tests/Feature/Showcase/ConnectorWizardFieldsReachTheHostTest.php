<?php

use App\Support\Registry\ConnectorSource;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The setup-wizard fields, a trigger's cursor and the org-level Google grant
 * all survive `ConnectorSource::entryFor()`.
 *
 * `entryFor()` is a whitelist: anything it does not name stops at the serving
 * layer, silently. That already happened to `idempotencyMaxLength`, the oauth
 * endpoints and the whole trigger block. Each of these arrived (or is arriving)
 * in Weaver's connectors.json, and the plan names every one:
 * `.ai/plans/setup-wizards.md`, "Showcase gotcha".
 *
 *   - a setup step's `actor`, `prompt`, `copy`, `fields` and `done`
 *     (`fancy-connector-core` SetupStep; the wizard renders them);
 *   - every trigger's `cursor` (gmail-inbox 0.2.0, core 0.14.0's
 *     readWithCursor): `{param, seedFrom, advanceFrom, maxPages,
 *     expiredStatus, resyncQuery}` or null;
 *   - `auth.grant`, `auth.authorizeParams`, `auth.revoke`, `auth.identity` and
 *     `auth.restrictedScopes` (google-* 0.6.0, the org-level Google
 *     connection). Each is null when a connector has none.
 *
 * The auth values below are google-sheets 0.6.0's own, copied from its
 * published `provider/manifest.json` `oauth` block (Packagist dist, 2026-11-08).
 */

/**
 * The entries for a one-connector index built from $connector overrides.
 *
 * @param  array<string,mixed>  $overrides
 * @param  list<array<string,mixed>>  $operations
 * @return list<array<string,mixed>>
 */
function wizardEntries(array $overrides, array $operations = []): array
{
    $path = storage_path('framework/testing/connectors-wizard-'.uniqid().'.json');
    File::ensureDirectoryExists(dirname($path));

    $connector = array_merge([
        'slug' => 'google-sheets',
        'service' => 'google_sheets',
        'serviceTitle' => 'Google Sheets',
        'domain' => 'productivity',
        'packages' => ['ui' => ['name' => '@particle-academy/google-sheets-ui', 'version' => '0.7.0', 'registry' => 'npm']],
        'operations' => $operations !== [] ? $operations : [
            ['kind' => '@particle-academy/google_sheets_append', 'role' => 'action'],
        ],
    ], $overrides);

    File::put($path, json_encode(['connectors' => [$connector]]));

    try {
        return (new ConnectorSource($path))->indexEntries();
    } finally {
        @unlink($path);
    }
}

it('carries every wizard field of a setup step', function () {
    $entry = wizardEntries(['setup' => [
        [
            'title' => 'Create an OAuth client',
            'detail' => 'In Google Cloud, create a Web application client for {{appName}}.',
            'url' => 'https://console.cloud.google.com/apis/credentials',
            'actor' => 'person',
            'copy' => [
                ['label' => 'Authorized redirect URI', 'value' => '{{appUrl}}/connectors/{{connector}}/callback'],
            ],
            'fields' => ['clientId', 'clientSecret'],
            'done' => 'You have a client ID and a client secret.',
        ],
        [
            'title' => 'Install the connector',
            'detail' => 'Your agent adds the package.',
            'actor' => 'agent',
            'prompt' => 'Install particle-academy/{{connector}}-php in {{appName}} and read its README.',
            'done' => 'The facade resolves.',
        ],
    ]])[0];

    expect($entry['setup'])->toHaveCount(2);

    expect($entry['setup'][0])->toBe([
        'title' => 'Create an OAuth client',
        'detail' => 'In Google Cloud, create a Web application client for {{appName}}.',
        'url' => 'https://console.cloud.google.com/apis/credentials',
        'actor' => 'person',
        'prompt' => null,
        'copy' => [['label' => 'Authorized redirect URI', 'value' => '{{appUrl}}/connectors/{{connector}}/callback']],
        'fields' => ['clientId', 'clientSecret'],
        'done' => 'You have a client ID and a client secret.',
    ]);

    expect($entry['setup'][1]['actor'])->toBe('agent');
    expect($entry['setup'][1]['prompt'])->toBe('Install particle-academy/{{connector}}-php in {{appName}} and read its README.');
    expect($entry['setup'][1]['url'])->toBeNull();
    expect($entry['setup'][1]['copy'])->toBeNull();
    expect($entry['setup'][1]['fields'])->toBeNull();
});

it('emits every wizard key, null when a step does not carry it', function () {
    $entry = wizardEntries(['setup' => [['title' => 'Grant the policy', 'detail' => 'A tenant admin must do this.']]])[0];

    expect(array_keys($entry['setup'][0]))->toBe(['title', 'detail', 'url', 'actor', 'prompt', 'copy', 'fields', 'done']);
    expect($entry['setup'][0]['actor'])->toBeNull();
    expect($entry['setup'][0]['done'])->toBeNull();
});

it('refuses a malformed actor, copy row or field id rather than passing it through', function () {
    $entry = wizardEntries(['setup' => [[
        'title' => 'Step',
        'detail' => 'Detail',
        'actor' => 'robot',
        'copy' => [['label' => 'ok', 'value' => 'v'], ['label' => 'no value'], 'not-a-row'],
        'fields' => ['clientId', 7, ''],
        'prompt' => ['not', 'a', 'string'],
    ]]])[0];

    expect($entry['setup'][0]['actor'])->toBeNull();
    expect($entry['setup'][0]['copy'])->toBe([['label' => 'ok', 'value' => 'v']]);
    expect($entry['setup'][0]['fields'])->toBe(['clientId']);
    expect($entry['setup'][0]['prompt'])->toBeNull();
});

it('carries a trigger\'s cursor, and null on a trigger without one', function () {
    $entries = collect(wizardEntries([], [
        [
            'kind' => '@particle-academy/gmail_inbox_message_received_trigger',
            'role' => 'trigger',
            'delivery' => 'subscription',
            'cursor' => [
                'param' => 'startHistoryId',
                'seedFrom' => 'historyId',
                'advanceFrom' => 'historyId',
                'maxPages' => 10,
                'expiredStatus' => 404,
                'resyncQuery' => 'in:inbox newer_than:7d',
                'unknown' => 'dropped',
            ],
        ],
        ['kind' => '@particle-academy/gmail_inbox_poll_trigger', 'role' => 'trigger', 'delivery' => 'poll', 'cursor' => null],
    ]))->keyBy('kind');

    expect($entries['@particle-academy/gmail_inbox_message_received_trigger']['trigger']['cursor'])->toBe([
        'param' => 'startHistoryId',
        'seedFrom' => 'historyId',
        'advanceFrom' => 'historyId',
        'maxPages' => 10,
        'expiredStatus' => 404,
        'resyncQuery' => 'in:inbox newer_than:7d',
    ]);

    expect($entries['@particle-academy/gmail_inbox_poll_trigger']['trigger'])->toHaveKey('cursor');
    expect($entries['@particle-academy/gmail_inbox_poll_trigger']['trigger']['cursor'])->toBeNull();
});

it('carries the org-level Google grant exactly as google-sheets 0.6.0 declares it', function () {
    $entry = wizardEntries(['auth' => [
        'kind' => 'oauth2',
        'grant' => 'google',
        'authorizeParams' => ['access_type' => 'offline', 'include_granted_scopes' => 'true'],
        'revoke' => ['url' => 'https://oauth2.googleapis.com/revoke', 'param' => 'token', 'scope' => 'grant'],
        'identity' => [
            'scope' => 'openid',
            'claim' => 'sub',
            'issuers' => ['https://accounts.google.com', 'accounts.google.com'],
            'jwksUrl' => 'https://www.googleapis.com/oauth2/v3/certs',
            'audienceCredential' => 'clientId',
        ],
        'restrictedScopes' => [],
    ]])[0];

    expect($entry['auth']['grant'])->toBe('google');
    expect($entry['auth']['authorizeParams'])->toBe(['access_type' => 'offline', 'include_granted_scopes' => 'true']);
    expect($entry['auth']['revoke'])->toBe(['url' => 'https://oauth2.googleapis.com/revoke', 'param' => 'token', 'scope' => 'grant']);
    expect($entry['auth']['identity'])->toBe([
        'scope' => 'openid',
        'claim' => 'sub',
        'issuers' => ['https://accounts.google.com', 'accounts.google.com'],
        'jwksUrl' => 'https://www.googleapis.com/oauth2/v3/certs',
        'audienceCredential' => 'clientId',
    ]);

    // EMPTY is a statement ("checked: none is restricted"), not an absence.
    expect($entry['auth']['restrictedScopes'])->toBe([]);
});

it('carries a restricted scope list as declared', function () {
    $entry = wizardEntries(['auth' => [
        'kind' => 'oauth2',
        'restrictedScopes' => ['https://www.googleapis.com/auth/gmail.readonly'],
    ]])[0];

    expect($entry['auth']['restrictedScopes'])->toBe(['https://www.googleapis.com/auth/gmail.readonly']);
});

it('states a considered null for every grant field a connector does not declare', function () {
    $entry = wizardEntries(['auth' => ['kind' => 'api_key']])[0];

    foreach (['grant', 'authorizeParams', 'revoke', 'identity', 'restrictedScopes'] as $key) {
        expect($entry['auth'])->toHaveKey($key);
        expect($entry['auth'][$key])->toBeNull("auth.{$key} should be null when undeclared");
    }
});

it('serves the cursor, the Google grant and twilio on the public endpoint, as Weaver emitted them', function () {
    // Pinned against the shipped file (Weaver's index, sha256 88d36009...,
    // byte-verified 2026-11-08), not a fixture: the whitelist being right on a
    // fixture proves nothing about what a host receives.
    $items = collect($this->getJson('/r/connectors/index.json')->assertOk()->json('items'))->keyBy('kind');

    $trigger = $items->get('@particle-academy/gmail_inbox_message_received_trigger');
    expect($trigger)->not->toBeNull('gmail-inbox message_received is not served; the case this pins is gone');
    expect($trigger['trigger']['cursor'])->toBe([
        'param' => 'startHistoryId',
        'seedFrom' => 'historyId',
        'advanceFrom' => 'historyId',
        'maxPages' => 20,
        'expiredStatus' => 404,
        'resyncQuery' => 'newer_than:{resyncWindowDays}d',
    ]);

    $gmailInbox = $items->first(fn (array $e) => $e['service'] === 'gmail_inbox');
    expect($gmailInbox['auth']['grant'])->toBe('google');
    expect($gmailInbox['auth']['restrictedScopes'])->toBe(['https://www.googleapis.com/auth/gmail.readonly']);
    expect($gmailInbox['auth']['revoke']['scope'])->toBe('grant');
    expect($gmailInbox['auth']['identity']['claim'])->toBe('sub');

    $google = $items->filter(fn (array $e) => ($e['auth']['grant'] ?? null) === 'google')->pluck('service')->unique();
    expect($google->count())->toBeGreaterThanOrEqual(10);

    expect($items->contains(fn (array $e) => $e['service'] === 'twilio'))->toBeTrue('twilio is not served');
});
