<?php

use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

it('renders the showcase home', function () {
    $response = $this->get('/');
    $response->assertOk();
    // Inertia's initial visit returns HTML with a data-page attribute carrying the page name.
    $response->assertSee('"component":"Home"', escape: false);
});

it('renders the packages index', function () {
    $this->get('/packages')->assertOk();
});

it('renders the starter-kits index', function () {
    $this->get('/starter-kits')->assertOk();
});

it('renders the dreaming gallery', function () {
    $this->get('/dreaming')->assertOk();
});

it('renders the archived dreams page', function () {
    $this->get('/dreaming/archived')->assertOk();
});

it('renders the leaderboard', function () {
    $this->get('/leaderboard')->assertOk();
});

it('renders the showcase index', function () {
    $this->get('/showcase')->assertOk();
});

it('shows a package detail page', function () {
    $first = PackageRegistry::all()[0];
    $this->get("/packages/{$first['slug']}")->assertOk();
});

it('shows a component detail page', function () {
    $first = PackageRegistry::all()[0];
    $comp = $first['components'][0]['slug'];
    $this->get("/packages/{$first['slug']}/{$comp}")->assertOk();
});

it('404s on an unknown package', function () {
    $this->get('/packages/does-not-exist')->assertNotFound();
});

it('404s on an unknown component', function () {
    $first = PackageRegistry::all()[0];
    $this->get("/packages/{$first['slug']}/does-not-exist")->assertNotFound();
});

it('rejects unauthenticated showcase submission', function () {
    $this->get('/showcase/submit')->assertRedirect('/login');
});
