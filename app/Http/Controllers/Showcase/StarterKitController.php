<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class StarterKitController extends Controller
{
    /** @return array<int, array<string, string>> */
    public static function kits(): array
    {
        // Mirrors the design bundle's ui_kits/ folder.
        return [
            ['slug' => 'fancy-query', 'name' => 'Realtime Chat', 'pkg' => 'fancy-query', 'blurb' => 'Streaming chat on fancy-query useFancyStream — Echo events patch the cache in place (append + token-stream + reconcile), optimistic send, poll fallback.'],
            ['slug' => 'react-fancy', 'name' => 'React Dashboard', 'pkg' => 'react-fancy', 'blurb' => 'Generic dashboard built from Action, Card, Table, Sidebar, Tabs, Composer, Toast.'],
            ['slug' => 'fancy-flow', 'name' => 'Workflow Studio', 'pkg' => 'fancy-flow', 'blurb' => 'Node canvas + run feed + toolbar.'],
            ['slug' => 'fancy-whiteboard', 'name' => 'Collaborative Board', 'pkg' => 'fancy-whiteboard', 'blurb' => 'Pan-zoom canvas with draggable, editable sticky notes — the real fancy-whiteboard Board + StickyNote.'],
            ['slug' => 'fancy-code', 'name' => 'Embedded IDE', 'pkg' => 'fancy-code', 'blurb' => 'CodeEditor + TreeNav IDE layout.'],
            ['slug' => 'fancy-sheets', 'name' => 'Spreadsheet Studio', 'pkg' => 'fancy-sheets', 'blurb' => 'Multi-sheet workbook with formulas.'],
            ['slug' => 'fancy-echarts', 'name' => 'Charts Studio', 'pkg' => 'fancy-echarts', 'blurb' => 'Real ECharts in four cuts: trends, composition, hierarchy, flow. Stacked area, donut + bar, sunburst, sankey.'],
            ['slug' => 'shop-n-sub', 'name' => 'Shop-n-Sub', 'pkg' => 'catalog-fms', 'blurb' => 'A personal-Patreon creator app: membership tiers + per-tier perks (catalog + FMS), a members area where perks unlock live as you subscribe, a one-time shop, and a creator studio to configure tiers. Built on the catalog-fms UI block (PricingTable, FeatureMatrix, FeatureGate, PlanFeaturesEditor).'],
        ];
    }

    public function index(): Response
    {
        return Inertia::render('StarterKits/Index', ['kits' => self::kits()]);
    }

    public function show(string $slug): Response
    {
        $kit = collect(self::kits())->firstWhere('slug', $slug);
        abort_if($kit === null, 404);

        return Inertia::render('StarterKits/Show', ['kit' => $kit]);
    }

    /**
     * The same kit page, authored as a CMS document instead of as JSX — the
     * second beachhead surface for the Stages model.
     *
     * Kept as a separate route rather than replacing `show`, because the point
     * is the COMPARISON: both render from the same `$kit`, so a divergence
     * between them is visible side by side rather than only in a screenshot
     * diff nobody runs.
     */
    public function cmsShow(string $slug): Response
    {
        $kit = collect(self::kits())->firstWhere('slug', $slug);
        abort_if($kit === null, 404);

        return Inertia::render('StarterKits/CmsShow', ['kit' => $kit]);
    }
}
