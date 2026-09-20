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

it('compiles exactly the packages production cannot read any other way', function () {
    $this->artisan('readmes:build')->assertSuccessful();

    $compiled = json_decode(File::get(ReadmeSource::compiledPath()), true)['readmes'] ?? [];
    $readmes = new ReadmeSource;

    // Non-empty: a build that quietly produced an empty artifact would look
    // like a successful deploy and read like a dead site for every uninstalled
    // package. This used to assert `> 40`, back when the artifact held EVERY
    // package; it now holds only the ones with no other source, so the number
    // moved for a reason rather than because something shrank unexpectedly.
    expect(count($compiled))->toBeGreaterThan(10);

    // The shape the whole artifact exists for: real, published packages the
    // showcase does NOT install, so nothing else can serve their docs on prod.
    //
    // Named individually rather than counted, because the count is what went
    // stale last time. `fancy-git-js` used to be the example here and no longer
    // qualifies -- its slug differs from its npm name (`@particle-academy/
    // fancy-git`), which IS installed, so it reads from the package now. That
    // is the correct outcome and the old assertion had simply stopped
    // describing reality.
    expect($compiled)->toHaveKey('fancy-term-host')
        ->and($compiled)->toHaveKey('holy-sheet-js')
        ->and($compiled)->toHaveKey('fancy-git-github-js');

    // And the other half of the new rule: an INSTALLED package must not be
    // copied in here at all. Its README ships with it, `ReadmeSource` reads
    // that first, and a copy could only ever be a stale duplicate.
    $installedButCopied = array_values(array_filter(
        array_keys($compiled),
        fn (string $slug) => $readmes->isInstalled(
            collect($readmes->everyPackage())->firstWhere('slug', $slug) ?? []
        ),
    ));

    expect($installedButCopied)->toBe([], 'these are installed, so the artifact is duplicating a file that already ships with the package');
})->skip(fn () => ! app(ReadmeSource::class)->liveSourceAvailable(), 'needs the sibling repos');

/**
 * An INSTALLED package's README comes from the package, not from a copy of it.
 *
 * `readmes.json` is a 695KB duplicate of content that already exists on disk.
 * A duplicate goes stale the moment a package ships, silently, because nothing
 * compares the two. For anything the showcase actually installs, the real file
 * is right there in `node_modules` / `vendor` at exactly the version in use.
 *
 * So the artifact is the fallback for packages the showcase does NOT install —
 * which is the case it was added for — and not the answer for the ones it does.
 */
it('prefers the installed package over the compiled copy', function () {
    // A package with no sibling repo on disk, so `fromRepo` cannot answer and
    // the test is genuinely about installed-vs-compiled.
    $pkg = ['slug' => 'readme-order-probe', 'npm' => '@particle-academy/react-fancy'];

    $installed = base_path('node_modules/@particle-academy/react-fancy/README.md');
    expect(File::exists($installed))->toBeTrue('react-fancy must be installed for this test to mean anything');

    File::ensureDirectoryExists(dirname(ReadmeSource::compiledPath()));
    $original = File::exists(ReadmeSource::compiledPath()) ? File::get(ReadmeSource::compiledPath()) : null;
    File::put(ReadmeSource::compiledPath(), json_encode([
        'readmes' => ['readme-order-probe' => '# STALE COPY — must not win'],
    ]));

    $markdown = (new ReadmeSource)->markdownFor($pkg);

    $original === null ? File::delete(ReadmeSource::compiledPath()) : File::put(ReadmeSource::compiledPath(), $original);

    expect($markdown)->not->toBeNull()
        ->and($markdown)->not->toContain('STALE COPY')
        ->and($markdown)->toBe(File::get($installed));
});

/**
 * The other half, stated separately so a failure names which rule broke: an
 * UNINSTALLED package still reads from the artifact. This is the bug the
 * artifact exists to prevent — production deploys only this app, so without it
 * every package the showcase does not depend on loses its docs there.
 */
it('still serves an uninstalled package from the compiled copy', function () {
    $pkg = ['slug' => 'readme-order-probe-absent', 'npm' => '@particle-academy/not-installed-anywhere'];

    File::ensureDirectoryExists(dirname(ReadmeSource::compiledPath()));
    $original = File::exists(ReadmeSource::compiledPath()) ? File::get(ReadmeSource::compiledPath()) : null;
    File::put(ReadmeSource::compiledPath(), json_encode([
        'readmes' => ['readme-order-probe-absent' => '# From the artifact'],
    ]));

    $markdown = (new ReadmeSource)->markdownFor($pkg);

    $original === null ? File::delete(ReadmeSource::compiledPath()) : File::put(ReadmeSource::compiledPath(), $original);

    expect($markdown)->toBe('# From the artifact');
});

/**
 * PRODUCTION SHAPE: every package must resolve without a sibling repo on disk.
 *
 * This is the test that makes shrinking the artifact safe, and it deliberately
 * does NOT go through `markdownFor()` — that would consult `fromRepo()` first,
 * which succeeds locally and in CI because the sibling repos are checked out,
 * and would therefore pass while production had nothing. A check that can only
 * pass is not a check.
 *
 * So it asks the question production asks: is this package INSTALLED, or is it
 * in the COMPILED artifact? Those are the only two sources on the server.
 *
 * It fails if a dependency is dropped without rebuilding the artifact — which
 * is exactly how this could silently lose a package's docs now that
 * `readmes:build` skips installed packages.
 */
it('resolves every package through a source that exists in production', function () {
    $readmes = new ReadmeSource;
    $compiled = $readmes->compiled();

    $unreachable = [];

    foreach ($readmes->everyPackage() as $pkg) {
        $slug = (string) ($pkg['slug'] ?? '');
        if ($slug === '') {
            continue;
        }

        // A package with no README anywhere is a documented state, not a bug —
        // it is only a problem when the repo HAS one that production cannot see.
        if ($readmes->fromRepo($slug, $pkg) === null) {
            continue;
        }

        if ($readmes->isInstalled($pkg)) {
            continue;
        }

        if (isset($compiled[$slug]) && trim((string) $compiled[$slug]) !== '') {
            continue;
        }

        $unreachable[] = $slug;
    }

    expect($unreachable)->toBe([], 'these have a README in their repo but no source production can reach — run `php artisan readmes:build` and commit the artifact');
});
