<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/Citation.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * Where a declared fact was read, and when.
 *
 * A citation with no date is an assertion wearing a URL. The date is what lets a
 * drift check say *this was true eight months ago and nobody has looked since*,
 * which is a different and more useful statement than *this is true*.
 */
final readonly class Citation
{
    /**
     * @param  string  $url  the provider's own documentation for this fact
     * @param  string  $readOn  ISO date the URL was actually read by a person or a check
     * @param  string|null  $quote  the sentence the fact rests on. Optional, strongly wanted.
     */
    public function __construct(
        public string $url,
        public string $readOn,
        public ?string $quote = null,
    ) {}
}
