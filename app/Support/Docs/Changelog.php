<?php

namespace App\Support\Docs;

use App\Http\Controllers\Showcase\DocsController;
use App\Support\PackageRegistry;

/**
 * Generates the changelog page's package index straight from
 * {@see PackageRegistry}, so it never drifts out of sync with the suite. The
 * prose around it lives in resources/docs/changelog.md with a
 * {@see PLACEHOLDER} marker that {@see DocsController}
 * swaps for {@see tables()}.
 */
class Changelog
{
    /** Marker in changelog.md replaced by the generated tables. */
    public const PLACEHOLDER = '<!--PACKAGES-->';

    /**
     * Packages that live in the main grid (they ship UI components) but are
     * really Service/Tool layer — so the two-family split matches the docs.
     */
    private const SERVICE_IN_GRID = ['agent-integrations', 'fancy-inertia', 'fancy-pixel'];

    /** Build the two markdown tables (UI + Service & Tool), registry-driven. */
    public static function tables(): string
    {
        $ui = [];
        $service = [];

        foreach (PackageRegistry::all() as $pkg) {
            if (in_array($pkg['slug'], self::SERVICE_IN_GRID, true)) {
                $service[] = $pkg;
            } else {
                $ui[] = $pkg;
            }
        }
        foreach (PackageRegistry::companions() as $pkg) {
            $service[] = $pkg;
        }

        return self::table('UI packages', $ui)."\n".self::table('Service & Tool packages', $service);
    }

    /**
     * @param  array<int, array<string, mixed>>  $packages
     */
    private static function table(string $heading, array $packages): string
    {
        $rows = '';
        foreach ($packages as $pkg) {
            $slug = $pkg['slug'];
            $lang = $pkg['language'] ?? '';
            $repo = $pkg['repo'] ?? null;
            $notes = $repo ? "[Releases](https://github.com/{$repo}/releases)" : '—';
            $rows .= "| `{$slug}` | {$lang} | {$notes} |\n";
        }

        return "## {$heading}\n\n| Package | Language | Release notes |\n|---|---|---|\n{$rows}";
    }
}
