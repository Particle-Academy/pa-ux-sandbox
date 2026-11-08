<?php

declare(strict_types=1);

namespace App\Support\Registry;

/**
 * The connectors as the /features/connectors pages show them: one card per
 * CONNECTOR, where {@see ConnectorSource::indexEntries()} has one row per
 * operation.
 *
 * Everything here is read from the same served index
 * (`resources/registry/connectors.json`, also `/r/connectors/index.json`), so
 * the page cannot claim an operation, a version or a setup step the catalogue
 * does not carry. The setup steps are the SHAPED ones from `entryFor()`, so the
 * wizard sees exactly what a host fetching the index sees.
 *
 * The one fact read from the raw connector rather than an entry is the list of
 * credential fields (`auth.credentials`): the setup page shows them when a
 * connector has no guided steps yet, and they are labels and help text, the
 * same text each connector's `-ui` package renders in its own credential form.
 */
final class ConnectorCatalogue
{
    public function __construct(private readonly ConnectorSource $source) {}

    /**
     * Every connector, sorted by title.
     *
     * @return list<array<string, mixed>>
     */
    public function all(): array
    {
        $entries = collect($this->source->indexEntries())->groupBy('service');

        $cards = [];
        foreach ($this->source->connectors() as $connector) {
            $slug = is_string($connector['slug'] ?? null) ? $connector['slug'] : str_replace('_', '-', (string) $connector['service']);
            $rows = $entries->get((string) $connector['service']);

            if ($rows === null || $rows->isEmpty()) {
                // No operation with a kind: nothing a host could install.
                continue;
            }

            $first = $rows->first();

            $cards[] = [
                'slug' => $slug,
                'service' => (string) $connector['service'],
                'title' => (string) $first['serviceTitle'],
                'domain' => (string) $first['domain'],
                'summary' => $first['summary'],
                'status' => $first['status'],
                'docs' => is_string($connector['docs'] ?? null) ? $connector['docs'] : null,
                'packages' => array_map(
                    static fn (array $p): array => [...$p, 'url' => self::registryUrl($p)],
                    $first['packages'],
                ),
                'operations' => $rows->map(static fn (array $e): array => [
                    'kind' => $e['kind'],
                    'title' => $e['title'],
                    'role' => $e['role'],
                    'verification' => $e['trigger']['verification'] ?? null,
                ])->values()->all(),
                'needsWebhookEndpoint' => (bool) $first['needsWebhookEndpoint'],
                'auth' => [
                    'kind' => $first['auth']['kind'] ?? null,
                    'grant' => $first['auth']['grant'] ?? null,
                    'restrictedScopes' => $first['auth']['restrictedScopes'] ?? null,
                    'authorizeUrl' => $first['auth']['authorizeUrl'] ?? null,
                ],
                'credentials' => self::credentialsOf($connector),
                'setup' => $first['setup'],
                'setupHref' => "/features/connectors/{$slug}/setup",
            ];
        }

        usort($cards, static fn (array $a, array $b): int => strcasecmp($a['title'], $b['title']));

        return $cards;
    }

    /** @return array<string, mixed>|null */
    public function find(string $slug): ?array
    {
        foreach ($this->all() as $card) {
            if ($card['slug'] === $slug) {
                return $card;
            }
        }

        return null;
    }

    /** @return list<string> */
    public function slugs(): array
    {
        return array_column($this->all(), 'slug');
    }

    /**
     * The credential fields a person fills in, as the connector declares them.
     *
     * @param  array<string, mixed>  $connector
     * @return list<array{key: string, label: string, secret: bool, optional: bool, help: ?string}>
     */
    private static function credentialsOf(array $connector): array
    {
        $out = [];
        foreach ((array) ($connector['auth']['credentials'] ?? []) as $field) {
            if (! is_array($field) || ! is_string($field['key'] ?? null)) {
                continue;
            }
            $out[] = [
                'key' => $field['key'],
                'label' => is_string($field['label'] ?? null) ? $field['label'] : $field['key'],
                'secret' => (bool) ($field['secret'] ?? false),
                'optional' => (bool) ($field['optional'] ?? false),
                'help' => is_string($field['help'] ?? null) ? $field['help'] : null,
            ];
        }

        return $out;
    }

    /** @param  array<string, mixed>  $package */
    private static function registryUrl(array $package): ?string
    {
        $name = (string) ($package['name'] ?? '');
        $version = (string) ($package['version'] ?? '');

        return match ($package['registry'] ?? null) {
            'npm' => "https://www.npmjs.com/package/{$name}".($version !== '' ? "/v/{$version}" : ''),
            'packagist' => "https://packagist.org/packages/{$name}",
            'pypi' => "https://pypi.org/project/{$name}/".($version !== '' ? "{$version}/" : ''),
            default => null,
        };
    }
}
