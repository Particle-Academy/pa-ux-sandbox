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
 * ## Keyed by package, deliberately
 *
 * A package arrives or leaves as a unit — its components do not trickle in
 * across versions. Keying on individual item names would mean re-listing every
 * component of a package and silently missing the next one added.
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

    /** Stamp an item with its package's lifecycle, if it has one. */
    public static function apply(RegistryItem $item): RegistryItem
    {
        $entry = self::PACKAGES[$item->package] ?? null;

        if ($entry === null) {
            return $item;
        }

        return $item->withLifecycle($entry['since'] ?? null, $entry['until'] ?? null);
    }
}
