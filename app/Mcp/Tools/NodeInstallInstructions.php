<?php

namespace App\Mcp\Tools;

use App\Models\FlowNodePackage;
use App\Support\Registry\FirstPartyNodeSource;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Get the exact install command for a marketplace node, the suite packages its source needs, and the capability wiring to do afterwards. A node is VENDORED SOURCE, not a published package — it is copied into the project, once per runtime the project executes on, so there is nothing to `composer require` for the node itself. Its `dependencies` are a separate matter and those ARE real installs.')]
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

        // The built artifact wins for the MANIFEST; the row owns moderation.
        //
        // A row used to win outright, and it is a snapshot from whenever someone
        // last ran `flow:register-node` — while `flow:build` regenerates the
        // artifact from source. So a first-party node whose manifest gained a
        // field served the old one indefinitely, with nothing to indicate it:
        // the `fancyDependencies` these instructions read went missing exactly
        // that way. Third-party kinds have no artifact entry, so their row still
        // answers by absence.
        $manifest = $this->firstPartyManifest($kind) ?? $package?->manifest;
        if ($manifest === null) {
            return Response::error("No marketplace node with kind \"{$kind}\". Run search_nodes first.");
        }

        $name = $package?->name ?? ($manifest['name'] ?? $kind);
        $resolvedKind = $package?->kind ?? ($manifest['kind'] ?? $kind);
        $runtimes = is_array($manifest['runtimes'] ?? null) ? $manifest['runtimes'] : [];
        $commands = [];

        // A node is VENDORED SOURCE, not a published package: `fancy-cli add
        // node` copies its files into the project the way `add <component>`
        // copies a component's. This used to synthesize `composer require` /
        // `npm install` from the manifest name, which was the package model the
        // marketplace had already dropped — and `particle-academy/fancy-flow-nodes`
        // is not on Packagist, so the PHP command 404'd for every node an agent
        // asked about. The one command that works is the same for every runtime.
        foreach ($runtimes as $runtime => $spec) {
            $entry = is_array($spec) ? $spec : [];
            $commands[$runtime] = [
                'engine' => $entry['engine'] ?? null,
                'command' => "npx fancy-cli@latest add node {$resolvedKind} --backend=".($runtime === 'php' ? 'php' : 'js'),
                'lands' => 'Vendored into your project — the node is source you own, not a dependency.',
            ];
        }

        // Suite packages the node's SOURCE imports, which ARE ordinary installs.
        // Each names its own npm and/or Composer package, because the right
        // route depends on the runtime: `npm install` is the wrong answer in a
        // Laravel app that executes on PHP.
        $fancyDeps = is_array($manifest['fancyDependencies'] ?? null) ? $manifest['fancyDependencies'] : [];
        $dependencies = [];

        foreach ($fancyDeps as $dep) {
            if (! is_array($dep)) {
                continue;
            }

            $routes = [];
            if (is_string($dep['npm'] ?? null) && $dep['npm'] !== '') {
                $routes['js'] = 'npm install '.$dep['npm'];
            }
            if (is_string($dep['composer'] ?? null) && $dep['composer'] !== '') {
                $routes['php'] = 'composer require '.$dep['composer'];
            }

            $dependencies[] = [
                'package' => $dep['package'] ?? null,
                'requirement' => $dep['requirement'] ?? 'required',
                'reason' => $dep['reason'] ?? null,
                'install' => $routes,
            ];
        }

        $capabilities = is_array($manifest['capabilities'] ?? null) ? $manifest['capabilities'] : [];
        $required = array_keys(array_filter($capabilities, fn ($l) => $l === 'required'));

        return Response::json([
            'kind' => $resolvedKind,

            // The recommended path: it detects the runtime the project ACTUALLY
            // executes on and refuses a node that cannot run there.
            'recommended' => "npx fancy-cli@latest add node {$resolvedKind}",
            'recommendedWhy' => 'fancy-cli reads the project\'s real runtimes from package.json / composer.json and refuses a node that cannot run there. Vendoring by hand skips that check, and the node then appears in the palette and fails at run time — which looks like it worked.',

            'perRuntime' => $commands,
            'runtimeNote' => 'Nodes are vendored source, not published packages — there is nothing to `composer require` or `npm install` for the node itself. Vendor it for EVERY runtime the project executes on: a node vendored only for TS is invisible to a PHP runner and the graph fails at that node. Omit --backend to let fancy-cli detect it.',

            // Separate from the node itself: these ARE package installs.
            'dependencies' => $dependencies === [] ? null : $dependencies,
            'dependenciesNote' => $dependencies === []
                ? null
                : 'Suite packages this node\'s source imports. Install the route matching your runtime — the node is vendored, but these are not.',

            // Vendoring a node is not installing it. Until the host REGISTERS
            // the kind, the files are source in a directory: no palette entry,
            // and a graph naming the kind fails at run time. This used to say
            // only "wire the capabilities" — which is the step AFTER this one —
            // so an agent got the files and had nothing telling it what to do
            // with them. The Moic Suite integration hand-patched three separate
            // things before a vendored node ran.
            'afterVendoring' => [
                'php' => [
                    'composer dump-autoload — the executor is PSR-4 under your configured node namespace',
                    'php artisan flow:discover — reads the #[FlowNode] attribute and registers the kind',
                    "Bind the node's *Host class (beside the executor) in a service provider",
                    'The React kind under your components dir is for the EDITOR only and carries no executor: PHP runs the node, the browser draws it.',
                ],
                'ts' => [
                    'Import the RUNNABLE kind from the node\'s js/kind.ts — that is the surface with the executor attached',
                    'registerNodeKind(<name>RunnableKind) before the first run, or a graph naming the kind fails on an unknown kind',
                    'ui/kind.ts is the surface WITHOUT an executor — import it only when something else executes the node.',
                ],
            ],

            'wiring' => $required === []
                ? null
                : [
                    'requiredCapabilities' => $required,
                    'how' => 'Register these on the host AFTER the kind is registered — registerLlmClient() / registerWorkflowResolver() in TS, or the Capabilities seam in PHP. A required capability that is not registered means the node cannot run at all.',
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
