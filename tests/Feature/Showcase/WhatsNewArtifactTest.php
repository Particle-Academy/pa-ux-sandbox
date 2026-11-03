<?php

use App\Support\Notices\ChangelogSummary;
use App\Support\Notices\WhatsNewFeed;
use App\Support\PackageRegistry;
use App\Support\Registry\ReadmeSource;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The release half of the "What's new" feed is a COMMITTED artifact,
 * resources/notices/releases.json, written by `php artisan notices:build`.
 *
 * Why an artifact: the app knows which version it installs (the lockfiles) but
 * not WHEN any version was published, and the only source of that is the
 * registries. Asking them per request is what this must never do, so the
 * command asks once, at release time, the way `registry:build` and
 * `readmes:build` work.
 *
 * An artifact somebody has to remember to rebuild goes stale silently, so the
 * last test here fails the suite when the app installs a first-party version
 * the artifact has never heard of: the sandbox dogfoods every release in the
 * same session, so that is exactly the moment the rebuild is due.
 */

function whatsNewNpmBody(array $times, string $latest): array
{
    return [
        'dist-tags' => ['latest' => $latest],
        'time' => ['created' => '2026-01-01T00:00:00.000Z', 'modified' => '2026-10-21T00:00:00.000Z'] + $times,
    ];
}

/**
 * A directory of repos by folder name, each with the given CHANGELOG.md (null:
 * the repo has none). Stands in for the envelope's sibling repos, so these tests
 * run the same in a single-repo checkout.
 *
 * @param  array<string, ?string>  $changelogs
 */
function whatsNewRepos(array $changelogs): string
{
    $root = storage_path('framework/testing/whats-new-repos-'.uniqid());

    foreach ($changelogs as $folder => $changelog) {
        File::ensureDirectoryExists("{$root}/{$folder}");

        if ($changelog !== null) {
            File::put("{$root}/{$folder}/CHANGELOG.md", $changelog);
        }
    }

    return $root;
}

it('gives each release the summary from its own section of its own changelog', function () {
    Http::preventStrayRequests();
    Http::fake([
        'registry.npmjs.org/@particle-academy%2Freact-fancy' => Http::response(whatsNewNpmBody([
            '5.53.1' => '2026-10-21T07:55:25.161Z',
            '5.53.10' => '2026-10-21T08:55:25.161Z',
            '5.54.0' => '2026-10-21T15:50:30.567Z',
        ], '5.54.0')),
    ]);

    $out = storage_path('framework/testing/releases-'.uniqid().'.json');

    $this->artisan('notices:build', [
        '--output' => $out,
        '--now' => '2026-10-21T20:00:00Z',
        '--only' => 'react-fancy',
        '--repos' => whatsNewRepos(['react-fancy' => <<<'MD'
            # Changelog

            ## [Unreleased]

            ### Added

            - **Not shipped yet.** Soon.

            ## [5.53.10] - 2026-10-21

            ### Fixed

            - **The tenth patch.** Details.

            ## [5.53.1] - 2026-10-21

            ### Fixed

            - **`Toast.Stack` puts the front card first.** Details.
            MD]),
    ])->assertSuccessful();

    $built = json_decode(File::get($out), true);

    expect(array_column($built['releases'], 'summary', 'version'))->toBe([
        // No section for the newest: null, not the section beside it.
        '5.54.0' => null,
        '5.53.10' => 'The tenth patch',
        '5.53.1' => 'Toast.Stack puts the front card first',
    ]);
});

it('reads the changelog of the repo that publishes that slug', function () {
    Http::preventStrayRequests();
    Http::fake([
        'repo.packagist.org/p2/particle-academy/fancy-git.json' => Http::response(['packages' => ['particle-academy/fancy-git' => [
            ['version' => 'v0.4.1', 'time' => '2026-10-21T11:00:00+00:00'],
        ]]]),
        'registry.npmjs.org/@particle-academy%2Ffancy-git' => Http::response(whatsNewNpmBody([
            '0.4.1' => '2026-10-21T12:00:00.000Z',
        ], '0.4.1')),
    ]);

    $out = storage_path('framework/testing/releases-'.uniqid().'.json');

    $this->artisan('notices:build', [
        '--output' => $out,
        '--now' => '2026-10-21T20:00:00Z',
        '--only' => 'fancy-git,fancy-git-js',
        '--repos' => whatsNewRepos([
            // The PHP core owns the bare name, but its repo has the suffix.
            'fancy-git-php' => "## [0.4.1]\n\n- **The PHP entry.**\n",
            'fancy-git-js' => "## [0.4.1]\n\n- **The Node entry.**\n",
            // A folder named after the slug is not that package's repo.
            'fancy-git' => "## [0.4.1]\n\n- **The wrong folder.**\n",
        ]),
    ])->assertSuccessful();

    expect(array_column(json_decode(File::get($out), true)['releases'], 'summary', 'slug'))->toBe([
        'fancy-git-js' => 'The Node entry',
        'fancy-git' => 'The PHP entry',
    ]);
});

it('says how many releases got a summary and why the rest did not', function () {
    Http::preventStrayRequests();
    Http::fake([
        'registry.npmjs.org/*' => Http::response(whatsNewNpmBody(['1.0.0' => '2026-10-21T12:00:00.000Z', '1.1.0' => '2026-10-21T13:00:00.000Z'], '1.1.0')),
    ]);

    $out = storage_path('framework/testing/releases-'.uniqid().'.json');

    $this->artisan('notices:build', [
        '--output' => $out,
        '--now' => '2026-10-21T20:00:00Z',
        '--only' => 'react-fancy,fancy-echarts,fancy-code',
        '--repos' => whatsNewRepos([
            'react-fancy' => "## [1.1.0]\n\n- **Has one.**\n\n## [1.0.0]\n\n### Added\n",
            'fancy-echarts' => null,
        ]),
    ])
        ->expectsOutputToContain('1 of 6 releases have a summary')
        ->expectsOutputToContain('no repo on disk (2): fancy-code@1.0.0, fancy-code@1.1.0')
        ->expectsOutputToContain('no CHANGELOG.md (2): fancy-echarts@1.0.0, fancy-echarts@1.1.0')
        ->expectsOutputToContain('no usable entry (1): react-fancy@1.0.0')
        ->assertSuccessful();
});

/*
 * Production and a single-repo checkout have no sibling repos. Rebuilding there
 * would quietly blank every summary in the artifact, so it refuses, the way
 * `readmes:build` does. A repo missing from a real envelope is only a null.
 */
it('refuses to build where no package repos are on disk', function () {
    Http::preventStrayRequests();
    Http::fake(['*' => Http::response(whatsNewNpmBody(['1.0.0' => '2026-10-21T12:00:00.000Z'], '1.0.0'))]);

    $out = storage_path('framework/testing/releases-'.uniqid().'.json');

    $this->artisan('notices:build', [
        '--output' => $out,
        '--only' => 'react-fancy',
        '--repos' => storage_path('framework/testing/no-such-repos-'.uniqid()),
    ])->assertFailed();

    expect(is_file($out))->toBeFalse();
});

/*
 * The real artifact. Reads only the committed file, so it holds wherever the
 * suite runs, sibling repos or not.
 */
it('commits summaries that are one clean line', function () {
    $built = json_decode(File::get(resource_path('notices/releases.json')), true, 512, JSON_THROW_ON_ERROR);

    expect($built['releases'])->not->toBeEmpty();

    foreach ($built['releases'] as $release) {
        expect($release)->toHaveKey('summary');

        if ($release['summary'] === null) {
            continue;
        }

        $tag = "{$release['slug']}@{$release['version']}";
        expect(mb_strlen($release['summary']))->toBeLessThanOrEqual(ChangelogSummary::MAX_LENGTH, $tag)
            ->and(preg_match('/[\p{Cc}\p{Cf}\x{2028}\x{2029}]/u', $release['summary']))->toBe(0, $tag)
            ->and(trim($release['summary']))->not->toBe('', $tag);
    }
});

/*
 * Coverage of the packages whose repos are in this envelope. The prism-* family
 * lives in another estate's envelope, so its repos are never on disk here: it is
 * always null, and the share it takes of a rolling 60-day window moves with how
 * busy that estate has been. Counting it would make this test about Prism.
 *
 * 90%: measured 535 of 539 on 2026-11-03. What legitimately stays null is a
 * release newer than the local checkout of its repo (3, fancy-connector-core's
 * pin was behind) or one its changelog skipped (1, fancy-conformance 0.26.0).
 * That is about 1%. Losing a tenth is something else: a repo layout change, or a
 * heading form the extractor no longer reads.
 */
it('does not lose the summaries when the artifact is rebuilt', function () {
    $built = json_decode(File::get(resource_path('notices/releases.json')), true, 512, JSON_THROW_ON_ERROR);

    $ours = array_values(array_filter(
        $built['releases'],
        fn (array $r): bool => $r['slug'] !== 'prism' && ! str_starts_with($r['slug'], 'prism-'),
    ));
    $summarised = array_filter($ours, fn (array $r): bool => is_string($r['summary'] ?? null));

    expect(count($ours))->toBeGreaterThan(100);

    expect(count($summarised) / count($ours))->toBeGreaterThanOrEqual(0.90, sprintf(
        'Only %d of %d releases have a summary. Run `php artisan notices:build` from the envelope and read what it reports.',
        count($summarised),
        count($ours),
    ));
});

/*
 * A summary is only as right as the folder it was read from, and the slug, the
 * published name and the folder can all differ (`fancy-git` publishes
 * particle-academy/fancy-git from fancy-git-php; `fancy-git-js` publishes
 * @particle-academy/fancy-git). The folder must hold the package that releases
 * under that name. Envelope-scoped: it needs the sibling repos.
 */
it('reads every changelog from the repo that publishes the package', function () {
    $readmes = app(ReadmeSource::class);
    $wrong = [];
    $checked = 0;

    foreach ([...PackageRegistry::all(), ...PackageRegistry::companions()] as $pkg) {
        $published = $pkg['npm'] ?? $pkg['composer'] ?? $pkg['pypi'] ?? null;
        $dir = $readmes->repoDir($pkg['slug'], $pkg);

        if ($published === null || $dir === null) {
            continue;
        }
        $checked++;

        $names = [];
        foreach (['package.json', 'composer.json', '*/package.json', '*/composer.json'] as $glob) {
            foreach (glob("{$dir}/{$glob}") ?: [] as $file) {
                $names[] = json_decode((string) file_get_contents($file), true)['name'] ?? null;
            }
        }
        foreach (['pyproject.toml', '*/pyproject.toml'] as $glob) {
            foreach (glob("{$dir}/{$glob}") ?: [] as $file) {
                if (preg_match('/^name\s*=\s*"([^"]+)"/m', (string) file_get_contents($file), $m) === 1) {
                    $names[] = $m[1];
                }
            }
        }

        if (! in_array($published, $names, true)) {
            $wrong[] = "{$pkg['slug']}: publishes {$published}, but ".basename($dir).' holds '.json_encode($names);
        }
    }

    expect($checked)->toBeGreaterThan(50)
        ->and($wrong)->toBe([]);
})->group('envelope');

it('builds release entries from registry publish times', function () {
    Http::preventStrayRequests();
    Http::fake([
        'registry.npmjs.org/@particle-academy%2Ffancy-whats-new' => Http::response(whatsNewNpmBody([
            '0.0.0-stage' => '2026-10-21T17:52:03.145Z',   // bootstrap placeholders: never news
            '0.0.0' => '2026-10-21T17:53:19.547Z',
            '0.1.0' => '2026-10-21T18:06:29.546Z',
        ], '0.1.0')),
        'registry.npmjs.org/@particle-academy%2Freact-fancy' => Http::response(whatsNewNpmBody([
            '5.0.0' => '2026-06-01T00:00:00.000Z',          // outside the window
            '5.53.1' => '2026-10-21T07:55:25.161Z',
            '5.54.0-beta.1' => '2026-10-21T08:00:00.000Z',  // prerelease
            '5.54.0' => '2026-10-21T15:50:30.567Z',
            '4.9.9' => '2026-10-21T16:00:00.000Z',          // a backport: not news here
        ], '5.54.0')),
        'repo.packagist.org/p2/particle-academy/holy-sheet.json' => Http::response(['packages' => ['particle-academy/holy-sheet' => [
            ['version' => 'v2.9.1', 'time' => '2026-10-19T11:55:36+00:00'],
            ['version' => 'v2.9.0', 'time' => '2026-10-19T11:39:37+00:00'],
            ['version' => 'v1.0.0', 'time' => '2026-03-01T00:00:00+00:00'],   // its first, long ago
        ]]]),
        '*' => Http::response([], 404),
    ]);

    $out = storage_path('framework/testing/releases-'.uniqid().'.json');

    $this->artisan('notices:build', [
        '--output' => $out,
        '--now' => '2026-10-21T20:00:00Z',
        '--only' => 'fancy-whats-new,react-fancy,holy-sheet',
        '--repos' => whatsNewRepos(['react-fancy' => '', 'holy-sheet' => '']),
    ])->assertSuccessful();

    $built = json_decode(File::get($out), true);

    expect($built['latest'])->toBe([
        'fancy-whats-new' => '0.1.0',
        'holy-sheet' => '2.9.1',
        'react-fancy' => '5.54.0',
    ]);

    expect(collect($built['releases'])->map(fn ($r) => $r['slug'].'@'.$r['version'].($r['first'] ? ' first' : ''))->all())
        ->toBe([
            'fancy-whats-new@0.1.0 first',
            'react-fancy@5.54.0',
            'react-fancy@5.53.1',
            'holy-sheet@2.9.1',
            'holy-sheet@2.9.0',
        ]);

    expect($built['releases'][0])->toMatchArray([
        'registry' => 'npm',
        'published_at' => '2026-10-21T18:06:29Z',
    ]);
});

it('fails rather than writing a partial artifact when a registry does not answer', function () {
    Http::preventStrayRequests();
    Http::fake(['*' => Http::response('down', 503)]);

    $out = storage_path('framework/testing/releases-'.uniqid().'.json');

    $this->artisan('notices:build', ['--output' => $out, '--only' => 'react-fancy', '--repos' => whatsNewRepos(['react-fancy' => ''])])->assertFailed();

    expect(is_file($out))->toBeFalse();
});

/*
 * prism-acp is registered and on Packagist with ONLY pre-releases
 * (v0.1.0-alpha.1..5). That is an answer, not a failed lookup: there is no
 * stable release to announce, exactly like the 404 branch. Treating it as a
 * failure stopped notices:build writing anything at all for the whole kit.
 */
it('skips a package that has only pre-releases, like an unpublished one', function () {
    Http::preventStrayRequests();
    Http::fake(['repo.packagist.org/*' => Http::response(['packages' => ['particle-academy/prism-acp' => [
        ['version' => 'v0.1.0-alpha.2', 'time' => '2026-10-20T10:00:00+00:00'],
        ['version' => 'v0.1.0-alpha.1', 'time' => '2026-10-10T10:00:00+00:00'],
    ]]])]);

    $out = storage_path('framework/testing/releases-'.uniqid().'.json');

    $this->artisan('notices:build', ['--output' => $out, '--only' => 'prism-acp', '--repos' => whatsNewRepos(['prism-acp' => ''])])->assertSuccessful();

    $artifact = json_decode((string) file_get_contents($out), true);
    @unlink($out);

    expect($artifact['latest'])->not->toHaveKey('prism-acp')
        ->and($artifact['releases'])->toBe([]);
});

it('still fails when a registry answers with no versions at all', function () {
    Http::preventStrayRequests();
    Http::fake(['repo.packagist.org/*' => Http::response(['packages' => ['particle-academy/prism-acp' => []]])]);

    $out = storage_path('framework/testing/releases-'.uniqid().'.json');

    $this->artisan('notices:build', ['--output' => $out, '--only' => 'prism-acp', '--repos' => whatsNewRepos(['prism-acp' => ''])])->assertFailed();

    expect(is_file($out))->toBeFalse();
});

it('ships a curated notice file the feed can read', function () {
    $notices = json_decode(File::get(resource_path('notices/features.json')), true, 512, JSON_THROW_ON_ERROR);

    expect($notices)->not->toBeEmpty();

    foreach ($notices as $notice) {
        expect($notice)->toHaveKeys(['id', 'label', 'date', 'cards'])
            ->and($notice['cards'])->not->toBeEmpty();
    }

    $pdf = collect($notices)->firstWhere('id', 'secure-pdf-viewer');
    expect($pdf['cards'][0]['action']['href'])->toBe('/packages/react-fancy/pdf-viewer');

    // Any card image must be a file the site actually serves.
    foreach ($notices as $notice) {
        foreach ($notice['cards'] as $card) {
            foreach (['image', 'imageDark'] as $key) {
                if (isset($card[$key])) {
                    expect(is_file(public_path(ltrim($card[$key], '/'))))->toBeTrue("{$notice['id']}: {$card[$key]} does not exist");
                }
            }
        }
    }

    // And the real feed serves it, among real releases.
    $ids = array_column(app(WhatsNewFeed::class)->since(null, limit: 1000), 'id');
    expect(collect($ids)->contains(fn ($id) => str_ends_with($id, '~notice~secure-pdf-viewer')))->toBeTrue();
});

it('knows every first-party version this app installs', function () {
    $built = json_decode(File::get(resource_path('notices/releases.json')), true, 512, JSON_THROW_ON_ERROR);
    $latest = $built['latest'] ?? [];

    $installed = [];
    $lock = json_decode(File::get(base_path('package-lock.json')), true);
    foreach ($lock['packages'] ?? [] as $path => $meta) {
        if (preg_match('#^node_modules/(@particle-academy/[^/]+)$#', $path, $m)) {
            $installed['npm'][$m[1]] = $meta['version'];
        }
    }
    $composer = json_decode(File::get(base_path('composer.lock')), true);
    foreach ([...$composer['packages'] ?? [], ...$composer['packages-dev'] ?? []] as $meta) {
        if (str_starts_with($meta['name'], 'particle-academy/')) {
            $installed['composer'][$meta['name']] = ltrim($meta['version'], 'v');
        }
    }

    $stale = [];
    $checked = 0;
    foreach ([...PackageRegistry::all(), ...PackageRegistry::companions()] as $pkg) {
        $version = isset($pkg['npm'])
            ? ($installed['npm'][$pkg['npm']] ?? null)
            : (isset($pkg['composer']) ? ($installed['composer'][$pkg['composer']] ?? null) : null);

        if ($version === null) {
            continue;
        }
        $checked++;

        $known = $latest[$pkg['slug']] ?? null;
        if ($known === null || version_compare($version, $known, '>')) {
            $stale[] = "{$pkg['slug']}: installs {$version}, the artifact knows ".($known ?? 'nothing');
        }
    }

    // Vacuity guard: the sandbox installs dozens of first-party packages.
    expect($checked)->toBeGreaterThan(30);

    expect($stale)->toBe([], implode("\n", [
        'resources/notices/releases.json is behind what this app installs:',
        ...array_map(fn ($l) => '  '.$l, $stale),
        '',
        'Run `php artisan notices:build` and commit the artifact, so the release',
        'shows in the site\'s "What\'s new" notice.',
    ]));
});
