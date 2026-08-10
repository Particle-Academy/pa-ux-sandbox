<?php

use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/**
 * The react-fancy component list is a HAND-MAINTAINED MIRROR of a directory.
 *
 * `PackageRegistry::componentsForReactFancy()` says so itself — *"Mirrors
 * packages/react-fancy/src/components/ — hand-listed for Phase 1."* Nothing
 * checked the two agreed, and the failure is silent in the direction that
 * matters: ship a component, forget the line, and it is simply absent from
 * `/r/index.json`, from `npx fancy-cli add`, and from the MCP server. The
 * package builds, the tests pass, the docs page renders — the component just
 * does not exist for anyone outside the repo.
 *
 * That is exactly what happened to `JsonEditor` in react-fancy 5.16.0: shipped,
 * published, exported, subpath-built, and invisible to every consumer route
 * until this list was edited by hand.
 *
 * ## Why this compares against the SUBPATH EXPORTS, not the directory
 *
 * The obvious check is "scan `src/components/`". That only works inside the
 * envelope, where a react-fancy checkout sits next to this app — and a harness
 * that silently no-ops outside one directory layout is the specific failure
 * this codebase keeps finding (see `holy-sheet`'s parity suite reaching for
 * `../../holy-sheet/src/`).
 *
 * The installed package's `exports` map is the honest source: it is present in
 * `node_modules` on every machine and in CI, it is generated from the component
 * directories by that package's own build, and it is the thing a consumer can
 * actually import. If a component has a subpath, it is real.
 */
/**
 * Subpaths that are deliberately NOT standalone registry entries.
 *
 * The eleven input primitives are reachable as one `inputs` entry, which is how
 * they are documented and how a consumer vendors them — splitting them would
 * put eleven near-identical cards on the packages page for one coherent family.
 * `mode` and `icons` are not components at all: a context helper and an asset
 * barrel.
 *
 * Everything else must be listed. This is a short, argued list, not a bucket to
 * sweep new components into when this test goes red.
 */
const IGNORED_SUBPATHS = [
    'checkbox', 'checkbox-group', 'date-picker', 'field', 'input', 'multi-switch',
    'radio-group', 'select', 'slider', 'switch', 'textarea',
    'mode', 'icons',
];

/** Registry entries with no matching subpath. There should be none. */
const IGNORED_LISTED = [];

function reactFancySubpathSlugs(): array
{
    $pkgPath = base_path('node_modules/@particle-academy/react-fancy/package.json');

    if (! is_file($pkgPath)) {
        return [];
    }

    $pkg = json_decode((string) file_get_contents($pkgPath), true);

    $slugs = [];
    foreach (array_keys($pkg['exports'] ?? []) as $subpath) {
        // Skip the root, the wildcards, and the non-component entries that the
        // package also exposes (styles, icons, the mode helpers).
        if (! is_string($subpath) || ! str_starts_with($subpath, './')) {
            continue;
        }

        $slug = substr($subpath, 2);

        if ($slug === '' || str_contains($slug, '*') || str_contains($slug, '.')) {
            continue;
        }

        $slugs[] = $slug;
    }

    return $slugs;
}

it('lists every react-fancy component that ships a subpath', function () {
    $subpaths = reactFancySubpathSlugs();

    // Not a skip. If the package is not installed the check cannot run, and a
    // green tick over an unrun check is worse than a red one.
    expect($subpaths)->not->toBeEmpty(
        'react-fancy is not installed — run npm install before the suite'
    );

    $listed = collect(PackageRegistry::all())
        ->firstWhere('slug', 'react-fancy')['components'] ?? [];
    $listedSlugs = array_column($listed, 'slug');

    // Entries the package exposes that this app never mentions. These are the
    // ones that vanish from the CLI and the MCP server without a sound.
    $missing = array_values(array_diff($subpaths, $listedSlugs, IGNORED_SUBPATHS));

    expect($missing)->toBe([], 'react-fancy ships these with no registry entry: '.implode(', ', $missing));
});

it('does not list components the package no longer ships', function () {
    // The other direction: a stale entry produces a registry item whose source
    // cannot be resolved, so `npx fancy-cli add` fails for a real consumer on a
    // component the site advertises.
    $subpaths = reactFancySubpathSlugs();
    expect($subpaths)->not->toBeEmpty();

    $listed = collect(PackageRegistry::all())
        ->firstWhere('slug', 'react-fancy')['components'] ?? [];

    $ghosts = array_values(array_diff(array_column($listed, 'slug'), $subpaths, IGNORED_LISTED));

    expect($ghosts)->toBe([], 'listed but not shipped by react-fancy: '.implode(', ', $ghosts));
});

it('includes JsonEditor specifically', function () {
    // The component that proved the gap was real. Kept as a named case so the
    // regression has a headstone rather than only a rule.
    $listed = collect(PackageRegistry::all())
        ->firstWhere('slug', 'react-fancy')['components'] ?? [];

    expect(array_column($listed, 'slug'))->toContain('json-editor');
});
