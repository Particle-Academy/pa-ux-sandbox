<?php

use App\Support\Catalog\CatalogDrift;
use App\Support\PackageRegistry;
use App\Support\Registry\ConnectorSource;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Http\Client\StrayRequestException;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use Tests\TestCase;

uses(TestCase::class);

/*
 * `kit:catalog-drift` -- every class of drift goes RED, and a clean kit does not.
 *
 * The audit behind this command (2026-10-27) found ten published packages that
 * no surface listed, three of them still described in PLANNED as unstarted, and
 * a planned PyPI name that already belonged to a stranger. Every one was a
 * claim about a registry that nothing re-checked.
 *
 * Every request here is faked and stray requests are refused: a test that
 * reached npm would be measuring the network. The fake is built FROM
 * PackageRegistry, so the clean run is "the registries agree with the
 * registry", and each failure test changes exactly one answer.
 */

beforeEach(function () {
    Sleep::fake();
    Http::preventStrayRequests();
});

/** Registry name sets the fake treats as published, by registry. */
function driftPublished(): array
{
    $published = ['npm' => [], 'packagist' => [], 'pypi' => []];

    foreach (PackageRegistry::everything() as $pkg) {
        if (PackageRegistry::isHidden((string) $pkg['slug'])) {
            continue;
        }
        foreach (['npm' => 'npm', 'composer' => 'packagist', 'packagist' => 'packagist', 'pypi' => 'pypi'] as $field => $registry) {
            if (is_string($pkg[$field] ?? null)) {
                $published[$registry][$pkg[$field]] = true;
            }
        }
    }

    foreach (app(ConnectorSource::class)->connectors() as $connector) {
        foreach ((array) ($connector['packages'] ?? []) as $package) {
            if (is_array($package) && is_string($package['name'] ?? null)) {
                $published[(string) $package['registry']][$package['name']] = true;
            }
        }
    }

    return array_map('array_keys', $published);
}

/** A manifest in the shape prism-parity publishes, every entry registered. */
function driftManifest(array $extraPackages = [], array $extraSatellites = []): array
{
    return [
        'kit_version' => '0.5',
        'packages' => [
            'prism' => ['language' => 'php', 'registry' => 'packagist', 'name' => 'particle-academy/prism', 'repository' => 'https://github.com/Particle-Academy/prism', 'version' => '0.115.0'],
            'prism-ts' => ['language' => 'ts', 'registry' => 'npm', 'name' => '@particle-academy/prism', 'repository' => 'https://github.com/Particle-Academy/prism-ts', 'version' => '0.1.0'],
            'prism-py' => ['language' => 'py', 'registry' => 'pypi', 'name' => 'prism-ai-core', 'repository' => 'https://github.com/Particle-Academy/prism-py', 'version' => '0.1.0'],
            'prism-mcp-py' => ['language' => 'py', 'registry' => 'pypi', 'name' => 'prism-ai-mcp', 'repository' => 'https://github.com/Particle-Academy/prism-mcp-py', 'version' => '0.1.0'],
            ...$extraPackages,
        ],
        'satellites' => [
            '$comment' => 'Packages that are NOT language mirrors of the reference.',
            // The free-text `status` the manifest carries today, on a live package.
            'prism-workspace' => ['language' => 'php', 'registry' => 'packagist', 'name' => 'particle-academy/prism-workspace', 'repository' => 'https://github.com/Particle-Academy/prism-workspace', 'version' => null, 'status' => 'in progress'],
            // ...and on one that has never shipped.
            'prism-rag' => ['language' => 'php', 'registry' => 'packagist', 'name' => 'particle-academy/prism-rag', 'repository' => 'https://github.com/Particle-Academy/prism-rag', 'version' => null, 'status' => 'specified, not started'],
            ...$extraSatellites,
        ],
    ];
}

/**
 * Fake every registry the command asks.
 *
 * @param  array<string, mixed>  $answers  "registry:name" => a response, a Closure, or 'published' / 'absent'
 * @param  array{npm_maintainer?: list<string>, npm_scope?: list<string>, packagist?: list<string>, manifest?: mixed, pypi_author?: array<string,string>}  $o
 */
function fakeDrift(array $answers = [], array $o = []): void
{
    $published = driftPublished();

    $npmSearch = function (array $names, Request $request) use ($o) {
        parse_str((string) parse_url($request->url(), PHP_URL_QUERY), $q);
        $from = (int) ($q['from'] ?? 0);
        $size = (int) ($q['size'] ?? 250);
        $page = array_slice($names, $from, $size);

        return Http::response([
            'total' => count($names),
            'objects' => array_map(fn (string $n) => ['package' => ['name' => $n, 'links' => ['repository' => $o['npm_repo'][$n] ?? 'https://github.com/Particle-Academy/'.basename($n)]]], $page),
        ], 200);
    };

    $answer = function (string $key, bool $isPublished, callable $ok) use ($answers) {
        $a = $answers[$key] ?? ($isPublished ? 'published' : 'absent');

        if ($a instanceof Closure) {
            return $a();
        }
        if ($a === 'published') {
            return $ok();
        }
        if ($a === 'absent') {
            return Http::response(['error' => 'Not found'], 404);
        }

        return $a;
    };

    $stubs = [
        'raw.githubusercontent.com/Particle-Academy/prism-parity/*' => $o['manifest'] ?? Http::response(driftManifest(), 200),
        'registry.npmjs.org/-/v1/search*' => function (Request $request) use ($o, $published, $npmSearch) {
            parse_str((string) parse_url($request->url(), PHP_URL_QUERY), $q);
            $text = (string) ($q['text'] ?? '');

            if (isset($o['npm_search_response'])) {
                return $o['npm_search_response'];
            }

            return str_starts_with($text, 'maintainer:')
                ? $npmSearch($o['npm_maintainer'] ?? $published['npm'], $request)
                : $npmSearch($o['npm_scope'] ?? $published['npm'], $request);
        },
        'registry.npmjs.org/*' => function (Request $request) use ($answer, $published) {
            $name = rawurldecode((string) substr((string) parse_url($request->url(), PHP_URL_PATH), 1));

            return $answer('npm:'.$name, in_array($name, $published['npm'], true), fn () => Http::response(['name' => $name, 'dist-tags' => ['latest' => '1.0.0']], 200));
        },
        'packagist.org/packages/list.json*' => $o['packagist_list'] ?? Http::response(['packageNames' => $o['packagist'] ?? $published['packagist']], 200),
        'repo.packagist.org/p2/*' => function (Request $request) use ($answer, $published) {
            preg_match('#/p2/(.+)\.json$#', (string) parse_url($request->url(), PHP_URL_PATH), $m);
            $name = $m[1];

            return $answer('packagist:'.$name, in_array($name, $published['packagist'], true), fn () => Http::response(['packages' => [$name => [['version' => 'v1.0.0']]]], 200));
        },
        'pypi.org/pypi/*' => function (Request $request) use ($answer, $published, $o) {
            preg_match('#/pypi/([^/]+)/json$#', (string) parse_url($request->url(), PHP_URL_PATH), $m);
            $name = $m[1];
            $author = $o['pypi_author'][$name] ?? 'Particle Academy';

            $info = $o['pypi_info'][$name] ?? ['author' => $author];

            return $answer('pypi:'.$name, in_array($name, $published['pypi'], true), fn () => Http::response(['info' => ['name' => $name, 'version' => '1.0.0', ...$info]], 200));
        },
        'crates.io/api/v1/crates/*' => function (Request $request) use ($answer) {
            $name = basename((string) parse_url($request->url(), PHP_URL_PATH));

            return $answer('crates:'.$name, false, fn () => Http::response(['crate' => ['name' => $name]], 200));
        },
    ];

    foreach ($o['omit'] ?? [] as $pattern) {
        unset($stubs[$pattern]);
    }

    Http::fake($stubs);
}

/** A directory of repos with no pyproject in it, so the local envelope cannot leak in. */
function driftEmptyRepos(): string
{
    $dir = sys_get_temp_dir().'/catalog-drift-empty-'.getmypid();
    @mkdir($dir);

    return $dir;
}

/** @return array{0:int, 1:array<string,mixed>} */
function runDrift(array $options = []): array
{
    $code = Artisan::call('kit:catalog-drift', ['--json' => true, '--repos' => driftEmptyRepos(), ...$options]);
    $report = json_decode(Artisan::output(), true);

    expect($report)->toBeArray('the --json output must be JSON');

    return [$code, $report];
}

/** Every finding in the report, flattened. */
function driftFindings(array $report): array
{
    return collect($report['checks'])->flatMap(fn (array $c) => array_map(fn ($f) => $f + ['check' => $c['id']], $c['findings']))->all();
}

it('passes a kit whose registries agree with PackageRegistry, and prints every denominator', function () {
    fakeDrift();

    [$code, $report] = runDrift();

    expect(driftFindings($report))->toBe([])
        ->and($report['unknown'])->toBe([])
        ->and($report['ok'])->toBeTrue()
        ->and($code)->toBe(0);

    foreach ($report['checks'] as $check) {
        expect($check)->toHaveKeys(['id', 'label', 'denominator', 'unit', 'findings']);
        // A check that looked at nothing has not passed; it has not run.
        expect($check['denominator'])->toBeGreaterThan(0, "{$check['id']} looked at nothing");
    }

    expect(collect($report['checks'])->pluck('id')->all())->toBe([
        'npm-discovered', 'packagist-discovered', 'pypi-candidates', 'planned-unpublished',
        'hidden-reasoned', 'registered-resolves', 'prism-manifest',
    ]);
});

it('prints a denominator for every check in the human output too', function () {
    fakeDrift();

    $code = Artisan::call('kit:catalog-drift', ['--repos' => driftEmptyRepos()]);
    $out = Artisan::output();

    expect($code)->toBe(0)
        ->and($out)->toMatch('/npm.*\d+ live/i')
        ->and($out)->toMatch('/Packagist.*\d+ /')
        ->and($out)->toContain('CLEAN');
});

it('FAILS a live @particle-academy npm package that only the MAINTAINER search finds', function () {
    // `scope:` search missed @particle-academy/fancy-git-bitbucket in the audit,
    // so the ghost is put where only the maintainer query would see it.
    $published = driftPublished()['npm'];
    fakeDrift(
        ['npm:@particle-academy/ghost' => 'published'],
        ['npm_maintainer' => [...$published, '@particle-academy/ghost'], 'npm_scope' => $published],
    );

    [$code, $report] = runDrift();

    expect($code)->toBe(1)
        ->and(driftFindings($report))->toContain([
            'class' => 'unregistered', 'registry' => 'npm', 'name' => '@particle-academy/ghost',
            'detail' => 'published, and in no PackageRegistry list, connectors.json or PLANNED', 'check' => 'npm-discovered',
        ]);
});

it('reads every page of the npm search, not only the first', function () {
    $published = driftPublished()['npm'];
    // 260 names: the ghost sits on page two of a 250-per-page search.
    $padded = [...$published, ...array_map(fn ($i) => "@particle-academy/stale-{$i}", range(1, 260 - count($published) - 1)), '@particle-academy/ghost'];
    fakeDrift(['npm:@particle-academy/ghost' => 'published'], ['npm_maintainer' => $padded]);

    [$code, $report] = runDrift();

    expect($code)->toBe(1)
        ->and(collect(driftFindings($report))->pluck('name')->all())->toBe(['@particle-academy/ghost']);
});

it('does not trust the search index: a searched name that 404s directly is not drift', function () {
    $published = driftPublished()['npm'];
    fakeDrift([], ['npm_maintainer' => [...$published, '@particle-academy/unpublished-long-ago']]);

    [$code, $report] = runDrift();

    expect($code)->toBe(0)->and(driftFindings($report))->toBe([]);
});

it('ignores an unscoped package the maintainer search returns that is not a Particle-Academy repo', function () {
    $published = driftPublished()['npm'];
    fakeDrift(
        ['npm:someones-side-project' => 'published'],
        ['npm_maintainer' => [...$published, 'someones-side-project'], 'npm_repo' => ['someones-side-project' => 'https://github.com/elsewhere/side-project']],
    );

    [$code, $report] = runDrift();

    expect($code)->toBe(0)->and(driftFindings($report))->toBe([]);
});

it('counts an unscoped package from a Particle-Academy repo as ours', function () {
    $published = driftPublished()['npm'];
    fakeDrift(['npm:fancy-ghost-cli' => 'published'], ['npm_maintainer' => [...$published, 'fancy-ghost-cli']]);

    [$code, $report] = runDrift();

    expect($code)->toBe(1)
        ->and(collect(driftFindings($report))->pluck('name')->all())->toBe(['fancy-ghost-cli']);
});

it('FAILS a Packagist package under the vendor that is registered nowhere', function () {
    fakeDrift(
        ['packagist:particle-academy/ghost' => 'published'],
        ['packagist' => [...driftPublished()['packagist'], 'particle-academy/ghost']],
    );

    [$code, $report] = runDrift();

    expect($code)->toBe(1)
        ->and(driftFindings($report))->toContain([
            'class' => 'unregistered', 'registry' => 'packagist', 'name' => 'particle-academy/ghost',
            'detail' => 'published, and in no PackageRegistry list, connectors.json or PLANNED', 'check' => 'packagist-discovered',
        ]);
});

it('counts a connector package as registered through connectors.json', function () {
    $connectorPhp = collect(app(ConnectorSource::class)->connectors())->pluck('packages.php.name')->filter()->first();
    expect($connectorPhp)->toBeString('connectors.json has no Packagist package to test with');

    fakeDrift();
    [$code, $report] = runDrift();

    expect($code)->toBe(0)
        ->and(collect(driftFindings($report))->pluck('name'))->not->toContain($connectorPhp);
});

it('FAILS a PyPI name from the Prism manifest that is published and unregistered', function () {
    fakeDrift(
        ['pypi:prism-ai-ghost' => 'published'],
        ['manifest' => Http::response(driftManifest(['prism-ghost-py' => ['language' => 'py', 'registry' => 'pypi', 'name' => 'prism-ai-ghost', 'repository' => 'https://github.com/Particle-Academy/prism-ghost-py', 'version' => '0.1.0']]), 200)],
    );

    [$code, $report] = runDrift();

    $classes = collect(driftFindings($report))->where('name', 'prism-ai-ghost')->pluck('class', 'check')->all();

    expect($code)->toBe(1)
        ->and($classes)->toBe(['pypi-candidates' => 'unregistered', 'prism-manifest' => 'manifest-unregistered']);
});

it('FAILS a PyPI name from one of our repos\' pyproject.toml that is published and unregistered', function () {
    $repos = sys_get_temp_dir().'/catalog-drift-repos-'.getmypid();
    @mkdir($repos.'/fancy-ghost/python', 0777, true);
    file_put_contents($repos.'/fancy-ghost/python/pyproject.toml', "[project]\nname = \"fancy-ghost\"\nversion = \"0.1.0\"\n");

    fakeDrift(['pypi:fancy-ghost' => 'published']);

    [$code, $report] = runDrift(['--repos' => $repos]);

    expect($code)->toBe(1)
        ->and(collect(driftFindings($report))->firstWhere('name', 'fancy-ghost')['class'])->toBe('unregistered');
});

it('FAILS a PyPI candidate that is published by somebody else, as a name collision', function () {
    fakeDrift(
        ['pypi:prism-ai-ghost' => 'published'],
        [
            'manifest' => Http::response(driftManifest(['prism-ghost-py' => ['language' => 'py', 'registry' => 'pypi', 'name' => 'prism-ai-ghost', 'repository' => 'x', 'version' => '0.1.0']]), 200),
            'pypi_author' => ['prism-ai-ghost' => 'Someone Unrelated'],
        ],
    );

    [$code, $report] = runDrift();

    expect($code)->toBe(1)
        ->and(collect(driftFindings($report))->where('check', 'pypi-candidates')->firstWhere('name', 'prism-ai-ghost')['class'])->toBe('name-collision');
});

it('does not adopt a name-matching PyPI package whose metadata is foreign -- prism-ai-cli', function () {
    // Real case, relayed from Prism's census: `prism-ai-cli` 0.1.13 shares the
    // `prism-ai-` prefix of every Prism Python port and is not ours. The prefix
    // is not proof of ownership; the publisher and the source repo are.
    fakeDrift(
        ['pypi:prism-ai-cli' => 'published'],
        [
            'manifest' => Http::response(driftManifest(['prism-cli-py' => ['language' => 'py', 'registry' => 'pypi', 'name' => 'prism-ai-cli', 'repository' => 'https://github.com/Particle-Academy/prism-cli-py', 'version' => '0.1.0']]), 200),
            'pypi_info' => ['prism-ai-cli' => ['author' => null, 'author_email' => 'Your Name <you@prism.ai>', 'home_page' => 'https://prism.ai', 'project_urls' => ['Homepage' => 'https://prism.ai']]],
        ],
    );

    [$code, $report] = runDrift();

    $classes = collect(driftFindings($report))->where('name', 'prism-ai-cli')->pluck('class')->unique()->values()->all();

    // Red, because one of our sources names a package somebody else owns --
    // but as a COLLISION, never as a package of ours to register.
    expect($code)->toBe(1)->and($classes)->toBe(['name-collision']);
});

it('recognises ownership from the source repository when the author field is blank', function () {
    fakeDrift(
        ['pypi:prism-ai-ghost' => 'published'],
        [
            'manifest' => Http::response(driftManifest(['prism-ghost-py' => ['language' => 'py', 'registry' => 'pypi', 'name' => 'prism-ai-ghost', 'repository' => 'x', 'version' => '0.1.0']]), 200),
            'pypi_info' => ['prism-ai-ghost' => ['author' => '', 'project_urls' => ['Source' => 'https://github.com/Particle-Academy/prism-ghost-py']]],
        ],
    );

    [$code, $report] = runDrift();

    expect($code)->toBe(1)
        ->and(collect(driftFindings($report))->where('check', 'pypi-candidates')->firstWhere('name', 'prism-ai-ghost')['class'])->toBe('unregistered');
});

it('is not fooled by a look-alike repository owner', function () {
    fakeDrift(
        ['pypi:prism-ai-ghost' => 'published'],
        [
            'manifest' => Http::response(driftManifest(['prism-ghost-py' => ['language' => 'py', 'registry' => 'pypi', 'name' => 'prism-ai-ghost', 'repository' => 'x', 'version' => '0.1.0']]), 200),
            'pypi_info' => ['prism-ai-ghost' => ['author' => 'A Fan', 'project_urls' => ['Source' => 'https://github.com/particle-academy-fans/prism-ghost'], 'description' => 'unofficial particle academy tools']],
        ],
    );

    [$code, $report] = runDrift();

    expect(collect(driftFindings($report))->where('check', 'pypi-candidates')->firstWhere('name', 'prism-ai-ghost')['class'])->toBe('name-collision');
});

it('does not flag a manifest entry that has not been published, however it is marked', function (array $marks) {
    // The prism-conformance trio and prism-ai-mcp-server are in Prism's
    // manifest and on no registry. Prism will mark them planned or hidden; until
    // then they carry no status at all. None is something the catalogue could
    // list or hide, so none is drift.
    fakeDrift([], ['manifest' => Http::response(driftManifest([
        'prism-conformance-ts' => ['language' => 'ts', 'registry' => 'npm', 'name' => '@particle-academy/prism-conformance', 'repository' => 'x', 'version' => '0.1.0', ...$marks],
        'prism-conformance-php' => ['language' => 'php', 'registry' => 'packagist', 'name' => 'particle-academy/prism-conformance', 'repository' => 'x', 'version' => '0.1.0', ...$marks],
        'prism-conformance-py' => ['language' => 'py', 'registry' => 'pypi', 'name' => 'prism-conformance', 'repository' => 'x', 'version' => '0.1.0', ...$marks],
        'prism-mcp-server-py' => ['language' => 'py', 'registry' => 'pypi', 'name' => 'prism-ai-mcp-server', 'repository' => 'x', 'version' => '0.1.0', ...$marks],
    ]), 200)]);

    [$code, $report] = runDrift();

    expect(driftFindings($report))->toBe([])->and($code)->toBe(0);
})->with([
    'no marks yet' => [[]],
    'planned' => [['status' => 'planned']],
    'hidden' => [['status' => 'published', 'catalog' => ['visibility' => 'hidden', 'reason' => 'conformance tooling, not a product']]],
]);

it('FAILS a registered PyPI name that belongs to somebody else', function () {
    fakeDrift([], ['pypi_author' => ['fancy-flow' => 'Someone Unrelated']]);

    [$code, $report] = runDrift();

    expect($code)->toBe(1)
        ->and(collect(driftFindings($report))->where('check', 'registered-resolves')->firstWhere('name', 'fancy-flow')['class'])->toBe('name-collision');
});

it('FAILS a PLANNED package that is already published', function () {
    fakeDrift(['npm:@particle-academy/charlotte-ui' => 'published']);

    [$code, $report] = runDrift();

    $finding = collect(driftFindings($report))->firstWhere('name', '@particle-academy/charlotte-ui');

    expect($code)->toBe(1)
        ->and($finding['class'])->toBe('planned-but-published')
        ->and($finding['check'])->toBe('planned-unpublished')
        ->and($finding['slug'])->toBe('charlotte-ui');
});

it('FAILS a PLANNED PyPI name that a stranger already owns -- the charlotte collision', function () {
    fakeDrift(['pypi:fancy-charlotte' => 'published'], ['pypi_author' => ['fancy-charlotte' => 'Jack King']]);

    [$code, $report] = runDrift();

    expect($code)->toBe(1)
        ->and(collect(driftFindings($report))->firstWhere('name', 'fancy-charlotte')['class'])->toBe('name-collision');
});

it('asks crates.io about the planned Rust crates', function () {
    fakeDrift(['crates:fancy-json' => 'published']);

    [$code, $report] = runDrift();

    expect($code)->toBe(1)
        ->and(collect(driftFindings($report))->firstWhere('name', 'fancy-json')['class'])->toBe('planned-but-published');
});

it('FAILS a HIDDEN package that is published without a recorded reason', function () {
    app()->instance(CatalogDrift::class, new CatalogDrift(app(ConnectorSource::class), hidden: [...PackageRegistry::HIDDEN, 'fancy-grid'], hiddenReasons: []));
    fakeDrift();

    [$code, $report] = runDrift();

    $finding = collect(driftFindings($report))->firstWhere('check', 'hidden-reasoned');

    expect($code)->toBe(1)
        ->and($finding['class'])->toBe('hidden-published-without-reason')
        ->and($finding['slug'])->toBe('fancy-grid');
});

it('passes a HIDDEN published package whose reason is recorded', function () {
    app()->instance(CatalogDrift::class, new CatalogDrift(app(ConnectorSource::class), hidden: [...PackageRegistry::HIDDEN, 'fancy-grid'], hiddenReasons: ['fancy-grid' => 'owner ruling: held back while the API settles']));
    fakeDrift();

    [$code] = runDrift();

    expect($code)->toBe(0);
});

it('passes a HIDDEN package that is not published -- the ordinary use of HIDDEN', function () {
    // fancy-schema and fancy-inertia-server are hidden and 404 in the fake.
    expect(PackageRegistry::HIDDEN)->not->toBe([]);
    fakeDrift();

    [$code, $report] = runDrift();

    expect($code)->toBe(0)
        ->and(collect($report['checks'])->firstWhere('id', 'hidden-reasoned')['denominator'])->toBe(count(PackageRegistry::HIDDEN));
});

it('FAILS a registered package that 404s on its registry', function () {
    fakeDrift(['npm:@particle-academy/react-fancy' => 'absent']);

    [$code, $report] = runDrift();

    expect($code)->toBe(1)
        ->and(driftFindings($report))->toContain([
            'class' => 'registered-but-404', 'registry' => 'npm', 'name' => '@particle-academy/react-fancy',
            'detail' => 'registered as react-fancy, but the registry has no published release', 'slug' => 'react-fancy', 'check' => 'registered-resolves',
        ]);
});

it('FAILS an npm package whose packument survives an unpublish with no dist-tags', function () {
    fakeDrift(['npm:@particle-academy/fancy-grid' => Http::response(['name' => '@particle-academy/fancy-grid', 'time' => ['unpublished' => ['time' => '2026-10-01']]], 200)]);

    [$code, $report] = runDrift();

    expect($code)->toBe(1)
        ->and(collect(driftFindings($report))->firstWhere('name', '@particle-academy/fancy-grid')['class'])->toBe('registered-but-404');
});

it('FAILS a Packagist package that answers 200 with no versions', function () {
    fakeDrift(['packagist:particle-academy/holy-sheet' => Http::response(['packages' => ['particle-academy/holy-sheet' => []]], 200)]);

    [$code, $report] = runDrift();

    expect($code)->toBe(1)
        ->and(collect(driftFindings($report))->firstWhere('name', 'particle-academy/holy-sheet')['class'])->toBe('registered-but-404');
});

it('FAILS a Prism manifest entry marked hidden that has no HIDDEN slug and reason', function () {
    fakeDrift([], ['manifest' => Http::response(driftManifest([
        'prism-mcp-py' => ['language' => 'py', 'registry' => 'pypi', 'name' => 'prism-ai-mcp', 'repository' => 'x', 'version' => '0.1.0', 'status' => 'published', 'catalog' => ['visibility' => 'hidden', 'reason' => 'superseded']],
    ]), 200)]);

    [$code, $report] = runDrift();

    expect($code)->toBe(1)
        ->and(collect(driftFindings($report))->firstWhere('name', 'prism-ai-mcp')['class'])->toBe('manifest-hidden-unrecorded');
});

it('accepts a manifest hidden entry that matches a HIDDEN slug with a reason, in either catalog shape', function (mixed $catalog) {
    app()->instance(CatalogDrift::class, new CatalogDrift(app(ConnectorSource::class), hidden: [...PackageRegistry::HIDDEN, 'prism-mcp-py'], hiddenReasons: ['prism-mcp-py' => 'superseded by prism-ai-mcp-server']));
    fakeDrift([], ['manifest' => Http::response(driftManifest([
        'prism-mcp-py' => ['language' => 'py', 'registry' => 'pypi', 'name' => 'prism-ai-mcp', 'repository' => 'x', 'version' => '0.1.0', 'status' => 'published', 'catalog' => $catalog],
    ]), 200)]);

    [$code, $report] = runDrift();

    expect(driftFindings($report))->toBe([])->and($code)->toBe(0);
})->with([
    'string' => ['hidden'],
    'object' => [['visibility' => 'hidden', 'reason' => 'superseded']],
]);

it('treats a manifest entry with no status or catalog as published and public', function () {
    fakeDrift(['npm:@particle-academy/prism-ghost' => 'published'], ['manifest' => Http::response(driftManifest([
        'prism-ghost-ts' => ['language' => 'ts', 'registry' => 'npm', 'name' => '@particle-academy/prism-ghost', 'repository' => 'x', 'version' => '0.1.0'],
    ]), 200)]);

    [$code, $report] = runDrift();

    expect($code)->toBe(1)
        ->and(collect(driftFindings($report))->where('check', 'prism-manifest')->pluck('name')->all())->toBe(['@particle-academy/prism-ghost']);
});

it('does not require a planned or deprecated manifest entry to be registered', function (string $status) {
    fakeDrift([], ['manifest' => Http::response(driftManifest([], [
        'prism-future' => ['language' => 'php', 'registry' => 'packagist', 'name' => 'particle-academy/prism-future', 'repository' => 'x', 'version' => null, 'status' => $status],
    ]), 200)]);

    [$code, $report] = runDrift();

    expect($code)->toBe(0)->and(driftFindings($report))->toBe([]);
})->with(['planned', 'deprecated']);

it('FAILS on an unrecognised manifest catalog value rather than guessing', function () {
    fakeDrift([], ['manifest' => Http::response(driftManifest([
        'prism-mcp-py' => ['language' => 'py', 'registry' => 'pypi', 'name' => 'prism-ai-mcp', 'repository' => 'x', 'version' => '0.1.0', 'catalog' => 'members-only'],
    ]), 200)]);

    [$code, $report] = runDrift();

    expect($code)->toBe(1)
        ->and(collect($report['unknown'])->pluck('name'))->toContain('prism-ai-mcp');
});

it('reports a failed lookup as UNKNOWN and fails, never as fine', function (string $key, string $kind) {
    fakeDrift([$key => match ($kind) {
        '500' => fn () => Http::response('upstream exploded', 500),
        '429' => fn () => Http::response('slow down', 429),
        'drop' => fn () => throw new ConnectionException('reset by peer'),
        'html' => fn () => Http::response('<html>maintenance</html>', 200),
    }]);

    [$code, $report] = runDrift();

    expect($code)->toBe(1)
        ->and($report['ok'])->toBeFalse()
        ->and(collect($report['unknown'])->map(fn ($u) => $u['registry'].':'.$u['name'])->all())->toContain($key);
})->with([
    'a 500' => ['npm:@particle-academy/react-fancy', '500'],
    'a rate limit' => ['pypi:fancy-flow', '429'],
    'a dropped connection' => ['packagist:particle-academy/prism', 'drop'],
    'a 200 that is not JSON' => ['crates:fancy-flow', 'html'],
]);

it('reports an unreadable npm search as UNKNOWN and fails', function () {
    fakeDrift([], ['npm_search_response' => Http::response('rate limited', 429)]);

    [$code, $report] = runDrift();

    expect($code)->toBe(1)->and(collect($report['unknown'])->pluck('registry'))->toContain('npm-search');
});

it('reports an empty npm search as UNKNOWN: zero results means the question was not answered', function () {
    fakeDrift([], ['npm_maintainer' => [], 'npm_scope' => []]);

    [$code, $report] = runDrift();

    expect($code)->toBe(1)->and(collect($report['unknown'])->pluck('registry'))->toContain('npm-search');
});

it('reports an empty Packagist vendor listing as UNKNOWN and fails', function () {
    fakeDrift([], ['packagist_list' => Http::response(['packageNames' => []], 200)]);

    [$code, $report] = runDrift();

    expect($code)->toBe(1)->and(collect($report['unknown'])->pluck('registry'))->toContain('packagist-list');
});

it('reports an unreachable Prism manifest as UNKNOWN and fails', function () {
    fakeDrift([], ['manifest' => Http::response('Not Found', 404)]);

    [$code, $report] = runDrift();

    expect($code)->toBe(1)->and(collect($report['unknown'])->pluck('registry'))->toContain('prism-manifest');
});

it('fetches the Prism manifest without credentials', function () {
    fakeDrift();
    runDrift();

    Http::assertSent(fn (Request $request) => str_contains($request->url(), 'prism-parity/main/manifest/packages.json')
        && ! $request->hasHeader('Authorization'));
});

it('lets a stray real request fail the run loudly instead of passing as UNKNOWN', function () {
    // Every host but crates.io faked, with stray requests refused: the command
    // must not swallow the refusal as one more UNKNOWN.
    fakeDrift([], ['omit' => ['crates.io/api/v1/crates/*']]);

    expect(fn () => Artisan::call('kit:catalog-drift', ['--json' => true, '--repos' => driftEmptyRepos()]))
        ->toThrow(StrayRequestException::class);
});
