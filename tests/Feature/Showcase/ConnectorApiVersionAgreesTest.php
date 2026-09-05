<?php

use App\Support\Registry\ConnectorSource;
use Tests\TestCase;

uses(TestCase::class);

/*
 * A connector's OAuth endpoints agree about which API version they call.
 *
 * Meta pins its Graph version in THREE places — the base URL, the OAuth
 * authorize dialog and the token endpoint — and Weaver nearly missed two of
 * them on a bump their own ticket described as "a one-line manifest change".
 *
 * Two of the three are index-carried, so this is the half a consumer can see.
 * If a future bump moved the base URL and missed the OAuth URLs, the index
 * would advertise the old version while the packages called the new one, and
 * the disagreement would be invisible from either side alone: Weaver sees the
 * manifest, we see the index, and neither sees both.
 *
 * This does not pin WHICH version — that is their decision and it will move.
 * It pins that a single connector does not call two of them at once, which is
 * never a plan.
 *
 * The base URL is deliberately absent from the index (a wire concern the
 * package owns), so a full three-way check is only possible upstream. Weaver
 * pins it there as a VALIDATOR rule, so a half-bumped manifest is refused at
 * load rather than caught by a suite. This is defence in depth at the boundary
 * a host actually reads.
 *
 * ## The false positive this will eventually hit
 *
 * An authorize URL and a token URL can carry versions from DIFFERENT
 * namespaces, legitimately disagreeing. Google's authorize is
 * `accounts.google.com/o/oauth2/v2/auth` — that `v2` is the version of
 * Google's OAuth ENDPOINT, not of Sheets or Drive, whose APIs carry no version
 * in the base URL at all. It is safe here only because their token URL
 * (`oauth2.googleapis.com/token`) carries no version, so there is nothing to
 * compare. Slack is the same shape: `/oauth/v2/authorize` against
 * `oauth.v2.access`, where the second is not a path segment.
 *
 * Weaver hit this building the upstream rule — a blanket "all versions in a
 * manifest must agree" refused eight correct manifests. Theirs fires only when
 * the BASE URL pins a version, which is the anchor that establishes the API's
 * own version.
 *
 * We are not sent base URLs and should not be — a wire concern the package
 * owns. So the index now carries the FACT instead: `apiVersion`, stated per
 * connector (four pin one; nineteen are null). That is the anchor, and the
 * comparison against it below is what catches the original hazard — a bump
 * that moves the base URL and misses the OAuth URLs — without inferring an
 * API's version from an endpoint that may be versioned on its own schedule.
 *
 * Verified against all sixteen oauth2 connectors: five carry a version on both
 * URLs and all five agree; the rest carry one or none, so nothing is compared.
 * WHEN a provider appears whose authorize pins an OAuth-endpoint version and
 * whose token pins an API version, this will call it a defect and be wrong.
 * The fix then is Weaver's: anchor to something that establishes which version
 * belongs to the API, rather than comparing every version-shaped segment.
 */

it('never lets one connector name two API versions', function () {
    $entries = collect(app(ConnectorSource::class)->indexEntries());

    // Split the PATH into segments rather than pattern-matching the whole
    // URL. The old regex was narrow in three shapes, all silently:
    //
    //     /v1.2.3/    a three-part version
    //     /V2/        uppercase
    //     /v2?x=1     a version as the last segment before a query
    //
    // Weaver found the same three in theirs after I described mine, which is
    // the second time this week two independent implementations of one agreed
    // rule diverged in the same direction. Segment-splitting also makes the
    // host question disappear — `v2.api.example.com` has no version SEGMENT —
    // and `?` and `#` come free from parse_url.
    $version = static function (?string $url): ?string {
        if (! is_string($url) || $url === '') {
            return null;
        }

        $path = parse_url($url, PHP_URL_PATH);

        if (! is_string($path)) {
            return null;
        }

        foreach (explode('/', $path) as $segment) {
            // Anchored at both ends: `oauth.v2.access` is a method name that
            // happens to contain a version, not a versioned path segment.
            if (preg_match('/^v(\d+(?:\.\d+)*)$/i', $segment, $m) === 1) {
                return $m[1];
            }
        }

        return null;
    };

    $declared = static fn (?string $v): ?string => is_string($v) && $v !== ''
        ? ltrim($v, 'vV')
        : null;

    $versioned = [];
    $disagree = [];

    foreach ($entries as $entry) {
        $auth = $entry['auth'] ?? [];
        $a = $version($auth['authorizeUrl'] ?? null);
        $t = $version($auth['tokenUrl'] ?? null);
        $api = $declared($entry['apiVersion'] ?? null);

        if ($a === null && $t === null) {
            continue; // unversioned endpoints — nothing to disagree about
        }

        $versioned[$entry['service']] = true;

        if ($a !== null && $t !== null && $a !== $t) {
            $disagree[] = "{$entry['service']}: authorize v{$a} vs token v{$t}";
        }

        // The anchored comparison, and the one that catches the ORIGINAL
        // hazard: a bump that moves the base URL and misses the OAuth URLs.
        // `apiVersion` states the API's own version, so this does not have to
        // infer it from an endpoint that may be versioned separately — which
        // is exactly the false positive that would otherwise arrive with the
        // first provider pinning both.
        if ($api !== null) {
            foreach (['authorize' => $a, 'token' => $t] as $which => $found) {
                if ($found !== null && $found !== $api) {
                    $disagree[] = "{$entry['service']}: apiVersion v{$api} vs {$which} v{$found}";
                }
            }
        }
    }

    // The vacuity guard. If nobody carries a versioned URL any more — because a
    // provider changed shape, or because the field stopped being carried at all
    // — this check would pass having compared nothing, which is the exact
    // failure the whole exchange behind this file was about.
    expect($versioned)->not->toBeEmpty(
        'no connector carries a versioned OAuth URL; this check compared nothing',
    );

    expect(array_unique($disagree))->toBe([], implode("\n", [
        'These connectors name two different API versions across their own OAuth endpoints:',
        '  '.implode("\n  ", array_unique($disagree)),
        '',
        'A partial version bump is the likely cause: the version sits in the base URL, the',
        'authorize dialog and the token endpoint, and only the last two are visible here.',
    ]));
});
