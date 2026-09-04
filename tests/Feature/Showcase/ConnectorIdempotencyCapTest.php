<?php

use App\Support\Registry\ConnectorSource;
use Tests\TestCase;

uses(TestCase::class);

/*
 * A connector's idempotency CAP reaches the host, not just its placement.
 *
 * Weaver's index emitter flattened idempotency to `"header" | "body" | null`
 * and carried the PLACEMENT without the LIMIT, so `idempotencyMaxLength: 25`
 * existed in Discord's manifest and in all three generated runtimes, and was
 * absent from the one file a host reads. They fixed it as a sibling key.
 *
 * We then dropped it again one layer down: `entryFor()` builds an explicit
 * whitelist, so the field arrived in `connectors.json` and did not reach
 * `/r/connectors/index.json`.
 *
 * Why the cap has to arrive BEFORE the call: a host derives an idempotency key
 * from a run id plus a step id, which is comfortably longer than 25 characters.
 * Discord's `nonce` is capped there, so the choice is made when the key is
 * built. Learning the limit from an exception during the call is too late — and
 * a host that truncates blindly instead produces a key that still looks like a
 * key.
 */

it('carries the idempotency cap onto every entry of a capped connector', function () {
    $entries = collect(app(ConnectorSource::class)->indexEntries());

    expect($entries)->not->toBeEmpty('no connector entries at all; this check would assert nothing');

    $discord = $entries->filter(fn (array $e) => str_starts_with((string) $e['kind'], '@particle-academy/discord'));

    expect($discord)->not->toBeEmpty('no discord entries found; the fixture this pins is gone');

    foreach ($discord as $entry) {
        expect($entry)->toHaveKey('idempotencyMaxLength');
        expect($entry['idempotencyMaxLength'])->toBe(25, "{$entry['kind']} lost Discord's 25-character nonce cap");
    }
});

it('says "no cap" explicitly rather than by omission', function () {
    // `null` is the same "checked, and there is none" that `scopes`,
    // `capabilities` and `pkce` already mean in this index. A KEY THAT VANISHES
    // reads as "not applicable", which is the answer a host must not infer.
    $entries = collect(app(ConnectorSource::class)->indexEntries());

    $uncapped = $entries->first(fn (array $e) => ! str_starts_with((string) $e['kind'], '@particle-academy/discord'));

    expect($uncapped)->not->toBeNull();
    expect($uncapped)->toHaveKey('idempotencyMaxLength');
    expect($uncapped['idempotencyMaxLength'])->toBeNull();
});
