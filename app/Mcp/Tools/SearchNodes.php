<?php

namespace App\Mcp\Tools;

use App\Models\FlowNodePackage;
use App\Support\Registry\ConnectorFacet;
use App\Support\Registry\FirstPartyNodeSource;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Str;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Search fancy-flow MARKETPLACE nodes by concept before you build one. Ask this whenever a workflow needs a step you are about to hand-roll in app code ("upload to s3", "wait for approval", "route with an llm"). The expensive failure is not "could not install it" — it is not knowing a node existed and writing a worse version. Matches kind, title, description, category and vendor service. Core builtins are NOT listed: they ship with fancy-flow, so check the engine\'s own node kit too. VENDOR CONNECTOR nodes are excluded by default, but a matching count is ALWAYS reported so a search never dead-ends — pass `connectors: "include"` to see them.')]
class SearchNodes extends Tool
{
    public function __construct(private readonly FirstPartyNodeSource $firstParty) {}

    public function handle(Request $request): Response
    {
        $query = Str::lower(trim((string) $request->get('query', '')));
        if ($query === '') {
            return Response::error('`query` is required.');
        }

        $connectors = (string) $request->get('connectors', 'exclude');

        // Database UNION compiled artifact — see ListNodes. Searching the
        // database alone meant every first-party node was unfindable through
        // the MCP, which is the surface an agent actually searches.
        $matches = FlowNodePackage::query()
            ->listed()
            ->get()
            ->map(fn (FlowNodePackage $p) => $p->toIndexEntry())
            ->concat($this->firstParty->indexEntries())
            ->unique('kind')
            ->filter(fn (array $entry) => Str::contains(
                Str::lower(implode(' ', [
                    $entry['kind'] ?? '',
                    $entry['title'] ?? '',
                    $entry['description'] ?? '',
                    $entry['category'] ?? '',
                    // Searching the service name is what makes "stripe" a
                    // useful query. Without it the two-step browse would be the
                    // only way to reach a connector, and nobody types a browse.
                    $entry['service'] ?? '',
                    $entry['serviceTitle'] ?? '',
                ])),
                $query,
            ))
            ->values();

        $items = ConnectorFacet::filter($matches, $connectors)
            ->sortBy([['category', 'asc'], ['kind', 'asc']])
            ->values()
            ->all();

        $hiddenConnectors = $matches->count() - count($items);

        return Response::json(array_filter([
            'query' => $query,
            'count' => count($items),
            'items' => $items,
            'note' => $this->note($items, $hiddenConnectors),
            // The count is reported even when it is the ONLY thing that
            // matched. A search that hid every result and said "no match" would
            // be worse than no filter at all — it would teach an agent the
            // capability does not exist.
            'connectorMatches' => $hiddenConnectors > 0 ? $hiddenConnectors : null,
            'connectorServices' => $hiddenConnectors > 0
                ? collect(ConnectorFacet::services($matches))->pluck('service')->all()
                : null,
        ], fn ($value) => $value !== null));
    }

    /** @param list<array<string,mixed>> $items */
    private function note(array $items, int $hiddenConnectors): string
    {
        if ($hiddenConnectors > 0 && $items === []) {
            return "No core marketplace node matched, but {$hiddenConnectors} VENDOR CONNECTOR node(s) did — "
                .'they are hidden by default. Pass `connectors: "include"` to see them.';
        }

        if ($hiddenConnectors > 0) {
            return 'Install with: npx fancy-cli@latest add node <kind>'
                ." — {$hiddenConnectors} vendor connector node(s) also matched and are hidden by default; "
                .'pass `connectors: "include"` to see them.';
        }

        // A miss must not read as "no such capability exists" — the core kit is
        // the far more likely place to find it today.
        return $items === []
            ? 'No marketplace node matched. Check fancy-flow\'s CORE builtins before hand-rolling one — '
                .'triggers, branch/switch_case, merge, for_each, wait, transform, http, output, user_input, '
                .'human_approval, subflow, llm_router and llm_call all ship with the engine.'
            : 'Install with: npx fancy-cli@latest add node <kind>';
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'query' => $schema->string()
                ->description('A concept or name. Case-insensitive substring across kind, title, description, category and vendor service.')
                ->required(),
            'connectors' => $schema->string()
                ->description('How to treat vendor connector nodes: "exclude" (default), "include", or "only". A matching count is reported either way, so a search never dead-ends.'),
        ];
    }
}
