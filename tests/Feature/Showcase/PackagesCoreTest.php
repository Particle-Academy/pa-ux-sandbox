<?php

use Tests\TestCase;

uses(TestCase::class);

it('flags react-fancy, fancy-inertia, and fancy-query as Fancy Core on /packages', function () {
    $this->get('/packages')
        ->assertOk()
        ->assertInertia(function ($page) {
            $data = $page->toArray()['props'];
            $pkgs = collect($data['packages']);
            $comps = collect($data['companions']);

            // The two grid members of Fancy Core.
            expect($pkgs->firstWhere('slug', 'react-fancy')['core'])->toBeTrue();
            expect($pkgs->firstWhere('slug', 'fancy-inertia')['core'])->toBeTrue();
            // A normal grid package is NOT core.
            expect($pkgs->firstWhere('slug', 'fancy-whiteboard')['core'])->toBeFalse();
            // The headless Core member lives in companions.
            expect($comps->firstWhere('slug', 'fancy-query')['core'])->toBeTrue();
            // A normal companion is NOT core.
            expect($comps->firstWhere('slug', 'holy-sheet')['core'])->toBeFalse();
        });
});

it('renders the installed README for a headless package instead of a dead stub', function () {
    $this->get('/packages/fancy-query')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Packages/Show')
            // README HTML is attached + actually rendered (has markup), not the
            // "No UI surface" placeholder.
            ->whereNot('readmeHtml', null)
            ->where('readmeHtml', fn (string $html) => str_contains($html, '<'))
        );
});

it('does not attach a README for a package that has live component demos', function () {
    $this->get('/packages/react-fancy')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Packages/Show')
            ->where('readmeHtml', null)
        );
});
