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
 * pins it there. This is defence in depth at the boundary a host actually
 * reads.
 */

it('never lets one connector name two API versions', function () {
    $entries = collect(app(ConnectorSource::class)->indexEntries());

    $version = static function (?string $url): ?string {
        if (! is_string($url) || $url === '') {
            return null;
        }

        return preg_match('#/v(\d+\.\d+)/#', $url, $m) === 1 ? $m[1] : null;
    };

    $versioned = [];
    $disagree = [];

    foreach ($entries as $entry) {
        $auth = $entry['auth'] ?? [];
        $a = $version($auth['authorizeUrl'] ?? null);
        $t = $version($auth['tokenUrl'] ?? null);

        if ($a === null && $t === null) {
            continue; // unversioned endpoints — nothing to disagree about
        }

        $versioned[$entry['service']] = true;

        if ($a !== null && $t !== null && $a !== $t) {
            $disagree[] = "{$entry['service']}: authorize v{$a} vs token v{$t}";
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
