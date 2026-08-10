<?php

use App\Support\Registry\RegistryLifecycle;
use App\Support\Registry\RegistrySource;
use Tests\TestCase;

uses(TestCase::class);

/**
 * `since` / `until` are authored, not just declared.
 *
 * `RegistryItem` has carried both fields for a while — `existsIn()` honours
 * them with `version_compare`, `toArray()` serialises them, and
 * `/r/index.json?version=` filters on them. **Nothing ever set one.** Every one
 * of the 269 items had `since: null`, so the whole version-narrowing feature
 * answered "yes, that existed" for every item in every version ever asked for.
 *
 * That is the shape this session kept finding: a mechanism that is present,
 * correct, tested at the unit level, and wired to nothing.
 *
 * The CMS is the first real entry. `fancy-cms` / `fancy-cms-ui` were published
 * before 0.5 but **hidden from the registry** the entire time (`1f5a8dd`,
 * "hide preview packages … until released"), so a 0.4 consumer could not obtain
 * them at all. Serving them for `?version=0.4` would offer source for something
 * that was never available on that line — and the CLI vendors whatever the
 * registry returns.
 */
it('marks the CMS items as arriving in 0.5', function () {
    $items = app(RegistrySource::class)->all();

    $cms = array_values(array_filter(
        $items,
        fn ($i): bool => str_starts_with($i->package, 'fancy-cms'),
    ));

    expect($cms)->not->toBeEmpty('no fancy-cms items — the assertion below would be vacuous');

    foreach ($cms as $item) {
        expect($item->since)->toBe('0.5', "{$item->name} should be marked since 0.5");
    }
});

it('excludes them from a 0.4 registry request', function () {
    // The behaviour that matters: the CLI vendors whatever this returns.
    $items = app(RegistrySource::class)->all();
    $cms = array_values(array_filter($items, fn ($i): bool => str_starts_with($i->package, 'fancy-cms')));

    foreach ($cms as $item) {
        expect($item->existsIn('0.4'))->toBeFalse("{$item->name} must not be served for 0.4");
        expect($item->existsIn('0.5'))->toBeTrue("{$item->name} must be served for 0.5");
    }
});

it('leaves everything else untouched', function () {
    // A lifecycle map that quietly stamped every item would break every older
    // consumer at once, which is worse than the gap it fixes.
    $items = app(RegistrySource::class)->all();

    $stamped = array_values(array_filter(
        $items,
        fn ($i): bool => $i->since !== null && ! str_starts_with($i->package, 'fancy-cms'),
    ));

    expect(array_map(fn ($i): string => $i->name, $stamped))->toBe([]);
});

it('serves an unmarked item in every version', function () {
    $items = app(RegistrySource::class)->all();
    $plain = array_values(array_filter($items, fn ($i): bool => $i->since === null && $i->until === null));

    expect($plain)->not->toBeEmpty();
    expect($plain[0]->existsIn('0.4'))->toBeTrue();
    expect($plain[0]->existsIn('0.5'))->toBeTrue();
});

it('keys the map on things that actually exist', function () {
    // A typo in the map is silent: it stamps nothing and the item keeps being
    // served for every version, which is exactly the bug this closes.
    $packages = array_unique(array_map(
        fn ($i): string => $i->package,
        app(RegistrySource::class)->all(),
    ));

    foreach (array_keys(RegistryLifecycle::PACKAGES) as $slug) {
        // NOT expect(...)->toContain($slug, $message): Pest's toContain is
        // VARIADIC needles, so the message becomes a second thing to look for
        // and the test fails for a reason that has nothing to do with the map.
        expect(in_array($slug, $packages, true))
            ->toBeTrue("lifecycle map names '{$slug}', which is not a real package");
    }
});
