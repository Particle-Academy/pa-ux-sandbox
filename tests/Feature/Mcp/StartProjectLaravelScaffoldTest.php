<?php

/**
 * `start_project`'s Laravel scaffold must lead with the starter kit.
 *
 * It told agents to assemble the app by hand (`laravel new` + `composer require
 * inertiajs/inertia-laravel` + three npm installs) and never named the kit, so a
 * consumer's agent did exactly that and ended up without auth, tests, PWA or
 * charts that one command would have given it.
 */

use App\Mcp\Tools\StartProject;
use Tests\TestCase;

uses(TestCase::class);

/** @return list<string> */
function laravelScaffold(): array
{
    $r = new ReflectionClass(StartProject::class);
    $m = $r->getMethod('php');
    $m->setAccessible(true);

    return $m->invoke($r->newInstanceWithoutConstructor())['scaffold'];
}

it('starts the Laravel scaffold with the starter kit', function () {
    expect(laravelScaffold()[0])->toStartWith('laravel new my-app --using=particle-academy/fancy-starter-kit');
});

it('says what the starter kit already includes', function () {
    $first = laravelScaffold()[0];

    foreach (['react-fancy', 'fancy-inertia', 'fancy-query', 'fancy-echarts', 'fancy-pwa', 'fancy-screens', 'Pest', 'auth'] as $included) {
        expect($first)->toContain($included);
    }
});

it('says Prism is not in the kit and names its package', function () {
    $text = implode("\n", laravelScaffold());

    expect($text)->toMatch('/Prism[^\n]*not[^\n]*included|not[^\n]*include[^\n]*Prism/i')
        ->and($text)->toContain('particle-academy/prism');
});

it('keeps the by-hand steps as the alternative for an existing app', function () {
    $text = implode("\n", laravelScaffold());

    expect($text)->toMatch('/existing app/i')
        ->and($text)->toContain('composer require inertiajs/inertia-laravel')
        ->and($text)->toContain('npm install @particle-academy/react-fancy @particle-academy/fancy-inertia @particle-academy/fancy-query');
});

it('names every Fancy package the starter kit really installs', function () {
    $path = dirname(base_path()).'/fancy-starter-kit/package.json';
    if (! is_file($path)) {
        $this->markTestSkipped('fancy-starter-kit is not checked out beside this app.');
    }

    $deps = array_keys(json_decode((string) file_get_contents($path), true)['dependencies'] ?? []);
    $fancy = array_values(array_filter($deps, fn (string $d) => str_starts_with($d, '@particle-academy/')));

    expect($fancy)->not->toBeEmpty();

    foreach ($fancy as $dep) {
        expect(laravelScaffold()[0])->toContain(substr($dep, strlen('@particle-academy/')));
    }
})->group('envelope');
