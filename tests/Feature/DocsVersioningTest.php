<?php

use App\Support\Docs\DocsArchive;
use App\Support\Docs\DocsRegistry;
use App\Support\Docs\SupportPolicy;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

uses(TestCase::class);

/**
 * Build a throwaway snapshot so the archive is exercised for real rather than
 * against whatever versions happen to be committed. Cleaned up after each test
 * that asks for one.
 */
function snapshot(string $version, array $sections = [['label' => 'Reference', 'pages' => [['slug' => 'introduction', 'title' => 'Old intro'], ['slug' => 'cli', 'title' => 'Old CLI']]]]): void
{
    $dir = base_path("resources/docs/$version");
    File::ensureDirectoryExists($dir);
    File::put("$dir/introduction.md", "Docs frozen at v$version.");
    File::put("$dir/cli.md", 'The old CLI page.');
    File::put(DocsArchive::manifestPath($version), json_encode(['version' => $version, 'sections' => $sections]));
}

function dropSnapshot(string $version): void
{
    File::deleteDirectory(base_path("resources/docs/$version"));
}

afterEach(fn () => dropSnapshot('0.1'));

// ─── The support policy ──────────────────────────────────────────────────────

it('derives the end dates rather than storing them', function () {
    $table = SupportPolicy::table();

    expect($table)->toContain('Bug fixes until')->toContain('Security fixes until');
});

it('has no end dates for the current line, because its clock has not started', function () {
    $current = collect(SupportPolicy::lines())->firstWhere('current', true);

    expect($current)->not->toBeNull();
    expect($current['bugFixesUntil'])->toBeNull();
    expect($current['securityUntil'])->toBeNull();
    expect($current['status'])->toBe('Active development');
});

/**
 * The drift this whole design is trying to prevent. kit.json is bumped at a cut;
 * if SupportPolicy::LINES is not updated in the same change, the site advertises
 * one version and the support table describes another — and nothing else would
 * say so.
 */
it('lists the current kit version as a line', function () {
    $versions = collect(SupportPolicy::lines())->pluck('version');

    expect($versions)->toContain(config('kit.version'));
});

it('treats every listed line as supported until it goes EOL', function () {
    $supported = collect(SupportPolicy::supported())->pluck('status');

    expect($supported)->not->toContain('End of life');
});

// ─── The archive ─────────────────────────────────────────────────────────────

it('finds a snapshot and serves its pages', function () {
    snapshot('0.1');

    expect(DocsArchive::exists('0.1'))->toBeTrue();

    $this->get('/docs/0.1/introduction')
        ->assertOk()
        ->assertSee('Docs frozen at v0.1', false);
});

it('404s a version that was never snapshotted', function () {
    $this->get('/docs/9.9/introduction')->assertNotFound();
});

/**
 * The reason a snapshot carries its own manifest. Rendering an old version
 * through the CURRENT sidebar would link a reader to pages that did not exist
 * then — each one 404ing, with nothing explaining why.
 */
it('uses the snapshot manifest for the sidebar, not the current registry', function () {
    snapshot('0.1');

    $archived = collect(DocsArchive::flat('0.1'))->pluck('slug');
    $current = collect(DocsRegistry::flat())->pluck('slug');

    expect($archived->all())->toBe(['introduction', 'cli']);
    expect($current->count())->toBeGreaterThan($archived->count());
    expect($current)->toContain('versions');
    expect($archived)->not->toContain('versions');
});

/**
 * Asserted on the props rather than the markup: the sidebar and the banner are
 * rendered by React, and the test environment runs no SSR, so the HTML is only
 * the shell. The props are what the component is handed either way.
 */
it('tells the page which version it is showing, and that it is not the current one', function () {
    snapshot('0.1');

    $this->get('/docs/0.1/introduction')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('version.active', '0.1')
            ->where('version.current', config('kit.version'))
            ->where('version.isCurrent', false)
        );
});

it('hands the page the archived sidebar, so its links stay in that version', function () {
    snapshot('0.1');

    $this->get('/docs/0.1/introduction')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('sections.0.pages.1.slug', 'cli')
            ->where('neighbors.next.slug', 'cli')
        );
});

it('does not serve the current version under a version prefix, so a page has one URL', function () {
    // Two URLs for the same page would split its search ranking and its
    // inbound links.
    snapshot(config('kit.version'));

    $this->get('/docs/'.config('kit.version').'/introduction')->assertNotFound();

    dropSnapshot(config('kit.version'));
});

it('always offers the current version, listed first and marked current', function () {
    // Asserted about the CURRENT entry rather than the size of the list. These
    // two tests used to pin the absolute set, which only held while no snapshot
    // was committed — the 0.5 cut froze resources/docs/0.4 and both started
    // failing on a correct archive.
    $selectable = DocsArchive::selectable();

    expect($selectable[0]['version'])->toBe(config('kit.version'));
    expect($selectable[0]['current'])->toBeTrue();
});

it('offers the archived version alongside the current one once a snapshot exists', function () {
    $before = collect(DocsArchive::selectable())->pluck('version')->all();

    snapshot('0.1');

    $after = collect(DocsArchive::selectable())->pluck('version');

    // The fixture appears, the current version stays at the head, and every
    // version that was already archived is still there.
    expect($after)->toContain('0.1');
    expect($after->first())->toBe(config('kit.version'));
    expect($after->all())->toBe([...$before, '0.1']);
});

it('lists archived versions newest first, under the current one', function () {
    // The order the selector renders in. A user looking for the version they
    // are on scans from the top.
    snapshot('0.1');

    $versions = collect(DocsArchive::selectable())->pluck('version')->all();
    $archived = array_slice($versions, 1);

    expect($archived)->toBe(array_values(array_reverse(collect($archived)->sort()->values()->all())));
});

// ─── The snapshot command ────────────────────────────────────────────────────

it('snapshots the docs with a manifest', function () {
    $this->artisan('docs:snapshot', ['version' => '0.1'])->assertSuccessful();

    expect(File::exists(DocsArchive::manifestPath('0.1')))->toBeTrue();
    expect(File::exists(base_path('resources/docs/0.1/introduction.md')))->toBeTrue();
});

it('refuses to overwrite an existing snapshot without --force', function () {
    snapshot('0.1');

    $this->artisan('docs:snapshot', ['version' => '0.1'])->assertFailed();
    // The stub content survives, so nothing was clobbered.
    expect(File::get(base_path('resources/docs/0.1/introduction.md')))->toContain('frozen at v0.1');
});

it('rejects a version that is not a kit version', function () {
    $this->artisan('docs:snapshot', ['version' => 'latest'])->assertFailed();
});

/**
 * Copying recursively would nest every past snapshot inside the new one, and
 * each subsequent cut would double the archive.
 */
it('does not nest existing snapshots inside a new one', function () {
    snapshot('0.1');

    $this->artisan('docs:snapshot', ['version' => '0.2'])->assertSuccessful();

    expect(File::isDirectory(base_path('resources/docs/0.2/0.1')))->toBeFalse();

    dropSnapshot('0.2');
});
