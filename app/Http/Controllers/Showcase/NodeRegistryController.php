<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Models\FlowNodePackage;
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
    private const HEADERS = [
        'Cache-Control' => 'public, max-age=300, s-maxage=900',
        'Access-Control-Allow-Origin' => '*',
    ];

    /** GET /r/nodes/index.json */
    public function index(): JsonResponse
    {
        $items = FlowNodePackage::query()
            ->listed()
            ->orderBy('category')
            ->orderBy('kind')
            ->get()
            ->map(fn (FlowNodePackage $p) => $p->toIndexEntry())
            ->all();

        return response()->json([
            '$schema' => 'https://ui.particle.academy/schema/node-registry.json',
            'name' => 'fancy-flow-nodes',
            'homepage' => 'https://ui.particle.academy',
            // An empty marketplace is the correct answer today rather than an
            // error: the contract shipped before anyone published against it.
            'items' => $items,
        ], 200, self::HEADERS);
    }

    /**
     * GET /r/nodes/{slug}.json — one package's full manifest.
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
            return response()->json(['error' => "node '{$slug}' not found"], 404);
        }

        // The manifest as submitted, plus the two facts the registry owns
        // rather than the package: whether we verified it, and on what
        // evidence. A package cannot vouch for itself.
        return response()->json(
            array_merge($package->manifest, [
                'verified' => (bool) $package->verified,
                'fixturesAttestation' => $package->fixtures_attestation,
            ]),
            200,
            self::HEADERS,
        );
    }
}
