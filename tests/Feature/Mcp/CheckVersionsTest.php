<?php

use App\Mcp\Tools\CheckVersions;
use Illuminate\Support\Facades\Http;
use Laravel\Mcp\Request;
use Tests\TestCase;

uses(TestCase::class);

/*
 * `check_versions` — "here is what I am using, what should I be on?"
 *
 * The tool exists because the question an agent actually has is not "what is
 * the latest version of X". It is "I have this list; what is behind, and what
 * am I MISSING". The second half is the part no registry answers: a first-party
 * package that arrived as a transitive dependency is invisible in a consumer's
 * manifest, so an agent maintaining that manifest never learns it exists.
 *
 * Two rules govern everything below:
 *
 *  1. **An unreachable registry is never "current".** A blip that reads as
 *     up-to-date is worse than no check, because it is a check people trust.
 *     "Not published" and "could not tell" are DIFFERENT answers and both are
 *     different from "you are fine".
 *  2. **Nothing is silently dropped.** A name we do not recognise comes back
 *     named, because silence reads as "that package is fine" to the caller.
 */

/** @param array<string, mixed> $args */
function checkVersions(array $args): array
{
    $response = (new CheckVersions)->handle(new Request($args));

    return json_decode($response->content(), true, 512, JSON_THROW_ON_ERROR);
}

/**
 * An npm packument, trimmed to the fields the resolver reads.
 *
 * @param  array<string, string>  $deps
 * @param  array<string, string>  $peers
 * @return array<string, mixed>
 */
function npmDoc(string $name, string $latest, array $deps = [], array $peers = []): array
{
    return [
        'name' => $name,
        'dist-tags' => ['latest' => $latest],
        'versions' => [
            $latest => [
                'name' => $name,
                'version' => $latest,
                'dependencies' => $deps,
                'peerDependencies' => $peers,
            ],
        ],
    ];
}

/**
 * A Packagist `p2` document. Newest release first, which is how p2 orders them.
 *
 * @param  array<string, string>  $require
 * @return array<string, mixed>
 */
function packagistDoc(string $name, string $latest, array $require = []): array
{
    return ['packages' => [$name => [['version' => $latest, 'require' => $require]]]];
}

/**
 * Serve the given registry documents and 404 everything else, so a package the
 * test did not set up is "not published" rather than an accidental pass.
 *
 * @param  array<string, array<string, mixed>>  $npm
 * @param  array<string, array<string, mixed>>  $composer
 */
function fakeRegistries(array $npm = [], array $composer = []): void
{
    Http::fake([
        'registry.npmjs.org/*' => function ($request) use ($npm) {
            $name = urldecode(ltrim((string) parse_url($request->url(), PHP_URL_PATH), '/'));

            return isset($npm[$name]) ? Http::response($npm[$name], 200) : Http::response([], 404);
        },
        'repo.packagist.org/*' => function ($request) use ($composer) {
            $path = (string) parse_url($request->url(), PHP_URL_PATH);
            $name = preg_replace('#^/p2/|\.json$#', '', $path);

            return isset($composer[$name]) ? Http::response($composer[$name], 200) : Http::response([], 404);
        },
        'pypi.org/*' => Http::response([], 404),
    ]);
}

it('returns the latest version for each package the caller is using', function () {
    fakeRegistries(npm: [
        '@particle-academy/react-fancy' => npmDoc('@particle-academy/react-fancy', '5.26.0'),
    ]);

    $result = checkVersions(['lang' => 'node', 'packages' => ['react-fancy']]);

    expect($result['using'])->toHaveCount(1);
    expect($result['using'][0]['package'])->toBe('@particle-academy/react-fancy');
    expect($result['using'][0]['latest'])->toBe('5.26.0');
});

it('resolves the distribution for the LANGUAGE asked for, not a guess', function () {
    // The same capability ships as a PHP+Node pair under different names. Asking
    // as a Laravel app must not hand back an npm package it cannot install.
    fakeRegistries(composer: [
        'particle-academy/holy-sheet' => packagistDoc('particle-academy/holy-sheet', '2.1.0'),
    ]);

    $result = checkVersions(['lang' => 'php', 'packages' => ['holy-sheet']]);

    expect($result['registry'])->toBe('composer');
    expect($result['using'][0]['package'])->toBe('particle-academy/holy-sheet');
    expect($result['using'][0]['latest'])->toBe('2.1.0');
});

it('says whether the version the caller already has is behind', function () {
    fakeRegistries(npm: [
        '@particle-academy/react-fancy' => npmDoc('@particle-academy/react-fancy', '5.26.0'),
    ]);

    $result = checkVersions([
        'lang' => 'node',
        'packages' => ['@particle-academy/react-fancy@5.20.0'],
    ]);

    expect($result['using'][0]['have'])->toBe('5.20.0');
    expect($result['using'][0]['status'])->toBe('outdated');
});

it('reports a first-party dependency the caller did not list', function () {
    // The whole point. fancy-diff pulls fancy-file-commons; a consumer who only
    // ever wrote fancy-diff in their package.json has no way to learn that.
    fakeRegistries(npm: [
        '@particle-academy/fancy-diff' => npmDoc('@particle-academy/fancy-diff', '0.5.0', [
            '@particle-academy/fancy-file-commons' => '>=0.3.0 <2.0',
        ]),
        '@particle-academy/fancy-file-commons' => npmDoc('@particle-academy/fancy-file-commons', '0.3.0'),
    ]);

    $result = checkVersions(['lang' => 'node', 'packages' => ['fancy-diff']]);

    expect($result['add'])->toHaveCount(1);
    expect($result['add'][0]['package'])->toBe('@particle-academy/fancy-file-commons');
    expect($result['add'][0]['latest'])->toBe('0.3.0');
    expect($result['add'][0]['required_by'])->toContain('fancy-diff');
});

it('does not re-report a dependency the caller already listed', function () {
    fakeRegistries(npm: [
        '@particle-academy/fancy-diff' => npmDoc('@particle-academy/fancy-diff', '0.5.0', [
            '@particle-academy/fancy-file-commons' => '>=0.3.0 <2.0',
        ]),
        '@particle-academy/fancy-file-commons' => npmDoc('@particle-academy/fancy-file-commons', '0.3.0'),
    ]);

    $result = checkVersions([
        'lang' => 'node',
        'packages' => ['fancy-diff', 'fancy-file-commons'],
    ]);

    expect($result['add'])->toBe([]);
    expect($result['using'])->toHaveCount(2);
});

it('ignores third-party dependencies — this is a FANCY tool', function () {
    fakeRegistries(npm: [
        '@particle-academy/react-fancy' => npmDoc('@particle-academy/react-fancy', '5.26.0', [
            'clsx' => '^2.0.0',
            'tailwind-merge' => '^2.0.0',
        ], ['react' => '^19.0.0']),
    ]);

    $result = checkVersions(['lang' => 'node', 'packages' => ['react-fancy']]);

    expect($result['add'])->toBe([]);
});

it('counts prism as first-party, fork or not', function () {
    // It is a maintained fork under our own vendor name, and it went unlisted in
    // every registry for months precisely because it did not look like a Fancy
    // package. A consumer on fancy-flow-php needs to hear about it.
    fakeRegistries(composer: [
        'particle-academy/fancy-flow-php' => packagistDoc('particle-academy/fancy-flow-php', '0.16.0', [
            'php' => '^8.4',
            'particle-academy/prism' => '^1.0',
        ]),
        'particle-academy/prism' => packagistDoc('particle-academy/prism', '1.4.0'),
    ]);

    $result = checkVersions(['lang' => 'php', 'packages' => ['fancy-flow-php']]);

    expect(collect($result['add'])->pluck('package'))->toContain('particle-academy/prism');
});

it('resolves a marketplace node to the engine version it needs', function () {
    // A node is VENDORED SOURCE, not a package — there is no version to bump.
    // What it carries is an engine floor, and a graph whose engine is below it
    // fails at that node with nothing visible beforehand.
    fakeRegistries(npm: [
        '@particle-academy/fancy-flow' => npmDoc('@particle-academy/fancy-flow', '0.65.2'),
    ]);

    $result = checkVersions([
        'lang' => 'node',
        'packages' => ['@particle-academy/deep_research'],
    ]);

    expect($result['nodes'])->toHaveCount(1);
    expect($result['nodes'][0]['kind'])->toBe('@particle-academy/deep_research');
    expect($result['nodes'][0]['engine'])->not->toBeNull();
    expect($result['nodes'][0]['vendored'])->toBeTrue();
});

it('names a package it does not recognise instead of dropping it', function () {
    fakeRegistries();

    $result = checkVersions([
        'lang' => 'node',
        'packages' => ['react-fancy', 'some-other-teams-thing'],
    ]);

    expect($result['not_recognised'])->toContain('some-other-teams-thing');
});

it('reports an unreachable registry as unknown rather than current', function () {
    // The rule that makes this tool trustworthy. A 500 is not a "no" and it is
    // certainly not a "yes" — it is the absence of an answer.
    Http::fake([
        'registry.npmjs.org/*' => Http::response('upstream exploded', 500),
        'repo.packagist.org/*' => Http::response('upstream exploded', 500),
        'pypi.org/*' => Http::response('upstream exploded', 500),
    ]);

    $result = checkVersions(['lang' => 'node', 'packages' => ['react-fancy']]);

    expect($result['using'][0]['status'])->toBe('unknown');
    expect($result['using'][0]['latest'])->toBeNull();
});

it('distinguishes "not published yet" from "could not tell"', function () {
    // A 404 is a real answer: the package is decided but unreleased. Collapsing
    // it into "unknown" would send someone debugging their network.
    fakeRegistries();

    $result = checkVersions(['lang' => 'node', 'packages' => ['react-fancy']]);

    expect($result['using'][0]['status'])->toBe('not-published');
});

it('refuses a language it cannot resolve, rather than picking one', function () {
    fakeRegistries();

    $result = checkVersions(['lang' => 'cobol', 'packages' => ['react-fancy']]);

    expect($result['error'] ?? '')->toContain('cobol');
});
