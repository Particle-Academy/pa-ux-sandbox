<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/ConnectorApi.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * The connector API version — what makes two release clocks safe.
 *
 * The core and the connector catalogue are separate repositories and release on
 * separate clocks, deliberately: a provider changing its API is a connector fix
 * and must not wait on a core release. The hazard that creates is worse here
 * than for an ordinary package pair, because **connectors ship as vendored
 * source** — a consumer copies one into their project, and that copy has no
 * manifest of its own to carry a version range. Six months and two core minors
 * later, nothing can tell it that the surface it was written against has moved.
 *
 * So there is a second number, and it moves far more slowly than the package
 * version. Adding a class, fixing a classifier or improving a message does not
 * move it. Changing what a connector must implement does.
 *
 * The window is the current version **and the one before**. One would mean every
 * consumer re-vendors every connector on the day the core ships — which nobody
 * does, so in practice they would pin the core and stop getting fixes instead.
 * More than two is a promise we cannot keep.
 */
final class ConnectorApi
{
    /**
     * The connector surface this core implements.
     *
     * Bump ONLY for a change a connector's own source can see, and say in the
     * changelog what a connector author must DO.
     */
    public const VERSION = 1;

    /** @var list<int> versions this core will run, newest first */
    public const SUPPORTED = [1];

    /**
     * Refuse a connector written against a surface this core does not implement.
     *
     * Called at registration, not at call time: a mismatch discovered on the
     * first real request is a mismatch discovered in production.
     *
     * The message names the DIRECTION, because the two cases need opposite
     * actions and are trivially confused — a connector ahead of the core needs a
     * core upgrade; a connector behind the window needs re-vendoring.
     */
    public static function assert(string $connectorId, int $declared): void
    {
        if (in_array($declared, self::SUPPORTED, true)) {
            return;
        }

        $supported = implode(', ', self::SUPPORTED);

        throw new ConnectorApiMismatchException(
            $declared > self::VERSION
                ? "\"{$connectorId}\" was written against connector API {$declared}, and this core implements "
                    ."{$supported}. The CONNECTOR is newer: upgrade particle-academy/fancy-connector-core. "
                    .'Vendoring a connector ahead of the core it needs is the one direction that cannot be made '
                    .'to work by trying.'
                : "\"{$connectorId}\" was written against connector API {$declared}, which is older than anything "
                    ."this core still runs ({$supported}). The CONNECTOR is behind: re-vendor it. Nothing is "
                    .'adapted automatically, because guessing what a two-version-old connector meant is how a '
                    .'connector quietly starts doing something else.',
            $connectorId,
            $declared,
        );
    }

    /**
     * Whether a core version satisfies a connector's declared minimum.
     *
     * So a registry or a CLI can answer BEFORE vendoring, which is the only
     * moment the answer is cheap.
     */
    public static function satisfiesMinimum(string $coreVersion, string $minimum): bool
    {
        $parts = static function (string $value): array {
            $out = array_map(
                static fn (string $segment): int => (int) $segment,
                array_slice(explode('.', $value), 0, 3),
            );

            return array_pad($out, 3, 0);
        };

        [$a, $b, $c] = $parts($coreVersion);
        [$x, $y, $z] = $parts($minimum);

        if ($a !== $x) {
            return $a > $x;
        }

        if ($b !== $y) {
            return $b > $y;
        }

        return $c >= $z;
    }
}
