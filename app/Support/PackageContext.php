<?php

namespace App\Support;

/**
 * Editorial Why / What / How for each *package* detail page — the package-level
 * sibling of {@see ComponentContext}. Hand-curated entries live in
 * {@see ENTRIES}; a generated JSON sidecar (written by the docs workflow) fills
 * the rest. Hand-curated always wins on a key collision.
 *
 * Why  — the gap in the ecosystem this package fills; why you&apos;d reach for it.
 * What — the shape of the package: its primitives, its contract, its surface.
 * How  — install + the smallest "first render" so a reader can start.
 *
 * Keyed by package slug.
 */
class PackageContext
{
    /** @var array<string, array{why: string, what: string, how: string}> */
    private const ENTRIES = [];

    /**
     * @var array<string, array{why: string, what: string, how: string}>|null
     */
    private static ?array $generated = null;

    /** @return array{why: string, what: string, how: string}|null */
    public static function find(string $packageSlug): ?array
    {
        return self::ENTRIES[$packageSlug] ?? self::generated()[$packageSlug] ?? null;
    }

    /**
     * Lazily load + cache the generated entries from the JSON sidecar.
     *
     * @return array<string, array{why: string, what: string, how: string}>
     */
    private static function generated(): array
    {
        if (self::$generated !== null) {
            return self::$generated;
        }

        $path = resource_path('data/package-context.json');
        if (! is_file($path)) {
            return self::$generated = [];
        }

        $decoded = json_decode((string) file_get_contents($path), true);

        return self::$generated = is_array($decoded) ? $decoded : [];
    }
}
