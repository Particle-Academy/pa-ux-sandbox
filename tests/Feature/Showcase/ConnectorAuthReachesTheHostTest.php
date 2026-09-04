<?php

use App\Support\Registry\ConnectorSource;
use Tests\TestCase;

uses(TestCase::class);

/*
 * What a host needs to AUTHORISE a connector survives the serving layer.
 *
 * The index gave a host `scopes`, `pkce` and `refreshTokenRotates` and omitted
 * `authorizeUrl` and `tokenUrl` entirely. So a scope fix reached consumers and
 * the endpoint to request it from did not — half a fact, which is worse than
 * none, because the half that arrives looks complete. A host's only remaining
 * option was to hardcode sixteen providers' authorize URLs: one fact in two
 * places, done by the index that exists to prevent exactly that.
 *
 * Weaver fixed the emitter. This pins the second gate — `entryFor()` builds an
 * explicit whitelist, and the raw index is not served, so anything it does not
 * name stops here. That is how the idempotency cap was lost after they fixed
 * it, and there is no reason to learn it twice.
 *
 * The test for what belongs here is Weaver's and it is a good one: WOULD A HOST
 * ACT ON IT. Authorize URLs, credential field names, token lifetimes and
 * idempotency qualifiers change what a host builds or shows. Base URLs,
 * encoding and header placement are wire concerns the package owns, and are
 * deliberately absent.
 */

it('carries the OAuth endpoints a consent URL cannot be built without', function () {
    $entries = collect(app(ConnectorSource::class)->indexEntries());

    $oauth = $entries->filter(fn (array $e) => ($e['auth']['kind'] ?? null) === 'oauth2');

    // Guard the guard: with no oauth2 rows this would pass having checked none.
    expect($oauth)->not->toBeEmpty('no oauth2 entries; this check would assert nothing');

    foreach ($oauth as $entry) {
        expect($entry['auth']['authorizeUrl'] ?? null)
            ->toBeString("{$entry['kind']} has no authorizeUrl — a host cannot build its consent URL")
            ->not->toBe('');
        expect($entry['auth']['tokenUrl'] ?? null)
            ->toBeString("{$entry['kind']} has no tokenUrl")
            ->not->toBe('');
    }
});

it('states a considered null rather than omitting the key', function () {
    // facebook-pages mints NO refresh token — a connection is re-authorised,
    // not refreshed, on a 60-day access token. A host that read a missing key
    // as "not applicable" would wait for a refresh that never arrives.
    $entries = collect(app(ConnectorSource::class)->indexEntries());

    // NOTE the underscore: the index slug is `facebook-pages`, but the entry's
    // `service` is derived from the node kind, which uses underscores. Reading
    // one form from the other is a real way to match nothing and conclude the
    // connector is gone.
    $fb = $entries->first(fn (array $e) => ($e['service'] ?? null) === 'facebook_pages');

    expect($fb)->not->toBeNull('facebook-pages is gone; the case this pins no longer exists');
    expect($fb['auth'])->toHaveKey('refreshTokenCredential');
    expect($fb['auth']['refreshTokenCredential'])->toBeNull();
    expect($fb['auth']['accessTokenTtlSeconds'])->toBe(5184000);
});

it('carries the idempotency qualifier, not just the mechanism', function () {
    // "Deduplicates for a few minutes" and "guarantees uniqueness" are
    // different promises, and no other field can tell a host which one it has.
    $entries = collect(app(ConnectorSource::class)->indexEntries());

    $noted = $entries->filter(fn (array $e) => is_string($e['idempotencyNote'] ?? null) && $e['idempotencyNote'] !== '');

    expect($noted)->not->toBeEmpty('no idempotency notes survived the serving layer');

    $discord = $entries->first(fn (array $e) => ($e['service'] ?? null) === 'discord');
    expect($discord['idempotencyNote'])->toContain('25');
});
