<?php

namespace App\Support\Docs;

use App\Console\Commands\SnapshotDocs;
use Illuminate\Support\Facades\File;

/**
 * Docs for kit versions other than the current one.
 *
 * A snapshot is a directory — `resources/docs/0.4/` — holding that version's
 * markdown plus a `manifest.json` describing its sidebar. The manifest is the
 * part that matters: without it an old version would be rendered through the
 * CURRENT sidebar, so a reader on 0.4 would see links to pages that did not
 * exist in 0.4, each 404ing or silently falling through to a newer page. The
 * snapshot has to carry its own table of contents to be a snapshot at all.
 *
 * Snapshots are frozen on purpose. The software a maintenance line describes
 * has stopped changing, so its docs should too — but the directory is committed
 * source, so a genuine error in an old page can still be corrected.
 *
 * {@see SnapshotDocs} writes them.
 */
class DocsArchive
{
    public const MANIFEST = 'manifest.json';

    /** The current line — served from `resources/docs/` with no version prefix. */
    public static function current(): string
    {
        return (string) config('kit.version');
    }

    /** Snapshotted versions, newest first. Excludes the current one. */
    public static function versions(): array
    {
        $root = base_path('resources/docs');

        if (! File::isDirectory($root)) {
            return [];
        }

        return collect(File::directories($root))
            ->map(fn (string $dir): string => basename($dir))
            ->filter(fn (string $name): bool => (bool) preg_match('/^\d+\.\d+$/', $name))
            ->filter(fn (string $name): bool => File::exists(self::manifestPath($name)))
            ->sortByDesc(fn (string $name): string => $name, SORT_NATURAL)
            ->values()
            ->all();
    }

    /**
     * Every version the selector should offer, newest first, current one first.
     *
     * @return list<array{version: string, current: bool, supported: bool}>
     */
    public static function selectable(): array
    {
        $supported = collect(SupportPolicy::supported())->pluck('version')->all();

        return collect([self::current(), ...self::versions()])
            ->unique()
            ->map(fn (string $version): array => [
                'version' => $version,
                'current' => $version === self::current(),
                // An EOL line still has readable docs — people land on them from
                // search for years. It is labelled, not hidden.
                'supported' => in_array($version, $supported, true),
            ])
            ->values()
            ->all();
    }

    public static function exists(string $version): bool
    {
        return in_array($version, self::versions(), true);
    }

    /** That version's sidebar, in the shape `DocsRegistry::sections()` returns. */
    public static function sections(string $version): array
    {
        if (! self::exists($version)) {
            return [];
        }

        return json_decode((string) File::get(self::manifestPath($version)), true)['sections'] ?? [];
    }

    /** @return list<array{slug: string, title: string, description?: string, section: string}> */
    public static function flat(string $version): array
    {
        $flat = [];
        foreach (self::sections($version) as $section) {
            foreach ($section['pages'] as $page) {
                $flat[] = $page + ['section' => $section['label']];
            }
        }

        return $flat;
    }

    /** @return array{slug: string, title: string, description?: string, section: string}|null */
    public static function find(string $version, string $slug): ?array
    {
        foreach (self::flat($version) as $page) {
            if ($page['slug'] === $slug) {
                return $page;
            }
        }

        return null;
    }

    /** @return array{prev: array{slug: string, title: string}|null, next: array{slug: string, title: string}|null} */
    public static function neighbors(string $version, string $slug): array
    {
        $flat = self::flat($version);
        $index = null;
        foreach ($flat as $i => $page) {
            if ($page['slug'] === $slug) {
                $index = $i;
                break;
            }
        }

        if ($index === null) {
            return ['prev' => null, 'next' => null];
        }

        return [
            'prev' => $index > 0 ? ['slug' => $flat[$index - 1]['slug'], 'title' => $flat[$index - 1]['title']] : null,
            'next' => isset($flat[$index + 1]) ? ['slug' => $flat[$index + 1]['slug'], 'title' => $flat[$index + 1]['title']] : null,
        ];
    }

    public static function markdownPath(string $version, string $slug): string
    {
        return base_path("resources/docs/$version/$slug.md");
    }

    public static function manifestPath(string $version): string
    {
        return base_path("resources/docs/$version/".self::MANIFEST);
    }
}
