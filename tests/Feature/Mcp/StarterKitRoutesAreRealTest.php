<?php

use App\Http\Controllers\Showcase\StarterKitController;
use App\Mcp\Tools\StartProject;
use Laravel\Mcp\Request;
use Tests\TestCase;

uses(TestCase::class);

/*
 * An advertised starter kit is obtainable, and the MCP names the route that
 * actually works.
 *
 * ## Why this exists
 *
 * The Prism estate was told to build an app from the Fancy catalog, beginning
 * from a Fancy starter kit as its brief required. It reported **"required Fancy
 * starter unavailable"** and hand-assembled instead — against a comparison build
 * on another stack that DID start from its official starter. The kit it wanted,
 * Realtime Chat, was live and obtainable the whole time.
 *
 * It failed for a reason worth encoding: `start_project` step 4 pointed at the
 * kits page and gave exactly one worked example —
 *
 *     Shop-n-Sub = catalog + FMS, vendored as `npx fancy-cli@latest add catalog-fms`
 *
 * `catalog-fms` is the vendorable component BLOCK that the Shop-n-Sub kit uses.
 * It is not the kit, and no kit is reachable that way: kits are zip downloads at
 * `/starter-kits/{slug}/download.zip`. So the single example taught the
 * generalisation "a kit is `fancy-cli add <its slug>`", which is false for all
 * eight, and the agent followed it faithfully — `realtime-chat` (not found),
 * then `fancy-query` (resolves, but as the npm package).
 *
 * **The pointer was right and the example beside it described a mechanism that
 * does not apply.** That is worse than no example, because a wrong route is
 * indistinguishable from a missing capability once you have tried it twice.
 *
 * ## What it checks, and why each half
 *
 *   1. Every advertised kit really downloads — the "advertised but unobtainable"
 *      half, which is what Prism reasonably suspected was happening.
 *   2. The MCP never presents a kit slug as `fancy-cli add`-able — the half that
 *      was ACTUALLY wrong.
 *   3. Kit NAMES map to their slugs somewhere an agent can read. "Realtime Chat"
 *      lives at slug `fancy-query`; no agent guesses that, and before this the
 *      mapping existed only in a React page's props.
 */

it('downloads every kit it advertises', function () {
    $kits = StarterKitController::kits();

    expect($kits)->not->toBeEmpty('no kits found; this check would assert nothing');

    foreach ($kits as $kit) {
        $response = $this->get("/starter-kits/{$kit['slug']}/download.zip");

        expect($response->getStatusCode())->toBe(200,
            "kit '{$kit['name']}' (slug {$kit['slug']}) is advertised on /starter-kits but its download returned {$response->getStatusCode()}");

        // A 200 that serves an unopenable archive is the failure this is really
        // about, one layer down. Read it back rather than trusting the status.
        $path = $response->getFile()->getPathname();

        $zip = new ZipArchive;
        expect($zip->open($path))->toBeTrue("kit '{$kit['name']}' served a file that is not a readable zip");
        expect($zip->locateName("{$kit['slug']}-starter/package.json"))->not->toBeFalse(
            "kit '{$kit['name']}' zip has no package.json; it is not a runnable project");
        $zip->close();
    }
});

it('gives the route that actually fetches a kit', function () {
    $payload = starterKitMcpText();

    // `toBeTrue` with a message, NOT `toContain('needle', 'explanation')` —
    // `toContain` is variadic, so a message passed there becomes a second needle
    // and the assertion fails on the prose rather than the fact. Found by this very
    // check going red while the payload plainly contained what it asked for.
    expect(str_contains($payload, 'starter-kits'))->toBeTrue(
        'start_project does not mention the starter kits at all; this check would assert nothing');

    // The one route that works. Naming the page without it is what sent Prism's
    // agent to the CLI: a pointer to where kits are LISTED reads as a pointer to
    // where they are OBTAINED.
    expect(str_contains($payload, 'download.zip'))->toBeTrue(implode('
', [
        'start_project points at the starter kits but never names the route that fetches one.',
        '',
        'Kits are zip downloads at /starter-kits/{slug}/download.zip. Nothing else works —',
        'they are not registry entries, so `npx fancy-cli add <slug>` returns "not found"',
        'for every one of them.',
    ]));
});

it('does not pair a kit with the component-vendoring CLI', function () {
    $payload = starterKitMcpText();

    /*
     * ## This check is the SECOND version, and the first one passed against the
     * ## live bug
     *
     * It matched kit SLUGS beside `fancy-cli add`. The offending text read
     * `Shop-n-Sub = catalog + FMS, vendored as npx fancy-cli@latest add catalog-fms`
     * — and `catalog-fms` is a component block, not a kit slug. So the check found
     * nothing and reported clean on the exact sentence it was written for.
     *
     * The defect is a kit NAME presented as vendorable, whatever string follows.
     * Recorded because a check that cannot fail on its own motivating case is the
     * most expensive kind: it is indistinguishable from a fixed bug.
     */
    $offenders = [];

    foreach (StarterKitController::kits() as $kit) {
        // Same clause: the kit's name, then a vendoring command, with no sentence
        // boundary between them.
        $pattern = '/'.preg_quote($kit['name'], '/').'[^.
]{0,200}?fancy-cli(@latest)?\s+add/i';

        if (preg_match($pattern, $payload)) {
            $offenders[] = $kit['name'];
        }
    }

    expect($offenders)->toBe([], implode('
', array_merge(
        ['These kits are presented as `npx fancy-cli add` targets:', ''],
        array_map(fn ($s) => '  '.$s, $offenders),
        [
            '',
            'No kit is reachable that way. An agent that tries it gets "not found" and',
            'reasonably concludes the kit does not exist — which is exactly what happened.',
        ],
    )));
});

it('maps every kit NAME to its slug somewhere an agent can read', function () {
    $payload = starterKitMcpText();

    $missing = [];

    foreach (StarterKitController::kits() as $kit) {
        // Both halves, because either alone is useless: a name with no slug
        // cannot be fetched, and a slug with no name cannot be recognised as the
        // kit the consumer was told to use.
        if (! str_contains($payload, $kit['name']) || ! str_contains($payload, $kit['slug'])) {
            $missing[] = "{$kit['name']} → {$kit['slug']}";
        }
    }

    expect($missing)->toBe([], implode("\n", array_merge(
        ['These kits are not discoverable through the MCP by name:', ''],
        array_map(fn ($m) => '  '.$m, $missing),
        [
            '',
            'A kit\'s name and its slug differ ("Realtime Chat" is slug `fancy-query`),',
            'so an agent told to use a kit by name cannot reach it without the mapping.',
        ],
    )));
});

/** The start_project payload as an agent receives it. */
function starterKitMcpText(): string
{
    $response = app(StartProject::class)->handle(new Request([]));

    return (string) $response->content();
}
