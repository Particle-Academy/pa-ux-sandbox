<?php

use Tests\TestCase;

uses(TestCase::class);

/*
 * /features/3d (Phase B). Pest cannot render React, so this pins the Inertia
 * page the server sends and the page source that consumes it. The source
 * checks are what fail on the Phase A stub.
 */

function threeDFeaturePage(TestCase $test): array
{
    $html = $test->get('/features/3d')->assertOk()->getContent();
    preg_match('#<script data-page="app" type="application/json">(.*?)</script>#s', $html, $match);

    return json_decode($match[1] ?? '{}', true) ?? [];
}

function threeDFeatureSource(): string
{
    $dir = resource_path('js/Pages/Features/ThreeD');
    $source = '';
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS)) as $file) {
        if (in_array($file->getExtension(), ['tsx', 'ts', 'css'], true)) {
            $source .= file_get_contents($file->getPathname())."\n";
        }
    }

    return $source;
}

it('renders the 3D micro-site with its registry members and the scene bridge', function () {
    $page = threeDFeaturePage($this);

    expect($page['component'] ?? null)->toBe('Features/ThreeD/Index')
        ->and($page['props']['feature']['slug'])->toBe('3d')
        ->and(array_column($page['props']['feature']['members'], 'slug'))
        ->toBe(['fancy-3d', 'fancy-3d-babylon', 'fancy-3d-three'])
        ->and(array_column($page['props']['feature']['bridges'], 'name'))->toBe(['registerSceneBridge']);
});

it('demos one fancy-3d Scene on the DOM renderer and both WebGL adapters', function () {
    $source = threeDFeatureSource();

    expect($source)
        ->toContain('from "@particle-academy/fancy-3d/canvas"')
        ->toContain('from "@particle-academy/fancy-3d/dom"')
        ->toContain('from "@particle-academy/fancy-3d-babylon/react"')
        ->toContain('from "@particle-academy/fancy-3d-three/react"')
        ->toContain('createCard3D')
        ->toContain('<Monitor')
        ->toContain('<DemoFrame')
        ->toContain('<FeatureTour')
        ->toContain('<HowItFits')
        ->toContain('<InstallSteps')
        ->toContain('<PackagesGrid')
        ->toContain('<FeatureCta');
});

it('falls back to the DOM renderer without WebGL and respects reduced motion', function () {
    $source = threeDFeatureSource();

    expect($source)
        ->toContain('hasWebGL')
        ->toContain('prefers-reduced-motion');
});

it('leaves no Phase A placeholder behind', function () {
    $source = threeDFeatureSource();

    expect($source)->not->toContain('TODO')
        ->and($source)->not->toContain('feature-todo')
        ->and($source)->not->toContain('circle-dashed');
});
