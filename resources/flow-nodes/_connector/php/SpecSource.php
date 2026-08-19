<?php


// GENERATED from particle-academy/fancy-connectors — php/src/SpecSource.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

use InvalidArgumentException;

/**
 * Where a provider's machine-readable description lives, if anywhere.
 *
 * Built through the named constructors rather than directly, so the one rule
 * that matters is enforced by the type: **`none` requires a reason.** A `none`
 * with no note is indistinguishable from nobody having looked, and those need
 * opposite actions — one is a fact about the provider, the other is a fact about
 * us.
 */
final readonly class SpecSource
{
    private function __construct(
        public SpecKind $kind,
        public ?string $url,
        /** Why there is no spec and what the fallback is, or a note about the URL. */
        public ?string $note,
    ) {}

    public static function openapi(string $url, ?string $note = null): self
    {
        return new self(SpecKind::OpenApi, $url, $note);
    }

    public static function lexicon(string $url, ?string $note = null): self
    {
        return new self(SpecKind::Lexicon, $url, $note);
    }

    /** @param string $note why there is no spec, and what the fallback is. Required. */
    public static function none(string $note): self
    {
        if (trim($note) === '') {
            throw new InvalidArgumentException(
                'SpecSource::none() needs a reason. "no spec" with no note is indistinguishable from '
                .'"nobody looked", and a drift report built on that says nothing.'
            );
        }

        return new self(SpecKind::None, null, $note);
    }
}
