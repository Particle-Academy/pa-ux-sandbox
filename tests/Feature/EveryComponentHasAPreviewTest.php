<?php

use App\Support\PackageRegistry;
use App\Support\Registry\TuiPreviewSource;
use Tests\TestCase;

uses(TestCase::class);

/**
 * Every component the catalog advertises must render something.
 *
 * The packages grid falls back to a "Live preview coming soon" placeholder, and
 * the code called that fallback "for components without a custom preview
 * (rare)". It was the majority: 147 of 279 registry items resolved to nothing.
 * We were advertising components as installable and showing a grey box where
 * the component should be.
 *
 * Nothing failed when that happened. The registry built, the page rendered, CI
 * went green, and the tile quietly said "coming soon" — so it survived release
 * after release. This test is what makes it a build failure instead.
 *
 * ## Resolution mirrors the page, not the file
 *
 * A preview resolves by any of three routes, and an earlier count of this gap
 * was wrong twice for checking only the first:
 *
 *   1. an exact `<package>/<slug>` key in ComponentPreviews / HeavyPreviews
 *   2. the same key with the package prefix stripped — the registry qualifies a
 *      slug when it would collide across packages (`fancy-3d-babylon-stage`),
 *      while the preview map keys on the bare name
 *   3. a captured ANSI frame from `TuiPreviewSource` — fancy-tui renders to a
 *      terminal, so its tiles are server-supplied frames and never appear in
 *      the client map at all
 *
 * Counting only route 1 reported fancy-tui as 52 components with no preview.
 * All 52 had frames and always had.
 */
function previewKeys(): array
{
    $keys = [];

    foreach (['ComponentPreviews', 'HeavyPreviews'] as $file) {
        $path = resource_path("js/Pages/Packages/{$file}.tsx");
        if (! is_file($path)) {
            continue;
        }
        preg_match_all('/"([a-z0-9@\/.-]+)":\s*(?:\(|heavy\()/', (string) file_get_contents($path), $m);
        $keys = array_merge($keys, $m[1]);
    }

    return array_flip($keys);
}

it('renders a preview for every advertised component', function () {
    $keys = previewKeys();
    $frames = app(TuiPreviewSource::class)->all();

    expect($keys)->not->toBeEmpty('found no preview keys — the parser broke, and this test would pass over nothing');

    $missing = [];
    $checked = 0;

    foreach (PackageRegistry::all() as $pkg) {
        foreach (($pkg['components'] ?? []) as $component) {
            $slug = (string) ($component['slug'] ?? '');
            $name = (string) ($pkg['slug'] ?? '');
            $checked++;

            // 3 — a captured terminal frame.
            if (isset($frames[$slug])) {
                continue;
            }
            // 1 — an exact key.
            if (isset($keys["{$name}/{$slug}"])) {
                continue;
            }
            // 2 — the registry qualified a colliding slug; the map keys on the bare name.
            if (str_starts_with($slug, "{$name}-")
                && isset($keys["{$name}/".substr($slug, strlen($name) + 1)])) {
                continue;
            }

            $missing[] = "{$name}/{$slug}";
        }
    }

    // Guard against a vacuous pass: if PackageRegistry ever returns nothing,
    // "no missing previews" would be true and meaningless.
    expect($checked)->toBeGreaterThan(200, 'checked suspiciously few components');

    expect($missing)->toBe([], count($missing).' component(s) would render "Live preview coming soon": '.implode(', ', $missing));
});

it('detects a component that has no preview', function () {
    // The discrimination check. Without it, a parser that returned every
    // possible key would make the test above pass forever.
    $keys = previewKeys();

    expect(isset($keys['react-fancy/definitely-not-a-real-component']))->toBeFalse();
    expect(isset($keys['react-fancy/json-editor']))->toBeTrue('the JsonEditor preview should be found by the same parser');
});
