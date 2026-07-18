<?php

use App\Support\PackageParity;
use Tests\TestCase;

uses(TestCase::class);

it('derives the MCP start_project mirror pairs from the same parity source', function () {
    $pairs = collect(PackageParity::mcpPairs());

    // One MCP pair per parity group, package ids resolved from the registry.
    expect($pairs)->toHaveCount(count(PackageParity::groups()));

    $catalog = $pairs->firstWhere('php', 'particle-academy/laravel-catalog');
    expect($catalog['node'])->toBe('@particle-academy/fancy-catalog');

    $holy = $pairs->firstWhere('php', 'particle-academy/holy-sheet');
    expect($holy['node'])->toBe('@particle-academy/holy-sheet');

    // Every pair resolved both language ids (no accidental null from a typo'd slug).
    $pairs->each(fn (array $p) => expect($p['php'])->not->toBeNull()->and($p['node'])->not->toBeNull());
});

it('folds language mirrors into one parity card on /packages', function () {
    $this->get('/packages')
        ->assertOk()
        ->assertInertia(function ($page) {
            $pkgs = collect($page->toArray()['props']['packages']);

            // The individual mirror members no longer list on their own.
            foreach (['holy-sheet-js', 'dark-slide-js', 'last-word-js', 'fancy-catalog-js', 'fancy-features-js', 'fancy-git-js', 'fancy-mlm-js', 'fancy-heuristics-js', 'fancy-x-files-js'] as $mirror) {
                expect($pkgs->firstWhere('slug', $mirror))->toBeNull();
            }

            // One consolidated parity card stands in, carrying its languages.
            $holy = $pkgs->firstWhere('slug', 'holy-sheet');
            expect($holy)->not->toBeNull();
            expect($holy['parity'])->toBeTrue();
            expect($holy['ecosystem'])->toBe('polyglot');
            expect($holy['languages'])->toContain('PHP');
            expect($holy['languages'])->toContain('Node / TypeScript');

            // A non-mirror package is untouched (still lists on its own).
            expect($pkgs->firstWhere('slug', 'react-fancy'))->not->toBeNull();
        });
});

it('redirects a mirror slug to its canonical parity page', function () {
    // Suffix twins.
    $this->get('/packages/holy-sheet-js')->assertRedirect('/packages/holy-sheet');
    // Cross-named twins (slug is not derivable from the PHP one).
    $this->get('/packages/fancy-catalog-js')->assertRedirect('/packages/laravel-catalog');
    $this->get('/packages/fancy-features-js')->assertRedirect('/packages/laravel-fms');
});

it('renders one parity page with a per-language install card', function () {
    $this->get('/packages/holy-sheet')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Packages/Parity')
            ->where('group.slug', 'holy-sheet')
            ->where('group.members', function ($members) {
                $members = collect($members);
                expect($members->pluck('language'))->toContain('PHP')->toContain('Node / TypeScript');

                $php = $members->firstWhere('language', 'PHP');
                expect($php['install'])->toContain('composer require');

                $node = $members->firstWhere('language', 'Node / TypeScript');
                expect($node['install'])->toContain('npm install');

                return true;
            })
        );
});
