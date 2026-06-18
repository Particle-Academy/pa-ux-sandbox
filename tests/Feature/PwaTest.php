<?php

use Tests\TestCase;

uses(TestCase::class);

/**
 * The site-wide PWA was removed. /sw.js now ALWAYS serves a self-unregistering
 * tombstone (served by an invokable controller, not a closure, so route:cache
 * stays intact) so any service worker from a prior deploy tears itself down on
 * its next update check.
 */
it('serves a self-unregistering service-worker tombstone at root scope', function () {
    $res = $this->get('/sw.js');

    $res->assertOk();
    expect($res->headers->get('Content-Type'))->toContain('application/javascript');
    expect($res->headers->get('Service-Worker-Allowed'))->toBe('/');
    expect($res->getContent())->toContain('registration.unregister');
});
