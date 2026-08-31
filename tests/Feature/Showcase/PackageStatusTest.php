<?php

/**
 * The planned list has to stay honest, or it becomes the thing it prevents.
 *
 * `PackageRegistry::HIDDEN` is the cautionary tale, and its own comment records
 * it: four slugs sat there marked unpublished long after every one had shipped,
 * so four live packages were invisible to the site, the docs and the MCP. The
 * list was keyed on a CLAIM about a registry and nothing re-checked the claim.
 *
 * `PLANNED` can rot the same way in the opposite direction — a package gets
 * built and nobody removes its entry, so `kit:status` keeps reporting work that
 * is already done and people stop reading it.
 */

use App\Support\PackageRegistry;

it('never lists a package as both planned and built', function () {
    $built = collect([...PackageRegistry::all(), ...PackageRegistry::companions()])
        ->pluck('slug')
        ->all();

    $both = array_values(array_intersect(array_keys(PackageRegistry::PLANNED), $built));

    // Remove the slug from PLANNED in the same commit that adds its real entry.
    expect($both)->toBe([]);
});

it('gives every planned package a name, a repo and a reason', function () {
    foreach (PackageRegistry::PLANNED as $slug => $row) {
        expect($row)->toHaveKeys(['name', 'repo', 'why'], "planned '{$slug}' is missing a field");

        // A reason is the field that makes this a backlog rather than a list of
        // names — it is what tells the next person whether it still matters.
        expect(trim($row['why']))->not->toBe('', "planned '{$slug}' has no reason");
        // `toContain` takes needles, not a message -- a second string argument
        // would be asserted as another needle.
        expect(str_contains($row['repo'], '/'))->toBeTrue("planned '{$slug}' needs an owner/repo");
    }
});

it('lists published fancy devtools as built and public', function () {
    $built = collect(PackageRegistry::everything())->firstWhere('slug', 'fancy-devtools');

    expect(PackageRegistry::PLANNED)->not->toHaveKey('fancy-devtools')
        ->and(PackageRegistry::HIDDEN)->not->toContain('fancy-devtools')
        ->and($built)->toMatchArray([
            'name' => 'fancy-devtools',
            'npm' => '@particle-academy/fancy-devtools',
            'repo' => 'Particle-Academy/fancy-devtools',
        ])
        ->and(PackageRegistry::find('fancy-devtools'))->not->toBeNull();
});

it('keeps planned packages off every public surface', function () {
    // They cannot be installed. Announcing one is worse than saying nothing —
    // the same reason HIDDEN exists.
    $public = collect([...PackageRegistry::all(), ...PackageRegistry::companions()])->pluck('slug');

    foreach (array_keys(PackageRegistry::PLANNED) as $slug) {
        expect($public)->not->toContain($slug);
        expect(PackageRegistry::find($slug))->toBeNull();
    }
});

it('covers the whole kit, not just the featured half', function () {
    // kit:status reads all() AND companions(). Reading only the first would have
    // checked 33 of 84 packages while reporting a clean run — the exact shape of
    // failure the command exists to catch.
    $featured = count(PackageRegistry::all());
    $everything = count([...PackageRegistry::all(), ...PackageRegistry::companions()]);

    expect($everything)->toBeGreaterThan($featured);
});

it('reports HIDDEN packages too, because that is how built-but-unpublished is marked', function () {
    // The failure this pins: `all()` and `companions()` apply the visibility
    // filter, so reading them in kit:status silently drops every hidden slug —
    // and a slug is hidden precisely BECAUSE it is built and not yet published.
    // The command would then have gone quiet about the one state it exists to
    // report, over a package nobody could install.
    $visible = collect([...PackageRegistry::all(), ...PackageRegistry::companions()])->pluck('slug');
    $everything = collect(PackageRegistry::everything())->pluck('slug');

    foreach (PackageRegistry::HIDDEN as $slug) {
        // `toContain` takes NEEDLES, not a message -- a second string argument
        // is asserted as another needle. The file's own note above says so, and
        // it caught this on the first run.
        expect($visible->contains($slug))->toBeFalse("hidden '{$slug}' leaked onto a public surface");
        expect($everything->contains($slug))->toBeTrue("hidden '{$slug}' is invisible to kit:status");
    }

    // And the union is still the whole kit when nothing is hidden.
    expect($everything->count())->toBe($visible->count() + count(PackageRegistry::HIDDEN));
});

it('keeps a hidden package out of the compiled registry a consumer installs from', function () {
    // `npx fancy-cli add` and the MCP both read registry.json, and both are an
    // invitation to install. A hidden slug reaching either is a 404 with our
    // name on it.
    foreach (PackageRegistry::HIDDEN as $slug) {
        expect(PackageRegistry::find($slug))->toBeNull("hidden '{$slug}' is still findable");
    }
});
