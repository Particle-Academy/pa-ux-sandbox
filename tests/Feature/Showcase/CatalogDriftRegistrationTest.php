<?php

use App\Support\PackageFamily;
use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The packages the 2026-10-27 catalog audit found PUBLISHED and registered
 * nowhere (sandbox/catalog-audit/report.txt in the envelope).
 *
 * Each of them was live on its registry and invisible to /packages, the MCP and
 * kit:status, which is the same blind spot the registry has documented four
 * times already. `kit:catalog-drift` is the standing watch; this file pins the
 * specific repairs so a tidy-up cannot quietly undo one.
 */

/**
 * slug => [registry field => name, ecosystem, family sibling or null].
 *
 * @return array<string, array{0: array<string,string>, 1: string, 2: ?string}>
 */
function catalogDriftRepairs(): array
{
    return [
        'prism-acp' => [['composer' => 'particle-academy/prism-acp', 'packagist' => 'particle-academy/prism-acp'], 'php', 'prism-acp-ts'],
        'prism-mcp-server-ts' => [['npm' => '@particle-academy/prism-mcp-server'], 'ts', null],
        'prism-human-plus-py' => [['pypi' => 'prism-ai-human-plus'], 'py', 'prism-human-plus-ts'],
        'prism-mcp-py' => [['pypi' => 'prism-ai-mcp'], 'py', 'prism-mcp-ts'],
        'prism-opentelemetry-py' => [['pypi' => 'prism-ai-opentelemetry'], 'py', 'prism-opentelemetry-ts'],
        'prism-perplexity-py' => [['pypi' => 'prism-ai-perplexity'], 'py', 'prism-perplexity-ts'],
        'prism-workspace-py' => [['pypi' => 'prism-ai-workspace'], 'py', 'prism-workspace-ts'],
        'fancy-expr' => [['npm' => '@particle-academy/fancy-expr', 'composer' => 'particle-academy/fancy-expr'], 'polyglot', null],
        'fancy-template' => [['npm' => '@particle-academy/fancy-template', 'composer' => 'particle-academy/fancy-template', 'pypi' => 'fancy-template'], 'polyglot', null],
        'change-council' => [['composer' => 'particle-academy/change-council', 'packagist' => 'particle-academy/change-council'], 'php', null],
    ];
}

it('registers every published package the audit found missing, on a public surface', function (string $slug) {
    [$fields, $ecosystem] = catalogDriftRepairs()[$slug];

    $package = PackageRegistry::findAny($slug);

    expect($package)->not->toBeNull("{$slug} is published and must be listed, not merely defined")
        ->and($package)->toMatchArray($fields)
        // META, not the fallback: the fallback is `ts`, so a Python or PHP
        // package without a META row would read as TypeScript.
        ->and($package['ecosystem'])->toBe($ecosystem)
        ->and(mb_strlen(trim((string) $package['tagline'])))->toBeGreaterThan(40)
        ->and(str_starts_with((string) $package['repo'], 'Particle-Academy/'))->toBeTrue();

    expect(PackageRegistry::isHidden($slug))->toBeFalse()
        ->and(PackageRegistry::PLANNED)->not->toHaveKey($slug);
})->with(array_keys(catalogDriftRepairs()));

it('pairs each Prism port with its existing sibling in the Prism family', function (string $slug) {
    $sibling = catalogDriftRepairs()[$slug][2];

    if ($sibling === null) {
        expect(PackageFamily::memberSlugsOf($slug))->toBeArray();

        return;
    }

    expect(PackageFamily::memberSlugsOf($slug))->toContain($sibling)
        ->and(PackageFamily::canonicalFor($slug))->toBe(PackageFamily::canonicalFor($sibling));
})->with(array_keys(catalogDriftRepairs()));

it('does not offer fancy-expr on PyPI, where it is not published', function () {
    expect(PackageRegistry::findAny('fancy-expr'))->not->toHaveKey('pypi');
});

it('names the planned Python Charlotte something we can actually publish', function () {
    $planned = PackageRegistry::PLANNED['charlotte-py'];

    // `charlotte` on PyPI belongs to an unrelated author (Jack King, 17
    // releases). Planning to publish under it would have failed at the first
    // upload, or worse, sent a reader to a stranger's package.
    expect($planned['name'])->toBe('fancy-charlotte')
        ->and($planned['registries'])->toBe(['pypi' => 'fancy-charlotte'])
        ->and($planned['why'])->toContain('Jack King');
});
