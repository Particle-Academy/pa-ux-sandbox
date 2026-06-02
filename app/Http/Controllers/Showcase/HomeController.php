<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use App\Support\PackageRegistry;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    /**
     * PHP document writers — part of the suite, but not UI. They live in the
     * companion-packages footnote on the homepage rather than the main UI grid.
     * Still registered in PackageRegistry::all(), so their detail pages + docs
     * keep working.
     */
    private const NON_UI = ['holy-sheet', 'dark-slide'];

    public function __invoke(): Response
    {
        return Inertia::render('Home', $this->props());
    }

    /**
     * The Home page payload — package grid, Composer companions, and the total
     * component count. Exposed so the CMS demo (`/cms/home`) can re-author the
     * exact same page from the exact same data.
     *
     * @return array{packages: array<int, array<string, mixed>>, companions: array<int, array<string, mixed>>, total_components: int}
     */
    public function props(): array
    {
        $all = collect(PackageRegistry::all());

        $packages = $all
            ->reject(fn (array $p) => in_array($p['slug'], self::NON_UI, true))
            ->map(fn (array $p) => [
                'slug' => $p['slug'],
                'name' => $p['name'],
                'tagline' => $p['tagline'],
                'language' => $p['language'],
                'components_count' => count($p['components'] ?? []),
                'glyph' => $this->glyphFor($p['slug']),
                'install' => $p['npm'] ?? $p['composer'] ?? $p['name'],
                'kind' => isset($p['npm']) ? 'npm' : 'composer',
            ])
            ->values()
            ->all();

        // The PHP doc writers lead the companion list (suite packages), then the
        // sandbox's own Composer infra packages.
        $writers = $all
            ->filter(fn (array $p) => in_array($p['slug'], self::NON_UI, true))
            ->map(fn (array $p) => [
                'slug' => $p['slug'],
                'name' => $p['name'],
                'tagline' => $p['tagline'],
                'composer' => $p['composer'],
                'language' => $p['language'],
            ]);

        $companions = $writers
            ->concat(collect(PackageRegistry::companions())->map(fn (array $c) => [
                'slug' => $c['slug'],
                'name' => $c['name'],
                'tagline' => $c['tagline'],
                'composer' => $c['composer'],
                'language' => $c['language'],
            ]))
            ->values()
            ->all();

        return [
            'packages' => $packages,
            'companions' => $companions,
            'total_components' => $all
                ->reject(fn (array $p) => in_array($p['slug'], self::NON_UI, true))
                ->sum(fn (array $p) => count($p['components'] ?? [])),
        ];
    }

    /**
     * A short monospace glyph badge for the package grid, derived from the slug.
     * Editorial touch — mirrors the reference design's two-character package marks.
     */
    private function glyphFor(string $slug): string
    {
        return match ($slug) {
            'react-fancy' => 'rF',
            'fancy-whiteboard' => 'Wb',
            'fancy-artboard' => 'Ab',
            'fancy-flow' => '→',
            'fancy-sheets' => 'fx',
            'fancy-slides' => '▶',
            'fancy-code' => '{ }',
            'fancy-echarts' => '∿',
            'fancy-screens' => '▦',
            'fancy-3d' => '3D',
            'fancy-3d-babylon' => 'bJ',
            'agent-integrations' => 'mcp',
            'fancy-inertia' => 'iN',
            'holy-sheet' => 'xls',
            'dark-slide' => 'ppt',
            default => strtoupper(substr($slug, 0, 2)),
        };
    }
}
