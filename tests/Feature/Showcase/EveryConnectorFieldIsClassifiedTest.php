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
        'status' => 'verbatim — maturity',
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
