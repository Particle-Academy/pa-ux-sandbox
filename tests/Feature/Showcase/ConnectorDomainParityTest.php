<?php

use App\Support\Registry\ConnectorFacet;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The connector DOMAIN list exists in three places and nothing checked it.
 *
 *   1. `ConnectorDomain` in @particle-academy/fancy-flow — the contract;
 *   2. `ConnectorFacet::DOMAINS` here — what the catalogue groups by;
 *   3. weaver's closed set — what a generated connector is allowed to declare.
 *
 * They agree today. Nothing made them.
 *
 * That is the shape this suite keeps getting caught by: three copies of an
 * assertion agree right up until someone edits one, and the divergence is
 * SILENT because `ConnectorFacet::from()` maps an unknown domain to `other`.
 * A connector would simply arrive in the wrong bucket, on a green build.
 *
 * Raised by weaver while indexing fifteen published connectors — "it is the
 * sort of thing this kit is supposed to pin with a test rather than discover
 * in a conversation." They were right, and the precedent already exists next
 * door: `connectors.ts` says SandboxKind is "kept in step with the runtime's
 * SandboxKind, and vendoring.test.ts compares the two declarations". The same
 * care was never applied to the domain list.
 *
 * The union is read from the PUBLISHED `.d.ts` rather than from source, so
 * this pins what consumers actually resolve — including us.
 */

/** @return list<string> the domains declared by the installed fancy-flow. */
function connectorDomainsFromPackage(): array
{
    $path = base_path('node_modules/@particle-academy/fancy-flow/dist/connectors.d.ts');

    expect(file_exists($path))->toBeTrue(
        'fancy-flow is not installed, so this parity check cannot run. That is a FAILURE, not a skip: '.
        'a missing counterpart is exactly when a list silently drifts.',
    );

    $source = (string) file_get_contents($path);

    expect(preg_match('/type ConnectorDomain = ([^;]+);/', $source, $m))->toBe(1,
        'Could not find the ConnectorDomain union in the published d.ts. If its SHAPE changed, this '.
        'parser is what needs updating -- do not delete the check.',
    );

    preg_match_all('/"([a-z-]+)"/', $m[1], $values);

    return $values[1];
}

it('groups by exactly the domains fancy-flow declares', function () {
    $fromPackage = connectorDomainsFromPackage();
    $fromFacet = array_keys(ConnectorFacet::DOMAINS);

    sort($fromPackage);
    sort($fromFacet);

    expect($fromFacet)->toBe($fromPackage);
});

it('names any domain that would silently fall into "other"', function () {
    // The failure mode, stated as its own test: `from()` maps an unrecognised
    // domain to `other` rather than erroring, so a connector declaring a domain
    // fancy-flow knows and we do not is mis-bucketed with nothing reported.
    $missing = array_diff(connectorDomainsFromPackage(), array_keys(ConnectorFacet::DOMAINS));

    expect($missing)->toBe([], 'These domains exist in fancy-flow and would be bucketed as "other" here: '.implode(', ', $missing));
});

it('does not offer a domain fancy-flow has never heard of', function () {
    // The other direction: a bucket in the catalogue that no connector can ever
    // legally declare is an empty shelf nobody can stock.
    $extra = array_diff(array_keys(ConnectorFacet::DOMAINS), connectorDomainsFromPackage());

    expect($extra)->toBe([], 'These are offered here but are not valid ConnectorDomain values: '.implode(', ', $extra));
});
