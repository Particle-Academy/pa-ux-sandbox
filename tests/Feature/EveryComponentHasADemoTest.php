<?php

use App\Support\PackageRegistry;
use App\Support\Registry\TuiPreviewSource;
use Tests\TestCase;

uses(TestCase::class);

/**
 * Every advertised component has an interactive demo on its detail page.
 *
 * `EveryComponentHasAPreviewTest` guards the package-grid TILES. Nothing guarded
 * the DEMOS, and the gap grew to 46 components — Grid, Container, the media
 * viewers, all of classroom and job-board — each showing "Interactive demo for X
 * isn't wired yet" on the page where someone decides whether to adopt it.
 *
 * A tile proves a component renders. The detail page is the one that has to
 * convince, and it was the one with the hole. That asymmetry is exactly what a
 * ratchet is for: the tiles had one, the demos did not, so only the tiles stayed
 * complete.
 *
 * ## What is legitimately exempt
 *
 * Two classes, both structural rather than a matter of taste:
 *
 *  - **fancy-tui** renders to a TERMINAL. `Component.tsx` shows a captured ANSI
 *    frame for those and never reaches `ComponentDemo` at all.
 *  - **A package's own entry** (`name === package`, e.g. `holy-sheet`) is the
 *    "install this package" row, not a component. Most are headless — an xlsx
 *    writer has no surface to demo.
 *
 * Everything else needs one.
 */
function demoKeys(): array
{
    $path = resource_path('js/Pages/Packages/ComponentDemo.tsx');
    $source = (string) file_get_contents($path);

    // Only the REGISTRY map — not every quoted string in a 4,000-line file,
    // which would match demo copy and make this pass over nothing.
    $start = strpos($source, 'const REGISTRY');
    expect($start)->not->toBeFalse('the demo REGISTRY map is gone — this test is checking nothing');

    $map = substr($source, $start, strpos($source, '};', $start) - $start);
    preg_match_all('/"([a-z0-9@\/.-]+)":\s*[\w(]/', $map, $m);

    return array_flip($m[1]);
}

it('renders an interactive demo for every advertised component', function () {
    $keys = demoKeys();
    $frames = app(TuiPreviewSource::class)->all();

    expect($keys)->not->toBeEmpty('parsed no demo keys');

    $missing = [];
    $checked = 0;

    foreach (PackageRegistry::all() as $pkg) {
        $name = (string) ($pkg['slug'] ?? '');

        foreach (($pkg['components'] ?? []) as $component) {
            $slug = (string) ($component['slug'] ?? '');

            // A package's own row — "install this", not a component.
            if ($slug === $name) {
                continue;
            }
            // A terminal component: the detail page shows a captured frame.
            if ($name === 'fancy-tui' || isset($frames[$slug])) {
                continue;
            }

            $checked++;

            if (isset($keys["{$name}/{$slug}"])) {
                continue;
            }
            // The registry package-qualifies a slug when it would collide across
            // packages; the demo map keys on the bare name.
            if (str_starts_with($slug, "{$name}-")
                && isset($keys["{$name}/".substr($slug, strlen($name) + 1)])) {
                continue;
            }

            $missing[] = "{$name}/{$slug}";
        }
    }

    // Guard against a vacuous pass: if the registry ever returns nothing,
    // "no missing demos" is true and meaningless.
    expect($checked)->toBeGreaterThan(120, 'checked suspiciously few components');

    expect($missing)->toBe(
        [],
        count($missing).' component(s) show "Interactive demo for X isn\'t wired yet": '.implode(', ', $missing)
    );
});

it('detects a component with no demo', function () {
    // The discrimination check. A parser returning every possible key would make
    // the test above pass forever, which is the failure mode a ratchet has.
    $keys = demoKeys();

    expect(isset($keys['react-fancy/definitely-not-a-real-component']))->toBeFalse();
    expect(isset($keys['react-fancy/grid']))->toBeTrue('the Grid demo should be found by the same parser');
    expect(isset($keys['classroom/course-player']))->toBeTrue();
});
