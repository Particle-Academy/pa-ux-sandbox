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
            ['slug' => 'react-fancy', 'name' => 'React Dashboard', 'pkg' => 'react-fancy', 'blurb' => 'Generic dashboard built from Action, Card, Table, Sidebar, Tabs, Composer, Toast.'],
            ['slug' => 'fancy-flow', 'name' => 'Workflow Studio', 'pkg' => 'fancy-flow', 'blurb' => 'Node canvas + run feed + toolbar.'],
            ['slug' => 'fancy-whiteboard', 'name' => 'Collaborative Board', 'pkg' => 'fancy-whiteboard', 'blurb' => 'Sticky notes with agent cursor + activity panel.'],
            ['slug' => 'fancy-code', 'name' => 'Embedded IDE', 'pkg' => 'fancy-code', 'blurb' => 'CodeEditor + TreeNav IDE layout.'],
            ['slug' => 'fancy-sheets', 'name' => 'Spreadsheet Studio', 'pkg' => 'fancy-sheets', 'blurb' => 'Multi-sheet workbook with formulas.'],
            ['slug' => 'fancy-echarts', 'name' => 'Charts Studio', 'pkg' => 'fancy-echarts', 'blurb' => 'Real ECharts in four cuts: trends, composition, hierarchy, flow. Stacked area, donut + bar, sunburst, sankey.'],
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
}
