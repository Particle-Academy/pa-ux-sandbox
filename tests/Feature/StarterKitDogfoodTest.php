<?php

declare(strict_types=1);

use App\Support\StarterKitDogfood;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

/*
 * `kit:dogfood-starter-kit` -- the Laravel starter kit's COMMITTED lockfiles
 * must carry the latest release of every first-party package.
 *
 * `kit:dogfood` checks what the SHOWCASE installs. Nothing checked the starter
 * kit, and a fresh `laravel new --using=particle-academy/fancy-starter-kit`
 * installs from the kit's lockfile, so a stale lockfile hands every new user an
 * old release. Measured 2026-10-27: react-fancy 5.65.0 in the kit against 5.71.0
 * on npm, six releases, with the rule that forbids it already written down.
 *
 * Every test fakes every request and refuses strays: this asks GitHub and two
 * registries a question, and a test that reached the network would pass or
 * fail on someone else's uptime.
 */

const SK_NPM_LOCK = 'https://raw.githubusercontent.com/Particle-Academy/fancy-starter-kit/main/package-lock.json';
const SK_COMPOSER_LOCK = 'https://raw.githubusercontent.com/Particle-Academy/fancy-starter-kit/main/composer.lock';

/**
 * A package-lock.json v3 body.
 *
 * @param  array<string, string>  $paths  lockfile path => version
 */
function skNpmLock(array $paths): array
{
    $packages = ['' => ['name' => 'fancy-starter-kit']];

    foreach ($paths as $path => $version) {
        $packages[$path] = ['version' => $version, 'resolved' => 'https://registry.npmjs.org/x.tgz'];
    }

    // A third-party entry, so the filter is exercised rather than assumed.
    $packages['node_modules/react'] = ['version' => '19.2.8'];

    return ['name' => 'fancy-starter-kit', 'lockfileVersion' => 3, 'packages' => $packages];
}

/** @param array<string, string> $packages name => version */
function skComposerLock(array $packages, array $dev = []): array
{
    $rows = fn (array $set) => array_map(
        fn (string $name, string $version) => ['name' => $name, 'version' => $version],
        array_keys($set),
        array_values($set),
    );

    return [
        'packages' => [...$rows($packages), ['name' => 'laravel/framework', 'version' => 'v13.34.0']],
        'packages-dev' => $rows($dev),
    ];
}

function skNpmLatest(string $version): array
{
    return ['dist-tags' => ['latest' => $version], 'versions' => [$version => []]];
}

function skPackagistLatest(string $name, string $version): array
{
    return ['packages' => [$name => [['version' => $version, 'require' => []]]]];
}

/**
 * The happy world: two first-party npm packages, current; a composer.lock with
 * none, which is the kit's real state today.
 *
 * @param  array<string, mixed>  $overrides  url pattern => response, applied first
 */
function skFake(array $overrides = []): void
{
    Http::preventStrayRequests();
    // array_replace, not a spread with the overrides first: a later duplicate
    // key overwrites an earlier one, so that order silently kept every default.
    Http::fake(array_replace([
        SK_NPM_LOCK => Http::response(skNpmLock([
            'node_modules/@particle-academy/react-fancy' => '5.71.0',
            'node_modules/@particle-academy/fancy-inertia' => '0.14.0',
        ])),
        SK_COMPOSER_LOCK => Http::response(skComposerLock([])),
        'https://registry.npmjs.org/@particle-academy%2Freact-fancy' => Http::response(skNpmLatest('5.71.0')),
        'https://registry.npmjs.org/@particle-academy%2Ffancy-inertia' => Http::response(skNpmLatest('0.14.0')),
    ], $overrides));
}

/** @return array{0: int, 1: string} */
function skRun(array $args = []): array
{
    $code = Artisan::call('kit:dogfood-starter-kit', $args);

    return [$code, Artisan::output()];
}

it('passes when the committed lockfiles carry the latest of every first-party package, and says how many it read', function () {
    skFake();

    [$code, $out] = skRun();

    expect($code)->toBe(0)
        // The denominator. A check that cannot say how much it looked at cannot
        // be trusted when it says it found nothing.
        ->and($out)->toContain('2 first-party packages')
        ->and($out)->toContain('package-lock.json: 2')
        ->and($out)->toContain('composer.lock: 0');
});

it('fails on a first-party npm package that is behind, naming both versions', function () {
    skFake([
        SK_NPM_LOCK => Http::response(skNpmLock([
            'node_modules/@particle-academy/react-fancy' => '5.65.0',
            'node_modules/@particle-academy/fancy-inertia' => '0.14.0',
        ])),
    ]);

    [$code, $out] = skRun();

    expect($code)->toBe(1)
        ->and($out)->toContain('BEHIND')
        ->and($out)->toContain('@particle-academy/react-fancy  5.65.0 -> 5.71.0');
});

it('reads composer.lock too, including require-dev', function () {
    skFake([
        SK_COMPOSER_LOCK => Http::response(skComposerLock(
            ['particle-academy/fancy-seo' => 'v0.5.0'],
            ['particle-academy/laravel-fms' => 'v0.12.0'],
        )),
        'https://repo.packagist.org/p2/particle-academy/fancy-seo.json' => Http::response(skPackagistLatest('particle-academy/fancy-seo', 'v0.6.0')),
        'https://repo.packagist.org/p2/particle-academy/laravel-fms.json' => Http::response(skPackagistLatest('particle-academy/laravel-fms', 'v0.12.0')),
    ]);

    [$code, $out] = skRun();

    expect($code)->toBe(1)
        ->and($out)->toContain('composer.lock: 2')
        ->and($out)->toContain('particle-academy/fancy-seo  0.5.0 -> 0.6.0')
        ->and($out)->not->toContain('particle-academy/laravel-fms  ');
});

it('reports a nested copy that is behind, even when the top-level one is current', function () {
    // npm installs a second copy under a dependent when ranges disagree. That
    // copy is code the app runs, and keying by name alone would hide it behind
    // the current top-level one.
    skFake([
        SK_NPM_LOCK => Http::response(skNpmLock([
            'node_modules/@particle-academy/react-fancy' => '5.71.0',
            'node_modules/@particle-academy/fancy-inertia' => '0.14.0',
            'node_modules/@particle-academy/fancy-inertia/node_modules/@particle-academy/react-fancy' => '5.60.0',
        ])),
    ]);

    [$code, $out] = skRun();

    expect($code)->toBe(1)
        ->and($out)->toContain('3 first-party packages')
        ->and($out)->toContain('5.60.0 -> 5.71.0')
        ->and($out)->toContain('under node_modules/@particle-academy/fancy-inertia');
});

it('FAILS when a registry lookup fails, rather than counting the package as current', function () {
    skFake([
        'https://registry.npmjs.org/@particle-academy%2Ffancy-inertia' => Http::response('upstream down', 503),
    ]);

    [$code, $out] = skRun();

    expect($code)->toBe(1)
        ->and($out)->toContain('UNKNOWN')
        ->and($out)->toContain('@particle-academy/fancy-inertia');
});

it('FAILS when the registry says a locked package does not exist', function () {
    skFake([
        'https://registry.npmjs.org/@particle-academy%2Ffancy-inertia' => Http::response('', 404),
    ]);

    [$code, $out] = skRun();

    expect($code)->toBe(1)->and($out)->toContain('@particle-academy/fancy-inertia');
});

it('FAILS when a lockfile cannot be fetched', function (string $which) {
    skFake([$which === 'npm' ? SK_NPM_LOCK : SK_COMPOSER_LOCK => Http::response('', 500)]);

    [$code, $out] = skRun();

    expect($code)->toBe(1)
        ->and($out)->toContain('UNKNOWN')
        ->and($out)->toContain($which === 'npm' ? 'package-lock.json' : 'composer.lock');
})->with(['npm', 'composer']);

it('FAILS when a lockfile is not the JSON it should be', function (mixed $body) {
    skFake([SK_NPM_LOCK => Http::response($body)]);

    [$code, $out] = skRun();

    expect($code)->toBe(1)->and($out)->toContain('UNKNOWN');
})->with([
    'an HTML error page' => ['<html>rate limited</html>'],
    'JSON with no packages map' => [['lockfileVersion' => 3]],
]);

it('FAILS when package-lock.json names no first-party package at all', function () {
    // The kit IS react-fancy + fancy-inertia + fancy-query. A lockfile with none
    // of them is a broken read -- a renamed scope, a moved file -- and passing it
    // would report "all current" over nothing.
    skFake([SK_NPM_LOCK => Http::response(skNpmLock([]))]);

    [$code, $out] = skRun();

    expect($code)->toBe(1)->and($out)->toContain('names no first-party package');
});

it('FAILS when a transport error is thrown', function () {
    skFake([
        SK_NPM_LOCK => fn () => throw new ConnectionException('connection reset'),
    ]);

    [$code, $out] = skRun();

    expect($code)->toBe(1)->and($out)->toContain('connection reset');
});

it('emits the same verdict as JSON', function () {
    skFake([
        SK_NPM_LOCK => Http::response(skNpmLock([
            'node_modules/@particle-academy/react-fancy' => '5.65.0',
            'node_modules/@particle-academy/fancy-inertia' => '0.14.0',
        ])),
    ]);

    [$code, $out] = skRun(['--json' => true]);
    $json = json_decode($out, true, 512, JSON_THROW_ON_ERROR);

    expect($code)->toBe(1)
        ->and($json['ok'])->toBeFalse()
        ->and($json['checked'])->toBe(['package-lock.json' => 2, 'composer.lock' => 0])
        ->and($json['behind'])->toBe(['@particle-academy/react-fancy' => ['5.65.0', '5.71.0']]);
});

it('reads the kit from GitHub main of the real repository', function () {
    expect(StarterKitDogfood::NPM_LOCK_URL)->toBe(SK_NPM_LOCK)
        ->and(StarterKitDogfood::COMPOSER_LOCK_URL)->toBe(SK_COMPOSER_LOCK);
});

it('is registered, and the nightly Dogfood workflow runs it', function () {
    // A check nobody runs is a note. kit:dogfood is nightly; this belongs beside it.
    expect(array_key_exists('kit:dogfood-starter-kit', app(Kernel::class)->all()))->toBeTrue();

    $workflow = (string) file_get_contents(base_path('.github/workflows/dogfood.yml'));

    expect($workflow)->toContain('run: php artisan kit:dogfood-starter-kit');
});
