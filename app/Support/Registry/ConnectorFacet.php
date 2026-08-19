<?php

namespace App\Support\Registry;

use Illuminate\Support\Collection;

/**
 * The connector facet of a node — service, domain, role — read off its manifest.
 *
 * ## Why this is not the node's `category`
 *
 * fancy-flow's `category` says what a node does to the GRAPH: a trigger starts
 * a run, an `io` node reaches outside, a `logic` node decides shape. The palette
 * groups by it and the engine's own taxonomy is fixed
 * (`trigger|logic|data|ai|io|human|output|layout|annotation|custom`).
 *
 * Connector-ness is a different axis entirely. A Stripe webhook trigger is a
 * `trigger` AND a connector; a Stripe charge is `io` AND a connector. Folding
 * one into the other would make "show me the triggers" and "hide the connectors"
 * impossible to ask at the same time — and hiding connectors is the whole
 * reason this exists, because a catalogue of hundreds of vendor nodes drowns a
 * core vocabulary of twenty-seven.
 *
 * So the facet is carried separately, and the listing tools filter on it.
 *
 * ## Why a manifest may simply declare it
 *
 * `FancyFlow\Marketplace\NodeManifest` validates known keys and ignores the
 * rest, so `connector` is additive: an engine that has never heard of it loads
 * these manifests unchanged, and a node that omits it is exactly what it was
 * before. Nothing had to ship in fancy-flow for this to work, which is the
 * property you want in a registry field.
 */
class ConnectorFacet
{
    /** Domains the catalogue is grouped by. Mirrors `_connector/ui/connector.ts`. */
    public const DOMAINS = [
        'payments' => 'Payments',
        'commerce' => 'Commerce',
        'messaging' => 'Chat & messaging',
        'email' => 'Email & SMS',
        'crm' => 'CRM',
        'support' => 'Support & issues',
        'storage' => 'Files & storage',
        'calendar' => 'Calendar',
        'productivity' => 'Productivity',
        'database' => 'Databases',
        'devtools' => 'Developer tooling',
        'analytics' => 'Analytics',
        'marketing' => 'Marketing & social',
        'ai' => 'AI services',
        'forms' => 'Forms & documents',
        'hr' => 'HR',
        'geo' => 'Maps & geo',
    ];

    /** What a connector node does in the graph — IFTTT's "this" versus "that". */
    public const ROLES = ['trigger', 'action', 'search'];

    /**
     * The index fields a manifest's `connector` block contributes.
     *
     * Returns an EMPTY array for a non-connector, so existing entries are
     * unchanged byte for byte. A payload that gained `"connector": false` on
     * every core node would be a wire change for no gain, and the absence of a
     * key is already the honest way to say "this is not one".
     *
     * @param  array<string,mixed>  $manifest
     * @return array<string,mixed>
     */
    public static function from(array $manifest): array
    {
        $connector = $manifest['connector'] ?? null;

        if (! is_array($connector) || ! is_string($connector['service'] ?? null)) {
            return [];
        }

        $domain = (string) ($connector['domain'] ?? '');
        $role = (string) ($connector['role'] ?? 'action');

        return [
            'connector' => true,
            'service' => $connector['service'],
            'serviceTitle' => (string) ($connector['serviceTitle'] ?? $connector['service']),
            'domain' => array_key_exists($domain, self::DOMAINS) ? $domain : 'other',
            'role' => in_array($role, self::ROLES, true) ? $role : 'action',
        ];
    }

    /** True when an index entry is a connector node. */
    public static function isConnector(array $entry): bool
    {
        return ($entry['connector'] ?? false) === true;
    }

    /**
     * Apply the connector filter to a set of index entries.
     *
     * `$connectors` is one of `exclude` (the default everywhere a human or an
     * agent browses), `include`, or `only`. Naming a `$service` narrows to that
     * service and implies `only` — asking for Stripe is not an ambiguous
     * request.
     *
     * @param  Collection<int,array<string,mixed>>  $entries
     * @return Collection<int,array<string,mixed>>
     */
    public static function filter(
        Collection $entries,
        string $connectors = 'exclude',
        ?string $service = null,
    ): Collection {
        $service = $service === null ? null : trim(strtolower($service));

        if ($service !== null && $service !== '') {
            return $entries->filter(
                fn (array $entry) => strtolower((string) ($entry['service'] ?? '')) === $service,
            )->values();
        }

        return match ($connectors) {
            'only' => $entries->filter(fn (array $e) => self::isConnector($e))->values(),
            'include' => $entries->values(),
            default => $entries->reject(fn (array $e) => self::isConnector($e))->values(),
        };
    }

    /**
     * The service directory — IFTTT's first step, "pick a service".
     *
     * Returned alongside a filtered listing so the two-step narrowing is
     * DISCOVERABLE rather than documented. An agent that asked for nodes and got
     * a short list plus "and 240 connector nodes across 38 services, here they
     * are by name" can take the second step; one that got a silently shortened
     * list cannot, and has no reason to suspect there was one.
     *
     * @param  Collection<int,array<string,mixed>>  $entries
     * @return list<array<string,mixed>>
     */
    public static function services(Collection $entries): array
    {
        return $entries
            ->filter(fn (array $e) => self::isConnector($e))
            ->groupBy('service')
            ->map(fn ($group, $service) => [
                'service' => (string) $service,
                'title' => (string) ($group->first()['serviceTitle'] ?? $service),
                'domain' => (string) ($group->first()['domain'] ?? 'other'),
                'nodes' => $group->count(),
                'triggers' => $group->where('role', 'trigger')->count(),
                'actions' => $group->where('role', 'action')->count(),
            ])
            ->sortBy([['domain', 'asc'], ['service', 'asc']])
            ->values()
            ->all();
    }
}
