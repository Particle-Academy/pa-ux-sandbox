<?php

use App\Support\FeatureSites;
use App\Support\Registry\ConnectorCatalogue;
use App\Support\Registry\ConnectorSource;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

uses(TestCase::class);

/*
 * /features/connectors and /features/connectors/{service}/setup.
 *
 * PHP cannot render the React pages, so this pins what the server sends (the
 * catalogue, from the SAME served index as /r/connectors/index.json), the
 * setup route for every connector, the "coming soon" path for a connector
 * with no steps, the steps reaching the wizard verbatim for one that has
 * them, and the page sources: the real SetupWizard, the three tokens, and the
 * claims the page makes.
 */

const CONNECTORS_DIR = 'resources/js/Pages/Features/Connectors';

function connectorsPage(TestCase $test, string $url): array
{
    $html = $test->get($url)->assertOk()->getContent();
    preg_match('#<script data-page="app" type="application/json">(.*?)</script>#s', $html, $page);

    return json_decode($page[1] ?? '{}', true) ?? [];
}

/**
 * Serve a one-connector index with $setup for the rest of the test.
 *
 * @param  array<string,mixed>|null  $setup
 */
function serveConnectorIndex(mixed $setup): void
{
    $path = storage_path('framework/testing/connectors-feature-'.uniqid().'.json');
    File::ensureDirectoryExists(dirname($path));
    File::put($path, json_encode(['connectors' => [[
        'slug' => 'twilio',
        'service' => 'twilio',
        'serviceTitle' => 'Twilio',
        'domain' => 'communication',
        'docs' => 'https://www.twilio.com/docs/messaging/api/message-resource',
        'status' => 'alpha',
        'setup' => $setup,
        'packages' => [
            'ui' => ['name' => '@particle-academy/twilio-ui', 'version' => '0.1.0', 'registry' => 'npm'],
            'php' => ['name' => 'particle-academy/twilio-php', 'version' => '0.1.0', 'registry' => 'packagist'],
        ],
        'auth' => ['kind' => 'basic', 'credentials' => [
            ['key' => 'accountSid', 'label' => 'Account SID', 'secret' => false, 'help' => 'AC followed by 32 hex characters.'],
            ['key' => 'apiSecret', 'label' => 'API key secret', 'secret' => true],
        ]],
        'operations' => [['kind' => '@particle-academy/twilio_message_send', 'role' => 'action', 'title' => 'Send SMS']],
    ]]]));

    app()->instance(ConnectorSource::class, new ConnectorSource($path));
}

/** @return array<string, string> */
function connectorsSources(): array
{
    $files = [];
    foreach (glob(base_path(CONNECTORS_DIR.'/*')) ?: [] as $path) {
        $files[basename($path)] = (string) file_get_contents($path);
    }

    return $files;
}

it('is the eleventh Feature, last in the menu', function () {
    expect(FeatureSites::slugs())->toHaveCount(11)
        ->and(FeatureSites::slugs()[10])->toBe('connectors')
        ->and(array_column(FeatureSites::nav(), 'slug'))->toContain('connectors');
});

it('serves the Connectors page with every connector the served index carries', function () {
    $page = connectorsPage($this, '/features/connectors');
    $cards = collect($page['props']['connectors'] ?? []);

    $served = collect($this->getJson('/r/connectors/index.json')->assertOk()->json('items'));

    expect($page['component'] ?? null)->toBe('Features/Connectors/Index')
        ->and($cards)->not->toBeEmpty()
        ->and($cards->pluck('service')->sort()->values()->all())->toBe($served->pluck('service')->unique()->sort()->values()->all())
        ->and($cards->sum(fn (array $c): int => count($c['operations'])))->toBe($served->count());

    foreach ($cards as $card) {
        expect($card['setupHref'])->toBe("/features/connectors/{$card['slug']}/setup");
    }

    expect(collect($page['props']['feature']['members'])->pluck('slug')->all())->toBe(['fancy-connector-core', 'fancy-flow']);
});

it('serves a setup page for every connector in the catalogue', function () {
    foreach (app(ConnectorCatalogue::class)->all() as $card) {
        $page = connectorsPage($this, $card['setupHref']);

        expect($page['component'] ?? null)->toBe('Features/Connectors/Setup')
            ->and($page['props']['connector']['slug'])->toBe($card['slug']);
    }
});

it('404s a connector the catalogue does not carry', function () {
    $this->get('/features/connectors/not-a-connector/setup')->assertNotFound();
    $this->get('/features/connectors/Stripe/setup')->assertNotFound();
});

it('gives a connector without steps its credential fields and links, and no steps', function () {
    serveConnectorIndex(null);

    $connector = connectorsPage($this, '/features/connectors/twilio/setup')['props']['connector'];

    expect($connector['setup'])->toBeNull()
        ->and(array_column($connector['credentials'], 'key'))->toBe(['accountSid', 'apiSecret'])
        ->and($connector['credentials'][1]['secret'])->toBeTrue()
        ->and($connector['docs'])->toBe('https://www.twilio.com/docs/messaging/api/message-resource')
        ->and($connector['packages']['php']['url'])->toBe('https://packagist.org/packages/particle-academy/twilio-php')
        ->and($connector['packages']['ui']['url'])->toBe('https://www.npmjs.com/package/@particle-academy/twilio-ui/v/0.1.0');
});

it('hands the wizard the index\'s steps verbatim, tokens unsubstituted', function () {
    $steps = [
        [
            'title' => 'Create an API key',
            'detail' => 'In the Twilio Console, create a Standard API key for {{appName}}.',
            'url' => 'https://console.twilio.com/',
            'actor' => 'person',
            'copy' => [['label' => 'Status callback', 'value' => '{{appUrl}}/connectors/{{connector}}/status']],
            'fields' => ['apiKeySid', 'apiSecret'],
            'done' => 'You have a key SID and its secret.',
        ],
        [
            'title' => 'Install the connector',
            'detail' => 'Your agent installs it.',
            'actor' => 'agent',
            'prompt' => 'Run composer require particle-academy/{{connector}}-php in {{appName}}.',
        ],
    ];
    serveConnectorIndex($steps);

    $setup = connectorsPage($this, '/features/connectors/twilio/setup')['props']['connector']['setup'];

    expect($setup)->toHaveCount(2)
        ->and($setup[0]['copy'][0]['value'])->toBe('{{appUrl}}/connectors/{{connector}}/status')
        ->and($setup[0]['detail'])->toBe($steps[0]['detail'])
        ->and($setup[0]['done'])->toBe('You have a key SID and its secret.')
        ->and($setup[1]['actor'])->toBe('agent')
        ->and($setup[1]['prompt'])->toBe($steps[1]['prompt']);
});

it('lists every setup page in the sitemap and names each one', function () {
    $sitemap = $this->get('/sitemap.xml')->assertOk()->getContent();
    $first = app(ConnectorCatalogue::class)->all()[0];

    expect($sitemap)->toContain('/features/connectors/'.$first['slug'].'/setup');

    $html = $this->get($first['setupHref'])->assertOk()->getContent();
    expect($html)->toContain('>Set up '.e($first['title']).' — Connectors — Fancy UI</title>');
});

it('renders the real SetupWizard with the closed set of five tokens and per-connector progress', function () {
    $sources = connectorsSources();

    expect($sources['Setup.tsx'])->toContain('<SetupWizard')
        ->and($sources['Setup.tsx'])->toContain('from "@particle-academy/react-fancy"')
        ->and($sources['Setup.tsx'])->toContain('Setup guide coming soon')
        ->and($sources['Setup.tsx'])->toContain('label="Your app URL"')
        ->and($sources['Setup.tsx'])->toContain('label="Webhook URL"')
        ->and($sources['Setup.tsx'])->toContain('label="OAuth redirect URL"')
        ->and($sources['Setup.tsx'])->toContain('data-co-handle="setup-webhook-url"')
        ->and($sources['Setup.tsx'])->toContain('data-co-handle="setup-oauth-redirect-url"')
        ->and($sources['wizard.ts'])->toContain('DEFAULT_APP_URL = "https://app.example.com"')
        ->and($sources['wizard.ts'])->toContain('"appUrl", "appName", "connector", "webhookUrl", "oauthRedirectUrl"')
        ->and($sources['wizard.ts'])->toContain('fancy:connector-setup:${connector}')
        ->and(implode("\n", $sources))->not->toContain('TODO');
});

it('serves twilio\'s five real steps and microsoft-teams\' redirect URL from the shipped index', function () {
    // Pinned against the shipped file (Weaver's index, sha256 cd24ddef...,
    // byte-verified 2026-11-08): twilio 0.1.2 and microsoft-teams 0.2.2.
    $twilio = connectorsPage($this, '/features/connectors/twilio/setup')['props']['connector'];

    expect($twilio['setup'])->toHaveCount(5)
        ->and($twilio['setup'][0]['fields'])->toBe(['accountSid'])
        ->and($twilio['setup'][1]['copy'])->toBe([['label' => 'Friendly name', 'value' => '{{appName}} ({{connector}})']])
        ->and($twilio['setup'][4]['actor'])->toBe('agent')
        ->and($twilio['setup'][4]['prompt'])->toContain('message_get')
        ->and($twilio['setup'][4]['done'])->toContain('error_code null');

    $teams = connectorsPage($this, '/features/connectors/microsoft-teams/setup')['props']['connector'];

    expect($teams['setup'][0]['copy'])->toBe([['label' => 'Redirect URI (Web)', 'value' => '{{oauthRedirectUrl}}']])
        ->and($teams['setup'][0]['detail'])->toContain('{{oauthRedirectUrl}}')
        ->and(json_encode($teams['setup']))->not->toContain('{host.');
});

it('makes the claims the owner asked for, and a Set up button per connector', function () {
    $index = connectorsSources()['Index.tsx'];

    expect($index)->toContain('Verified webhooks')
        ->and($index)->toContain('<Service>::fake()')
        ->and($index)->toContain('One Google connection for the organization')
        ->and($index)->toContain('fancy-flow node')
        ->and($index)->toContain('href={c.setupHref}')
        ->and($index)->toContain('Set up');
});
