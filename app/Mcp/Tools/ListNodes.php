<?php

namespace App\Mcp\Tools;

use App\Models\FlowNodePackage;
use App\Support\Registry\ConnectorFacet;
use App\Support\Registry\FirstPartyNodeSource;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Mcp\Request;
use Laravel\Mcp\Response;
use Laravel\Mcp\Server\Attributes\Description;
use Laravel\Mcp\Server\Tool;

#[Description('List every published fancy-flow MARKETPLACE node package, grouped by category. These are installable third-party nodes — fancy-flow\'s ~25 core builtins are NOT here, because they ship with the engine and need no installation. Each entry shows which runtimes it implements (ts / php): a node that does not implement the runtime the project executes on cannot run there. VENDOR CONNECTOR nodes (Stripe, Slack, …) are EXCLUDED by default so the core vocabulary is legible — the response tells you how many were hidden and which services they belong to. Pass `service` to see one vendor\'s nodes, or `connectors: "include"` / `"only"`.')]
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
     *
     * ## The connector filter, and the lesson it inherits
     *
     * Connectors are excluded by DEFAULT, because a vendor catalogue is
     * unbounded and the core vocabulary is twenty-seven kinds: unfiltered, the
     * thing an author actually needs is buried under four hundred rows.
     *
     * But a filter that silently shortens a list is the same defect as an empty
     * registry — the caller has no reason to suspect anything was withheld. So
     * the response ALWAYS reports how many connectors were hidden and lists the
     * services they belong to. That is what makes the two-step narrowing (pick a
     * service, then pick what about it) discoverable rather than documented.
     */
    public function handle(Request $request): Response
    {
        $runtime = (string) $request->get('runtime', '');
        $connectors = (string) $request->get('connectors', 'exclude');
        $service = trim((string) $request->get('service', ''));

        $all = FlowNodePackage::query()
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
            ->values();

        $items = ConnectorFacet::filter($all, $connectors, $service === '' ? null : $service)
            ->sortBy([['category', 'asc'], ['kind', 'asc']])
            ->values()
            ->all();

        $hidden = $all->count() - count($items);

        return Response::json(array_filter([
            'count' => count($items),
            'items' => $items,
            // Said explicitly, because an empty list otherwise reads as a
            // broken tool rather than an empty marketplace.
            'note' => $this->note($items, $hidden, $connectors, $service),
            // Only when something was actually withheld — a services directory
            // on a response that hid nothing is noise.
            'connectorsHidden' => $hidden > 0 ? $hidden : null,
            'services' => $hidden > 0 ? ConnectorFacet::services($all) : null,
        ], fn ($value) => $value !== null));
    }

    /** @param list<array<string,mixed>> $items */
    private function note(array $items, int $hidden, string $connectors, string $service): string
    {
        if ($items === [] && $service !== '') {
            return "No marketplace node is published for the \"{$service}\" service. "
                .'Call list_connector_services to see which services have nodes.';
        }

        if ($items === []) {
            return 'No marketplace nodes are published yet. fancy-flow\'s core builtins ship with the engine '
                .'and are not listed here — use them directly rather than installing anything.';
        }

        $install = 'Install with: npx fancy-cli@latest add node <kind>';

        if ($hidden > 0 && $connectors === 'exclude' && $service === '') {
            return $install." — {$hidden} vendor connector node(s) were hidden so the core vocabulary stays legible. "
                .'They are listed by service under `services`; pass `service: "<name>"` for one vendor, '
                .'or `connectors: "include"` for everything.';
        }

        return $install;
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'runtime' => $schema->string()
                ->description('Optional. Only return nodes implementing this runtime ("ts" or "php"). Use it when the project executes on one of them, so you do not suggest a node that cannot run there.'),
            'connectors' => $schema->string()
                ->description('How to treat vendor connector nodes: "exclude" (default — keeps the core vocabulary legible), "include" (everything), or "only" (just the connectors). The response always says how many were hidden.'),
            'service' => $schema->string()
                ->description('Narrow to one vendor service ("stripe", "slack"). Implies connectors: "only" for that service. This is the second step of the two-step browse — call list_connector_services first to see what exists.'),
        ];
    }
}
