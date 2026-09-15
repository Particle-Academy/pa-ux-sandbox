<?php

namespace App\Support\Seo;

use App\Support\PackageRegistry;

/**
 * The facts the site states about the kit as a whole, derived from the
 * registry instead of typed into copy.
 *
 * Every one of these was once a hand-written literal, and every one went stale:
 * the home meta said "React, PHP, Node" and "every server capability ships for
 * both PHP and Node" while six Python packages were on PyPI and most PHP
 * packages had no Node twin; the JSON-LD and llms.txt said "version 0.2" after
 * the kit cut 0.5; the docs said "64 packages, 47 TypeScript and 16 PHP". A
 * number or a language list in a sentence is a claim nothing keeps true, so the
 * sentences read these instead.
 *
 * Only PUBLIC packages count: {@see PackageRegistry::all()} and
 * {@see PackageRegistry::companions()}, which already exclude hidden and
 * planned ones. Announcing a runtime nobody can install is worse than leaving
 * it out.
 */
final class KitFacts
{
    /** @return list<array<string, mixed>> */
    public static function packages(): array
    {
        return collect(PackageRegistry::all())
            ->concat(PackageRegistry::companions())
            ->unique('slug')
            ->values()
            ->all();
    }

    public static function packageCount(): int
    {
        return count(self::packages());
    }

    /**
     * The languages a consumer can build with, in the order a reader expects.
     *
     * React is the UI surface: a TypeScript package that renders. Node is the
     * headless TypeScript half. The two are separate because a PHP app uses the
     * first and not the second, and the site has always named them apart.
     *
     * @return list<string>
     */
    public static function languages(): array
    {
        $packages = collect(self::packages());
        $ts = $packages->where('ecosystem', 'ts');

        return array_values(array_keys(array_filter([
            'React' => $ts->contains(fn (array $p): bool => ($p['kind'] ?? null) !== 'headless'),
            'PHP' => $packages->contains('ecosystem', 'php'),
            'Node' => $ts->contains('kind', 'headless'),
            'Python' => $packages->contains('ecosystem', 'py'),
        ])));
    }

    /**
     * How many public packages are written in each language, largest first:
     * `['TypeScript' => 59, 'PHP' => 30, 'Python' => 6, 'polyglot' => 2]`.
     *
     * @return array<string, int>
     */
    public static function languageCounts(): array
    {
        return collect(self::packages())
            ->countBy(fn (array $p): string => str_starts_with((string) ($p['language'] ?? ''), 'Polyglot') ? 'polyglot' : (string) ($p['language'] ?? 'other'))
            ->sortDesc()
            ->all();
    }

    /**
     * The registries the kit publishes to.
     *
     * @return list<string>
     */
    public static function registries(): array
    {
        $packages = collect(self::packages());

        return array_values(array_keys(array_filter([
            'npm' => $packages->contains(fn (array $p): bool => ! empty($p['npm'])),
            'Packagist' => $packages->contains(fn (array $p): bool => ! empty($p['composer']) || ! empty($p['packagist'])),
            'PyPI' => $packages->contains(fn (array $p): bool => ! empty($p['pypi'])),
        ])));
    }

    /** The kit version, from kit.json -- never a package's version. */
    public static function kitVersion(): string
    {
        return (string) config('kit.version');
    }

    /**
     * A list as prose: "React, PHP, Node and Python".
     *
     * @param  list<string>  $items
     */
    public static function sentence(array $items): string
    {
        if (count($items) <= 1) {
            return implode('', $items);
        }

        return implode(', ', array_slice($items, 0, -1)).' and '.end($items);
    }
}
