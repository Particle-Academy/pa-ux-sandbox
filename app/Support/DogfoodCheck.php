<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Is this app actually running the packages it exists to demonstrate?
 *
 * The showcase is the kit's end-to-end test. Running it against versions nobody
 * ships means the suite is green about code that is not what consumers get —
 * which is worse than having no suite, because it reads as coverage.
 *
 * It had drifted badly before this existed: `holy-sheet` a full MAJOR behind
 * (one of the three cut FOR kit 0.5, so the app declaring kit 0.5 was not
 * running it), `fancy-flow-php` five minors back including a human gate that
 * ran straight past the person, and several constraints pinned so tightly they
 * could not take a patch.
 *
 * The comparison is pure and lives here, separately from the I/O that fetches
 * versions, so it can be tested without a network.
 */
final class DogfoodCheck
{
    /**
     * Packages that are behind, as `name => [installed, latest]`.
     *
     * @param  array<string,string>  $installed  name => version in use
     * @param  array<string,?string>  $latest  name => published version, or null if the lookup FAILED
     * @return array{behind: array<string,array{0:string,1:string}>, unchecked: list<string>}
     */
    public static function compare(array $installed, array $latest): array
    {
        $behind = [];
        $unchecked = [];

        foreach ($installed as $name => $have) {
            $want = $latest[$name] ?? null;

            if ($want === null || $want === '') {
                // A failed lookup is NOT a pass. Reporting "all current" over
                // packages nobody managed to check is the exact fail-open that
                // hid eleven behind-versions the first time this was swept by
                // hand: an empty result read as a clean sweep.
                $unchecked[] = $name;

                continue;
            }

            if (self::normalize($have) !== self::normalize($want)) {
                $behind[$name] = [self::normalize($have), self::normalize($want)];
            }
        }

        ksort($behind);
        sort($unchecked);

        return ['behind' => $behind, 'unchecked' => $unchecked];
    }

    /**
     * Whether the result is a pass.
     *
     * Anything unchecked fails too, for the reason above — a check that cannot
     * see is not a check that agrees.
     *
     * @param  array{behind: array<string,mixed>, unchecked: list<string>}  $result
     */
    public static function passes(array $result): bool
    {
        return $result['behind'] === [] && $result['unchecked'] === [];
    }

    /** Registries spell the same release `v1.2.3` and `1.2.3`. */
    private static function normalize(string $version): string
    {
        return ltrim(trim($version), 'v');
    }
}
