<?php

use App\Support\PackageFamily;
use Tests\TestCase;

uses(TestCase::class);

it('derives the MCP start_project mirror pairs from the family table', function () {
    $pairs = collect(PackageFamily::mcpPairs());

    $catalog = $pairs->firstWhere('php', 'particle-academy/laravel-catalog');
    expect($catalog['node'])->toBe('@particle-academy/fancy-catalog');

    $holy = $pairs->firstWhere('php', 'particle-academy/holy-sheet');
    expect($holy['node'])->toBe('@particle-academy/holy-sheet');

    // A family can contribute more than one pair — fancy-git ships an engine
    // plus a mirrored adapter per host.
    expect($pairs->firstWhere('php', 'particle-academy/fancy-git')['node'])->toBe('@particle-academy/fancy-git');
    expect($pairs->firstWhere('php', 'particle-academy/fancy-git-github')['node'])->toBe('@particle-academy/fancy-git-github');

    // React UI companions are not a server mirror, so they never emit a pair.
    expect($pairs->pluck('node')->filter())->not->toContain('@particle-academy/fancy-git-ui');

    // Every emitted pair resolved at least one real package id.
    $pairs->each(fn (array $p) => expect($p['php'] ?? $p['node'])->not->toBeNull());
});

it('folds related packages into one family card on /packages', function () {
    $this->get('/packages')
        ->assertOk()
        ->assertInertia(function ($page) {
            $pkgs = collect($page->toArray()['props']['packages']);
            $slugs = $pkgs->pluck('slug');

            // The family lists once…
            expect($slugs)->toContain('fancy-git')->toContain('fancy-flow');

            // …and none of its members list on their own.
            foreach ([
                'fancy-git-js', 'fancy-git-ui', 'fancy-git-github-php', 'fancy-git-github-js',
                'fancy-git-gitlab-php', 'fancy-git-gitlab-js', 'fancy-git-bitbucket-php', 'fancy-git-bitbucket-js',
                'fancy-flow-php', 'fancy-mlm-js', 'fancy-mlm-ui', 'fancy-x-files-js', 'fancy-x-files-ui',
                'fancy-3d-babylon', 'fancy-3d-three', 'fancy-term-host', 'fancy-cms-ui',
                'holy-sheet-js', 'dark-slide-js', 'last-word-js', 'fancy-catalog-js', 'fancy-features-js',
                'fancy-heuristics-js',
            ] as $member) {
                expect($slugs)->not->toContain($member);
            }

            $git = $pkgs->firstWhere('slug', 'fancy-git');
            expect($git['family'])->toBeTrue();
            expect($git['member_count'])->toBe(9);
            expect($git['languages'])->toContain('PHP')->toContain('Node / TypeScript')->toContain('React');

            // A UI-headlined family keeps its Human+ tier and preview tile.
            $flow = $pkgs->firstWhere('slug', 'fancy-flow');
            expect($flow['group'])->toBe('human');
            expect($flow['kind'])->toBe('ui');
            expect($flow['member_count'])->toBe(2);

            // Standalone packages are untouched.
            expect($slugs)->toContain('react-fancy')->toContain('fancy-pixel');
        });
});

it('redirects any family member to the family page', function () {
    $this->get('/packages/fancy-git-js')->assertRedirect('/packages/fancy-git');
    $this->get('/packages/fancy-git-ui')->assertRedirect('/packages/fancy-git');
    $this->get('/packages/fancy-git-github-php')->assertRedirect('/packages/fancy-git');
    $this->get('/packages/fancy-flow-php')->assertRedirect('/packages/fancy-flow');
    $this->get('/packages/holy-sheet-js')->assertRedirect('/packages/holy-sheet');
});

it('renders the family page with a section per role', function () {
    $this->get('/packages/fancy-git')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Packages/Family')
            ->where('family.slug', 'fancy-git')
            ->where('family.sections', function ($sections) {
                $sections = collect($sections);
                expect($sections->pluck('label'))
                    ->toContain('Engine')->toContain('React UI')->toContain('GitHub provider');

                $engine = $sections->firstWhere('label', 'Engine');
                expect(collect($engine['members'])->firstWhere('language', 'PHP')['install'])
                    ->toBe('composer require particle-academy/fancy-git');
                expect(collect($engine['members'])->firstWhere('language', 'Node / TypeScript')['install'])
                    ->toBe('npm install @particle-academy/fancy-git');

                $ui = $sections->firstWhere('label', 'React UI');
                expect(collect($ui['members'])->first()['slug'])->toBe('fancy-git-ui');

                return true;
            })
        );
});
