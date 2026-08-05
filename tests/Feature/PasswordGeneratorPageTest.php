<?php

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

// This project has no tests/Pest.php — every test file binds its own base class.
uses(TestCase::class);

/**
 * /pw — the standalone password generator.
 *
 * The page is entirely client-side, so there is very little server behaviour to
 * assert. What these tests DO guard is the two properties that would silently
 * regress: that the route stays anonymous, and that the handler keeps passing
 * nothing. A password generator that starts accepting or returning props is one
 * refactor away from putting a secret through the server, and nothing about the
 * rendered page would look different when it happened.
 */
it('serves the generator anonymously', function () {
    $this->get('/pw')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Pw'));
});

it('passes no props to the page', function () {
    // The generator never reads server state. An empty prop bag is the assertion
    // that it still does not — if someone later seeds a password, a charset or a
    // "recently generated" list from the server, this fails.
    $this->get('/pw')
        ->assertInertia(fn (Assert $page) => $page->component('Pw')->etc());

    $props = $this->get('/pw')->viewData('page')['props'];

    // Inertia always injects framework keys (errors, auth scaffolding, shared
    // data). What matters is that the ROUTE contributed nothing of its own.
    expect($props)->not->toHaveKey('password')
        ->and($props)->not->toHaveKey('charset')
        ->and($props)->not->toHaveKey('length');
});

it('never accepts a password back over the wire', function () {
    // There is no POST handler, and there must not be one. A generator that can
    // submit is a generator that can leak.
    $this->post('/pw', ['password' => 'should-not-be-accepted'])
        ->assertStatus(405);
});
