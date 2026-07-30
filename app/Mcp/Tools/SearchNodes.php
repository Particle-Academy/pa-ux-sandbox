<?php

namespace App\Mcp\Tools;

use App\Models\FlowNodePackage;
use App\Support\Registry\FirstPartyNodeSource;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Illuminate\Support\Str;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('Search fancy-flow MARKETPLACE nodes by concept before you build one. Ask this whenever a workflow needs a step you are about to hand-roll in app code ("upload to s3", "wait for approval", "route with an llm"). The expensive failure is not "could not install it" — it is not knowing a node existed and writing a worse version. Matches kind, title, description, and category. Core builtins are NOT listed: they ship with fancy-flow, so check the engine\'s own node kit too.')]
class SearchNodes extends Tool
{
    public function __construct(private readonly FirstPartyNodeSource $firstParty) {}

    public function handle(Request $request): Response
    {
        $query = Str::lower(trim((string) $request->get('query', '')));
        if ($query === '') {
            return Response::error('`query` is required.');
        }

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
                Str::lower(($entry['kind'] ?? '').' '.($entry['title'] ?? '').' '.($entry['description'] ?? '').' '.($entry['category'] ?? '')),
                $query,
            ))
            ->sortBy([['category', 'asc'], ['kind', 'asc']])
            ->values()
            ->all();

        return Response::json([
            'query' => $query,
            'count' => count($matches),
            'items' => $matches,
            // A miss must not read as "no such capability exists" — the core
            // kit is the far more likely place to find it today.
            'note' => $matches === []
                ? 'No marketplace node matched. Check fancy-flow\'s CORE builtins before hand-rolling one — triggers, branch/switch_case, merge, for_each, wait, transform, http, output, user_input, human_approval, subflow, llm_router and llm_call all ship with the engine.'
                : 'Install with: npx fancy-cli@latest add node <kind>',
        ]);
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'query' => $schema->string()
                ->description('A concept or name. Case-insensitive substring across kind, title, description, and category.')
                ->required(),
        ];
    }
}
