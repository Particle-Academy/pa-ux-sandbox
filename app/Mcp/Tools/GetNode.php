<?php

namespace App\Mcp\Tools;

use App\Models\FlowNodePackage;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Fetch one marketplace node\'s full manifest: config schema, ports, per-runtime entrypoints and engine ranges, required capabilities, and whether it pauses for a human or is unsafe to replay. Call this before wiring a node into a graph — the capability and replay facts change what the HOST has to provide, and are not visible from a listing.')]
class GetNode extends Tool
{
    public function handle(Request $request): Response
    {
        $kind = trim((string) $request->get('kind', ''));
        if ($kind === '') {
            return Response::error('`kind` is required.');
        }

        $package = FlowNodePackage::query()
            ->listed()
            ->where('kind', $kind)
            ->first();

        if (! $package) {
            return Response::error(
                "No marketplace node with kind \"{$kind}\". Run search_nodes to find one, and check fancy-flow's core builtins — they ship with the engine and are not listed in the marketplace.",
            );
        }

        $manifest = $package->manifest;
        $capabilities = is_array($manifest['capabilities'] ?? null) ? $manifest['capabilities'] : [];

        return Response::json([
            'kind' => $package->kind,
            'name' => $package->name,
            'title' => $package->title,
            'description' => $package->description,
            'category' => $package->category,
            'manifest' => $manifest,

            // The registry's own claims, kept separate from the manifest so it
            // is obvious which facts the package asserts and which we do.
            'verified' => (bool) $package->verified,
            'fixturesAttestation' => $package->fixtures_attestation,
            'provenance' => $package->provenance,

            // Lifted out because a host has to act on them, and burying them in
            // the manifest means they get skimmed past.
            'hostMustProvide' => [
                'requiredCapabilities' => array_keys(array_filter($capabilities, fn ($level) => $level === 'required')),
                'optionalCapabilities' => array_keys(array_filter($capabilities, fn ($level) => $level === 'optional')),
                'pausesForHuman' => $manifest['pausesForHuman'] ?? null,
                'sideEffects' => $manifest['sideEffects'] ?? null,
            ],
            'warnings' => array_values(array_filter([
                isset($manifest['pausesForHuman'])
                    ? 'This node halts the run to wait for a person. The host needs a resume path, and the node cannot be embedded in a workflow that must run unattended.'
                    : null,
                ($manifest['sideEffects'] ?? null) === 'unsafe-to-replay'
                    ? 'This node is unsafe to replay. Durable runs retry, so guard it or scope its retry policy.'
                    : null,
                ! $package->verified
                    ? 'This package is NOT verified: nobody has confirmed its golden fixtures pass on the runtimes it claims. Treat its cross-runtime behaviour as unproven.'
                    : null,
            ])),
        ]);
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'kind' => $schema->string()
                ->description('The canonical namespaced kind id, e.g. "@acme/salesforce_upsert".')
                ->required(),
        ];
    }
}
