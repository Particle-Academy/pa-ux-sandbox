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

#[Description('Browse the vendor SERVICES the fancy-flow connector catalogue covers — Stripe, Slack, Telegram, … — grouped by domain, with how many triggers and actions each has. This is step ONE of a two-step browse: pick a service here, then call list_nodes with `service: "<name>"` to see what that service can do. Connector nodes are hidden from list_nodes by default precisely so the core node vocabulary stays legible, and this is the door back to them.')]
class ListConnectorServices extends Tool
{
    public function __construct(private readonly FirstPartyNodeSource $firstParty) {}

    /**
     * IFTTT's first step, and the reason the catalogue can be large without
     * being unusable.
     *
     * A flat list of every connector node is the wrong unit for a person OR an
     * agent: nobody asks "which of these four hundred nodes do I want", they ask
     * "does this support Stripe". Answering the second question first is what
     * makes the size of the catalogue an asset rather than a cost.
     *
     * It reads the SAME union `list_nodes` does — database over compiled
     * artifact — because a service directory derived from a different source
     * than the node list is a directory that can promise a service whose nodes
     * do not resolve.
     */
    public function handle(Request $request): Response
    {
        $domain = trim((string) $request->get('domain', ''));

        $entries = FlowNodePackage::query()
            ->listed()
            ->get()
            ->map(fn (FlowNodePackage $p) => $p->toIndexEntry())
            ->concat($this->firstParty->indexEntries())
            ->unique('kind')
            ->values();

        $services = collect(ConnectorFacet::services($entries))
            ->when($domain !== '', fn ($rows) => $rows->where('domain', $domain))
            ->values()
            ->all();

        return Response::json([
            'count' => count($services),
            'services' => $services,
            'domains' => ConnectorFacet::DOMAINS,
            'note' => $services === []
                ? 'No vendor connector nodes are published yet. fancy-flow\'s core `api_request` node calls any '
                    .'HTTP API directly, and is the right answer until a connector exists for the service you need.'
                : 'Next: list_nodes with service: "<name>" for one vendor\'s triggers and actions. '
                    .'Install any of them with: npx fancy-cli@latest add node <kind>',
        ]);
    }

    /** @return array<string, JsonSchema> */
    public function schema(JsonSchema $schema): array
    {
        return [
            'domain' => $schema->string()
                ->description('Optional. Narrow to one domain — payments, messaging, crm, storage, … The full list comes back as `domains`.'),
        ];
    }
}
