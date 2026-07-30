<?php

namespace App\Mcp\Tools;

use App\Models\FlowNodePackage;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Get the exact install commands for a marketplace node, plus the capability wiring it needs afterwards. Returns a command per runtime, because a node is installed once per runtime the project executes on — the TS package and the PHP package are separate artifacts.')]
class NodeInstallInstructions extends Tool
{
    public function handle(Request $request): Response
    {
        $kind = trim((string) $request->get('kind', ''));
        if ($kind === '') {
            return Response::error('`kind` is required.');
        }

        $package = FlowNodePackage::query()->listed()->where('kind', $kind)->first();
        if (! $package) {
            return Response::error("No marketplace node with kind \"{$kind}\". Run search_nodes first.");
        }

        $manifest = $package->manifest;
        $runtimes = is_array($manifest['runtimes'] ?? null) ? $manifest['runtimes'] : [];
        $commands = [];

        foreach ($runtimes as $runtime => $spec) {
            $entry = is_array($spec) ? $spec : [];
            $commands[$runtime] = [
                'engine' => $entry['engine'] ?? null,
                'command' => $runtime === 'php'
                    ? 'composer require '.($entry['package'] ?? $package->name)
                    : 'npm install '.($entry['package'] ?? $package->name),
            ];
        }

        $capabilities = is_array($manifest['capabilities'] ?? null) ? $manifest['capabilities'] : [];
        $required = array_keys(array_filter($capabilities, fn ($l) => $l === 'required'));

        return Response::json([
            'kind' => $package->kind,

            // The recommended path: it checks the node against the runtimes the
            // project ACTUALLY executes on and refuses a mismatch, which the
            // raw package-manager commands below cannot do.
            'recommended' => "npx fancy-cli@latest add node {$package->kind}",
            'recommendedWhy' => 'fancy-cli reads the project\'s real runtimes from package.json / composer.json and refuses a node that cannot run there. Installing by hand skips that check, and the node then appears in the palette and fails at run time — which looks like it worked.',

            'perRuntime' => $commands,
            'runtimeWarning' => 'Install for EVERY runtime the project executes on. A node installed only for TS is invisible to a PHP runner and the graph fails at that node.',

            'wiring' => $required === []
                ? null
                : [
                    'requiredCapabilities' => $required,
                    'how' => 'Register these on the host before the first run — registerLlmClient() / registerWorkflowResolver() in TS, or the Capabilities seam in PHP. A required capability that is not registered means the node cannot run at all.',
                ],

            'verified' => (bool) $package->verified,
            'verifiedNote' => $package->verified
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
}
