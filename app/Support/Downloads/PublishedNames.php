<?php

namespace App\Support\Downloads;

use App\Support\PackageRegistry;

/**
 * Which registry names to ask for download counts, derived from
 * {@see PackageRegistry} so there is no second list to drift.
 *
 * The PUBLISHED name is what counts, and it is often not the slug:
 * `last-word-js` is `@particle-academy/last-word` on npm, `holy-sheet-py` is
 * `fancy-holy-sheet` on PyPI. Asking a registry for the slug returns a 404,
 * which would read as a package nobody downloads.
 *
 * A polyglot package yields one target per registry it publishes to. Hidden
 * (built but unpublished) packages yield none.
 */
final class PublishedNames
{
    public const NPM = 'npm';

    public const PACKAGIST = 'packagist';

    public const PYPI = 'pypi';

    /**
     * Every published package's targets, in registry order.
     *
     * @return list<array{slug: string, source: string, name: string}>
     */
    public static function targets(): array
    {
        $targets = [];
        foreach (PackageRegistry::everything() as $pkg) {
            if (PackageRegistry::isHidden((string) ($pkg['slug'] ?? ''))) {
                continue;
            }
            array_push($targets, ...self::for($pkg));
        }

        return $targets;
    }

    /**
     * The slugs whose counts make up the kit.
     *
     * @return list<string>
     */
    public static function slugs(): array
    {
        return array_values(array_unique(array_column(self::targets(), 'slug')));
    }

    /**
     * One registry entry's targets.
     *
     * `packagist` alone is a real Packagist name (the starter kit carries it
     * without `composer`), so it is read as a fallback, exactly as `kit:status`
     * reads it.
     *
     * @param  array<string, mixed>  $pkg
     * @return list<array{slug: string, source: string, name: string}>
     */
    public static function for(array $pkg): array
    {
        $slug = (string) $pkg['slug'];
        $names = [
            self::NPM => $pkg['npm'] ?? null,
            self::PACKAGIST => $pkg['composer'] ?? $pkg['packagist'] ?? null,
            self::PYPI => $pkg['pypi'] ?? null,
        ];

        $targets = [];
        foreach ($names as $source => $name) {
            if (is_string($name) && $name !== '') {
                $targets[] = ['slug' => $slug, 'source' => $source, 'name' => $name];
            }
        }

        return $targets;
    }
}
