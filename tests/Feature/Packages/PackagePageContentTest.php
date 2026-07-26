<?php

use App\Support\PackageFamily;
use App\Support\PackageRegistry;
use Tests\TestCase;

uses(TestCase::class);

/**
 * Every package page has to say *something*.
 *
 * A page with no preview, no README and no context is not a thin page — it is a
 * blank one, and nothing in the app notices. These pin the cases where two bits
 * of metadata disagreed and a page fell through the gap between them.
 */
it('gives a headless package its README even when it lists a component', function () {
    // fancy-pwa is classified headless AND lists one component. The README was
    // fetched only when the component list was EMPTY, so it got none — then
    // rendered through the headless body with nothing in it. One word of
    // metadata disagreeing with another produced a completely blank page.
    $this->get('/packages/fancy-pwa')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Packages/Show')
            ->where('package.kind', 'headless')
            ->where('readmeHtml', fn ($html) => is_string($html) && strlen($html) > 500)
        );
});

it('never serves a package page with nothing on it', function () {
    // The real assertion behind the one above, applied to every page the site
    // lists: previews, or a README, or curated context — at least one.
    $slugs = collect(PackageRegistry::all())
        ->merge(PackageRegistry::companions())
        ->pluck('slug')
        ->reject(fn ($slug) => PackageFamily::find($slug) !== null)
        ->values();

    $blank = [];

    foreach ($slugs as $slug) {
        $response = $this->get("/packages/{$slug}");
        if ($response->status() !== 200) {
            continue; // a redirect to a family page is a different question
        }

        $props = $response->viewData('page')['props'] ?? [];
        $hasComponents = ($props['package']['components'] ?? []) !== [];
        $hasReadme = is_string($props['readmeHtml'] ?? null) && trim($props['readmeHtml']) !== '';
        $hasContext = ($props['context'] ?? null) !== null;

        if (! $hasComponents && ! $hasReadme && ! $hasContext) {
            $blank[] = $slug;
        }
    }

    expect($blank)->toBe([]);
});
