<?php

use App\Support\Registry\ConnectorSource;
use Tests\TestCase;

uses(TestCase::class);

/*
 * Every field the connector index carries is either CARRIED to hosts or
 * explicitly NOT — and a new one fails until somebody says which.
 *
 * ## Why this exists rather than another field fix
 *
 * `entryFor()` is a whitelist, so anything it does not name stops at the
 * serving layer. Five fields were carried one at a time as each was noticed:
 * `idempotency`, `idempotencyMaxLength`, `idempotencyNote`, `auth`,
 * `apiVersion`. Every one was a real drop, and every one was found from
 * outside — by Weaver reporting what they sent and this side reporting what
 * arrived.
 *
 * Five instance fixes and no mechanism. A field added upstream tomorrow would
 * have been dropped in exactly the same place, exactly as silently, and would
 * have needed the same person to notice it again.
 *
 * Writing this found the sixth and seventh immediately:
 *
 *   - `needsWebhookEndpoint`, true for facebook-lead-ads and stripe. A host
 *     must provision a publicly reachable endpoint before either works, and
 *     had no way to learn that.
 *   - `status`, `alpha` on all twenty-three. A surface showing none of them as
 *     alpha makes a readiness claim nobody made.
 *
 * That is the argument for the mechanism, not an anecdote about it: the audit
 * that found the first five was careful and still missed two.
 *
 * ## The rule for which list a field belongs in
 *
 * **Would a HOST act on it.** Scopes, endpoints, credential names, token
 * lifetimes, idempotency limits, webhook requirements and maturity all change
 * what a host builds or shows. Wire concerns the package owns do not — both
 * estates drew that line independently, which is the best evidence it is
 * right.
 */

/**
 * Fields whose VALUE reaches a host, mapped to how.
 *
 * @return array<string,string>
 */
function connectorCarriedFields(): array
{
    return [
        'apiVersion' => 'verbatim — the anchor for version-drift checks',
        'auth' => 'the host-actionable subset, via authFor()',
        // NOT verbatim, and the value check caught me claiming it was. An
        // entry carries the OPERATION's deep link
        // (`.../page/feed/#publish`), not the connector's general one
        // (`.../page/feed/`) — more useful, and a different fact. The map
        // said verbatim and was wrong within an hour of being written.
        'docs' => 'per-operation — the deep link for THIS operation, not the connector-wide one',
        'domain' => 'verbatim, via the facet',
        'environments' => 'verbatim',
        'idempotency' => 'verbatim — where the key goes',
        'idempotencyMaxLength' => 'verbatim — how long it may be',
        'idempotencyNote' => 'verbatim — what the mechanism actually promises',
        'needsWebhookEndpoint' => 'verbatim — a host must provision one first',
        'packages' => 'verbatim, plus derived install commands',
        'sandbox' => 'verbatim, including its note',
        'service' => 'transformed — underscored, derived from the node kind',
        'serviceTitle' => 'verbatim',
        // Both arrived in the 26-connector index (weaver.agi cf73117) and are
        // NULL on all 26 today. `ConnectorSource` already carried them — this
        // map did not, which is the half of the two-gate problem that lives
        // here: a fact passes the emitter AND this whitelist, and a fix at one
        // is half a fix. The code was ahead of the classification, so the test
        // was right to fail and the entryFor side needed nothing.
        'setup' => 'shaped — list<{title,detail,url}> via setupFor(), CONNECTOR-level. '
            .'Note `entry.trigger.setup` is a STRING at operation level; they do not '
            .'collide but a single handler for "the setup field" would meet both.',
        'summary' => 'verbatim — the connector-level one-liner. Distinct from the '
            .'per-operation `summary`, which becomes `description`: one says what '
            .'Stripe is, the other says what this one operation does.',
        'status' => 'verbatim — maturity',
    ];
}

/**
 * OPERATION-level fields, each classified the same way.
 *
 * ## Why this exists separately
 *
 * The connector-level guard below walked `array_keys($connector)` and stopped
 * there — so for two weeks the mechanism that was written to end silent
 * gate-2 drops covered only HALF the surface it was protecting. `operations` was
 * classified as "EXPANDED rather than dropped" and nothing then looked inside
 * the expansion, even though an index entry is built per operation and most of
 * what a host reads about a CALL comes from the operation, not the connector.
 *
 * A field added to an operation upstream would have been dropped in exactly the
 * place, and exactly as quietly, as the seven connector-level ones that
 * prompted this file. The classification map was ahead of nothing; it simply
 * had no opinion.
 *
 * Found by Weaver fixing trigger `method`/`path` to be explicit nulls and me
 * checking whether that would redden our build. It would not have — which is
 * the finding. A guard that cannot go red for a whole class of change is not
 * protecting that class.
 *
 * @return array<string,string>
 */
function operationCarriedFields(): array
{
    return [
        'delivery' => 'shaped — the install path (package/vendor/both), via deliveryFor()',
        'docs' => 'verbatim — the deep link for THIS operation',
        'kind' => 'verbatim — the identity everything is keyed on; a missing one SKIPS the entry',
        'kindAlias' => 'shaped into the `aliases` list',
        'role' => 'verbatim, and mapped again into `category` via CATEGORY_FOR_ROLE',
        'sideEffects' => 'verbatim — whether a host may safely replay the call',
        'summary' => 'renamed to `description` — what THIS operation does',
        'title' => 'verbatim, falling back to the kind',
        // The trigger block is nested precisely because these three mean
        // something different from their connector-level namesakes.
        'handshake' => 'inside the nested `trigger` block',
        'setup' => 'inside the nested `trigger` block, where it is a STRING',
        'subscription' => 'inside the nested `trigger` block',
        'verification' => 'inside the nested `trigger` block — hmac / shared-token / null',
    ];
}

/**
 * OPERATION-level fields deliberately not carried, each with the reason.
 *
 * @return array<string,string>
 */
function operationNotCarriedFields(): array
{
    return [
        'operation' => 'The generator\'s own short name (`message_send`). `kind` is the '
            .'identity a host keys on, and carrying a second near-identical name invites '
            .'a lookup against the wrong one — the same trap `service` against `slug` '
            .'already sets at connector level.',
        'method' => 'WIRE CONCERN the package owns. A host calls the node, never the HTTP '
            .'endpoint, so the verb changes nothing it builds or shows. Both estates drew '
            .'this line independently for `baseUrls`, `headers` and `encoding`. Carried as '
            .'an explicit null on triggers upstream (weaver.agi 911e23c) because a '
            .'webhook-delivered trigger is not a call — null means checked, absent would '
            .'mean nobody decided.',
        'path' => 'WIRE CONCERN, as `method`. Also the one field that would embed a '
            .'provider API version we are deliberately not sent — see '
            .'ConnectorApiVersionAgreesTest for why anchoring on it is the thing we cannot do.',
    ];
}

/**
 * Fields deliberately not carried, each with the reason.
 *
 * @return array<string,string>
 */
function connectorNotCarriedFields(): array
{
    return [
        'operations' => 'EXPANDED rather than dropped: one index entry per operation, '
            .'because an operation is the unit a host installs and asks about, not a connector.',
        'slug' => 'Carried in transformed form as `service`. The two differ — `facebook-pages` '
            .'against `facebook_pages` — and eleven of twenty-three do, which is why the '
            .'transformation is named here rather than assumed to be identity.',
        'repo' => 'Provenance for the PACKAGE, not something a host acts on when calling the '
            .'API. A host installs a published package whose own metadata names its repo; '
            .'`docs` is carried because it is what a host shows a person.',
    ];
}

it('classifies every field the index actually carries', function () {
    $connectors = app(ConnectorSource::class)->connectors();

    expect($connectors)->not->toBeEmpty('no connectors in the index; this check would assert nothing');

    $present = [];
    foreach ($connectors as $connector) {
        foreach (array_keys($connector) as $key) {
            if (! str_starts_with((string) $key, '$')) {
                $present[(string) $key] = true;
            }
        }
    }

    $classified = array_merge(connectorCarriedFields(), connectorNotCarriedFields());

    $unclassified = array_values(array_diff(array_keys($present), array_keys($classified)));

    expect($unclassified)->toBe([], implode("\n", [
        'These connector fields are in the index and classified nowhere:',
        '  '.implode("\n  ", $unclassified),
        '',
        'Decide whether a HOST would act on the field. If yes, carry it in',
        'ConnectorSource::entryFor() and add it to connectorCarriedFields().',
        'If no, add it to connectorNotCarriedFields() WITH THE REASON — an',
        'unexplained exclusion is indistinguishable from an oversight, which is',
        'how the last seven were lost.',
    ]));
});

it('classifies every OPERATION field the index actually carries', function () {
    $connectors = app(ConnectorSource::class)->connectors();

    $present = [];
    $operationCount = 0;

    foreach ($connectors as $connector) {
        foreach (($connector['operations'] ?? []) as $operation) {
            $operationCount++;
            foreach (array_keys($operation) as $key) {
                if (! str_starts_with((string) $key, '$')) {
                    $present[(string) $key] = true;
                }
            }
        }
    }

    // Vacuity guard. Walking zero operations would pass this silently, and an
    // empty discovery reporting success is the failure this whole file exists
    // to prevent — see the connector-level check's own `not->toBeEmpty`.
    expect($operationCount)->toBeGreaterThan(0, 'no operations walked; this check would assert nothing');

    $classified = array_merge(operationCarriedFields(), operationNotCarriedFields());

    $unclassified = array_values(array_diff(array_keys($present), array_keys($classified)));

    expect($unclassified)->toBe([], implode("\n", [
        'These OPERATION fields are in the index and classified nowhere:',
        '  '.implode("\n  ", $unclassified),
        '',
        'An index entry is built PER OPERATION, so a field here is as host-facing',
        'as a connector-level one. Decide whether a HOST would act on it. If yes,',
        'carry it in ConnectorSource::entryFor() and add it to',
        'operationCarriedFields(). If no, add it to operationNotCarriedFields()',
        'WITH THE REASON.',
    ]));
});

it('has no classification for a field the index no longer carries', function () {
    // The other direction, and the one that rots quietly. An entry describing a
    // field nobody declares any more is a map of an estate that has moved,
    // and it makes the list above look more complete than it is.
    $present = [];
    foreach (app(ConnectorSource::class)->connectors() as $connector) {
        foreach (array_keys($connector) as $key) {
            $present[(string) $key] = true;
        }
    }

    $classified = array_keys(array_merge(connectorCarriedFields(), connectorNotCarriedFields()));

    expect($classified)->not->toBeEmpty('nothing classified; this check would assert nothing');

    $stale = array_values(array_diff($classified, array_keys($present)));

    expect($stale)->toBe([], 'These fields are classified but no connector declares them: '.implode(', ', $stale));
});

it('actually emits every field it claims to carry, with the value it claims', function () {
    // Two directions, and the second is the one Weaver found the hard way after
    // adopting the first: a field CLAIMED as carried can be present in every
    // entry and asserted by nothing. Absent is the obvious failure; present and
    // unexamined is the more convincing one, because it looks like coverage.
    //
    // The CARRIED map's own annotations decide what gets compared. Anything
    // described as `verbatim` must equal its source exactly — so a transform
    // bug that quietly set every `needsWebhookEndpoint` to false, or dropped
    // `status`, fails here. Fields labelled `transformed` or `subset` are
    // excluded by their own description rather than by a second list that
    // could drift from this one.
    $source = app(ConnectorSource::class);
    $entries = $source->indexEntries();
    $byService = [];

    foreach ($source->connectors() as $connector) {
        $byService[(string) $connector['service']] = $connector;
    }

    expect($entries)->not->toBeEmpty('no entries; this check would assert nothing');
    expect($byService)->not->toBeEmpty('no connectors; this check would assert nothing');

    $verbatim = array_keys(array_filter(
        connectorCarriedFields(),
        fn (string $how) => str_starts_with($how, 'verbatim'),
    ));

    expect($verbatim)->not->toBeEmpty('nothing claims to be carried verbatim; the map has lost its annotations');

    $wrong = [];

    foreach ($entries as $entry) {
        $connector = $byService[(string) $entry['service']] ?? null;

        if ($connector === null) {
            $wrong[] = "{$entry['kind']}: no connector for service {$entry['service']}";

            continue;
        }

        foreach ($verbatim as $field) {
            if (! array_key_exists($field, $entry)) {
                $wrong[] = "{$entry['kind']}: {$field} claimed carried, absent from the entry";

                continue;
            }

            // `needsWebhookEndpoint` is cast to bool on the way out, so compare
            // loosely enough to allow the cast and strictly enough to catch a
            // changed value.
            $expected = $connector[$field] ?? ($field === 'needsWebhookEndpoint' ? false : null);

            if ($entry[$field] != $expected) {
                $wrong[] = "{$entry['kind']}: {$field} is ".json_encode($entry[$field])
                    .' but the index says '.json_encode($expected);
            }
        }
    }

    expect($wrong)->toBe([], 'Carried fields that do not match the index:
  '.implode('
  ', $wrong));
});

it('does not let a maturity claim appear without being stated', function () {
    // `status` is a READINESS claim on a file built to be rendered. All
    // twenty-three connectors are alpha; a surface showing them as anything
    // else promises maturity nobody stated. Weaver pins the same thing at their
    // end, and it is worth pinning at both: the value is carried across a gate,
    // and a gate is where it would change.
    $statuses = collect(app(ConnectorSource::class)->indexEntries())
        ->pluck('status')
        ->unique()
        ->sort()
        ->values()
        ->all();

    expect($statuses)->not->toBeEmpty('no statuses; this check would assert nothing');

    expect($statuses)->toBe(['alpha'],
        'A connector status changed to '.implode(', ', $statuses).'. A promotion out of alpha is a '
        .'promise to consumers and has to be made deliberately — update this expectation in the same '
        .'change that makes it, so it cannot arrive by itself.');
});
