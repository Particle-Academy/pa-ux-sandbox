<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Support\Registry\ConnectorFacet;
use App\Support\Registry\ConnectorSource;
use App\Support\Registry\FirstPartyNodeSource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The PUBLISHED connector catalogue — packages, not vendorable source.
 *
 * ## Why this is not `/r/nodes/index.json`
 *
 * That endpoint is the machine index the CLI RESOLVES through, and everything
 * in it is vendored: `NodeIndexItem` requires a `url`, the manifest behind it
 * requires `files`, and "the files ARE the node". A connector has none — it
 * ships as a matched set on four registries and a consumer installs it.
 *
 * Putting one in there would produce an entry that resolves, downloads, writes
 * nothing, and reports success. This app already documents that failure twice
 * ("installs nothing and says nothing") and the node build command warns on any
 * node compiling to zero files. A catalogue entry whose install verb is wrong
 * is worse than an absent one, because the absent one sends somebody to the
 * docs instead of to a silently empty directory.
 *
 * So connectors travel here, carrying package names and versions in place of a
 * vendoring url. Discovery is unchanged — `list_connector_services` is still
 * the front door and still spans both delivery paths.
 */
class ConnectorRegistryController extends Controller
{
    public function __construct(
        private readonly ConnectorSource $connectors,
        private readonly FirstPartyNodeSource $firstParty,
    ) {}

    private const HEADERS = [
        'Cache-Control' => 'public, max-age=300, s-maxage=900',
        'Access-Control-Allow-Origin' => '*',
    ];

    /**
     * GET /r/connectors/index.json
     *
     * Optionally narrowed by `service` or `domain`.
     */
    public function index(Request $request): JsonResponse
    {
        $entries = collect($this->connectors->indexEntries());

        $service = trim(strtolower((string) $request->query('service', '')));
        if ($service !== '') {
            $entries = $entries->filter(
                fn (array $e) => strtolower($e['service']) === $service,
            )->values();
        }

        $domain = trim((string) $request->query('domain', ''));
        if ($domain !== '') {
            $entries = $entries->where('domain', $domain)->values();
        }

        // Every kind that ALSO exists as vendored source. Saying so per entry is
        // what stops a consumer choosing an install verb by guessing: four of
        // these are reachable both ways, and which one is right depends on
        // whether they want the source in their project or a dependency.
        $vendoredKinds = array_column($this->firstParty->indexEntries(), 'kind');

        $items = $entries->map(fn (array $entry) => array_merge($entry, [
            'delivery' => $this->connectors->deliveryFor($entry['kind'], $vendoredKinds),
            'install' => $this->installFor($entry),
        ]))->values()->all();

        return response()->json([
            '$schema' => 'https://ui.particle.academy/schema/connector-registry.json',
            'name' => 'fancy-flow-connectors',
            'homepage' => 'https://ui.particle.academy',

            // Stated rather than implied. A client that assumed the node
            // registry's contract would look for `url` and find none.
            'delivery' => 'package',
            'note' => 'These are PUBLISHED PACKAGES, not vendored source. Install them with your package '
                .'manager — `npx fancy-cli add node` does not apply. Install the `-ui` package first where '
                .'`installFirst` is set: the runtime package peer-depends on it. Entries marked '
                .'delivery: "both" are also available as vendorable source via /r/nodes/index.json.',
            'count' => count($items),
            'items' => $items,
            'services' => ConnectorFacet::services(collect($this->connectors->indexEntries())),
            'domains' => ConnectorFacet::DOMAINS,
        ], 200, self::HEADERS);
    }

    /**
     * Ready-to-run install commands, per ecosystem.
     *
     * Composed here rather than shipped in the index because the command is a
     * property of the CONSUMER's toolchain, not of the connector: the same
     * package is `npm install` and `composer require` and `pip install`, and
     * the index has no business guessing which one is being read.
     *
     * The `-ui` package is listed first where the index says so. Its runtime
     * sibling peer-depends on it, and npm resolves a missing peer as an error
     * rather than a warning.
     *
     * @param  array<string,mixed>  $entry
     * @return array<string,string>
     */
    private function installFor(array $entry): array
    {
        $byRegistry = [];

        foreach ($entry['packages'] as $package) {
            $byRegistry[$package['registry']] ??= [];

            $spec = match ($package['registry']) {
                'npm' => "{$package['name']}@{$package['version']}",
                'packagist' => "{$package['name']}:^{$package['version']}",
                'pypi' => "{$package['name']}=={$package['version']}",
                default => $package['name'],
            };

            // `installFirst` packages lead — the peer has to exist before the
            // package declaring it does.
            if ($package['installFirst']) {
                array_unshift($byRegistry[$package['registry']], $spec);
            } else {
                $byRegistry[$package['registry']][] = $spec;
            }
        }

        $commands = [];

        foreach ($byRegistry as $registry => $specs) {
            $commands[$registry] = match ($registry) {
                'npm' => 'npm install '.implode(' ', $specs),
                'packagist' => 'composer require '.implode(' ', $specs),
                'pypi' => 'pip install '.implode(' ', $specs),
                default => implode(' ', $specs),
            };
        }

        return $commands;
    }
}
