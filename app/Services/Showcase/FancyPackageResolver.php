<?php

namespace App\Services\Showcase;

use App\Support\PackageRegistry;

/**
 * Turns raw Fancy package references detected during verification (npm
 * `@particle-academy/x`, Composer `particle-academy/x`) into a normalized,
 * de-duplicated list LINKED to the package registry — the structured
 * "which packages does this verified project use" record. Unknown references
 * are kept (as evidence) but carry no registry link.
 */
class FancyPackageResolver
{
    /**
     * Extract canonical package names from free text (HTML, source, manifests).
     *
     * @return list<string>
     */
    public function extractFromText(string $text): array
    {
        $names = [];

        if (preg_match_all('/@particle-academy\/([a-z0-9][a-z0-9._-]*)/i', $text, $m)) {
            foreach ($m[1] as $pkg) {
                $names[] = '@particle-academy/'.strtolower($pkg);
            }
        }

        // Composer / bare form — the lookbehind keeps the npm form from
        // double-matching as its own substring.
        if (preg_match_all('/(?<!@)\bparticle-academy\/([a-z0-9][a-z0-9._-]*)/i', $text, $m)) {
            foreach ($m[1] as $pkg) {
                $names[] = 'particle-academy/'.strtolower($pkg);
            }
        }

        return array_values(array_unique($names));
    }

    /**
     * Normalize + registry-link a set of detected names. Both forms of the
     * same registry package merge into one entry.
     *
     * @param  list<string>  $names
     * @return list<array{name: string, slug: ?string, registry_url: ?string}>
     */
    public function resolve(array $names): array
    {
        $index = $this->registryIndex();

        $linked = [];
        $unknown = [];
        foreach (array_unique($names) as $name) {
            $key = strtolower(trim((string) $name));
            if ($key === '') {
                continue;
            }

            $slug = $index[$key] ?? null;
            if ($slug !== null) {
                // First detected form wins as the display name for that slug.
                $linked[$slug] ??= [
                    'name' => $key,
                    'slug' => $slug,
                    'registry_url' => url('/packages/'.$slug),
                ];
            } else {
                $unknown[$key] = ['name' => $key, 'slug' => null, 'registry_url' => null];
            }
        }

        return array_values([...$linked, ...$unknown]);
    }

    /**
     * npm / packagist name → registry slug, across the UI grid packages and the
     * headless companions.
     *
     * @return array<string, string>
     */
    private function registryIndex(): array
    {
        $index = [];
        foreach ([...PackageRegistry::all(), ...PackageRegistry::companions()] as $pkg) {
            $slug = $pkg['slug'] ?? null;
            if (! is_string($slug) || $slug === '') {
                continue;
            }
            foreach (['npm', 'packagist'] as $field) {
                $name = $pkg[$field] ?? null;
                if (is_string($name) && $name !== '') {
                    $index[strtolower($name)] = $slug;
                }
            }
        }

        return $index;
    }
}
