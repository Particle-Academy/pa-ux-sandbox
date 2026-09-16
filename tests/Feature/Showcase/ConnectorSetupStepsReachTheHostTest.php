<?php

use App\Support\Registry\ConnectorSource;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

uses(TestCase::class);

/*
 * A setup step a host must perform BEYOND the auth dance survives our gate.
 *
 * ## Why this exists before any connector needs it
 *
 * microsoft-teams is the first: every operation additionally requires a TENANT
 * ADMINISTRATOR to grant an application access policy naming the target user.
 * Not OAuth consent — a separate admin action. Without it every call returns
 * empty, so a host reads "OAuth configured" as "ready" and gets nothing, with
 * no error anywhere to explain it.
 *
 * `needsWebhookEndpoint` is the same shape narrowed to one case, and that
 * narrowness is the point: it could say "a host must provision something" for
 * exactly one kind of something. This carries the CLASS.
 *
 * ## The gate this pins
 *
 * `entryFor()` is a whitelist. A fact that reaches `connectors.json` and is not
 * named there stops at the serving layer, silently — that is how
 * `idempotencyNote`, sixteen oauth endpoint pairs and the whole trigger block
 * were each lost once. Weaver carries `setup` upstream now; this asserts it
 * arrives, because their side being right proves nothing about what a host
 * receives.
 *
 * Written while our own connectors.json still carries no `setup` at all — every
 * connector today needs nothing beyond auth. A fixture exercises the non-null
 * path so the passthrough is tested NOW rather than on the day the first real
 * one lands, which is exactly when nobody is looking at this file.
 */

/**
 * The entries for a one-connector index whose connector carries $setup.
 *
 * @return Collection<int,array<string,mixed>>
 */
function setupEntries(mixed $setup): Collection
{
    $path = storage_path('framework/testing/connectors-setup-'.uniqid().'.json');
    File::ensureDirectoryExists(dirname($path));

    $connector = [
        'slug' => 'microsoft-teams',
        'service' => 'microsoft_teams',
        'serviceTitle' => 'Microsoft Teams',
        'domain' => 'communication',
        'packages' => ['ui' => ['name' => '@particle-academy/microsoft-teams-ui', 'version' => '0.1.0', 'registry' => 'npm']],
        'operations' => [
            ['kind' => '@particle-academy/microsoft_teams_meeting_create', 'role' => 'action'],
        ],
    ];

    if ($setup !== '__absent__') {
        $connector['setup'] = $setup;
    }

    File::put($path, json_encode(['connectors' => [$connector]]));

    try {
        return collect((new ConnectorSource($path))->indexEntries());
    } finally {
        @unlink($path);
    }
}

it('carries a setup step onto every entry for that connector', function () {
    $entry = setupEntries([
        [
            'title' => 'Grant the app an application access policy naming the target user',
            'detail' => 'A tenant administrator must run New-CsApplicationAccessPolicy and '
                .'Grant-CsApplicationAccessPolicy. Without it every operation returns empty.',
            'url' => 'https://learn.microsoft.com/en-us/graph/cloud-communication-online-meeting-application-access-policy',
        ],
    ])->first();

    expect($entry['setup'])->toBeArray();
    expect($entry['setup'])->toHaveCount(1);
    expect($entry['setup'][0]['title'])->toContain('application access policy');
    expect($entry['setup'][0]['url'])->toStartWith('https://learn.microsoft.com/');

    // The citation is the half most easily dropped, and the half that lets a
    // host check the instruction against the provider rather than trust us.
    expect($entry['setup'][0])->toHaveKeys(['title', 'detail', 'url']);
});

it('passes `detail` through VERBATIM, host tokens unsubstituted', function () {
    // `{host.oauthRedirectUrl}` is the CONSUMER's value to fill in — we do not
    // know it. Rewriting it here would hand the other side a string it can no
    // longer substitute, which is the same reason a pause reason travels
    // untouched.
    $detail = 'Register the app and add {host.oauthRedirectUrl} as a redirect URI.';

    $entry = setupEntries([
        ['title' => 'Register the application', 'detail' => $detail, 'url' => 'https://learn.microsoft.com/x'],
    ])->first();

    expect($entry['setup'][0]['detail'])->toBe($detail);
});

it('emits an explicit null when a connector needs nothing beyond auth', function () {
    // Every connector today. Null rather than ABSENT, because a vanished key
    // reads as "not carried" — and "not carried" is the one answer a host must
    // not infer from "checked, and there is none".
    $entry = setupEntries('__absent__')->first();

    expect($entry)->toHaveKey('setup');
    expect($entry['setup'])->toBeNull();

    expect(setupEntries([])->first()['setup'])->toBeNull();
});

it('KEEPS a step that has no url, carrying url as null', function () {
    // `fancy-connector-core`'s own `SetupStep` declares `url?: string` —
    // OPTIONAL. The connector lab's checkSetup() requires one, but that is a
    // stricter house rule on a looser core type, not a guarantee this layer may
    // rely on.
    //
    // This dropped such a step until that was pointed out, reasoning that an
    // instruction with a quietly absent citation is worse than none. The
    // reasoning inverts once the field is optional BY CONTRACT: the step is
    // valid, and dropping it means a host never learns about a setup action it
    // must perform — empty results forever, with no way to find out why. A host
    // that has the step but no link can still act.
    $entry = setupEntries([
        ['title' => 'Grant the policy', 'detail' => 'a tenant admin must do this'],
    ])->first();

    expect($entry['setup'])->toHaveCount(1);
    expect($entry['setup'][0]['title'])->toBe('Grant the policy');
    expect($entry['setup'][0]['url'])->toBeNull();
});

it('DROPS a step with no title or no detail', function () {
    // Still dropped, and for a reason that did not invert: a step with no title
    // or no detail conveys nothing at all. Half a row is not a row.
    $entry = setupEntries([
        ['title' => '', 'detail' => 'empty title', 'url' => 'https://example.com'],
        ['title' => 'no detail', 'detail' => '', 'url' => 'https://example.com'],
        ['detail' => 'no title key at all', 'url' => 'https://example.com'],
        ['title' => 'Good one', 'detail' => 'with a citation', 'url' => 'https://learn.microsoft.com/y'],
    ])->first();

    expect($entry['setup'])->toHaveCount(1);
    expect($entry['setup'][0]['title'])->toBe('Good one');
});

it('keeps the connector-level setup distinct from a TRIGGER’s own setup', function () {
    // There are two `setup`s in an entry and they differ in scope AND type:
    //
    //   entry.setup          list<{title,detail,url}> | null   CONNECTOR-level
    //   entry.trigger.setup  string | null                     OPERATION-level
    //
    // They do not collide — different nesting — but a consumer writing one
    // handler for "the setup field" meets an array on one path and a string on
    // the other. Pinned so the distinction is deliberate rather than a
    // coincidence of nesting, and so renaming either one fails here first.
    $path = storage_path('framework/testing/connectors-setup-both-'.uniqid().'.json');
    File::ensureDirectoryExists(dirname($path));
    File::put($path, json_encode(['connectors' => [[
        'slug' => 'microsoft-teams',
        'service' => 'microsoft_teams',
        'serviceTitle' => 'Microsoft Teams',
        'domain' => 'communication',
        'setup' => [['title' => 'Admin grant', 'detail' => 'tenant policy', 'url' => 'https://learn.microsoft.com/z']],
        'packages' => ['ui' => ['name' => '@particle-academy/microsoft-teams-ui', 'version' => '0.1.0', 'registry' => 'npm']],
        'operations' => [[
            'kind' => '@particle-academy/microsoft_teams_transcript_ready',
            'role' => 'trigger',
            'delivery' => 'webhook',
            'setup' => 'Answer the validationToken handshake.',
        ]],
    ]]]));

    try {
        $entry = collect((new ConnectorSource($path))->indexEntries())->first();

        expect($entry['setup'])->toBeArray();
        expect($entry['trigger']['setup'])->toBe('Answer the validationToken handshake.');
    } finally {
        @unlink($path);
    }
});
