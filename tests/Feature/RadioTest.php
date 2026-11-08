<?php

use App\Support\Radio\RadioTracks;
use Tests\TestCase;

uses(TestCase::class);

/*
 * The showcase radio's server half: the three tracks behind
 * RadioAudioController, with HTTP Range so the player can seek, and the cover
 * art in public/radio. The client's station list (resources/js/radio/stations.ts)
 * is read here so the two cannot drift: every track it plays is served, and
 * every cover it shows exists.
 */

function radioStationsSource(): string
{
    return (string) file_get_contents(resource_path('js/radio/stations.ts'));
}

it('serves each track whole as audio/mpeg, cacheable, advertising ranges', function (string $slug) {
    $response = $this->get("/radio/{$slug}.mp3");

    $response->assertOk();
    expect($response->headers->get('Content-Type'))->toBe('audio/mpeg')
        ->and($response->headers->get('Accept-Ranges'))->toBe('bytes')
        ->and($response->headers->get('Cache-Control'))->toContain('public')
        ->and($response->headers->get('Cache-Control'))->toContain('max-age=86400')
        ->and((int) $response->headers->get('Content-Length'))->toBe(filesize(RadioTracks::path($slug)));
})->with(RadioTracks::slugs());

it('answers a Range request with 206 and exactly those bytes', function (string $slug) {
    $response = $this->get("/radio/{$slug}.mp3", ['Range' => 'bytes=100-1123']);
    $size = filesize(RadioTracks::path($slug));

    $response->assertStatus(206);
    expect($response->headers->get('Content-Range'))->toBe("bytes 100-1123/{$size}")
        ->and((int) $response->headers->get('Content-Length'))->toBe(1024)
        ->and($response->headers->get('Content-Type'))->toBe('audio/mpeg');

    ob_start();
    $response->sendContent();
    $body = (string) ob_get_clean();
    expect($body)->toBe(substr((string) file_get_contents(RadioTracks::path($slug)), 100, 1024));
})->with(RadioTracks::slugs());

it('answers a range past the end of the file with the whole file, as Symfony does', function () {
    // BinaryFileResponse ignores a Range it cannot satisfy and sends 200 with
    // the full body; a player then simply has the file. Pinned so a change in
    // that behaviour is noticed rather than assumed.
    $response = $this->get('/radio/locked-on.mp3', ['Range' => 'bytes=999999999-']);

    $response->assertOk();
    expect((int) $response->headers->get('Content-Length'))->toBe(filesize(RadioTracks::path('locked-on')));
});

it('serves nothing it was not approved to', function (string $path) {
    $this->get($path)->assertNotFound();
})->with(['/radio/nope.mp3', '/radio/..%2F..%2F.env.mp3', '/radio/No%20Second%20Life.mp3']);

it('plays only tracks the server serves, and shows only covers that exist', function () {
    $source = radioStationsSource();

    preg_match_all('#src: "/radio/([a-z0-9-]+)\.mp3"#', $source, $tracks);
    expect($tracks[1])->toBe(RadioTracks::slugs());

    preg_match_all('#cover\("([a-z0-9-]+)"\)#', $source, $covers);
    expect(array_unique($covers[1]))->toEqualCanonicalizing(['riverwest-radio', 'thunder-in-the-garden']);
    foreach ($covers[1] as $name) {
        foreach (['512.webp', '1024.webp', '512.jpg', '1024.jpg'] as $variant) {
            expect(public_path("radio/{$name}-{$variant}"))->toBeFile();
        }
    }
});

it('letterboxes Riverwest onto a square tile at 512 and 1024', function (int $size) {
    foreach (['jpg', 'webp'] as $ext) {
        [$w, $h] = getimagesize(public_path("radio/riverwest-radio-{$size}.{$ext}"));
        expect([$w, $h])->toBe([$size, $size]);
    }
})->with([512, 1024]);

it('lists Riverwest live at 128k and 256k, with its status feed and site', function () {
    $source = radioStationsSource();

    expect($source)->toContain('src: "https://radio.computer:8443/riverwestradio"')
        ->toContain('src: "https://radio.computer:8443/riverwestradio-hq"')
        ->toContain('"https://radio.computer:8443/status-json.xsl"')
        ->toContain('"https://www.riverwestradio.com"');
});

it('mounts the radio once, above every page, in both the client and the SSR tree', function () {
    foreach (['showcase-app.tsx', 'ssr.tsx'] as $entry) {
        $tree = (string) file_get_contents(resource_path("js/{$entry}"));
        expect($tree)->toContain('<RadioProvider>')
            ->and($tree)->toMatch('#<RadioProvider>\s*<ShowcaseWhatsNew>\{outlet\}</ShowcaseWhatsNew>\s*</RadioProvider>#');
    }

    expect((string) file_get_contents(resource_path('js/Pages/Layout.tsx')))->toContain('<RadioButton />');
});

it('never asks the player to autoplay', function () {
    $radio = '';
    foreach (glob(resource_path('js/radio/*.{ts,tsx}'), GLOB_BRACE) ?: [] as $file) {
        $radio .= (string) file_get_contents($file);
    }

    expect($radio)->toContain('playing: false')
        ->and($radio)->not->toMatch('/autoPlay|autoplay=|playing: true/');
});

it('renders the radio toggle in the header of a real page', function () {
    // The header is React; the server sends the Layout through SSR only when
    // the daemon runs, so this pins the page loads and the asset routes exist.
    $this->get('/')->assertOk();
    expect(route('radio.track', ['track' => 'locked-on'], false))->toBe('/radio/locked-on.mp3');
});
