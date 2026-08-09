<?php

use Tests\TestCase;

uses(TestCase::class);

/**
 * Asset URLs must match the scheme the request actually arrived on.
 *
 * `AppServiceProvider` forced https whenever `config('app.url')` starts with
 * https — regardless of how the request came in. On Herd that is right, because
 * the canonical site really is https. On `php artisan serve`, which is plain
 * http on localhost, it emitted:
 *
 *     https://localhost:8000/build/assets/showcase-*.css
 *
 * The dev server has no TLS, so every stylesheet and script failed to load and
 * the page rendered BLANK. Nothing errored in a way that pointed here: the HTML
 * was correct, the Inertia payload was present, `data-page` was populated, and
 * the response was a 200. The app simply never booted.
 *
 * That cost real time across a session — the gallery pages were written off as
 * "renders blank in dev, works in prod", and it silently blocked verifying any
 * UI change locally, because client-side navigation kept working once the app
 * had loaded from a URL where the scheme happened to match.
 *
 * The mixed-content protection the original condition wanted is kept: the
 * canonical host still gets https even if proxy headers are missing.
 */
it('does not force https on a plain-http request to a non-canonical host', function () {
    // `php artisan serve` — http, on localhost, while app.url is https.
    $response = $this->get('http://localhost:8000/');

    $response->assertSuccessful();

    preg_match_all('#https://localhost:8000/build/[^"]+#', $response->getContent(), $m);

    expect($m[0])->toBe([], 'asset URLs are https on a server with no TLS, so nothing loads');
});

it('emits usable http asset URLs there', function () {
    // The positive half: not merely "no https", but the right thing instead.
    $response = $this->get('http://localhost:8000/');

    preg_match_all('#https?://localhost:8000/build/[^"]+#', $response->getContent(), $m);

    expect($m[0])->not->toBe([], 'no build assets at all — the assertion above would be vacuous');
    foreach ($m[0] as $url) {
        expect($url)->toStartWith('http://localhost:8000/build/');
    }
});

it('still forces https for the canonical host', function () {
    // The case the original condition existed for: the real site is https, and
    // a missing proxy header must not downgrade asset URLs into mixed content.
    $response = $this->get('http://fancy.test/');

    $response->assertSuccessful();

    preg_match_all('#https?://fancy\.test/build/[^"]+#', $response->getContent(), $m);

    expect($m[0])->not->toBe([]);
    foreach ($m[0] as $url) {
        expect($url)->toStartWith('https://fancy.test/build/');
    }
});

it('still forces https when the request genuinely arrived over https', function () {
    $response = $this->get('https://staging.example/');

    preg_match_all('#https?://staging\.example/build/[^"]+#', $response->getContent(), $m);

    foreach ($m[0] as $url) {
        expect($url)->toStartWith('https://staging.example/build/');
    }
});
