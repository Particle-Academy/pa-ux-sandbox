<?php

use App\Support\PackageFamily;
use App\Support\PackageRegistry;
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

            // A UI-headlined family lands in Surfaces and keeps its preview tile.
            $flow = $pkgs->firstWhere('slug', 'fancy-flow');
            expect($flow['group'])->toBe('surfaces');
            expect($flow['kind'])->toBe('ui');
            expect($flow['member_count'])->toBe(2);

            // Themes replace the old core/human/companion tiers entirely.
            $unknown = $pkgs->pluck('group')->unique()
                ->diff(['core', 'surfaces', 'documents', 'commerce', 'platform', 'tooling'])
                ->values()->all();
            expect($unknown)->toBe([]);
            expect($pkgs->firstWhere('slug', 'fancy-git')['group'])->toBe('tooling');
            expect($pkgs->firstWhere('slug', 'holy-sheet')['group'])->toBe('documents');
            expect($pkgs->firstWhere('slug', 'fancy-map')['group'])->toBe('surfaces');

            // Core is a family too — its members fold in behind one card.
            expect($slugs)->toContain('fancy-core');
            foreach (['react-fancy', 'fancy-inertia', 'fancy-query', 'fancy-app-update', 'agent-integrations'] as $member) {
                expect($slugs)->not->toContain($member);
            }

            // Packages in no family are untouched.
            expect($slugs)->toContain('fancy-pixel')->toContain('fancy-map');
        });
});

it('never lets a family slug swallow a package page', function () {
    // fancy-3d / fancy-flow are BOTH a family slug and a real package. The
    // package page must still serve its own component demos + props.
    foreach (['fancy-3d', 'fancy-flow'] as $slug) {
        $this->get("/packages/{$slug}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Packages/Show'));
    }

    // …and the family lives on its own path, so nothing collides.
    $this->get('/packages/family/fancy-3d')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Packages/Family'));
});

it('links every family member that has its own page', function () {
    $this->get('/packages/family/fancy-3d')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('family.sections', function ($sections) {
                $members = collect($sections)->flatMap(fn ($s) => $s['members']);
                // Each member with demos links to its OWN page, never back here.
                foreach (['fancy-3d', 'fancy-3d-babylon', 'fancy-3d-three'] as $slug) {
                    expect($members->firstWhere('slug', $slug)['href'])->toBe("/packages/{$slug}");
                }

                return true;
            })
        );
});

it('routes a family member by whether it has content of its own', function () {
    // Ships component demos — grouping must NEVER bury these.
    foreach (['fancy-git-ui', 'fancy-3d-babylon', 'fancy-3d-three', 'fancy-cms-ui', 'fancy-mlm-ui', 'fancy-x-files-ui'] as $ui) {
        $this->get("/packages/{$ui}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Packages/Show'));
    }

    // Has no components, but DOES have a README — read from its own repo, not
    // from whatever this app happens to install — so it keeps its page. It used
    // to fold in, which was the sourcing bug rather than a fact about the
    // package: a real, published adapter with real docs, redirected away.
    $this->get('/packages/fancy-git-github-php')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Packages/Show'));

    // A family slug that is not itself a package still resolves to the family
    // page — there is no package there to document.
    $this->get('/packages/fancy-core')->assertRedirect('/packages/family/fancy-core');
});

it('renders the family page with a section per role', function () {
    $this->get('/packages/family/fancy-git')
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

it('keeps a member page when it has real content, and folds the thin ones', function () {
    // react-fancy ships ~50 component demos — grouping must never bury them.
    $this->get('/packages/react-fancy')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Packages/Show'));

    // fancy-query has no components but ships a README — still its own page.
    $this->get('/packages/fancy-query')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Packages/Show'));

    // The family page links out to the members that kept a page.
    $this->get('/packages/family/fancy-core')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Packages/Family')
            ->where('family.sections', function ($sections) {
                $members = collect($sections)->flatMap(fn ($s) => $s['members']);
                expect($members->firstWhere('slug', 'react-fancy')['href'])->toBe('/packages/react-fancy');
                expect($members->pluck('slug'))->toContain('agent-integrations');

                return true;
            })
        );
});

it('withholds a family whose every member is hidden, and lists one that ships', function () {
    // This used to hardcode the passkey trio as hidden — and its own comment
    // claimed the family "comes back the moment they ship, with no second edit
    // here", which the hardcoding made false. All three shipped (Packagist
    // v0.2.0, npm 0.2.0 x2) and this test was what still said otherwise.
    //
    // So: assert the MECHANISM against whatever is hidden right now, and assert
    // the passkey family is listed, because it is released.
    $hidden = (new ReflectionClass(PackageRegistry::class))->getConstant('HIDDEN');

    foreach (PackageFamily::all() as $family) {
        $members = collect($family['sections'] ?? [])
            ->flatMap(fn (array $section): array => $section['members'] ?? [])
            ->pluck('slug')
            ->all();

        if ($members === []) {
            continue;
        }

        $allHidden = collect($members)->every(fn (string $s): bool => in_array($s, $hidden, true));
        expect($allHidden)->toBeFalse("family {$family['slug']} is listed but every member is hidden");
    }

    // The passkey family specifically: released, therefore visible.
    foreach (['fancy-passkeys', 'fancy-passkeys-js', 'fancy-passkeys-ui'] as $slug) {
        expect(PackageRegistry::isHidden($slug))->toBeFalse("{$slug} is published — it must not be hidden");
    }

    expect(PackageFamily::find('fancy-passkeys'))->not->toBeNull();

    // /packages lists standalone packages merged with FAMILY cards, so the
    // three passkey members appear as their one family rather than as three
    // rows. Asserting three slugs there would fail for the right reason and the
    // wrong one at once.
    $this->get('/packages')
        ->assertOk()
        ->assertInertia(function ($page) {
            $slugs = collect($page->toArray()['props']['packages'])->pluck('slug');

            expect($slugs)->toContain('fancy-passkeys');
        });

    // The members themselves are reachable, which is the thing that was broken.
    foreach (['fancy-passkeys', 'fancy-passkeys-js', 'fancy-passkeys-ui'] as $slug) {
        expect(PackageRegistry::findAny($slug))->not->toBeNull();
    }

    $this->get('/packages/family/fancy-passkeys')->assertOk();
});

it('hides nothing that is already on a registry', function () {
    // The lesson from the four-slug mistake: hiding is keyed on a claim about a
    // REGISTRY, and nothing re-checks it. This cannot reach the network, so it
    // guards the next-best thing — a slug may only be hidden if its definition
    // carries no published coordinates to contradict it.
    $hidden = (new ReflectionClass(PackageRegistry::class))->getConstant('HIDDEN');

    expect($hidden)->toBeArray();

    foreach ($hidden as $slug) {
        // A slug hidden without a definition is the other failure mode: the
        // package goes live invisible and nothing says why.
        //
        // `definitionFor()`, not `findAny()`. findAny() is what the packages
        // controller and the install-instructions MCP tool call, so it stays
        // FILTERED -- and being filtered, it can never see a hidden slug, which
        // meant this assertion could only pass while HIDDEN was empty. It went
        // green for a year and failed the first time something was hidden.
        expect(PackageRegistry::definitionFor($slug))
            ->not->toBeNull("HIDDEN lists {$slug}, which has no definition to come back to");

        // And the public lookups still refuse it, which is the other half.
        expect(PackageRegistry::findAny($slug))
            ->toBeNull("HIDDEN lists {$slug}, but findAny() still returns it to a public surface");
    }
});

it('keeps the passkey definitions complete so publishing is a HIDDEN deletion', function () {
    // The definitions live behind the hidden flags, not instead of them. If this
    // fails, someone removed a definition rather than a flag — and the packages
    // would go live invisible, which looks exactly like nothing being wrong.
    $registry = new ReflectionClass(PackageRegistry::class);

    $meta = $registry->getConstant('META');
    foreach (['fancy-passkeys' => 'php', 'fancy-passkeys-js' => 'ts', 'fancy-passkeys-ui' => 'ts'] as $slug => $ecosystem) {
        expect($meta)->toHaveKey($slug);
        expect($meta[$slug]['ecosystem'])->toBe($ecosystem);
        expect($meta[$slug]['group'])->toBe('platform');
    }

    $ui = $registry->getMethod('fancyPasskeysUi');
    $ui->setAccessible(true);
    $definition = $ui->invoke(null);
    expect($definition['npm'])->toBe('@particle-academy/fancy-passkeys-ui');
    expect(collect($definition['components'])->pluck('name'))
        ->toContain('PasskeySignIn')->toContain('PasskeyManager')->toContain('PasskeyStatus');

    // The family table still describes the whole product, both backends included.
    $families = $registry = new ReflectionClass(PackageFamily::class);
    $all = $families->getConstant('FAMILIES');
    $passkeys = collect($all)->firstWhere('slug', 'fancy-passkeys');
    expect($passkeys)->not->toBeNull();
    expect(collect($passkeys['sections'])->flatMap(fn ($s) => $s['members'])->pluck('slug'))
        ->toContain('fancy-passkeys')->toContain('fancy-passkeys-js')->toContain('fancy-passkeys-ui');
});
