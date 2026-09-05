<?php

use App\Support\Registry\ConnectorSource;
use Tests\TestCase;

uses(TestCase::class);

/*
 * A connector's stated API version and its OAuth endpoints agree.
 *
 * Meta pins its Graph version in THREE places — the base URL, the OAuth
 * authorize dialog and the token endpoint — and Weaver nearly missed two of
 * them on a bump their own ticket described as "a one-line manifest change".
 *
 * ## The anchor
 *
 * We are not sent base URLs and should not be: a wire concern the package
 * owns, which both estates independently excluded. So the index carries the
 * FACT instead — `apiVersion`, stated per connector (four pin one, nineteen
 * are null). Comparing against that is what catches the original hazard, a
 * bump that moves the base URL and leaves the OAuth URLs behind, WITHOUT
 * inferring an API's version from an OAuth endpoint that may be versioned on
 * its own schedule.
 *
 * That distinction is not theoretical. Google's authorize endpoint is
 * `accounts.google.com/o/oauth2/v2/auth`, and that `v2` is the version of
 * Google's OAuth endpoint, not of Sheets or Drive — whose APIs carry no
 * version in the base URL at all. A blanket "every version must agree" rule
 * refused eight correct manifests upstream. Those rows are safe here because
 * their `apiVersion` is null and their token URLs carry no version, so there
 * is nothing to compare.
 *
 * ## Why the reader is defined once, at the top
 *
 * Weaver found a SECOND copy of this reader inside their own test — the old
 * narrow pattern, quietly agreeing with itself while the rule it existed to
 * pin had moved on. A duplicate that agrees with itself is worse than no test.
 * One definition, used by both cases below.
 */

/**
 * The API version in a URL's PATH, or null.
 *
 * Splits the parsed path into segments rather than matching the whole URL. The
 * previous regex (`#/v(\d+(?:\.\d+)?)(?:/|$)#`) was narrow in three shapes,
 * all silently — and the identical three were live in Weaver's independent
 * implementation of the same agreed rule:
 *
 *     /v1.2.3/    a three-part version
 *     /V2/        uppercase
 *     /v2?x=1     a version as the last segment before a query
 *
 * Segment-splitting also makes the host question disappear —
 * `v2.api.example.com` has no version SEGMENT — and `?` and `#` come free.
 */
function connectorPathApiVersion(?string $url): ?string
{
    if (! is_string($url) || $url === '') {
        return null;
    }

    $path = parse_url($url, PHP_URL_PATH);

    if (! is_string($path)) {
        return null;
    }

    foreach (explode('/', $path) as $segment) {
        // Anchored at BOTH ends, and for a distinct reason from the host case:
        // `oauth.v2.access` is a method name that happens to contain a
        // version, not a versioned path segment.
        if (preg_match('/^v(\d+(?:\.\d+)*)$/i', $segment, $m) === 1) {
            return $m[1];
        }
    }

    return null;
}

it('reads a version from every shape a path can carry it in', function (string $url, ?string $expected) {
    // Pinned rather than verified once in a shell. Weaver reported "twelve
    // shapes verified" from a throwaway command committed nowhere, and said it
    // best: a check run once and not committed is the same as having read the
    // code — and reading is exactly what let the narrow pattern survive. Mine
    // was a scratch file, deleted, so nothing here exercised these shapes
    // either: the live index contains no three-part, uppercase or
    // query-terminated version, so the old pattern would still pass today.
    expect(connectorPathApiVersion($url))->toBe($expected);
})->with([
    // The three the old pattern missed, and this is the whole point of the row.
    'three-part version' => ['https://x.example.com/v1.2.3/a', '1.2.3'],
    'uppercase' => ['https://x.example.com/V2/a', '2'],
    'before a query' => ['https://x.example.com/v2?x=1', '2'],

    // Already worked; kept so a rewrite cannot quietly lose them.
    'dotted' => ['https://www.facebook.com/v25.0/dialog/oauth', '25.0'],
    'plain' => ['https://api.notion.com/v1/oauth/authorize', '1'],

    // Must NOT match, each for its own reason.
    'a versioned HOST is not a versioned path' => ['https://v2.api.example.com/a', null],
    'a method name containing a version' => ['https://slack.com/api/oauth.v2.access', null],
    'unversioned' => ['https://oauth2.googleapis.com/token', null],
    'empty' => ['', null],
]);

it('never lets a connector name two API versions', function () {
    $entries = collect(app(ConnectorSource::class)->indexEntries());

    $declared = static fn (?string $v): ?string => is_string($v) && $v !== ''
        ? ltrim($v, 'vV')
        : null;

    $versioned = [];
    $disagree = [];

    foreach ($entries as $entry) {
        $auth = $entry['auth'] ?? [];
        $a = connectorPathApiVersion($auth['authorizeUrl'] ?? null);
        $t = connectorPathApiVersion($auth['tokenUrl'] ?? null);
        $api = $declared($entry['apiVersion'] ?? null);

        if ($a === null && $t === null && $api === null) {
            continue; // nothing stated anywhere — nothing to disagree about
        }

        $versioned[$entry['service']] = true;

        if ($a !== null && $t !== null && $a !== $t) {
            $disagree[] = "{$entry['service']}: authorize v{$a} vs token v{$t}";
        }

        // The anchored comparison — the one that catches a bump moving the
        // base URL and missing the OAuth URLs.
        if ($api !== null) {
            foreach (['authorize' => $a, 'token' => $t] as $which => $found) {
                if ($found !== null && $found !== $api) {
                    $disagree[] = "{$entry['service']}: apiVersion v{$api} vs {$which} v{$found}";
                }
            }
        }
    }

    // The vacuity guard. If nothing states a version any more — a provider
    // changes shape, or the field stops being carried at all — this fails
    // rather than passing having compared nothing.
    expect($versioned)->not->toBeEmpty(
        'no connector states an API version anywhere; this check compared nothing',
    );

    expect(array_values(array_unique($disagree)))->toBe([], implode("\n", [
        'These connectors name two different API versions:',
        '  '.implode("\n  ", array_unique($disagree)),
        '',
        'The version sits in the base URL, the authorize dialog and the token endpoint.',
        'Only the last two are index-carried, so a partial bump shows up here as a',
        'disagreement with `apiVersion` rather than as a silent mismatch.',
    ]));
});
