<?php


// GENERATED from particle-academy/fancy-connectors — php/src/MetricDescriptor.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * What a connector can report, in its own words — declared, not inferred.
 *
 * Inferring the shape from whatever a pull last returned gives an EMPTY shape
 * when nothing has been pulled, and then "this reports nothing" and "nobody has
 * asked yet" are the same blank, needing opposite actions.
 */
final readonly class MetricDescriptor
{
    /**
     * @param  string  $key  the key the connector's own mapping actually returns
     * @param  string  $label  what the provider itself calls it
     * @param  CanonicalMetric|null  $canonical  null where there is no honest equivalent
     * @param  string  $means  what it counts, in a sentence. Checked for length by
     *                         {@see Metrics::capabilityProblems()}, because a one-word
     *                         `means` is the same as none.
     */
    public function __construct(
        public string $key,
        public string $label,
        public ?CanonicalMetric $canonical,
        public string $means,
    ) {}
}
