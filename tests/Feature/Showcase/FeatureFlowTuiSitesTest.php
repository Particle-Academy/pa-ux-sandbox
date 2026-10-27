<?php

use Illuminate\Testing\TestResponse;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The Flow and TUI Feature micro-sites (Phase B, .ai/plans/features-microsites.md).
 *
 * The page props come from Inertia and are asserted as Inertia sends them. The
 * page BODIES are React, which a PHP test cannot render, so the second half
 * reads the page source for the kit pieces every micro-site owes (a live demo
 * in a DemoFrame, a FeatureTour, a FeatureCta) and for the claims the tour
 * makes. Each of those claims is pinned here so a rewrite that drops one is a
 * red test, not a quieter page.
 */

/** The Inertia page object an initial (HTML) visit carries. */
function flowTuiPage(TestResponse $response): array
{
    preg_match('#<script data-page="app" type="application/json">(.*?)</script>#s', (string) $response->getContent(), $page);

    return json_decode($page[1] ?? '{}', true) ?? [];
}

/** Every .ts/.tsx file under a page folder, concatenated. */
function flowTuiSource(string $folder): string
{
    $out = '';
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(resource_path("js/Pages/{$folder}"), FilesystemIterator::SKIP_DOTS));
    foreach ($files as $file) {
        if (preg_match('/\.tsx?$/', $file->getFilename())) {
            $out .= (string) file_get_contents($file->getPathname())."\n";
        }
    }

    return $out;
}

it('serves /features/flow with the Flow feature data from the registry', function () {
    $page = flowTuiPage($this->get('/features/flow')->assertOk());

    expect($page['component'] ?? null)->toBe('Features/Flow/Index')
        ->and($page['props']['feature']['slug'] ?? null)->toBe('flow');

    $members = array_column($page['props']['feature']['members'] ?? [], 'slug');
    expect($members)->toContain('fancy-flow', 'fancy-flow-php', 'fancy-flow-py', 'fancy-flow-mcp')
        ->and(array_column($page['props']['feature']['bridges'] ?? [], 'name'))->toContain('registerFlowBridge');
});

it('serves /features/tui with the TUI feature data from the registry', function () {
    $page = flowTuiPage($this->get('/features/tui')->assertOk());

    expect($page['component'] ?? null)->toBe('Features/Tui/Index')
        ->and($page['props']['feature']['slug'] ?? null)->toBe('tui')
        ->and(array_column($page['props']['feature']['members'] ?? [], 'slug'))->toContain('fancy-tui')
        ->and(array_column($page['props']['feature']['bridges'] ?? [], 'name'))->toContain('registerTuiBridge');
});

it('builds each micro-site from the shared kit, with no placeholder left', function (string $folder) {
    $index = (string) file_get_contents(resource_path("js/Pages/Features/{$folder}/Index.tsx"));
    $all = flowTuiSource("Features/{$folder}");

    foreach (['<FeatureShell', '<FeatureHero', '<DemoFrame', '<FeatureTour', '<HowItFits', '<InstallSteps', '<PackagesGrid', '<FeatureCta'] as $piece) {
        expect($all)->toContain($piece);
    }

    // Install steps, packages and the bridge come from the feature prop, never typed.
    expect($index)->toContain('feature.members')
        ->and($index)->toContain('feature.bridges')
        ->and($all)->not->toMatch('/\bTODO\b/')
        ->and($all)->not->toContain('feature-todo');
})->with(['Flow', 'Tui']);

it('tours the Flow claims the brief requires, each sourced from the packages', function () {
    $flow = flowTuiSource('Features/Flow');

    // Zero-React engine.
    expect($flow)->toContain('@particle-academy/fancy-flow/engine')
        // PHP + Python runtime twins.
        ->and($flow)->toContain('fancy-flow-php')
        ->and($flow)->toContain('fancy-flow-py')
        // The marketplace: vendored with the CLI, never a package.
        ->and($flow)->toContain('npx fancy-cli@latest add node')
        ->and($flow)->toContain('/r/nodes/index.json')
        // A shuttle, not an engine: core never imports a provider SDK.
        ->and($flow)->toContain('registerLlmClient')
        ->and($flow)->toContain('./llm/vercel-ai')
        ->and($flow)->toContain('./llm/prism');
});

it('keeps the live Flow demos: the editor and the trigger cohort', function () {
    $flow = flowTuiSource('Features/Flow');

    expect($flow)->toContain('FlowStudio')
        ->and($flow)->toContain('TriggerCohortDemo');
});

it('keeps the TUI console full-screen, outside the shell', function () {
    $tui = (string) file_get_contents(resource_path('js/Pages/Features/Tui/Index.tsx'));

    // The console branch returns BEFORE any FeatureShell is rendered.
    $console = strpos($tui, '<DocsTui');
    $shell = strpos($tui, '<FeatureShell');
    expect($console)->not->toBeFalse()
        ->and($shell)->not->toBeFalse()
        ->and($console)->toBeLessThan($shell);
});

it('keeps the TUI workbench and the captured component gallery', function () {
    $tui = flowTuiSource('Features/Tui').flowTuiSource('FancyTui');

    expect($tui)->toContain('TuiWorkbench')
        ->and($tui)->toContain('<ComponentGallery')
        ->and($tui)->toContain('tui_action_invoke')
        ->and($tui)->toContain('human_plus_events_list');
});

it('uses react-fancy controls, not hand-rolled buttons, on the Flow and TUI pages', function (string $folder) {
    expect(flowTuiSource($folder))->not->toMatch('/<button[\s>]/');
})->with(['Features/Flow', 'Features/Tui', 'Flow', 'FancyTui']);
