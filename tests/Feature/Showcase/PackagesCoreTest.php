<?php

use Tests\TestCase;

uses(TestCase::class);

it('emits one merged catalog with the design classification on /packages', function () {
    $this->get('/packages')
        ->assertOk()
        ->assertInertia(function ($page) {
            $data = $page->toArray()['props'];
            $pkgs = collect($data['packages']);

            // /packages is now ONE merged list (UI grid + companions), each
            // carrying group / accent / ecosystem / kind.
            expect($pkgs)->not->toBeEmpty();
            $pkgs->each(function (array $p) {
                expect($p)->toHaveKeys(['group', 'accent', 'ecosystem', 'kind']);
                expect($p['group'])->toBeIn(['core', 'human', 'companion']);
                expect($p['ecosystem'])->toBeIn(['ts', 'php', 'polyglot']);
                expect($p['kind'])->toBeIn(['ui', 'bridge', 'headless', 'block']);
            });

            // Groups honor the design: react-fancy/fancy-inertia are core; the
            // headless Core members (fancy-query) are core even though they live
            // in companions() today; the surfaces are human; the rest companion.
            expect($pkgs->firstWhere('slug', 'react-fancy')['group'])->toBe('core');
            expect($pkgs->firstWhere('slug', 'react-fancy')['core'])->toBeTrue();
            expect($pkgs->firstWhere('slug', 'fancy-inertia')['group'])->toBe('core');
            expect($pkgs->firstWhere('slug', 'fancy-query')['group'])->toBe('core');
            expect($pkgs->firstWhere('slug', 'fancy-whiteboard')['group'])->toBe('human');
            expect($pkgs->firstWhere('slug', 'holy-sheet')['group'])->toBe('companion');

            // UI vs headless distinction drives the tile style.
            expect($pkgs->firstWhere('slug', 'react-fancy')['kind'])->toBe('ui');
            expect($pkgs->firstWhere('slug', 'holy-sheet')['kind'])->toBe('headless');
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
