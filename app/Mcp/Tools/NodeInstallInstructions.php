<?php

namespace App\Mcp\Tools;

use App\Models\FlowNodePackage;
use App\Support\Registry\FirstPartyNodeSource;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Get the exact install commands for a marketplace node, plus the capability wiring it needs afterwards. Returns a command per runtime, because a node is installed once per runtime the project executes on — the TS package and the PHP package are separate artifacts.')]
class NodeInstallInstructions extends Tool
{
    public function __construct(private readonly FirstPartyNodeSource $firstParty) {}

    /**
     * Database FIRST, then the compiled artifact — see ListNodes.
     *
     * This looked in the database alone, so every first-party node returned
     * "No marketplace node with kind ...  Run search_nodes first" — advice that
     * led nowhere, because search_nodes was reading the same empty table. The
     * HTTP registry served all eight the whole time and `fancy-cli add node`
     * installed them, so only the MCP — the surface an AGENT uses — was blind.
     */
    public function handle(Request $request): Response
    {
        $kind = trim((string) $request->get('kind', ''));
        if ($kind === '') {
            return Response::error('`kind` is required.');
        }

        $package = FlowNodePackage::query()->listed()->where('kind', $kind)->first();

        // A moderated row wins; otherwise fall back to the built artifact.
        $manifest = $package?->manifest ?? $this->firstPartyManifest($kind);
        if ($manifest === null) {
            return Response::error("No marketplace node with kind \"{$kind}\". Run search_nodes first.");
        }

        $name = $package?->name ?? ($manifest['name'] ?? $kind);
        $resolvedKind = $package?->kind ?? ($manifest['kind'] ?? $kind);
        $runtimes = is_array($manifest['runtimes'] ?? null) ? $manifest['runtimes'] : [];
        $commands = [];

        foreach ($runtimes as $runtime => $spec) {
            $entry = is_array($spec) ? $spec : [];
            $commands[$runtime] = [
                'engine' => $entry['engine'] ?? null,
                'command' => $runtime === 'php'
                    ? 'composer require '.($entry['package'] ?? $name)
                    : 'npm install '.($entry['package'] ?? $name),
            ];
        }

        $capabilities = is_array($manifest['capabilities'] ?? null) ? $manifest['capabilities'] : [];
        $required = array_keys(array_filter($capabilities, fn ($l) => $l === 'required'));

        return Response::json([
            'kind' => $resolvedKind,

            // The recommended path: it checks the node against the runtimes the
            // project ACTUALLY executes on and refuses a mismatch, which the
            // raw package-manager commands below cannot do.
            'recommended' => "npx fancy-cli@latest add node {$resolvedKind}",
            'recommendedWhy' => 'fancy-cli reads the project\'s real runtimes from package.json / composer.json and refuses a node that cannot run there. Installing by hand skips that check, and the node then appears in the palette and fails at run time — which looks like it worked.',

            'perRuntime' => $commands,
            'runtimeWarning' => 'Install for EVERY runtime the project executes on. A node installed only for TS is invisible to a PHP runner and the graph fails at that node.',

            'wiring' => $required === []
                ? null
                : [
                    'requiredCapabilities' => $required,
                    'how' => 'Register these on the host before the first run — registerLlmClient() / registerWorkflowResolver() in TS, or the Capabilities seam in PHP. A required capability that is not registered means the node cannot run at all.',
                ],

            // First-party nodes are verified by construction — they come from a repo
            // we control whose fixtures run on both runtimes in its own CI.
            'verified' => $package === null ? true : (bool) $package->verified,
            'verifiedNote' => ($package === null || $package->verified)
                ? 'Golden fixtures are attested to pass on the runtimes this package claims.'
                : 'NOT verified — nobody has confirmed this package\'s fixtures pass on the runtimes it claims. Its cross-runtime behaviour is unproven.',
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
     * `FirstPartyNodeSource` keys on the flattened slug, so this scans rather
     * than guessing the slug encoding — the same reason the CLI resolves
     * through the index instead of building a path from the kind.
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
