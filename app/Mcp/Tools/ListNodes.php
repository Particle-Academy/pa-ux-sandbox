<?php

namespace App\Mcp\Tools;

use App\Models\FlowNodePackage;
use App\Support\Registry\FirstPartyNodeSource;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('List every published fancy-flow MARKETPLACE node package, grouped by category. These are installable third-party nodes — fancy-flow\'s ~25 core builtins are NOT here, because they ship with the engine and need no installation. Each entry shows which runtimes it implements (ts / php): a node that does not implement the runtime the project executes on cannot run there.')]
class ListNodes extends Tool
{
    public function __construct(private readonly FirstPartyNodeSource $firstParty) {}

    /**
     * Database UNION compiled artifact — the same source `/r/nodes/index.json`
     * serves, and for the same reason.
     *
     * This tool read the database ALONE. `FlowNodePackage` rows are written by
     * `flow:register-node`, which is for third-party submissions and was never
     * run against production — so the MCP answered "No marketplace nodes are
     * published yet" while the HTTP registry served eight and `fancy-cli add
     * node` installed them without complaint.
     *
     * That is the worse half of the bug this pattern already exists to fix: the
     * MCP is how an AGENT discovers nodes, so an agent was told the marketplace
     * was empty and would never look again. An empty list is a valid answer,
     * which is exactly why nothing reported it.
     */
    public function handle(Request $request): Response
    {
        $runtime = (string) $request->get('runtime', '');

        $items = FlowNodePackage::query()
            ->listed()
            ->get()
            ->map(fn (FlowNodePackage $p) => $p->toIndexEntry())
            // The database wins a kind collision: a moderator's decision has to
            // beat a build artifact, or moderation means nothing.
            ->concat($this->firstParty->indexEntries())
            ->unique('kind')
            // Filter in PHP rather than SQL: `runtimes` is a JSON column, the
            // artifact is not in the database at all, and a portable
            // containment query is not worth it for a list this small.
            ->when($runtime !== '', fn ($rows) => $rows->filter(
                fn (array $entry) => in_array($runtime, $entry['runtimes'] ?? [], true),
            ))
            ->sortBy([['category', 'asc'], ['kind', 'asc']])
            ->values()
            ->all();

        return Response::json([
            'count' => count($items),
            'items' => $items,
            // Said explicitly, because an empty list otherwise reads as a
            // broken tool rather than an empty marketplace.
            'note' => $items === []
                ? 'No marketplace nodes are published yet. fancy-flow\'s core builtins ship with the engine and are not listed here — use them directly rather than installing anything.'
                : 'Install with: npx fancy-cli@latest add node <kind>',
        ]);
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'runtime' => $schema->string()
                ->description('Optional. Only return nodes implementing this runtime ("ts" or "php"). Use it when the project executes on one of them, so you do not suggest a node that cannot run there.'),
        ];
    }
}
