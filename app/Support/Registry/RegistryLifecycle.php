<?php

namespace App\Support\Registry;

/**
 * When a registry item entered the kit, and when it left.
 *
 * `RegistryItem` has carried `since` / `until` for a while: `existsIn()` honours
 * them, `toArray()` serialises them, and `/r/index.json?version=` filters on
 * them. **Nothing set one.** All 269 items had `since: null`, so version
 * narrowing answered "yes, that existed" for every item in every version — a
 * feature that was present, correct and wired to nothing.
 *
 * This is where they are authored. One map rather than four constructor call
 * sites in `RegistrySource`, because the question "when did this arrive?" is
 * about the kit's history, not about how the item happens to be built.
 *
 * ## Keyed by package, AND by item where that is not enough
 *
 * The package map is the default, because a package usually arrives or leaves
 * as a unit and keying everything on item names would mean re-listing every
 * component and silently missing the next one added.
 *
 * The original version of this file said components "do not trickle in across
 * versions" and stopped there. **That was wrong**, and it was wrong within
 * three days: `react-fancy` existed in 0.4, so the package map says nothing
 * about it — while `Container`, `Section` and `Grid` (5.15.0) and `JsonEditor`
 * (5.16.0) all arrived during the 0.5 line. A consumer asking
 * `/r/index.json?version=0.4` was offered all four, and `npx fancy-cli add
 * json-editor` on a 0.4 project would vendor source requiring react-fancy 5.16.
 *
 * So `ITEMS` overrides `PACKAGES` for the case the package map cannot express:
 * a component that appeared inside an existing package after a kit cut.
 *
 * ## Why a typo here is dangerous
 *
 * An unmatched key stamps nothing, and an unstamped item is served for EVERY
 * version. So the failure mode of a mistake in this file is silence, not an
 * error — which is why a test asserts every slug named here is a real package.
 */
final class RegistryLifecycle
{
    /**
     * package slug => ['since' => kit version, 'until' => kit version]
     *
     * `since` — the first kit version in which a consumer could actually obtain
     * this. Not when the code was written: `fancy-cms` and `fancy-cms-ui` were
     * published well before 0.5 but sat behind `PackageRegistry::HIDDEN` the
     * whole time, so a 0.4 consumer could not install them. Serving them for
     * `?version=0.4` would hand the CLI source for something that line never
     * had.
     *
     * `until` — the last kit version it exists in. Nothing is retired yet.
     *
     * @var array<string, array{since?: string, until?: string}>
     */
    public const PACKAGES = [
        'fancy-cms' => ['since' => '0.5'],
        'fancy-cms-ui' => ['since' => '0.5'],
    ];

    /**
     * Individual items that arrived (or left) inside a package that already
     * existed. Keyed by registry item name, and takes precedence over PACKAGES.
     *
     * `since` is the first kit version in which a consumer on that LINE could
     * obtain the component — not the package version it shipped in. The kit
     * line is the granularity the registry narrows on, so a component released
     * after the 0.5 cut but during the 0.5 line is `since: '0.5'`: it genuinely
     * does not exist for anyone on 0.4.
     *
     * @var array<string, array{since?: string, until?: string}>
     */
    public const ITEMS = [
        // react-fancy 5.16.0, 2026-08-10 — well after the 0.5 cut.
        'json-editor' => ['since' => '0.5'],

        // react-fancy 5.15.0, 2026-08-09 — the layout primitives from #170.
        'container' => ['since' => '0.5'],
        'section' => ['since' => '0.5'],
        'grid' => ['since' => '0.5'],
    ];

    /**
     * Stamp an item with its lifecycle: item-specific first, package second.
     *
     * NOT MARKED YET, and knowingly so: `eyebrow`, `kbd`, `pull-quote`,
     * `index-list`, `stat` and `stat-list` were also missing from the component
     * list until 2026-08-10, so they are newly installable, but the release they
     * actually shipped in has not been established. They are left unmarked
     * rather than guessed — a wrong `since` silently hides a component from a
     * line that really had it, which is harder to notice than the reverse.
     */
    public static function apply(RegistryItem $item): RegistryItem
    {
        $entry = self::ITEMS[$item->name] ?? self::PACKAGES[$item->package] ?? null;

        if ($entry === null) {
            return $item;
        }

        return $item->withLifecycle($entry['since'] ?? null, $entry['until'] ?? null);
    }
}
