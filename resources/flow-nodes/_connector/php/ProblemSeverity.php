<?php


// GENERATED from particle-academy/fancy-connector-core — php/src/ProblemSeverity.php
// Do not edit here. Fix it in the package and re-run `php artisan flow:build`;
// a test fails the build when this copy and the package disagree.
declare(strict_types=1);

namespace FancyFlow\Nodes\Connector;

/** Whether a problem stops a call or merely warns about it. */
enum ProblemSeverity: string
{
    case Block = 'block';

    case Warn = 'warn';
}
