<?php

use App\Support\FeatureSites;
use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/*
 * /features/media: every media component the kit ships (owner, 2026-11-14:
 * "a new Feature for Media that includes all of our media based goodies,
 * including the streaming media"). Plan: .ai/plans/media-channels.md.
 *
 * Only what SHIPS is demonstrated: react-fancy's viewers and StreamingAudio,
 * and fancy-code's FileViewer. The channel components (a channel is one
 * track, a playlist or a live stream) are built in react-fancy but not yet
 * released, so the page says "coming" and imports none of them. When they
 * ship, the sandbox dogfoods the release and the "coming" panel becomes the
 * live channel guide demo; this test is the guard until then.
 */

const MEDIA_DIR = 'resources/js/Pages/Features/Media';

/** The channel components that are not released yet. */
const UNRELEASED_CHANNEL_COMPONENTS = ['ChannelPlayer', 'ChannelGuide', 'Playlist', 'MediaQueue', 'TrackItem', 'NowPlaying', 'LiveBadge', 'MediaEmbed'];

function mediaPage(TestCase $test): array
{
    $html = $test->get('/features/media')->assertOk()->getContent();
    preg_match('#<script data-page="app" type="application/json">(.*?)</script>#s', $html, $page);

    return json_decode($page[1] ?? '{}', true) ?? [];
}

/** @return array<string, string> */
function mediaSources(): array
{
    $files = [];
    foreach (glob(base_path(MEDIA_DIR.'/*')) ?: [] as $path) {
        $files[basename($path)] = (string) file_get_contents($path);
    }

    return $files;
}

it('serves the Media page with react-fancy and fancy-code, from the registry', function () {
    $page = mediaPage($this);
    $slugs = collect($page['props']['feature']['members'] ?? [])->pluck('slug')->all();

    expect($page['component'] ?? null)->toBe('Features/Media/Index')
        ->and($slugs)->toBe(['react-fancy', 'fancy-code'])
        ->and($page['props']['feature']['bridges'] ?? null)->toBe([]);
});

it('is in the Features menu', function () {
    $nav = collect(FeatureSites::nav())->firstWhere('slug', 'media');

    expect($nav)->not->toBeNull()
        ->and($nav['href'])->toBe('/features/media')
        ->and($nav['name'])->toBe('Media');

    $shared = collect(mediaPage($this)['props']['features'] ?? [])->pluck('slug')->all();
    expect($shared)->toContain('media');
});

it('lists only installable packages', function () {
    foreach (FeatureSites::find('media')['memberSlugs'] as $slug) {
        expect(PackageRegistry::findAny($slug))->not->toBeNull()
            ->and(PackageRegistry::isHidden($slug))->toBeFalse()
            ->and(array_key_exists($slug, PackageRegistry::PLANNED))->toBeFalse();
    }
});

it('runs the shipped media components', function () {
    $sources = mediaSources();
    $all = implode("\n", $sources);

    expect($sources)->toHaveKey('Index.tsx')
        ->and($all)->toContain('<StreamingAudio', '<MediaViewer', '<FileViewer')
        ->and($sources['Index.tsx'])->toContain('<DemoFrame', '<FeatureTour', '<HowItFits', '<InstallSteps', '<PackagesGrid', '<FeatureCta')
        ->and($all)->not->toContain('TODO');
});

it('imports no unreleased channel component, and says channels are coming', function () {
    $sources = mediaSources();
    preg_match_all('#import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*"@particle-academy/react-fancy[^"]*"#s', implode("\n", $sources), $imports);
    $imported = array_map('trim', explode(',', implode(',', $imports[1])));

    expect($imports[1])->not->toBeEmpty();
    foreach (UNRELEASED_CHANNEL_COMPONENTS as $component) {
        expect($imported)->not->toContain($component)
            ->and($imported)->not->toContain("type {$component}");
    }

    // The channel section exists, and is honest about it.
    expect($sources['Index.tsx'])->toContain('id="channels"')
        ->and($sources['Index.tsx'])->toMatch('/coming/i')
        ->and($sources['Index.tsx'])->toContain('single track', 'playlist', 'live stream');
});

it('imports only packages the showcase installs', function () {
    $dependencies = array_keys(json_decode((string) file_get_contents(base_path('package.json')), true)['dependencies'] ?? []);
    preg_match_all('#from "(@particle-academy/[a-z0-9-]+)#', implode("\n", mediaSources()), $imports);

    expect($imports[1])->not->toBeEmpty();
    foreach (array_unique($imports[1]) as $package) {
        expect($dependencies)->toContain($package);
    }
});

it('plays only self-hosted media, plus the owner-approved live station', function () {
    $all = implode("\n", mediaSources());

    // No absolute media URL in the page itself: the stations come from the
    // showcase radio's list, whose only remote source is Riverwest Radio.
    preg_match_all('#https?://[^\s"\'`)]+#', $all, $urls);
    expect($urls[0])->toBe([]);

    expect($all)->toContain('RADIO_STATIONS');
    preg_match_all('#src:\s*"(https?://[^"]+)"#', (string) file_get_contents(resource_path('js/radio/stations.ts')), $remote);
    foreach ($remote[1] as $url) {
        expect($url)->toStartWith('https://radio.computer:8443/riverwestradio');
    }

    // Every local asset the page names exists on disk.
    preg_match_all('#"(/(?:showcase-assets|radio)/[^"]+)"#', $all, $local);
    expect($local[1])->not->toBeEmpty();
    foreach (array_unique($local[1]) as $path) {
        expect(is_file(public_path(ltrim($path, '/'))))->toBeTrue("{$path} is not in public/");
    }
});
