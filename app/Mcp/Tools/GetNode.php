<?php

namespace App\Mcp\Tools;

use App\Models\FlowNodePackage;
use App\Support\Registry\FirstPartyNodeSource;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Fetch one marketplace node\'s full manifest: config schema, ports, per-runtime entrypoints and engine ranges, required capabilities, and whether it pauses for a human or is unsafe to replay. Call this before wiring a node into a graph — the capability and replay facts change what the HOST has to provide, and are not visible from a listing.')]
class GetNode extends Tool
{
    public function __construct(private readonly FirstPartyNodeSource $firstParty) {}

    /**
     * The built artifact FIRST for the manifest, then the database row.
     *
     * This tool was left on the database alone when `list_nodes`,
     * `search_nodes` and `node_install_instructions` were taught to union in
     * the built artifact — so on production, where `flow:register-node` was
     * never run, every first-party kind returned "No marketplace node with kind
     * ...". That is the tool its own description tells an agent to call BEFORE
     * wiring a node into a graph, so the failure landed exactly where the
     * capability and replay facts were supposed to arrive.
     *
     * Precedence is deliberate and differs from a plain fallback: for a
     * first-party node the artifact is REBUILT from source by `flow:build`,
     * while a row is a snapshot from whenever someone last ran
     * `flow:register-node`. A stale row silently served an outdated manifest —
     * the `fancyDependencies` a node needs to be wired correctly went missing
     * that way. The row still owns moderation state (verified, attestation,
     * provenance), which is the thing the table exists to carry.
     */
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

        $manifest = $this->firstPartyManifest($kind) ?? $package?->manifest;

        if ($manifest === null) {
            return Response::error(
                "No marketplace node with kind \"{$kind}\". Run search_nodes to find one, and check fancy-flow's core builtins — they ship with the engine and are not listed in the marketplace.",
            );
        }

        $capabilities = is_array($manifest['capabilities'] ?? null) ? $manifest['capabilities'] : [];

        // First-party nodes are verified by construction — they come from a repo
        // we control whose fixtures run on both runtimes in its own CI.
        $verified = $package === null ? true : (bool) $package->verified;

        return Response::json([
            'kind' => $manifest['kind'] ?? $package?->kind ?? $kind,
            'name' => $package?->name ?? ($manifest['name'] ?? null),
            'title' => $package?->title ?? ($manifest['title'] ?? null),
            'description' => $package?->description ?? ($manifest['description'] ?? null),
            'category' => $package?->category ?? ($manifest['category'] ?? null),
            'manifest' => $manifest,

            // The registry's own claims, kept separate from the manifest so it
            // is obvious which facts the package asserts and which we do.
            'verified' => $verified,
            'fixturesAttestation' => $package?->fixtures_attestation,
            'provenance' => $package?->provenance,

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
                ! $verified
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

    /**
     * A first-party node's full manifest, by kind (canonical id or bare name).
     *
     * Mirrors {@see NodeInstallInstructions::firstPartyManifest()} — the source
     * keys on the flattened slug, so this scans rather than guessing the slug
     * encoding.
     *
     * @return array<string,mixed>|null
     */
    private function firstPartyManifest(string $kind): ?array
    {
        foreach ($this->firstParty->all() as $node) {
            $manifest = $node['manifest'] ?? $node;
            $candidate = (string) ($manifest['kind'] ?? '');

            if ($candidate === $kind || str_ends_with($candidate, '/'.$kind)) {
                return $manifest;
            }
        }

        return null;
    }
}
