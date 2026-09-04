<?php

use App\Support\PackageRegistry;
use App\Support\Registry\RegistrySource;
use Tests\TestCase;

uses(TestCase::class);

/*
 * Every companion package that publishes SOMETHING appears in the compiled
 * registry.
 *
 * ## Why this exists
 *
 * `RegistrySource::companionItem()` gated on `npm` or `composer` and nothing
 * else. Every Python-only package therefore compiled to nothing — six of them:
 * fancy-flow-py, fancy-features-py, fancy-catalog-py, holy-sheet-py,
 * dark-slide-py, last-word-py. They were registered, published on PyPI, and
 * absent from `registry.json` entirely, so `list_components`,
 * `search_components`, `/r/index.json` and `npx fancy-cli add` could not see
 * them.
 *
 * It was found from the outside, which is the expensive way: a consumer opened
 * fancy-flow#7 asking whether the Python runtime existed at all, because the
 * docs referenced it and the registry did not. `pip install fancy-flow` had
 * been live the whole time.
 *
 * This is the "wired to nothing" shape — a package that is fully built,
 * published and registered, and invisible to every consumer surface because one
 * gate did not know its ecosystem existed. The gate was not wrong when it was
 * written; PyPI simply arrived later, and nothing re-checked it.
 *
 * ## What it asserts
 *
 * Keyed on PUBLISHING, like `SubmodulesAreRegisteredTest`: a companion that
 * names a distribution on any registry must be discoverable. A companion that
 * publishes nothing is legitimately absent.
 */

it('lists every companion that publishes a distribution', function () {
    $registry = app(RegistrySource::class);

    $items = collect($registry->all())->keyBy(fn ($item) => $item->name);

    // The vacuity guard. A registry that compiled to nothing would pass every
    // assertion below by having nothing to disagree with.
    expect($items->count())->toBeGreaterThan(100, 'registry has only '.$items->count().' items; compilation is broken');

    $missing = [];
    $checked = 0;

    foreach (PackageRegistry::companions() as $pkg) {
        $slug = (string) ($pkg['slug'] ?? '');

        if ($slug === '' || PackageRegistry::isHidden($slug)) {
            continue;
        }

        // Evidence of publishing, on ANY registry. Adding an ecosystem here is
        // the one change this test needs when a fourth language lands.
        $distributions = array_filter([
            $pkg['npm'] ?? null,
            $pkg['composer'] ?? null,
            $pkg['pypi'] ?? null,
        ], fn ($v) => is_string($v) && $v !== '');

        if ($distributions === []) {
            continue; // publishes nothing — legitimately absent
        }

        $checked++;

        if (! $items->has($slug)) {
            $missing[] = $slug.' (publishes '.implode(', ', $distributions).')';
        }
    }

    expect($checked)->toBeGreaterThan(20, "only checked {$checked} publishing companions; discovery is broken");

    expect($missing)->toBe([], implode("\n", [
        'These companion packages publish a distribution but compile to NO registry item:',
        '  '.implode("\n  ", $missing),
        '',
        'They are invisible to list_components, search_components, /r/index.json and',
        '`npx fancy-cli add` — which is indistinguishable, from outside, from never',
        'having been built. Check the ecosystem gate in RegistrySource::companionItem().',
    ]));
});
