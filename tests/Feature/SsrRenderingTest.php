<?php

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

/**
 * SSR's SUCCESS path — that a render returned by the daemon actually reaches
 * the HTML.
 *
 * `SsrTimeoutTest` covers the opposite half: when the daemon is unreachable the
 * gateway must swallow it and fall back to client rendering. That fallback is
 * deliberate and correct in production, and it is also what made this whole
 * feature able to rot in silence — a page that never server-renders is a 200
 * with valid markup, an intact Inertia payload, and nothing in the log. The
 * only visible difference is an empty `<div id="app">`, which nobody inspects.
 *
 * It rotted exactly that way: the daemon was not running locally, every page in
 * the showcase was quietly client-rendered, and the suite stayed green because
 * the only SSR test asserted the fallback.
 *
 * So these tests fake a HEALTHY daemon and assert the render lands. They cover
 * the wiring a code change can break — the root view's `@inertia` /
 * `@inertiaHead` directives, the `Gateway` binding, and the SSR config — which
 * is everything between "the daemon replied" and "the user received it".
 *
 * They deliberately do NOT assert that a daemon is running: that is an ops
 * concern (`php artisan inertia:start-ssr`, the Forge daemon, the local
 * process), not something a test process can or should require.
 */
beforeEach(function () {
    config([
        'inertia.ssr.enabled' => true,
        // The SSR bundle is a build artifact and is gitignored, so it is absent
        // in CI. Skip the bundle-exists short-circuit — what is under test is
        // the wiring, not whether someone ran `npm run build`.
        'inertia.ssr.ensure_bundle_exists' => false,
    ]);

    Http::fake([
        '127.0.0.1:13733/*' => Http::response([
            'head' => ['<meta name="ssr-probe-head" content="yes">'],
            'body' => '<div id="ssr-probe">server rendered this</div>',
        ]),
    ]);
});

it('puts the server-rendered body into the page', function (string $uri) {
    $response = $this->get($uri);

    $response->assertOk();
    $response->assertSee('server rendered this', escape: false);
})->with([
    // The generator: shell-less, no props, entirely client-side once hydrated —
    // the page most likely to be written off as "does not need SSR". It needs it
    // for the same reason as any other: the first byte should be the page.
    '/pw',
    '/',
    '/packages',
]);

it('puts the server-rendered head into <head>', function () {
    // `@inertiaHead` is a separate directive from `@inertia`, so it can be
    // missing (or land in the wrong place) while the body renders perfectly.
    $content = $this->get('/pw')->getContent();

    expect($content)->toContain('<meta name="ssr-probe-head" content="yes">');

    $head = substr($content, 0, (int) strpos($content, '</head>'));

    expect($head)->toContain('ssr-probe-head');
});

it('renders the body inside the app root, not merely somewhere on the page', function () {
    // Inertia replaces the `<div id="app">` element wholesale with the SSR
    // markup. Asserting only "the string is present" would still pass if the
    // body were emitted next to an app root that stayed empty — which is the
    // client-rendered shape this test exists to distinguish from.
    $content = $this->get('/pw')->getContent();

    expect($content)->not->toMatch('/<div id="app"[^>]*>\s*<\/div>/');
});
