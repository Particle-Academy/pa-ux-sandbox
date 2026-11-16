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
 * Demonstrated: react-fancy's viewers, StreamingAudio and, since 6.26.0, the
 * channel components (a channel is one track, a playlist or a live stream),
 * and fancy-code's FileViewer. Until 6.26.0 the channel section said "coming"
 * and this test guarded that; it now guards the live channel guide, built from
 * the showcase radio's own media and taking turns with the site radio.
 */

const MEDIA_DIR = 'resources/js/Pages/Features/Media';

/** The channel components the live guide is built from (react-fancy 6.26.0). */
const MEDIA_GUIDE_COMPONENTS = ['ChannelGuide', 'ChannelPlayer', 'Playlist', 'MediaQueue'];

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

it('runs a live channel guide built from the channel components', function () {
    $sources = mediaSources();
    preg_match_all('#import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*"@particle-academy/react-fancy[^"]*"#s', implode("\n", $sources), $imports);
    $imported = array_map('trim', explode(',', implode(',', $imports[1])));

    expect($sources)->toHaveKey('ChannelsDemo.tsx');
    $demo = $sources['ChannelsDemo.tsx'];

    foreach (MEDIA_GUIDE_COMPONENTS as $component) {
        expect($imported)->toContain($component)
            ->and($demo)->toContain("<{$component}");
    }

    expect($demo)->toContain('data-media-demo="channels"')
        ->and($sources['Index.tsx'])->toContain('id="channels"', '<ChannelsDemo />')
        ->and($sources['Index.tsx'])->toContain('single track', 'playlist', 'live stream');
});

it('no longer says channels are coming', function () {
    $sources = mediaSources();

    expect(implode("\n", $sources))->not->toContain('data-media-coming', 'COMING_COMPONENTS')
        ->and($sources['Index.tsx'])->not->toMatch('/coming/i');
});

it('plays a single track, a three-track playlist and Riverwest live, all from the radio', function () {
    $demo = mediaSources()['ChannelsDemo.tsx'];
    $channels = (string) file_get_contents(resource_path('js/radio/channels.ts'));

    // The channels are derived from the radio's station list, which names the
    // only media this page may play; nothing here invents a URL.
    expect($channels)->toContain('RADIO_STATIONS', 'kind: "track"', 'kind: "playlist"', 'kind: "live"', 'stationOrThrow("riverwest")')
        ->and($channels)->not->toMatch('#https?://#')
        ->and($demo)->toContain('SINGLE_TRACK_CHANNEL', 'PLAYLIST_CHANNEL', 'riverwestChannel(');

    // The playlist is every self-hosted track the radio has: three today.
    preg_match_all('#src: "/radio/[a-z0-9-]+\.mp3"#', (string) file_get_contents(resource_path('js/radio/stations.ts')), $tracks);
    expect($tracks[0])->toHaveCount(3);
});

it('does not load the hls.js adapter: Riverwest is Icecast and plays natively', function () {
    // hls.js is third-party and not approved for the showcase.
    expect(implode("\n", mediaSources()))->not->toContain('react-fancy/channels/hls', 'hls.js');

    $manifest = json_decode((string) file_get_contents(base_path('package.json')), true);
    expect(array_keys(($manifest['dependencies'] ?? []) + ($manifest['devDependencies'] ?? [])))->not->toContain('hls.js');
});

it('takes turns with the site radio, and never starts playing itself', function () {
    $demo = mediaSources()['ChannelsDemo.tsx'];

    expect($demo)->toContain('useRadio()', 'r.setValue({ ...r.value, playing: false })', 'radioPlaying')
        ->and($demo)->not->toMatch('/playing: true|autoPlay/');
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
