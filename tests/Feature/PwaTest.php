<?php

use Tests\TestCase;

uses(TestCase::class);

/**
 * PWA wiring: the root-scoped /sw.js route (served by an invokable controller,
 * not a closure, so route:cache stays intact) and the /offline fallback page.
 */
it('serves the service worker at root scope with the right headers when built', function () {
    $path = public_path('build/sw.js');

    if (! is_file($path)) {
        // No build artifact in this environment → the route must 404 (dev safety:
        // the registration script only runs when the file exists).
        $this->get('/sw.js')->assertNotFound();

        return;
    }

    $res = $this->get('/sw.js');

    $res->assertOk();
    expect($res->headers->get('Content-Type'))->toContain('application/javascript');
    expect($res->headers->get('Service-Worker-Allowed'))->toBe('/');
    expect($res->headers->get('Cache-Control'))->toContain('no-cache');
});

it('renders the Offline inertia page', function () {
    $this->get('/offline')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Offline'));
});
