<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Models\FlowNodePackage;
use App\Support\Registry\FirstPartyNodeSource;
use App\Support\Registry\NodeSource;
use Illuminate\Http\JsonResponse;

/**
 * The public node marketplace registry, read side.
 *
 * These are the two endpoints `fancy-cli` calls for `list nodes`,
 * `search nodes`, and `add node`.
 *
 * MARKETPLACE ONLY. Core builtins ship inside fancy-flow and are not
 * installable, so they are deliberately absent — listing them would tell an
 * author to install something they already have.
 *
 * Only `listed` packages are served. A pending or rejected submission is not a
 * thing an install command should ever resolve.
 */
class NodeRegistryController extends Controller
{
    public function __construct(
        private readonly NodeSource $source,
        private readonly FirstPartyNodeSource $firstParty,
    ) {}

    private const HEADERS = [
        'Cache-Control' => 'public, max-age=300, s-maxage=900',
        'Access-Control-Allow-Origin' => '*',
    ];

    /**
     * GET /r/nodes/index.json
     *
     * Two sources, deliberately. Third-party SUBMISSIONS live in the database,
     * which carries the status and verification a moderator sets. First-party
     * nodes are BUILT from their own repo — they do not go through moderation,
     * and routing them through a manual registration command is what left
     * production serving an empty marketplace while eight nodes sat in
     * `fancy-flow-nodes`.
     *
     * The database wins a kind collision: a moderator's decision has to beat a
     * build artifact, or moderation means nothing.
     */
    public function index(): JsonResponse
    {
        $rows = FlowNodePackage::query()
            ->listed()
            ->get()
            ->map(fn (FlowNodePackage $p) => $p->toIndexEntry());

        $items = $rows
            ->concat($this->firstParty->indexEntries())
            ->unique('kind')
            ->sortBy([['category', 'asc'], ['kind', 'asc']])
            ->values()
            ->all();

        return response()->json([
            '$schema' => 'https://ui.particle.academy/schema/node-registry.json',
            'name' => 'fancy-flow-nodes',
            'homepage' => 'https://ui.particle.academy',
            'items' => $items,
        ], 200, self::HEADERS);
    }

    /**
     * GET /r/nodes/{slug}.json — one node's manifest AND its source.
     *
     * The source is the point. A node is vendored, not installed: the CLI
     * copies these files into the project the way it copies a component's, so
     * the response has to carry them. Naming an npm package instead would put
     * the node in `node_modules`, where it cannot be read or edited, and would
     * need a second package for the PHP half.
     *
     * The slug is the flattened kind id (`acme__salesforce_upsert`), because a
     * kind contains a slash and percent-encoding a path separator is handled
     * inconsistently by static hosts, CDNs and proxies. The index carries the
     * mapping, so a client resolves through it rather than guessing.
     */
    public function show(string $slug): JsonResponse
    {
        $slug = str_replace('.json', '', $slug);

        $package = FlowNodePackage::query()
            ->listed()
            ->get()
            ->first(fn (FlowNodePackage $p) => $p->slug() === $slug);

        if (! $package) {
            return $this->showFirstParty($slug);
        }

        // The manifest as submitted, plus what the registry owns rather than
        // the package — whether we verified it, on what evidence, and the
        // source itself. A package cannot vouch for itself.
        return response()->json(
            array_merge($package->manifest, [
                'verified' => (bool) $package->verified,
                'fixturesAttestation' => $package->fixtures_attestation,
                'files' => $this->source->filesFor($package->manifest, $package->nodeDirectory()),
            ]),
            200,
            self::HEADERS,
        );
    }

    /**
     * A first-party node — from its repo locally, from the compiled artifact in
     * production, where the repo does not exist.
     *
     * `files` is the point of the response, not a detail of it: a node is
     * vendored, so the CLI writes these into the project. An entry served
     * without them installs nothing and says nothing, which is why the build
     * command warns on any node that compiles to zero files.
     */
    private function showFirstParty(string $slug): JsonResponse
    {
        $node = $this->firstParty->find($slug);

        if ($node === null) {
            return response()->json(['error' => "node '{$slug}' not found"], 404);
        }

        return response()->json(
            array_merge($node['manifest'], [
                // Not a claim the package makes about itself: these come from a
                // repo we control, whose fixtures run on both runtimes in its
                // own CI. That is what the flag is supposed to mean.
                'verified' => true,
                'files' => $node['files'],
            ]),
            200,
            self::HEADERS,
        );
    }
}
