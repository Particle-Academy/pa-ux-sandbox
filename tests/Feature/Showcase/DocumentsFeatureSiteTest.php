<?php

use Tests\TestCase;

uses(TestCase::class);

/*
 * /features/documents: the Documents micro-site (Phase B,
 * .ai/plans/features-microsites.md).
 *
 * PHP cannot render the React page, so this pins the props the server sends
 * (four product families through App\Support\FeatureSites) and the page
 * source: a real in-browser writer, the agent JSON beside it, no Phase A
 * TODOs, and no import of a writer the showcase does not install.
 */

function documentsFeaturePage(TestCase $test): array
{
    $html = $test->get('/features/documents')->assertOk()->getContent();
    preg_match('#<script data-page="app" type="application/json">(.*?)</script>#s', $html, $page);

    return json_decode($page[1] ?? '{}', true) ?? [];
}

/** Every source file of the Documents micro-site, concatenated. */
function documentsFeatureSource(): string
{
    $source = '';
    foreach (glob(resource_path('js/Pages/Features/Documents/*.{ts,tsx,css}'), GLOB_BRACE) ?: [] as $file) {
        $source .= (string) file_get_contents($file)."\n";
    }

    return $source;
}

it('serves the Documents page with all four families', function () {
    $page = documentsFeaturePage($this);
    $slugs = array_column($page['props']['feature']['members'] ?? [], 'slug');

    expect($page['component'] ?? null)->toBe('Features/Documents/Index')
        ->and($page['props']['feature']['slug'] ?? null)->toBe('documents')
        ->and($slugs)->toContain('holy-sheet', 'dark-slide', 'last-word', 'fine-print')
        ->and($slugs)->toContain('last-word-js', 'dark-slide-js', 'last-word-py')
        ->and($page['props']['feature']['languages'] ?? [])->toContain('PHP', 'Node / TypeScript', 'Python');
});

it('has no Phase A placeholders left', function () {
    $source = documentsFeatureSource();

    expect($source)->not->toBe('')
        ->and($source)->not->toContain('TODO')
        ->and($source)->not->toContain('feature-todo');
});

it('generates real files in the browser with the installed npm writers', function () {
    $source = documentsFeatureSource();

    expect($source)->toMatch('#from\s*"@particle-academy/last-word"#')
        ->and($source)->toMatch('#from\s*"@particle-academy/dark-slide"#')
        ->and($source)->toContain('toBytes(')
        ->and($source)->toContain('describe(')
        ->and($source)->toContain('<DemoFrame');
});

it('imports only writers the showcase actually installs', function () {
    $dependencies = json_decode((string) file_get_contents(base_path('package.json')), true)['dependencies'] ?? [];
    preg_match_all('#from\s*"(@particle-academy/[a-z0-9-]+)#', documentsFeatureSource(), $imports);

    expect($imports[1])->not->toBeEmpty();
    foreach (array_unique($imports[1]) as $package) {
        expect(array_keys($dependencies))->toContain($package);
    }
});

it('renders every kit section from feature data, not typed copies', function () {
    $source = documentsFeatureSource();

    expect($source)->toMatch('/<HowItFits\s+members=\{feature\.members\}\s+bridges=\{feature\.bridges\}/')
        ->and($source)->toMatch('/<InstallSteps\s+members=/')
        ->and($source)->toMatch('/<PackagesGrid\s+members=\{feature\.members\}/')
        ->and($source)->toContain('<FeatureTour')
        ->and($source)->toContain('<FeatureCta');
});
