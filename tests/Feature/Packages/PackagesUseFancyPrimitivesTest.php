<?php

use Tests\TestCase;

uses(TestCase::class);

/**
 * /packages is the kit's own catalogue, so a page here that hand-rolls a
 * primitive react-fancy already ships is the surface that sells the kit not
 * using it — and it is how the gap list gets lost: a hand-rolled card looks
 * finished, so nobody files it, and the primitive never gets built.
 *
 * The mockup this redesign came from is ~2,000 lines of bespoke markup over 412
 * lines of CSS. Its class names are FINE to keep as restyling hooks; what must
 * not come back is the markup underneath them.
 */
function packagePages(): array
{
    return [
        'Index.tsx' => base_path('resources/js/Pages/Packages/Index.tsx'),
        'Show.tsx' => base_path('resources/js/Pages/Packages/Show.tsx'),
        'Family.tsx' => base_path('resources/js/Pages/Packages/Family.tsx'),
    ];
}

it('finds the package pages to check', function () {
    // Without this, every assertion below passes on a missing file.
    foreach (packagePages() as $name => $path) {
        expect(file_exists($path))->toBeTrue("{$name} is gone");
    }
});

it('builds every package surface from react-fancy', function () {
    foreach (packagePages() as $name => $path) {
        $src = (string) file_get_contents($path);

        expect(str_contains($src, '@particle-academy/react-fancy'))
            ->toBeTrue("{$name} lost its react-fancy import");

        // <Card> is the load-bearing one: three surfaces here are card grids,
        // and a <div className="card"> is exactly what the mockup shipped.
        expect(str_contains($src, '<Card'))
            ->toBeTrue("{$name} no longer renders a react-fancy <Card>");
    }
});

/**
 * `bg-white` is a FROZEN literal — it does not flip under `.dark`, and it is
 * what produced white-cards-on-a-dark-page earlier in this project. `<Card>`
 * renders `bg-white dark:bg-zinc-900` internally, which is fine; a page writing
 * the bare utility itself is not.
 */
it('never freezes a surface colour that cannot flip in dark mode', function () {
    $frozen = [
        'bg-white' => 'bg-white does not flip under .dark — let <Card> own the surface, or use var(--surface)',
        'text-black' => 'text-black does not flip under .dark — use var(--fg-1)',
        'bg-black' => 'bg-black does not flip under .dark — use var(--bg-0)',
    ];

    foreach (packagePages() as $name => $path) {
        $src = (string) file_get_contents($path);
        foreach ($frozen as $needle => $why) {
            expect(str_contains($src, $needle))->toBeFalse("{$name}: {$why}");
        }
    }
});

/**
 * The redesign's primary device. It is DERIVED from `kind` rather than typed
 * into PackageRegistry::META, so the thing worth guarding is that the two never
 * disagree — a listing whose basket contradicts its kind would put a headless
 * package in the violet "preview it now" lane, which is a promise the page
 * cannot keep.
 */
it('gives every listing a basket that agrees with its kind', function () {
    $this->get('/packages')
        ->assertOk()
        ->assertInertia(function ($page) {
            $pkgs = collect($page->toArray()['props']['packages']);

            expect($pkgs)->not->toBeEmpty();

            $pkgs->each(function (array $p) {
                expect($p)->toHaveKeys(['basket', 'ui_count', 'backend_count']);
                expect($p['basket'])->toBeIn(['ui', 'backend', 'both']);

                // "both" is only ever a family — a single package renders a UI
                // or it does not.
                if ($p['basket'] === 'both') {
                    expect($p['family'])->toBeTrue("{$p['slug']} is in both baskets but is not a family");

                    return;
                }

                if (! $p['family']) {
                    $expected = $p['kind'] === 'headless' ? 'backend' : 'ui';
                    expect($p['basket'])->toBe($expected, "{$p['slug']} is kind={$p['kind']} but basket={$p['basket']}");
                }
            });

            // The two lanes are the page's headline claim, so neither may be
            // empty — an empty lane means the derivation broke, not that the
            // suite has no backends.
            expect($pkgs->filter(fn (array $p) => $p['basket'] !== 'backend'))->not->toBeEmpty();
            expect($pkgs->filter(fn (array $p) => $p['basket'] !== 'ui'))->not->toBeEmpty();

            // A family spanning both languages is the case the map exists for.
            $git = $pkgs->firstWhere('slug', 'fancy-git');
            expect($git['basket'])->toBe('both');
            expect($git['ui_count'])->toBe(1);
            expect($git['backend_count'])->toBe(8);
        });
});

it('carries a role and a basket on every family member the listing renders', function () {
    $this->get('/packages')
        ->assertOk()
        ->assertInertia(function ($page) {
            $core = collect($page->toArray()['props']['packages'])->firstWhere('slug', 'fancy-core');

            // The "start here" band lists Fancy Core's members with their role,
            // so a member missing one renders a blank column rather than failing.
            expect($core['members'])->toHaveCount(5);
            foreach ($core['members'] as $member) {
                expect($member)->toHaveKeys(['slug', 'name', 'role', 'basket', 'components_count']);
                expect($member['role'])->not->toBe('');
                expect($member['basket'])->toBeIn(['ui', 'backend']);
            }
        });
});

it('serves a family page with the lane counts its map is drawn from', function () {
    $this->get('/packages/family/fancy-git')
        ->assertOk()
        ->assertInertia(function ($page) {
            $family = $page->toArray()['props']['family'];

            expect($family)->toHaveKeys(['accent', 'languages', 'basket', 'ui_count', 'backend_count', 'previews']);
            expect($family['ui_count'] + $family['backend_count'])->toBe(9);
            expect($family['previews'])->toBeGreaterThan(0);
        });
});
