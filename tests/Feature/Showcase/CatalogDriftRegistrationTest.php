<?php

use App\Support\PackageFamily;
use App\Support\PackageRegistry;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
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
        // Found by `kit:catalog-drift` on 2026-10-27: on Packagist since v1.0.0
        // and in no list. `packagist`, NOT `composer` -- see the tests below.
        'fancy-starter-kit' => [['packagist' => 'particle-academy/fancy-starter-kit'], 'php', null],
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

/*
 * The Laravel starter kit is an APP TEMPLATE, not a library. It is on Packagist
 * because `laravel new --using=` resolves it through `composer create-project`,
 * but nobody requires it into an existing app.
 *
 * So it carries `packagist` (what kit:catalog-drift and kit:status ask about)
 * and NOT `composer`: every surface that sees a `composer` field synthesizes
 * `composer require <name>` from it -- the /packages tile, the package page,
 * the family card, the micro-sites and the MCP backend search -- and that
 * command would install a whole Laravel skeleton as a dependency of somebody's
 * app. Its real install command goes in `download`, which surfaces use verbatim.
 */
it('lists the Laravel starter kit under Start here, installed with laravel new and never composer require', function () {
    $kit = PackageRegistry::findAny('fancy-starter-kit');

    expect($kit)->not->toBeNull()
        ->and($kit['group'])->toBe('core')
        ->and($kit['kind'])->toBe('headless')
        ->and($kit['download'])->toBe('laravel new my-app --using=particle-academy/fancy-starter-kit')
        ->and($kit['docs'])->toBe('/docs/starter-kit')
        ->and($kit['repo'])->toBe('Particle-Academy/fancy-starter-kit');

    expect(array_key_exists('composer', $kit))->toBeFalse(
        'a composer field makes every install surface print `composer require particle-academy/fancy-starter-kit`');
});

it('links the starter kit to the docs page that already exists, rather than a second copy', function () {
    $this->get(PackageRegistry::findAny('fancy-starter-kit')['docs'])->assertOk();

    $this->get('/packages/fancy-starter-kit')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('package.slug', 'fancy-starter-kit')
            ->where('package.docs', '/docs/starter-kit')
            ->where('package.download', 'laravel new my-app --using=particle-academy/fancy-starter-kit')
            ->missing('package.composer'));
});

it('lets kit:status find a package that carries only a packagist name', function () {
    // Without this, a Packagist-only entry has "nothing to publish to" and is
    // reported UNPUBLISHED -- a confident wrong answer about a live package.
    Http::preventStrayRequests();
    Http::fake([
        'repo.packagist.org/p2/particle-academy/fancy-starter-kit.json' => Http::response([
            'packages' => ['particle-academy/fancy-starter-kit' => [['version' => 'v1.1.90']]],
        ]),
        '*' => Http::response('', 404),
    ]);

    Artisan::call('kit:status', ['--json' => true]);
    $rows = collect(json_decode(Artisan::output(), true, 512, JSON_THROW_ON_ERROR));
    $row = $rows->firstWhere('slug', 'fancy-starter-kit');

    expect($rows->count())->toBeGreaterThan(100, 'kit:status reported almost nothing; the JSON was not read')
        ->and($row)->not->toBeNull()
        ->and($row['name'])->toBe('particle-academy/fancy-starter-kit')
        ->and($row['state'])->toBe('published')
        ->and($row['published'])->toBe('1.1.90');
});
