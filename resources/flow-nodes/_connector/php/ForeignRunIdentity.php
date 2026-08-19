<?php


// GENERATED from particle-academy/fancy-connectors — php/src/ForeignRunIdentity.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use DateTimeInterface;

/**
 * The bridge between a nominal interface and a structural contract.
 *
 * ## Why this file has to exist
 *
 * {@see RunIdentity} is declared structurally so that a flow engine's own
 * identity object satisfies it with no import in either direction. In TypeScript
 * that is the end of the story — a matching shape IS the type. PHP is nominal: a
 * class matching the shape but not declaring `implements RunIdentity` is not an
 * instance of it, and a type check would reject the exact object this package
 * was designed to accept.
 *
 * So the shape is checked at the boundary instead. `adapt()` takes any object
 * carrying the five members and wraps it; anything already implementing the
 * interface passes through untouched. `FancyFlow\Runtime\RunIdentity` goes
 * through the first path, which is what makes `$ctx->run` work with no adapter
 * written by the consumer.
 *
 * ## It refuses rather than half-matching
 *
 * An object with `runKey` and no `stepKey()` is not "nearly" a run identity — a
 * partial match would produce a key derived from something else, which is
 * indistinguishable from a correct key right up until two runs collide on it. So
 * a shape that does not match is a loud exception naming the missing member,
 * never a null that a caller would read as "this host publishes no identity" and
 * carry on writing without a key.
 */
final class ForeignRunIdentity implements RunIdentity
{
    public string $runKey { get => (string) $this->inner->runKey; }

    public int $attempt { get => (int) $this->inner->attempt; }

    public string $firstAttemptAt { get => (string) $this->inner->firstAttemptAt; }

    private function __construct(private readonly object $inner) {}

    /**
     * Accept anything that IS a run identity, whether or not it says so.
     *
     * Null in, null out: "no host published an identity" is a real answer and
     * {@see Idempotency::keyFor()} handles it by sending no key at all.
     */
    public static function adapt(?object $run): ?RunIdentity
    {
        if ($run === null || $run instanceof RunIdentity) {
            return $run;
        }

        foreach (['runKey', 'attempt', 'firstAttemptAt'] as $property) {
            if (! property_exists($run, $property) && ! isset($run->{$property})) {
                throw new ConnectorConfigException(sprintf(
                    '%s was passed as a run identity but has no `%s`. An identity that only half matches would '
                    .'produce a key derived from something else, which looks correct until two runs collide on '
                    .'it. Implement %s, or pass null and accept that the write goes out unkeyed.',
                    $run::class,
                    $property,
                    RunIdentity::class,
                ));
            }
        }

        foreach (['stepKey', 'isReplaySafe'] as $method) {
            if (! method_exists($run, $method)) {
                throw new ConnectorConfigException(sprintf(
                    '%s was passed as a run identity but has no `%s()`. Implement %s, or pass null and accept '
                    .'that the write goes out unkeyed.',
                    $run::class,
                    $method,
                    RunIdentity::class,
                ));
            }
        }

        return new self($run);
    }

    public function stepKey(string $stepId, ?int $occurrence = null): string
    {
        return (string) $this->inner->stepKey($stepId, $occurrence);
    }

    public function isReplaySafe(?int $windowSeconds, DateTimeInterface|string|null $now = null): bool
    {
        return (bool) $this->inner->isReplaySafe($windowSeconds, $now);
    }
}
