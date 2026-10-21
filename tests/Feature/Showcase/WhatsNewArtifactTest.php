<?php

use App\Support\Notices\WhatsNewFeed;
use App\Support\PackageRegistry;
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

    $this->artisan('notices:build', ['--output' => $out, '--only' => 'react-fancy'])->assertFailed();

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
