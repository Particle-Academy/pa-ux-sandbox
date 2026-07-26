<?php

use App\Support\PackageRegistry;
use App\Support\Registry\ReadmeSource;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

uses(TestCase::class);

/**
 * Where a package's documentation comes from.
 *
 * It used to be `node_modules/<npm>` and `vendor/<composer>` — which made a
 * package's docs a side effect of THIS app's dependency list. Every package the
 * showcase doesn't install (the `-js` twins, the eight git provider adapters)
 * had no documentation at all, and because a member with no components and no
 * README doesn't keep its own page, several of them redirected away entirely,
 * taking hand-written PackageContext prose with them.
 */
it('reads a package README from its own repo, installed or not', function () {
    $source = app(ReadmeSource::class);

    // fancy-git-js is published, real, and NOT a dependency of this app.
    expect(base_path('node_modules/@particle-academy/fancy-git-js'))->not->toBeDirectory();

    $markdown = $source->markdownFor(PackageRegistry::findAny('fancy-git-js') ?? ['slug' => 'fancy-git-js']);

    expect($markdown)->not->toBeNull();
})->skip(fn () => app(ReadmeSource::class)->repoDir('fancy-git-js') === null, 'needs the sibling repos');

it('serves the pages that used to redirect for want of a README', function (string $slug) {
    // These are the packages the old sourcing silently un-documented.
    $this->get("/packages/{$slug}")->assertOk();
})->with(['fancy-git-js', 'fancy-term-host', 'holy-sheet-js', 'fancy-mlm-js', 'fancy-x-files-js']);

it('falls back to the compiled artifact when no repo is on disk', function () {
    // Production deploys only this app, so the artifact IS the source there.
    // Losing this path means every uninstalled package loses its docs on prod
    // while looking fine locally — the worst shape for a docs bug.
    File::ensureDirectoryExists(dirname(ReadmeSource::compiledPath()));
    $original = File::exists(ReadmeSource::compiledPath()) ? File::get(ReadmeSource::compiledPath()) : null;

    File::put(ReadmeSource::compiledPath(), json_encode(['readmes' => ['made-up-pkg' => '# Compiled']]));

    $markdown = (new ReadmeSource)->markdownFor(['slug' => 'made-up-pkg']);

    expect($markdown)->toBe('# Compiled');

    $original === null ? File::delete(ReadmeSource::compiledPath()) : File::put(ReadmeSource::compiledPath(), $original);
});

it('reports no README rather than inventing one', function () {
    expect((new ReadmeSource)->markdownFor(['slug' => 'definitely-not-a-package']))->toBeNull();
});

it('compiles every package that has one', function () {
    $this->artisan('readmes:build')->assertSuccessful();

    $compiled = json_decode(File::get(ReadmeSource::compiledPath()), true)['readmes'] ?? [];

    // The artifact is what production reads. A build that quietly produces an
    // empty one would look like a successful deploy and read like a dead site.
    expect(count($compiled))->toBeGreaterThan(40);
    expect($compiled)->toHaveKey('fancy-git-js');
})->skip(fn () => ! app(ReadmeSource::class)->liveSourceAvailable(), 'needs the sibling repos');
