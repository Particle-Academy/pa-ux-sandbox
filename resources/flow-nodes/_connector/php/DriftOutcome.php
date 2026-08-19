<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/DriftOutcome.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/**
 * How a drift check ended.
 *
 * `Unchecked` is a REAL outcome and is never collapsed into `Clean`. A checker
 * that could not see is not a checker that saw nothing wrong, and the difference
 * between those two claims is the entire value of a report.
 */
enum DriftOutcome: string
{
    case Clean = 'clean';

    case Drifted = 'drifted';

    case Unchecked = 'unchecked';
}
