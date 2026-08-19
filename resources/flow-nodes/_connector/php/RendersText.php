<?php


// GENERATED from particle-academy/fancy-connectors — php/src/RendersText.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * A connector whose rendering needs CODE rather than a rule set.
 *
 * Overrides `renderRules` when both are present. Most connectors should not
 * implement this: the point of {@see RenderRules} is that the differences that
 * matter across providers are values, not behaviour, and a bespoke renderer is a
 * second place where a length rule can live.
 */
interface RendersText
{
    /**
     * Pure and versioned. No clock, no randomness, no network — if the preview
     * and the send could disagree, an approval means nothing.
     *
     * @param  array<string,int>|null  $overrides  caller-resolved numbers (an instance's
     *                                             configured limit), so they become part of
     *                                             what was approved
     */
    public function render(mixed $target, ?array $overrides = null): RenderedPayload;
}
